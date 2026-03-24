/**
 * A generic representation of a Signal that could come from any framework.
 * For any library building on top of A2UI's web core lib, this must be
 * implemented for their associated signals implementation.
 */
export interface FrameworkSignal<SignalType> {
  /**
   * Create a computed signal for this framework.
   */
  computed<T>(fn: () => T): SignalType;

  /**
   * Check if an arbitrary object is a framework signal.
   */
  isSignal(val: unknown): val is SignalType;

  /**
   * Wrap the value in a signal.
   */
  wrap<T>(val: T): SignalType;

  /**
   * Extract the value from a signal.
   */
  unwrap<T>(val: SignalType): T;

  /**
   * Sets the value of the provided framework signal.
   */
  set<T>(signal: SignalType, value: T): void;
}
