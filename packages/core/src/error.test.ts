import { strict as assert } from 'node:assert';
import { describe, it as test } from 'node:test';
import {
  serializeError,
  errorMessage,
  CancelError,
  NotSupportedError,
  RequestError,
  isCancelError,
  isRequestError
} from './error';

describe('Error Utilities', () => {
  describe('serializeError function', () => {
    test('should return undefined for null or undefined input', () => {
      assert.strictEqual(serializeError(null), undefined);
      assert.strictEqual(serializeError(undefined), undefined);
    });

    test('should serialize an Error instance', () => {
      const error = new Error('Test error');
      const serialized = serializeError(error);
      assert.strictEqual(serialized.message, 'Test error');
      assert.ok('stack' in serialized);
    });

    test('should return the object as is for SerializedError input', () => {
      const serializedError = { message: 'Serialized error', stack: 'stack trace' };
      const serialized = serializeError(serializedError);
      assert.deepStrictEqual(serialized, serializedError);
    });

    test('should return an object with message property for string input', () => {
      const message = 'Test message';
      const serialized = serializeError(message);
      assert.strictEqual(serialized.message, message);
    });

    test('should return an object with message property for number input', () => {
      const number = 42;
      const serialized = serializeError(number);
      assert.strictEqual(serialized.message, '42');
    });
  });

  describe('errorMessage function', () => {
    test('should return undefined for null or undefined input', () => {
      assert.strictEqual(errorMessage(null), undefined);
      assert.strictEqual(errorMessage(undefined), undefined);
    });

    test('should return the error message if available', () => {
      const error = new Error('Test error message');
      assert.strictEqual(errorMessage(error), 'Test error message');
    });

    test('should return default value if no message or name on error', () => {
      const error = {}; // Empty error-like object
      assert.strictEqual(errorMessage(error), 'error');
    });
  });

  describe('CancelError class', () => {
    test('should have a name property set to "CancelError"', () => {
      const error = new CancelError('Cancellation happened');
      assert.strictEqual(error.name, CancelError.NAME);
    });
  });

  describe('NotSupportedError class', () => {
    test('should have a name property set to "NotSupportedError"', () => {
      const error = new NotSupportedError('Not supported');
      assert.strictEqual(error.name, NotSupportedError.NAME);
    });
  });

  describe('RequestError class', () => {
    test('should set instance properties correctly', () => {
      const status = 404;
      const statusText = 'Not Found';
      const body = { message: 'Resource not found' };
      const bodyText = 'Error body text';
      const retryAfter = 120;
      const error = new RequestError(status, statusText, body, bodyText, retryAfter);
      assert.strictEqual(error.status, status);
      assert.strictEqual(error.statusText, statusText);
      assert.deepStrictEqual(error.body, body);
      assert.strictEqual(error.bodyText, bodyText);
      assert.strictEqual(error.retryAfter, retryAfter);
    });
  });

  describe('isCancelError function', () => {
    test('should return true for CancelError instances', () => {
      const error = new CancelError('Cancellation');
      assert.ok(isCancelError(error));
    });

    test('should return true for AbortError', () => {
      const error = new Error('Abort');
      error.name = 'AbortError';
      assert.ok(isCancelError(error));
    });
  });

  describe('isRequestError function', () => {
    test('should return true for RequestError instances with matching statusCode and code', () => {
      const error = new RequestError(400, 'Bad Request', { code: 'BadRequest' });
      assert.ok(isRequestError(error, 400, 'BadRequest'));
    });

    test('should return true for RequestError instances with undefined statusCode or code', () => {
      const error = new RequestError(400, 'Bad Request', { code: 'BadRequest' });
      assert.ok(isRequestError(error));
    });
  });
});
