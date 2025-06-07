#!/usr/bin/env python3
"""
Simple Memory Service Tools Test
Tests key tools to ensure they work correctly
"""

import subprocess
import json
import sys
import os
import tempfile
from pathlib import Path

class SimpleMemoryServiceTest:
    def __init__(self):
        self.memory_service_path = Path("/Users/hkr/Documents/GitHub/mcp-memory-service")
        self.python_path = self.memory_service_path / ".venv/bin/python"
        self.script_path = self.memory_service_path / "scripts/run_memory_server.py"
        
    def log(self, message, level="INFO"):
        print(f"[{level}] {message}")
        
    def test_dashboard_health(self):
        """Test the dashboard_check_health tool"""
        self.log("Testing dashboard_check_health tool...")
        
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
        
        if result and len(result) > 0:
            response_text = result[0].text
            health_data = json.loads(response_text)
            print(f"SUCCESS: Dashboard health tool working")
            print(f"Health status: {health_data}")
            return health_data.get("status") == "healthy"
        else:
            print("ERROR: No response from dashboard health tool")
            return False
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_dashboard_health())
    sys.exit(0 if result else 1)
'''
        
        return self._run_test_script(test_script, "dashboard_check_health")
    
    def test_database_health(self):
        """Test the check_database_health tool"""
        self.log("Testing check_database_health tool...")
        
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
        
        if result and len(result) > 0:
            response_text = result[0].text
            print(f"SUCCESS: Database health tool working")
            print(f"Response: {response_text[:300]}...")
            return "Database Health Check Results" in response_text
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
        
        return self._run_test_script(test_script, "check_database_health")
    
    def test_store_memory(self):
        """Test the store_memory tool"""
        self.log("Testing store_memory tool...")
        
        test_script = '''
import sys
import os
import asyncio
import json
sys.path.insert(0, "/Users/hkr/Documents/GitHub/mcp-memory-service/src")

from mcp_memory_service.server import MemoryServer

async def test_store_memory():
    try:
        server = MemoryServer()
        
        test_args = {
            "content": "This is a test memory for tool verification",
            "metadata": {
                "tags": "test,verification,tool-test",
                "type": "test"
            }
        }
        
        result = await server.handle_store_memory(test_args)
        
        if result and len(result) > 0:
            response_text = result[0].text
            print(f"SUCCESS: Store memory tool working")
            print(f"Response: {response_text}")
            return "successfully" in response_text.lower() or "stored" in response_text.lower()
        else:
            print("ERROR: No response from store memory tool")
            return False
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_store_memory())
    sys.exit(0 if result else 1)
'''
        
        return self._run_test_script(test_script, "store_memory")
    
    def test_retrieve_memory(self):
        """Test the retrieve_memory tool"""
        self.log("Testing retrieve_memory tool...")
        
        test_script = '''
import sys
import os
import asyncio
import json
sys.path.insert(0, "/Users/hkr/Documents/GitHub/mcp-memory-service/src")

from mcp_memory_service.server import MemoryServer

async def test_retrieve_memory():
    try:
        server = MemoryServer()
        
        test_args = {
            "query": "test memory",
            "n_results": 3
        }
        
        result = await server.handle_retrieve_memory(test_args)
        
        if result and len(result) > 0:
            response_text = result[0].text
            print(f"SUCCESS: Retrieve memory tool working")
            print(f"Response length: {len(response_text)} characters")
            return True  # Any response is good for this test
        else:
            print("ERROR: No response from retrieve memory tool")
            return False
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_retrieve_memory())
    sys.exit(0 if result else 1)
'''
        
        return self._run_test_script(test_script, "retrieve_memory")
    
    def test_search_by_tag(self):
        """Test the search_by_tag tool"""
        self.log("Testing search_by_tag tool...")
        
        test_script = '''
import sys
import os
import asyncio
import json
sys.path.insert(0, "/Users/hkr/Documents/GitHub/mcp-memory-service/src")

from mcp_memory_service.server import MemoryServer

async def test_search_by_tag():
    try:
        server = MemoryServer()
        
        test_args = {
            "tags": ["test", "verification"]
        }
        
        result = await server.handle_search_by_tag(test_args)
        
        if result and len(result) > 0:
            response_text = result[0].text
            print(f"SUCCESS: Search by tag tool working")
            print(f"Response length: {len(response_text)} characters")
            return True  # Any response is good for this test
        else:
            print("ERROR: No response from search by tag tool")
            return False
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_search_by_tag())
    sys.exit(0 if result else 1)
'''
        
        return self._run_test_script(test_script, "search_by_tag")

    def _run_test_script(self, script_content, test_name):
        """Helper to run a test script"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(script_content)
            temp_script = f.name
            
        try:
            result = subprocess.run([
                str(self.python_path), temp_script
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0 and "SUCCESS:" in result.stdout:
                self.log(f"✅ {test_name}: PASS")
                return True
            else:
                self.log(f"❌ {test_name}: FAIL")
                if result.stdout:
                    self.log(f"STDOUT: {result.stdout}")
                if result.stderr:
                    self.log(f"STDERR: {result.stderr}")
                return False
                
        except Exception as e:
            self.log(f"❌ {test_name}: EXCEPTION - {e}")
            return False
        finally:
            try:
                os.unlink(temp_script)
            except:
                pass

    def run_tests(self):
        """Run all tests"""
        self.log("🚀 Starting Simple Memory Service Tools Test")
        self.log("="*50)
        
        tests = [
            ("Dashboard Health", self.test_dashboard_health),
            ("Database Health", self.test_database_health),
            ("Store Memory", self.test_store_memory),
            ("Retrieve Memory", self.test_retrieve_memory),
            ("Search by Tag", self.test_search_by_tag),
        ]
        
        results = {}
        for test_name, test_func in tests:
            self.log(f"\n--- Testing {test_name} ---")
            results[test_name] = test_func()
        
        # Summary
        self.log("\n" + "="*50)
        self.log("🎯 TEST SUMMARY")
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        self.log(f"Passed: {passed}/{total}")
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"  {test_name}: {status}")
        
        if passed == total:
            self.log("\n🎉 ALL TESTS PASSED!")
            self.log("✅ Memory service tools are fully functional!")
        else:
            self.log(f"\n⚠️  {total - passed} tests failed")
        
        self.log("="*50)
        
        return passed == total

if __name__ == "__main__":
    tester = SimpleMemoryServiceTest()
    success = tester.run_tests()
    sys.exit(0 if success else 1)
