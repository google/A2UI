import type { Mock } from 'vitest';

/**
 * Safely get a mock call argument with proper typing.
 * Throws if the call doesn't exist (test failure).
 */
export function getMockCallArg<T>(mock: Mock, callIndex: number, argIndex = 0): T {
  const calls = mock.mock.calls;
  const call = calls[callIndex];
  if (!call) {
    throw new Error(`Mock call at index ${callIndex} does not exist. Total calls: ${calls.length}`);
  }
  return call[argIndex] as T;
}

/**
 * Get an element from an array with bounds checking.
 * Throws if index is out of bounds (test failure).
 */
export function getElement<T>(array: T[], index: number): T {
  const element = array[index];
  if (element === undefined) {
    throw new Error(`Array element at index ${index} does not exist. Array length: ${array.length}`);
  }
  return element;
}
