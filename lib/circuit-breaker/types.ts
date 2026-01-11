/**
 * Circuit Breaker Types
 * Following Loki Mode pattern for failure threshold with cooldown
 */

/**
 * Circuit Breaker States
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 */
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures before tripping
   * @default 5
   */
  failureThreshold: number;

  /**
   * Cooldown period in OPEN state before attempting HALF_OPEN
   * @default 300 (5 minutes)
   */
  cooldownSeconds: number;

  /**
   * Number of successful attempts allowed in HALF_OPEN before closing
   * @default 3
   */
  halfOpenAttempts: number;

  /**
   * Timeout in milliseconds for circuit operations
   * @default 30000 (30 seconds)
   */
  timeoutMs: number;

  /**
   * Whether to automatically reset failure count on success
   * @default true
   */
  autoResetOnSuccess: boolean;
}

/**
 * Circuit Breaker State Snapshot
 */
export interface CircuitBreakerState {
  name: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  openedAt?: string;
  cooldownUntil?: string;
  nextAttemptAt?: string;
  consecutiveSuccesses: number; // For HALF_OPEN state
}

/**
 * Circuit Breaker Event Types
 */
export type CircuitEventType =
  | "CIRCUIT_OPENED"
  | "CIRCUIT_CLOSED"
  | "CIRCUIT_HALF_OPEN"
  | "FAILURE_RECORDED"
  | "SUCCESS_RECORDED"
  | "TIMEOUT_OCCURRED";

/**
 * Circuit Breaker Event
 */
export interface CircuitEvent {
  type: CircuitEventType;
  circuitName: string;
  timestamp: string;
  previousState?: CircuitState;
  newState?: CircuitState;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Circuit Breaker Statistics
 */
export interface CircuitStats {
  name: string;
  state: CircuitState;
  totalFailures: number;
  totalSuccesses: number;
  currentFailureCount: number;
  consecutiveSuccesses: number;
  openCount: number; // How many times circuit has opened
  lastOpenedAt?: string;
  lastClosedAt?: string;
  averageRecoveryTime?: number; // ms
}
