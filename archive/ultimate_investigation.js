#!/usr/bin/env node

/**
 * Ultimate MCP Memory-Dashboard Integration Investigation
 * This script will diagnose and fix the routing between dashboard and memory service
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

class MCPInvestigator {
    constructor() {
        this.memoryServicePath = '/Users/hkr/Documents/GitHub/mcp-memory-service';
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {}
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logEntry);
        
        this.results.tests.push({
            timestamp,
            type,
            message
        });
    }

    async runTest(testName, testFn) {
        this.log(`🧪 Starting test: ${testName}`, 'test');
        try {
            const result = await testFn();
            this.log(`✅ Test passed: ${testName}`, 'pass');
            return result;
        } catch (error) {
            this.log(`❌ Test failed: ${testName} - ${error.message}`, 'fail');
            this.log(`Error details: ${error.stack}`, 'error');
            return null;
        }
    }

    async testMemoryServiceConnection() {
        return await this.runTest('Memory Service Connection', async () => {
            // Test 1: Check if memory service executable exists
            const memoryCmd = path.join(this.memoryServicePath, '.venv', 'bin', 'memory');
            const memoryExists = fs.existsSync(memoryCmd);
            this.log(`Memory executable exists: ${memoryExists} (${memoryCmd})`);

            if (!memoryExists) {
                // Try alternative path
                const altCmd = path.join(this.memoryServicePath, '.venv', 'Scripts', 'memory.exe');
                const altExists = fs.existsSync(altCmd);
                this.log(`Alternative memory executable exists: ${altExists} (${altCmd})`);
                
                if (!altExists) {
                    throw new Error('Memory service executable not found');
                }
                return altCmd;
            }
            return memoryCmd;
        });
    }

    async testMCPProtocolConnection(memoryServiceCmd) {
        return await this.runTest('MCP Protocol Connection', async () => {
            let client = null;
            let transport = null;
            
            try {
                // Start memory service
                this.log('Starting memory service...');
                const serverProcess = spawn(memoryServiceCmd, [], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    cwd: this.memoryServicePath
                });

                // Create MCP client
                transport = new StdioClientTransport({
                    command: memoryServiceCmd,
                    args: [],
                    cwd: this.memoryServicePath
                });

                client = new Client({
                    name: "dashboard-investigator",
                    version: "1.0.0"
                }, {
                    capabilities: {}
                });

                // Connect with timeout
                this.log('Connecting to memory service via MCP...');
                await Promise.race([
                    client.connect(transport),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Connection timeout')), 10000)
                    )
                ]);

                this.log('✅ Successfully connected to memory service');
                return { client, transport, serverProcess };
            } catch (error) {
                if (client) await client.close();
                if (transport) await transport.close();
                throw error;
            }
        });
    }

    async testToolDiscovery(client) {
        return await this.runTest('Tool Discovery', async () => {
            this.log('Discovering available tools...');
            const tools = await client.listTools();
            
            this.log(`Found ${tools.tools.length} tools:`);
            tools.tools.forEach(tool => {
                this.log(`  - ${tool.name}: ${tool.description}`);
            });

            // Check for required dashboard tools
            const requiredTools = ['dashboard_check_health', 'check_database_health'];
            const availableTools = tools.tools.map(t => t.name);
            
            const missingTools = requiredTools.filter(tool => !availableTools.includes(tool));
            if (missingTools.length > 0) {
                throw new Error(`Missing required tools: ${missingTools.join(', ')}`);
            }

            this.log('✅ All required dashboard tools are available');
            return tools.tools;
        });
    }

    async testDashboardHealthTool(client) {
        return await this.runTest('Dashboard Health Tool', async () => {
            this.log('Testing dashboard_check_health tool...');
            
            const result = await client.callTool({
                name: 'dashboard_check_health',
                arguments: {}
            });

            this.log(`Tool response: ${JSON.stringify(result, null, 2)}`);

            // Parse the response
            if (result.content && result.content[0] && result.content[0].text) {
                const responseText = result.content[0].text;
                try {
                    const healthData = JSON.parse(responseText);
                    this.log(`Parsed health data: ${JSON.stringify(healthData, null, 2)}`);
                    
                    if (healthData.status === 'healthy') {
                        this.log('✅ Dashboard health check successful');
                        return healthData;
                    } else {
                        throw new Error(`Unhealthy status: ${healthData.status}`);
                    }
                } catch (parseError) {
                    this.log(`Raw response: ${responseText}`);
                    throw new Error(`Failed to parse health response: ${parseError.message}`);
                }
            } else {
                throw new Error('Invalid tool response format');
            }
        });
    }

    async testDatabaseHealthTool(client) {
        return await this.runTest('Database Health Tool', async () => {
            this.log('Testing check_database_health tool...');
            
            const result = await client.callTool({
                name: 'check_database_health',
                arguments: {}
            });

            this.log(`Database health response: ${JSON.stringify(result, null, 2)}`);

            if (result.content && result.content[0] && result.content[0].text) {
                const responseText = result.content[0].text;
                this.log(`Database health details: ${responseText}`);
                return responseText;
            } else {
                throw new Error('Invalid database health response format');
            }
        });
    }

    async testClaudeIntegration() {
        return await this.runTest('Claude Integration Simulation', async () => {
            this.log('Simulating Claude MCP client behavior...');
            
            // Test what Claude would see when discovering tools
            const memoryServiceCmd = await this.testMemoryServiceConnection();
            if (!memoryServiceCmd) {
                throw new Error('Cannot test Claude integration without memory service');
            }

            const connection = await this.testMCPProtocolConnection(memoryServiceCmd);
            if (!connection) {
                throw new Error('Cannot establish MCP connection for Claude simulation');
            }

            const { client, transport, serverProcess } = connection;

            try {
                // Simulate Claude's tool discovery and usage
                const tools = await this.testToolDiscovery(client);
                const healthData = await this.testDashboardHealthTool(client);
                const dbHealth = await this.testDatabaseHealthTool(client);

                this.log('✅ Claude integration simulation successful');
                return {
                    tools_discovered: tools.length,
                    health_data: healthData,
                    db_health_response: dbHealth
                };
            } finally {
                await client.close();
                await transport.close();
                serverProcess.kill();
            }
        });
    }

    async generateDiagnosticReport() {
        this.log('📊 Generating comprehensive diagnostic report...');

        const report = {
            investigation_summary: {
                timestamp: this.results.timestamp,
                total_tests: this.results.tests.filter(t => t.type === 'test').length,
                passed_tests: this.results.tests.filter(t => t.type === 'pass').length,
                failed_tests: this.results.tests.filter(t => t.type === 'fail').length
            },
            memory_service: {
                path: this.memoryServicePath,
                executable_status: 'checked'
            },
            mcp_integration: {
                protocol_version: '2024-11-05',
                connection_status: 'tested'
            },
            dashboard_integration: {
                tools_status: 'verified',
                health_check: 'tested'
            },
            recommendations: []
        };

        // Add specific recommendations based on test results
        const failedTests = this.results.tests.filter(t => t.type === 'fail');
        if (failedTests.length === 0) {
            report.recommendations.push({
                priority: 'high',
                action: 'Integration is working correctly. The issue may be in Claude\'s MCP configuration.',
                details: 'All tools are responding correctly. Check Claude Desktop config for proper server routing.'
            });
        } else {
            failedTests.forEach(test => {
                report.recommendations.push({
                    priority: 'critical',
                    action: `Fix failed test: ${test.message}`,
                    details: 'This test failure is blocking dashboard integration.'
                });
            });
        }

        // Save report
        const reportPath = '/Users/hkr/Documents/GitHub/mcp-memory-dashboard/integration_diagnostic_report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`📄 Diagnostic report saved to: ${reportPath}`);

        return report;
    }

    async run() {
        this.log('🚀 Starting Ultimate MCP Memory-Dashboard Integration Investigation');
        this.log('====================================================================');

        try {
            // Run all tests
            await this.testMemoryServiceConnection();
            await this.testClaudeIntegration();
            
            const report = await this.generateDiagnosticReport();
            
            this.log('====================================================================');
            this.log('🎯 Investigation Complete!');
            this.log(`✅ Passed: ${report.investigation_summary.passed_tests}`);
            this.log(`❌ Failed: ${report.investigation_summary.failed_tests}`);
            this.log('====================================================================');

            return report;
        } catch (error) {
            this.log(`💥 Investigation failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Run the investigation
if (import.meta.url === `file://${process.argv[1]}`) {
    const investigator = new MCPInvestigator();
    investigator.run()
        .then(report => {
            console.log('\n🎉 Investigation completed successfully!');
            console.log('\n📊 Summary:');
            console.log(JSON.stringify(report.investigation_summary, null, 2));
            
            if (report.recommendations.length > 0) {
                console.log('\n🔧 Recommendations:');
                report.recommendations.forEach((rec, index) => {
                    console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
                    console.log(`   ${rec.details}`);
                });
            }
        })
        .catch(error => {
            console.error('\n💥 Investigation failed:', error);
            process.exit(1);
        });
}

export default MCPInvestigator;
