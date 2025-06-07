#!/usr/bin/env python3
"""
Final Dashboard Integration Test
Tests the exact MCP tools that should be available to Claude for dashboard integration
"""

import subprocess
import json
import sys
import os
import tempfile
from pathlib import Path

class DashboardIntegrationTester:
    def __init__(self):
        self.memory_service_path = Path("/Users/hkr/Documents/GitHub/mcp-memory-service")
        self.python_path = self.memory_service_path / ".venv/bin/python"
        self.script_path = self.memory_service_path / "scripts/run_memory_server.py"
        
    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")
        
    def test_dashboard_health_tool(self):
        """Test the dashboard_check_health tool directly"""
        self.log("Testing dashboard_check_health tool...")
        
        # Create a simple MCP client test script
        test_script = '''
import sys
import os
import asyncio
import json
sys.path.insert(0, "/Users/hkr/Documents/GitHub/mcp-memory-service/src")

from mcp_memory_service.server import MemoryServer

async def test_dashboard_health():
    try:
        server = MemoryServer()
        result = await server.handle_dashboard_check_health({})
        
        # Extract the text content
        if result and len(result) > 0:
            response_text = result[0].text
            health_data = json.loads(response_text)
            print(f"SUCCESS: {json.dumps(health_data, indent=2)}")
            return health_data
        else:
            print("ERROR: No response from dashboard health tool")
            return None
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(test_dashboard_health())
    if result and result.get("status") == "healthy":
        sys.exit(0)
    else:
        sys.exit(1)
'''
        
        # Write the test script to a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(test_script)
            temp_script = f.name
            
        try:
            # Run the test
            result = subprocess.run([
                str(self.python_path), temp_script
            ], capture_output=True, text=True, timeout=30)
            
            self.log(f"Dashboard health test exit code: {result.returncode}")
            self.log(f"STDOUT: {result.stdout}")
            if result.stderr:
                self.log(f"STDERR: {result.stderr}")
                
            return result.returncode == 0, result.stdout
            
        except Exception as e:
            self.log(f"Dashboard health test failed: {e}", "ERROR")
            return False, str(e)
        finally:
            # Clean up
            try:
                os.unlink(temp_script)
            except:
                pass
    
    def test_database_health_tool(self):
        """Test the check_database_health tool directly"""
        self.log("Testing check_database_health tool...")
        
        # Create a simple MCP client test script
        test_script = '''
import sys
import os
import asyncio
import json
sys.path.insert(0, "/Users/hkr/Documents/GitHub/mcp-memory-service/src")

from mcp_memory_service.server import MemoryServer

async def test_database_health():
    try:
        server = MemoryServer()
        result = await server.handle_check_database_health({})
        
        # Extract the text content
        if result and len(result) > 0:
            response_text = result[0].text
            print(f"SUCCESS: Database health response received")
            print(response_text)
            return True
        else:
            print("ERROR: No response from database health tool")
            return False
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_database_health())
    sys.exit(0 if result else 1)
'''
        
        # Write the test script to a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(test_script)
            temp_script = f.name
            
        try:
            # Run the test
            result = subprocess.run([
                str(self.python_path), temp_script
            ], capture_output=True, text=True, timeout=30)
            
            self.log(f"Database health test exit code: {result.returncode}")
            self.log(f"STDOUT: {result.stdout}")
            if result.stderr:
                self.log(f"STDERR: {result.stderr}")
                
            return result.returncode == 0, result.stdout
            
        except Exception as e:
            self.log(f"Database health test failed: {e}", "ERROR")
            return False, str(e)
        finally:
            # Clean up
            try:
                os.unlink(temp_script)
            except:
                pass

    def create_claude_test_instructions(self):
        """Create instructions for testing through Claude"""
        instructions = """
## 🧪 CLAUDE DASHBOARD INTEGRATION TEST

### Step 1: List Available MCP Servers
Ask Claude: "List all available MCP servers and their tools"

Expected result: You should see a 'memory' server with dashboard tools.

### Step 2: Test Dashboard Health Tool
Ask Claude: "Use the dashboard_check_health tool"

Expected result:
```json
{
  "status": "healthy",
  "health": 100,
  "avg_query_time": 0
}
```

### Step 3: Test Database Health Tool  
Ask Claude: "Use the check_database_health tool"

Expected result: Database statistics including memory count and validation status.

### Step 4: If Tools Are Not Available
1. Restart Claude Desktop application
2. Check that the memory server is configured in Claude Desktop config
3. Verify the paths in the config are correct

### Step 5: Integration Success Test
If the above tools work, the dashboard integration is complete!
The dashboard will be able to call these tools and display real data instead of static values.
"""
        
        test_file = Path("/Users/hkr/Documents/GitHub/mcp-memory-dashboard/CLAUDE_INTEGRATION_TEST.md")
        test_file.write_text(instructions)
        self.log(f"Claude test instructions saved to: {test_file}")
        
    def run_all_tests(self):
        """Run all integration tests"""
        self.log("🚀 Starting Dashboard Integration Tests")
        self.log("="*50)
        
        # Test 1: Dashboard Health Tool
        dashboard_success, dashboard_output = self.test_dashboard_health_tool()
        
        # Test 2: Database Health Tool
        database_success, database_output = self.test_database_health_tool()
        
        # Test 3: Generate Claude instructions
        self.create_claude_test_instructions()
        
        # Summary
        self.log("="*50)
        self.log("🎯 TEST SUMMARY")
        self.log(f"Dashboard Health Tool: {'✅ PASS' if dashboard_success else '❌ FAIL'}")
        self.log(f"Database Health Tool: {'✅ PASS' if database_success else '❌ FAIL'}")
        
        if dashboard_success and database_success:
            self.log("🎉 ALL TESTS PASSED!")
            self.log("✅ Dashboard integration is ready!")
            self.log("🔧 Next: Test through Claude using the instructions in CLAUDE_INTEGRATION_TEST.md")
        else:
            self.log("❌ Some tests failed - check the error messages above")
            
        self.log("="*50)
        
        return dashboard_success and database_success

if __name__ == "__main__":
    tester = DashboardIntegrationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
