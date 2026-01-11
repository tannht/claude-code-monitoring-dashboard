/**
 * Circuit Breaker Implementation
 * Following Loki Mode pattern for stuck query protection
 */

import { CircuitBreakerConfig, CircuitState, CircuitBreakerState, CircuitEvent, CircuitStats } from "./types";

/**
 * Circuit Breaker Class
 * Implements the circuit breaker pattern with three states:
 * - CLOSED: Normal operation
 * - OPEN: Failing fast, no requests allowed
 * - HALF_OPEN: Testing if service recovered
 */
export class CircuitBreaker {
  private name: string;
  private config: CircuitBreakerConfig;

  // State tracking
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private consecutiveSuccesses = 0; // For HALF_OPEN state
  private totalFailures = 0;
  private totalSuccesses = 0;

  // Timing
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private openedAt?: Date;
  private cooldownUntil?: Date;
  private openCount = 0;
  private recoveryTimes: number[] = []; // Track recovery times

  // Event listeners
  private listeners: Array<(event: CircuitEvent) => void> = [];

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...this.getDefaultConfig(), ...config };
  }

  private getDefaultConfig(): CircuitBreakerConfig {
    return {
      failureThreshold: 5,
      cooldownSeconds: 300,
      halfOpenAttempts: 3,
      timeoutMs: 30000,
      autoResetOnSuccess: true,
    };
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime?.toISOString(),
      lastSuccessTime: this.lastSuccessTime?.toISOString(),
      openedAt: this.openedAt?.toISOString(),
      cooldownUntil: this.cooldownUntil?.toISOString(),
      nextAttemptAt: this.cooldownUntil?.toISOString(),
      consecutiveSuccesses: this.consecutiveSuccesses,
    };
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitStats {
    const avgRecovery = this.recoveryTimes.length > 0
      ? this.recoveryTimes.reduce((a, b) => a + b, 0) / this.recoveryTimes.length
      : undefined;

    return {
      name: this.name,
      state: this.state,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      currentFailureCount: this.failureCount,
      consecutiveSuccesses: this.consecutiveSuccesses,
      openCount: this.openCount,
      lastOpenedAt: this.openedAt?.toISOString(),
      lastClosedAt: this.state === "CLOSED" && this.openedAt ? new Date().toISOString() : undefined,
      averageRecoveryTime: avgRecovery,
    };
  }

  /**
   * Check if circuit allows execution
   */
  canExecute(): boolean {
    // If OPEN, check if cooldown has passed
    if (this.state === "OPEN") {
      if (this.cooldownUntil && new Date() >= this.cooldownUntil) {
        this.transitionTo("HALF_OPEN");
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.lastSuccessTime = new Date();
    this.totalSuccesses++;
    this.successCount++;

    if (this.state === "HALF_OPEN") {
      this.consecutiveSuccesses++;

      this.emit({
        type: "SUCCESS_RECORDED",
        circuitName: this.name,
        timestamp: new Date().toISOString(),
        newState: "HALF_OPEN",
        message: `Success in HALF_OPEN (${this.consecutiveSuccesses}/${this.config.halfOpenAttempts})`,
      });

      // Close circuit after enough consecutive successes
      if (this.consecutiveSuccesses >= this.config.halfOpenAttempts) {
        // Track recovery time
        if (this.openedAt) {
          const recoveryTime = Date.now() - this.openedAt.getTime();
          this.recoveryTimes.push(recoveryTime);
        }
        this.transitionTo("CLOSED");
      }
    } else if (this.state === "CLOSED" && this.config.autoResetOnSuccess) {
      this.failureCount = 0;
    }

    this.emit({
      type: "SUCCESS_RECORDED",
      circuitName: this.name,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record a failed execution
   */
  recordFailure(error?: string): void {
    this.lastFailureTime = new Date();
    this.totalFailures++;
    this.failureCount++;

    this.emit({
      type: "FAILURE_RECORDED",
      circuitName: this.name,
      timestamp: new Date().toISOString(),
      message: error,
      metadata: { failureCount: this.failureCount, threshold: this.config.failureThreshold },
    });

    // Check if we should open the circuit
    if (this.state === "CLOSED" && this.failureCount >= this.config.failureThreshold) {
      this.transitionTo("OPEN");
    } else if (this.state === "HALF_OPEN") {
      // Immediate back to OPEN on failure in HALF_OPEN
      this.transitionTo("OPEN");
    }
  }

  /**
   * Record a timeout
   */
  recordTimeout(): void {
    this.emit({
      type: "TIMEOUT_OCCURRED",
      circuitName: this.name,
      timestamp: new Date().toISOString(),
      message: `Operation exceeded ${this.config.timeoutMs}ms timeout`,
    });

    // Treat timeout as a failure
    this.recordFailure("Timeout exceeded");
  }

  /**
   * Reset circuit breaker to CLOSED state
   */
  reset(): void {
    const previousState = this.state;
    this.state = "CLOSED";
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.openedAt = undefined;
    this.cooldownUntil = undefined;

    if (previousState !== "CLOSED") {
      this.emit({
        type: "CIRCUIT_CLOSED",
        circuitName: this.name,
        timestamp: new Date().toISOString(),
        previousState,
        newState: "CLOSED",
        message: "Circuit manually reset",
      });
    }
  }

  /**
   * Force open the circuit (useful for maintenance)
   */
  forceOpen(reason = "Manually opened"): void {
    this.transitionTo("OPEN");
    this.emit({
      type: "CIRCUIT_OPENED",
      circuitName: this.name,
      timestamp: new Date().toISOString(),
      message: reason,
    });
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    if (newState === "OPEN") {
      this.openedAt = new Date();
      this.cooldownUntil = new Date(Date.now() + this.config.cooldownSeconds * 1000);
      this.openCount++;
      this.consecutiveSuccesses = 0;

      this.emit({
        type: "CIRCUIT_OPENED",
        circuitName: this.name,
        timestamp: new Date().toISOString(),
        previousState,
        newState: "OPEN",
        message: `Circuit opened after ${this.failureCount} failures`,
      });
    } else if (newState === "HALF_OPEN") {
      this.consecutiveSuccesses = 0;

      this.emit({
        type: "CIRCUIT_HALF_OPEN",
        circuitName: this.name,
        timestamp: new Date().toISOString(),
        previousState,
        newState: "HALF_OPEN",
        message: "Testing if service has recovered",
      });
    } else if (newState === "CLOSED") {
      this.failureCount = 0;
      this.consecutiveSuccesses = 0;

      this.emit({
        type: "CIRCUIT_CLOSED",
        circuitName: this.name,
        timestamp: new Date().toISOString(),
        previousState,
        newState: "CLOSED",
        message: "Service recovered, circuit closed",
      });
    }
  }

  /**
   * Add event listener
   */
  onEvent(listener: (event: CircuitEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: CircuitEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`[CircuitBreaker:${this.name}] Event listener error:`, error);
      }
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker ${this.name} is OPEN`);
    }

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout after ${this.config.timeoutMs}ms`));
        }, this.config.timeoutMs);
      });

      const result = await Promise.race([fn(), timeoutPromise]);
      this.recordSuccess();
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Timeout")) {
        this.recordTimeout();
      } else {
        this.recordFailure(error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private circuits: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let circuit = this.circuits.get(name);
    if (!circuit) {
      circuit = new CircuitBreaker(name, config);
      this.circuits.set(name, circuit);
    }
    return circuit;
  }

  /**
   * Get all circuit states
   */
  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.circuits.values()).map(c => c.getState());
  }

  /**
   * Get all statistics
   */
  getAllStats(): CircuitStats[] {
    return Array.from(this.circuits.values()).map(c => c.getStats());
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    this.circuits.forEach(c => c.reset());
  }

  /**
   * Remove a circuit
   */
  remove(name: string): boolean {
    return this.circuits.delete(name);
  }

  /**
   * Clear all circuits
   */
  clear(): void {
    this.circuits.clear();
  }

  /**
   * Get circuit count by state
   */
  getCountByState(): Record<CircuitState, number> {
    const counts: Record<CircuitState, number> = {
      CLOSED: 0,
      OPEN: 0,
      HALF_OPEN: 0,
    };

    this.circuits.forEach(circuit => {
      counts[circuit.getState().state]++;
    });

    return counts;
  }
}

// Singleton instance
let registryInstance: CircuitBreakerRegistry | null = null;

export function getCircuitRegistry(): CircuitBreakerRegistry {
  if (!registryInstance) {
    registryInstance = new CircuitBreakerRegistry();
  }
  return registryInstance;
}
