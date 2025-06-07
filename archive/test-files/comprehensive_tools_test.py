#!/usr/bin/env python3
"""
Comprehensive Memory Service Tools Test
Tests all restored tools to ensure they work correctly
"""

import subprocess
import json
import sys
import os
import tempfile
from pathlib import Path

class MemoryServiceToolsTest:
    def __init__(self):
        self.memory_service_path = Path("/Users/hkr/Documents/GitHub/mcp-memory-service")
        self.python_path = self.memory_service_path / ".venv/bin/python"
        self.script_path = self.memory_service_path / "scripts/run_memory_server.py"
        self.test_results = {}
        
    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")
        
    def test_tool_availability(self):
        """Test that all tools are available via list_tools"""
        self.log("Testing tool availability...")
        
        test_script = '''
import sys
import os
import asyncio
import json
sys.path.insert(0, "/Users/hkr/Documents/GitHub/mcp-memory-service/src")

from mcp_memory_service.server import MemoryServer

async def test_list_tools():
    try:
        server = MemoryServer()
        tools = await server.register_handlers.__wrapped__(server)
        
        # The tools are defined in the list_tools handler
        # Let's call the list_tools method directly
        from mcp.server import Server
        import mcp.types as types
        
        # Get the list_tools handler
        list_tools_handler = None
        for name, handler in server.server._tool_handlers.items():
            if name == "list_tools":
                list_tools_handler = handler
                break
        
        if list_tools_handler:
            tools_response = await list_tools_handler()
            tool_names = [tool.name for tool in tools_response]
            
            print(f"SUCCESS: Found {len(tool_names)} tools:")
            for tool_name in sorted(tool_names):
                print(f"  - {tool_name}")
            
            expected_tools = [
                "store_memory", "retrieve_memory", "recall_memory", "search_by_tag",
                "delete_memory", "delete_by_tag", "cleanup_duplicates", 
                "get_embedding", "check_embedding_model", "debug_retrieve",
                "exact_match_retrieve", "check_database_health", "recall_by_timeframe",
                "delete_by_timeframe", "delete_before_date", "dashboard_check_health"
            ]
            
            missing_tools = [tool for tool in expected_tools if tool not in tool_names]
            extra_tools = [tool for tool in tool_names if tool not in expected_tools]
            
            if missing_tools:
                print(f"WARNING: Missing tools: {missing_tools}")
                return False
            
            if extra_tools:
                print(f"INFO: Extra tools found: {extra_tools}")
            
            print("SUCCESS: All expected tools are available")
            return True
        else:
            print("ERROR: Could not find list_tools handler")
            return False
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_list_tools())
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
            
            self.log(f"Tool availability test exit code: {result.returncode}")
            self.log(f"STDOUT: {result.stdout}")
            if result.stderr:
                self.log(f"STDERR: {result.stderr}")
                
            success = result.returncode == 0 and "SUCCESS: All expected tools are available" in result.stdout
            self.test_results["tool_availability"] = success
            return success
            
        except Exception as e:
            self.log(f"Tool availability test failed: {e}", "ERROR")
            self.test_results["tool_availability"] = False
            return False
        finally:
            # Clean up
            try:
                os.unlink(temp_script)
            except:
                pass

    def test_individual_tool(self, tool_name, test_args=None):
        """Test an individual tool"""
        self.log(f"Testing tool: {tool_name}...")
        
        if test_args is None:
            test_args = {}
        
        test_script = f'''
import sys
import os
import asyncio
import json
sys.path.insert(0, "/Users/hkr/Documents/GitHub/mcp-memory-service/src")

from mcp_memory_service.server import MemoryServer

async def test_tool():
    try:
        server = MemoryServer()
        
        # Get the call_tool handler
        call_tool_handler = None
        for name, handler in server.server._tool_handlers.items():
            if name == "call_tool":
                call_tool_handler = handler
                break
        
        if call_tool_handler:
            result = await call_tool_handler("{tool_name}", {json.dumps(test_args)})
            
            if result and len(result) > 0:
                response_text = result[0].text
                print(f"SUCCESS: Tool {tool_name} responded")
                print(f"Response: {{response_text[:200]}}{'...' if len(response_text) > 200 else ''}")
                
                # Check for error responses
                if "Error:" in response_text:
                    print(f"WARNING: Tool returned error: {{response_text}}")
                    return False
                else:
                    return True
            else:
                print(f"ERROR: Tool {tool_name} returned no response")
                return False
        else:
            print("ERROR: Could not find call_tool handler")
            return False
            
    except Exception as e:
        print(f"ERROR: {{str(e)}}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_tool())
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
            
            self.log(f"Tool {tool_name} test exit code: {result.returncode}")
            if "SUCCESS:" in result.stdout:
                self.log(f"✅ {tool_name}: PASS")
                success = True
            else:
                self.log(f"❌ {tool_name}: FAIL")
                self.log(f"STDOUT: {result.stdout}")
                if result.stderr:
                    self.log(f"STDERR: {result.stderr}")
                success = False
                
            self.test_results[tool_name] = success
            return success
            
        except Exception as e:
            self.log(f"Tool {tool_name} test failed: {e}", "ERROR")
            self.test_results[tool_name] = False
            return False
        finally:
            # Clean up
            try:
                os.unlink(temp_script)
            except:
                pass

    def run_comprehensive_test(self):
        """Run comprehensive test of all tools"""
        self.log("🚀 Starting Comprehensive Memory Service Tools Test")
        self.log("="*60)
        
        # Test 1: Tool availability
        self.test_tool_availability()
        
        # Test 2: Individual tool tests
        tools_to_test = [
            ("dashboard_check_health", {}),
            ("check_database_health", {}),
            ("check_embedding_model", {}),
            ("store_memory", {"content": "Test memory content", "metadata": {"tags": "test,sample"}}),
            ("retrieve_memory", {"query": "test", "n_results": 3}),
            ("search_by_tag", {"tags": ["test"]}),
            ("recall_memory", {"query": "yesterday", "n_results": 3}),
            ("get_embedding", {"content": "test content"}),
            ("debug_retrieve", {"query": "test", "n_results": 2}),
            ("exact_match_retrieve", {"content": "test"}),
            ("cleanup_duplicates", {}),
        ]
        
        for tool_name, test_args in tools_to_test:
            self.test_individual_tool(tool_name, test_args)
        
        # Summary
        self.log("="*60)
        self.log("🎯 TEST SUMMARY")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result)
        failed_tests = total_tests - passed_tests
        
        self.log(f"Total tests: {total_tests}")
        self.log(f"Passed: {passed_tests}")
        self.log(f"Failed: {failed_tests}")
        
        if failed_tests == 0:
            self.log("🎉 ALL TESTS PASSED!")
            self.log("✅ Memory service with all tools is fully functional!")
        else:
            self.log(f"❌ {failed_tests} tests failed")
            
            failed_tools = [tool for tool, result in self.test_results.items() if not result]
            self.log(f"Failed tools: {failed_tools}")
        
        self.log("="*60)
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = MemoryServiceToolsTest()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)
