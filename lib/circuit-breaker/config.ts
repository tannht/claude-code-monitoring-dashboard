/**
 * Circuit Breaker Configuration
 * Default configurations for different circuit types
 */

import { CircuitBreakerConfig } from "./types";

/**
 * Default Circuit Breaker Configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownSeconds: 300, // 5 minutes
  halfOpenAttempts: 3,
  timeoutMs: 30000, // 30 seconds
  autoResetOnSuccess: true,
};

/**
 * Predefined configurations for different scenarios
 */
export const CIRCUIT_PRESETS: Record<string, CircuitBreakerConfig> = {
  /**
   * Strict: Opens quickly, longer cooldown
   * Use for critical operations
   */
  strict: {
    failureThreshold: 3,
    cooldownSeconds: 600, // 10 minutes
    halfOpenAttempts: 5,
    timeoutMs: 15000, // 15 seconds
    autoResetOnSuccess: true,
  },

  /**
   * Lenient: More tolerant, shorter cooldown
   * Use for non-critical operations
   */
  lenient: {
    failureThreshold: 10,
    cooldownSeconds: 60, // 1 minute
    halfOpenAttempts: 2,
    timeoutMs: 60000, // 60 seconds
    autoResetOnSuccess: true,
  },

  /**
   * Aggressive: Very quick to open, very long cooldown
   * Use for expensive operations
   */
  aggressive: {
    failureThreshold: 2,
    cooldownSeconds: 1800, // 30 minutes
    halfOpenAttempts: 10,
    timeoutMs: 10000, // 10 seconds
    autoResetOnSuccess: true,
  },

  /**
   * Testing: Never opens, for development/testing
   */
  testing: {
    failureThreshold: 1000,
    cooldownSeconds: 1,
    halfOpenAttempts: 1,
    timeoutMs: 120000, // 2 minutes
    autoResetOnSuccess: true,
  },
};

/**
 * Get circuit breaker configuration by preset name
 */
export function getCircuitConfig(
  preset: keyof typeof CIRCUIT_PRESETS | "default"
): CircuitBreakerConfig {
  return preset === "default" ? DEFAULT_CIRCUIT_CONFIG : CIRCUIT_PRESETS[preset];
}

/**
 * Merge custom config with defaults
 */
export function mergeCircuitConfig(
  custom: Partial<CircuitBreakerConfig>,
  preset: keyof typeof CIRCUIT_PRESETS | "default" = "default"
): CircuitBreakerConfig {
  const base = getCircuitConfig(preset);
  return { ...base, ...custom };
}
