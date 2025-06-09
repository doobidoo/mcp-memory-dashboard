/**
 * Docker ChromaDB Manager for MCP Memory Dashboard
 * 
 * Manages ChromaDB Docker container lifecycle with robust error handling,
 * graceful fallbacks, and integration with existing database files.
 * 
 * Addresses GitHub Issue #11 by eliminating MCP service duplication
 * while preserving all existing data and providing stable fallbacks.
 */

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface DockerChromaConfig {
  chromaPath: string;
  backupsPath: string;
  containerName: string;
  port: number;
  fallbackPort?: number;
}

interface ContainerStatus {
  running: boolean;
  healthy: boolean;
  port: number;
  containerId?: string;
  error?: string;
}

export class DockerChromaManager {
  private config: DockerChromaConfig;
  private containerProcess: ChildProcess | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;

  constructor(config: DockerChromaConfig) {
    this.config = {
      containerName: 'mcp-memory-chromadb',
      port: 8000,
      fallbackPort: 8001,
      ...config
    };
    
    console.log('🐳 DockerChromaManager initialized:', this.config);
  }

  /**
   * Check if Docker is available and running
   */
  async isDockerAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking Docker availability...');
      await execAsync('docker --version');
      await execAsync('docker info');
      console.log('✅ Docker is available and running');
      return true;
    } catch (error) {
      console.log('❌ Docker not available:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Check if port is available
   */
  async isPortAvailable(port: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`lsof -i :${port}`);
      console.log(`⚠️ Port ${port} is in use:`, stdout.trim());
      return false;
    } catch (error) {
      // lsof returns non-zero exit code when no processes found (port is free)
      console.log(`✅ Port ${port} is available`);
      return true;
    }
  }

  /**
   * Find an available port starting from the configured port
   */
  async findAvailablePort(): Promise<number> {
    const portsToTry = [this.config.port, this.config.fallbackPort || 8001, 8002, 8003, 8004];
    
    for (const port of portsToTry) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    
    throw new Error(`No available ports found. Tried: ${portsToTry.join(', ')}`);
  }

  /**
   * Check if our ChromaDB container is already running
   */
  async getContainerStatus(): Promise<ContainerStatus> {
    try {
      const { stdout } = await execAsync(`docker ps --filter "name=${this.config.containerName}" --format "{{.ID}},{{.Status}},{{.Ports}}"`);
      
      if (!stdout.trim()) {
        console.log(`📋 Container ${this.config.containerName} is not running`);
        return { running: false, healthy: false, port: this.config.port };
      }

      const [containerId, status, ports] = stdout.trim().split(',');
      
      // Extract port from ports string (e.g., "0.0.0.0:8000->8000/tcp")
      const portMatch = ports.match(/0\.0\.0\.0:(\d+)->/);
      const actualPort = portMatch ? parseInt(portMatch[1]) : this.config.port;
      
      const isHealthy = status.includes('healthy') || !status.includes('unhealthy');
      
      console.log(`✅ Container ${this.config.containerName} is running on port ${actualPort}`);
      
      return {
        running: true,
        healthy: isHealthy,
        port: actualPort,
        containerId: containerId.trim()
      };
      
    } catch (error) {
      console.log('❌ Error checking container status:', error instanceof Error ? error.message : 'Unknown error');
      return { 
        running: false, 
        healthy: false, 
        port: this.config.port,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Stop and remove existing container if it exists
   */
  async cleanupExistingContainer(): Promise<void> {
    try {
      console.log(`🧹 Cleaning up existing container: ${this.config.containerName}`);
      
      // Stop container
      try {
        await execAsync(`docker stop ${this.config.containerName}`);
        console.log('✅ Container stopped');
      } catch (stopError) {
        console.log('ℹ️ Container was not running or already stopped');
      }
      
      // Remove container
      try {
        await execAsync(`docker rm ${this.config.containerName}`);
        console.log('✅ Container removed');
      } catch (removeError) {
        console.log('ℹ️ Container was not found or already removed');
      }
      
    } catch (error) {
      console.log('⚠️ Error during cleanup:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw - cleanup errors shouldn't prevent startup
    }
  }

  /**
   * Validate that the ChromaDB path exists and is accessible
   */
  validateChromaPath(): boolean {
    try {
      console.log(`🔍 Validating ChromaDB path: ${this.config.chromaPath}`);
      
      if (!fs.existsSync(this.config.chromaPath)) {
        console.log('📁 ChromaDB directory does not exist, creating...');
        fs.mkdirSync(this.config.chromaPath, { recursive: true });
      }
      
      // Test write access
      const testFile = path.join(this.config.chromaPath, '.docker-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      console.log('✅ ChromaDB path is valid and writable');
      return true;
      
    } catch (error) {
      console.error('❌ ChromaDB path validation failed:', error);
      return false;
    }
  }

  /**
   * Start ChromaDB Docker container
   */
  async startContainer(): Promise<ContainerStatus> {
    try {
      console.log('🚀 Starting ChromaDB Docker container...');
      
      // Validate prerequisites
      if (!await this.isDockerAvailable()) {
        throw new Error('Docker is not available. Please install Docker Desktop and ensure it is running.');
      }
      
      if (!this.validateChromaPath()) {
        throw new Error(`ChromaDB path is not accessible: ${this.config.chromaPath}`);
      }
      
      // Find available port
      const availablePort = await this.findAvailablePort();
      if (availablePort !== this.config.port) {
        console.log(`⚠️ Using fallback port ${availablePort} instead of ${this.config.port}`);
      }
      
      // Clean up any existing container
      await this.cleanupExistingContainer();
      
      // Prepare Docker command
      const dockerCommand = [
        'run',
        '-d',
        '--name', this.config.containerName,
        '-p', `${availablePort}:8000`,
        '-v', `${this.config.chromaPath}:/chroma/chroma`,
        '--health-cmd', 'sh -c "curl -f http://localhost:8000/api/v1/heartbeat || exit 1"',
        '--health-interval', '10s',
        '--health-timeout', '5s',
        '--health-retries', '3',
        'chromadb/chroma'
      ];
      
      console.log('🐳 Docker command:', `docker ${dockerCommand.join(' ')}`);
      
      // Start container
      const { stdout: containerId } = await execAsync(`docker ${dockerCommand.join(' ')}`);
      
      console.log(`✅ Container started with ID: ${containerId.trim()}`);
      
      // Wait for container to be healthy
      await this.waitForContainerHealthy(availablePort);
      
      // Start health monitoring
      this.startHealthMonitoring(availablePort);
      
      return {
        running: true,
        healthy: true,
        port: availablePort,
        containerId: containerId.trim()
      };
      
    } catch (error) {
      console.error('❌ Failed to start ChromaDB container:', error);
      throw error;
    }
  }

  /**
   * Wait for container to become healthy
   */
  async waitForContainerHealthy(port: number, timeoutMs: number = 30000): Promise<void> {
    console.log(`⏳ Waiting for ChromaDB container to be healthy on port ${port}...`);
    
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Check container health
        const { stdout } = await execAsync(`docker inspect --format='{{.State.Health.Status}}' ${this.config.containerName}`);
        const healthStatus = stdout.trim();
        
        if (healthStatus === 'healthy') {
          console.log('✅ Container is healthy and ready');
          return;
        }
        
        console.log(`⏳ Container health status: ${healthStatus}, waiting...`);
        
        // Also test direct HTTP connection
        try {
          await execAsync(`curl -f http://localhost:${port}/api/v1/heartbeat`);
          console.log('✅ ChromaDB API is responding');
          return;
        } catch (curlError) {
          // Continue waiting
        }
        
      } catch (error) {
        console.log('⏳ Still waiting for container health check...');
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    throw new Error(`Container failed to become healthy within ${timeoutMs}ms`);
  }

  /**
   * Start health monitoring for the container
   */
  startHealthMonitoring(port: number): void {
    console.log('🔄 Starting health monitoring...');
    
    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      
      try {
        const status = await this.getContainerStatus();
        if (!status.running || !status.healthy) {
          console.warn('⚠️ ChromaDB container is not healthy, attempting restart...');
          await this.restartContainer();
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Restart the container
   */
  async restartContainer(): Promise<ContainerStatus> {
    console.log('🔄 Restarting ChromaDB container...');
    
    try {
      await execAsync(`docker restart ${this.config.containerName}`);
      await this.waitForContainerHealthy(this.config.port);
      
      console.log('✅ Container restarted successfully');
      return await this.getContainerStatus();
      
    } catch (error) {
      console.error('❌ Failed to restart container:', error);
      // Try full restart
      return await this.startContainer();
    }
  }

  /**
   * Stop the ChromaDB container
   */
  async stopContainer(): Promise<void> {
    console.log('🛑 Stopping ChromaDB container...');
    this.isShuttingDown = true;
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    try {
      // Check if container exists before trying to stop it
      const status = await this.getContainerStatus();
      if (status.running) {
        await execAsync(`docker stop ${this.config.containerName}`);
        console.log('✅ Container stopped successfully');
      } else {
        console.log('ℹ️ Container was not running');
      }
    } catch (error) {
      console.log('⚠️ Error stopping container:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get the HTTP URL for the ChromaDB API
   */
  async getChromaApiUrl(): Promise<string> {
    const status = await this.getContainerStatus();
    return `http://localhost:${status.port}`;
  }

  /**
   * Test connection to ChromaDB API
   */
  async testConnection(): Promise<boolean> {
    try {
      const apiUrl = await this.getChromaApiUrl();
      await execAsync(`curl -f ${apiUrl}/api/v1/heartbeat`);
      console.log(`✅ ChromaDB API connection successful: ${apiUrl}`);
      return true;
    } catch (error) {
      console.log('❌ ChromaDB API connection failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Docker ChromaDB Manager...');
    await this.stopContainer();
  }
}

export default DockerChromaManager;