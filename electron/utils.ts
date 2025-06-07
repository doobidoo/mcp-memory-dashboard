import fs from 'fs';
import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Wait for a file to exist and return its contents
 */
export async function waitForFile(filePath: string, timeout = 30000): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.trim()) {
          console.log(`File found: ${filePath}, content: ${content.trim()}`);
          return content;
        }
      }
    } catch (error) {
      console.log(`Error reading file ${filePath}:`, error);
    }
    
    // Wait 500ms before trying again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error(`File ${filePath} not found or empty after ${timeout}ms`);
}

/**
 * Check if a server is running at the given URL
 */
export async function checkServer(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const request = protocol.get(url, (res) => {
        console.log(`Server check: ${url} responded with status ${res.statusCode}`);
        resolve(res.statusCode !== undefined && res.statusCode < 500);
        request.destroy();
      });
      
      request.on('error', (error) => {
        console.log(`Server check error for ${url}:`, error.message);
        resolve(false);
        request.destroy();
      });
      
      request.setTimeout(5000, () => {
        console.log(`Server check timeout for ${url}`);
        resolve(false);
        request.destroy();
      });
      
    } catch (error) {
      console.log(`Server check failed for ${url}:`, error);
      resolve(false);
    }
  });
}

/**
 * Wait for a server to be available
 */
export async function waitForServer(url: string, timeout = 30000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const isRunning = await checkServer(url);
    if (isRunning) {
      return true;
    }
    
    // Wait 1 second before trying again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}
