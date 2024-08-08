import test, { beforeEach, describe } from "node:test"
import { randomHex } from './crypto';
import assert from 'node:assert/strict';

describe('crypto.ts tests', () => {
  describe('randomHex function', () => {
    test('should return a string', () => {
      const size = 10;
      const hexString = randomHex(size);
      assert.strictEqual(typeof hexString, 'string');
    });

    test('should return a string of the correct length', () => {
      const size = 10;
      const expectedLength = size * 2; // Each byte is two hex characters
      const hexString = randomHex(size);
      assert.strictEqual(hexString.length, expectedLength);
    });

    test('should only contain valid hexadecimal characters', () => {
      const size = 10;
      const hexString = randomHex(size);
      assert.match(hexString, /^[a-f0-9]+$/i);
    });
  });
});
