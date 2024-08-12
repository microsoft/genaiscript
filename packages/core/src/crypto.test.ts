import assert from 'node:assert/strict';
import test, { beforeEach, describe } from 'node:test';
import { randomHex } from './crypto';

describe('randomHex function', () => {
    test('should generate a hex string of the correct length', () => {
        const size = 16;
        const hexString = randomHex(size);
        assert.strictEqual(hexString.length, size * 2);
    });

    test('should ensure randomness in generated hex strings', () => {
        const size = 16;
        const hexString1 = randomHex(size);
        const hexString2 = randomHex(size);
        assert.notStrictEqual(hexString1, hexString2);
    });

    test('should handle the smallest valid size correctly', () => {
        const size = 1;
        const hexString = randomHex(size);
        assert.strictEqual(hexString.length, 2);
    });

    test('should handle a large size correctly', () => {
        const size = 1024;
        const hexString = randomHex(size);
        assert.strictEqual(hexString.length, size * 2);
    });

    test('should return an empty string for size 0', () => {
        const size = 0;
        const hexString = randomHex(size);
        assert.strictEqual(hexString, '');
    });
});