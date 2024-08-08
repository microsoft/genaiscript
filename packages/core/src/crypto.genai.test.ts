import { randomHex } from './crypto';
import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('randomHex function', () => {
    test('should generate a hex string of correct length for size 1', () => {
        const size = 1;
        const hexString = randomHex(size);
        assert.strictEqual(hexString.length, size * 2);
        assert.match(hexString, /^[a-fA-F0-9]+$/);
    });

    test('should generate a hex string of correct length for size 16', () => {
        const size = 16;
        const hexString = randomHex(size);
        assert.strictEqual(hexString.length, size * 2);
        assert.match(hexString, /^[a-fA-F0-9]+$/);
    });

    test('should generate a hex string of correct length for size 32', () => {
        const size = 32;
        const hexString = randomHex(size);
        assert.strictEqual(hexString.length, size * 2);
        assert.match(hexString, /^[a-fA-F0-9]+$/);
    });
});
