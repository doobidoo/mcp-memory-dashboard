/**
 * Version management for MCP Memory Dashboard
 * 
 * This file serves as the single source of truth for version information.
 * Update this file whenever releasing a new version.
 */

export const VERSION = "1.2.0";

// Optional: Add semantic version components for advanced use cases
export const VERSION_PARTS = {
  major: 1,
  minor: 2,
  patch: 0
} as const;

// Optional: Add additional version metadata
export const VERSION_INFO = {
  version: VERSION,
  buildDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  description: "Critical bug fixes and dashboard enhancements"
} as const;
