"""
Performance Monitoring Utility for MCP-MEMORY-DASHBOARD
Date: 2025-06-08
Issue: #10 - Performance optimization verification

This utility helps track and analyze performance improvements.
"""

import time
import json
from datetime import datetime
from typing import List, Dict, Any

class PerformanceMonitor:
    def __init__(self):
        self.measurements = []
        self.baseline_stats = None
        
    def record_measurement(self, operation: str, duration_ms: float, 
                          cache_hit: bool = False, collection_size: int = 0):
        """Record a performance measurement"""
        measurement = {
            "timestamp": datetime.now().isoformat(),
            "operation": operation,
            "duration_ms": duration_ms,
            "cache_hit": cache_hit,
            "collection_size": collection_size
        }
        self.measurements.append(measurement)
        print(f"📊 {operation}: {duration_ms:.1f}ms {'(CACHE HIT)' if cache_hit else ''}")
    
    def set_baseline(self, stats_time: float, search_time: float):
        """Set baseline performance from original implementation"""
        self.baseline_stats = {
            "stats_query_ms": stats_time,
            "search_query_ms": search_time,
            "total_operations_ms": stats_time + search_time
        }
        print(f"🏁 Baseline set: Stats={stats_time:.1f}ms, Search={search_time:.1f}ms")
    
    def calculate_improvements(self) -> Dict[str, Any]:
        """Calculate performance improvements vs baseline"""
        if not self.baseline_stats or not self.measurements:
            return {"error": "Insufficient data for comparison"}
        
        # Calculate averages for each operation type
        stats_measurements = [m for m in self.measurements if m["operation"] == "stats"]
        search_measurements = [m for m in self.measurements if m["operation"] == "search"]
        
        avg_stats = sum(m["duration_ms"] for m in stats_measurements) / len(stats_measurements) if stats_measurements else 0
        avg_search = sum(m["duration_ms"] for m in search_measurements) / len(search_measurements) if search_measurements else 0
        
        cache_hit_rate = sum(1 for m in stats_measurements if m["cache_hit"]) / len(stats_measurements) if stats_measurements else 0
        
        improvements = {
            "baseline_stats_ms": self.baseline_stats["stats_query_ms"],
            "optimized_stats_ms": avg_stats,
            "stats_improvement_percent": ((self.baseline_stats["stats_query_ms"] - avg_stats) / self.baseline_stats["stats_query_ms"]) * 100,
            "cache_hit_rate_percent": cache_hit_rate * 100,
            "total_measurements": len(self.measurements),
            "avg_search_ms": avg_search,
            "search_operations_count": len(search_measurements)
        }
        
        return improvements
    
    def print_summary(self):
        """Print performance summary"""
        improvements = self.calculate_improvements()
        
        print("\n🎯 PERFORMANCE OPTIMIZATION SUMMARY")
        print("===================================")
        
        if "error" in improvements:
            print(f"❌ {improvements['error']}")
            return
        
        print(f"📈 Stats Query Improvement: {improvements['stats_improvement_percent']:.1f}%")
        print(f"   • Baseline: {improvements['baseline_stats_ms']:.1f}ms")
        print(f"   • Optimized: {improvements['optimized_stats_ms']:.1f}ms")
        print(f"📊 Cache Hit Rate: {improvements['cache_hit_rate_percent']:.1f}%")
        print(f"🔍 Search Operations: {improvements['search_operations_count']} (no stats refresh)")
        print(f"📏 Total Measurements: {improvements['total_measurements']}")
        
        if improvements['stats_improvement_percent'] > 80:
            print("🎉 EXCELLENT: >80% improvement achieved!")
        elif improvements['stats_improvement_percent'] > 50:
            print("✅ GOOD: >50% improvement achieved!")
        elif improvements['stats_improvement_percent'] > 20:
            print("⚠️  MODERATE: >20% improvement achieved, but more optimization possible")
        else:
            print("❌ POOR: <20% improvement, optimization may not be working")
    
    def export_data(self, filename: str = "performance_results.json"):
        """Export measurements to JSON file"""
        data = {
            "baseline": self.baseline_stats,
            "measurements": self.measurements,
            "improvements": self.calculate_improvements(),
            "export_timestamp": datetime.now().isoformat()
        }
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"💾 Performance data exported to {filename}")

# Example usage:
if __name__ == "__main__":
    monitor = PerformanceMonitor()
    
    # Set baseline (example values from issue description)
    monitor.set_baseline(stats_time=8500, search_time=2000)  # 8.5s + 2s
    
    # Record optimized measurements (examples)
    monitor.record_measurement("stats", 450, cache_hit=False, collection_size=500)  # First call
    monitor.record_measurement("stats", 45, cache_hit=True, collection_size=500)    # Cache hit
    monitor.record_measurement("search", 1800, cache_hit=False, collection_size=500) # Search (no stats)
    monitor.record_measurement("search", 1750, cache_hit=False, collection_size=500) # Search (no stats)
    monitor.record_measurement("stats", 420, cache_hit=False, collection_size=500)   # After cache expire
    
    # Print summary
    monitor.print_summary()
    
    # Export data
    monitor.export_data()
