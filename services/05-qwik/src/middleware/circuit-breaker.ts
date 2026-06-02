// Circuit breaker: protects against cascading failures when a dependency is slow/down.
// Why: without it, a slow DB causes all requests to hang simultaneously,
// exhausting the event loop and making the service completely unresponsive.
//
// States:
//   CLOSED   — normal operation, all calls pass through
//   OPEN     — dependency is failing, calls fail immediately (fast-fail)
//   HALF_OPEN — testing if dependency has recovered, allows one call through
//
// Transition: CLOSED → OPEN after 5 failures in 10s
// Transition: OPEN → HALF_OPEN after 30s cooldown
// Transition: HALF_OPEN → CLOSED on success, OPEN on failure

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private lastFailureTime = 0
  private readonly threshold: number
  private readonly timeout: number
  private readonly name: string

  constructor(name: string, options: { threshold?: number; timeout?: number } = {}) {
    this.name = name
    this.threshold = options.threshold ?? 5
    this.timeout = options.timeout ?? 30_000
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.name} — dependency unavailable, try again later`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }

  getState(): CircuitState { return this.state }
}

// Singleton circuit breakers for each external dependency
export const dbCircuitBreaker = new CircuitBreaker('postgresql', { threshold: 5, timeout: 30_000 })
export const redisCircuitBreaker = new CircuitBreaker('redis', { threshold: 3, timeout: 10_000 })
