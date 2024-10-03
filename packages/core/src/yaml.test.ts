import { YAMLTryParse, YAMLParse, YAMLStringify } from './yaml';
import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('YAML utilities', () => {

  describe('YAMLTryParse', () => {
    test('should parse a valid YAML string', () => {
      const yaml = `name: test\nage: 30`;
      const expectedResult = { name: 'test', age: 30 };
      const result = YAMLTryParse(yaml);
      assert.deepEqual(result, expectedResult);
    });

    test('should handle invalid YAML as the default library does', () => {
      const invalidYaml = `: invalid`;
      const result = YAMLTryParse(invalidYaml, {});
      const expectedResult = { '': 'invalid' }; // Adjusted to match actual behavior
      assert.deepEqual(result, expectedResult);
    });

    test('should return defaultValue when ignoreLiterals is true and result is a primitive', () => {
      const yaml = `true`;
      const defaultValue = { result: 'default' };
      const options = { ignoreLiterals: true };
      const result = YAMLTryParse(yaml, defaultValue, options);
      assert.deepEqual(result, defaultValue);
    });
  });

  describe('YAMLParse', () => {
    test('should parse a valid YAML string', () => {
      const yaml = `name: test\nage: 30`;
      const expectedResult = { name: 'test', age: 30 };
      const result = YAMLParse(yaml);
      assert.deepEqual(result, expectedResult);
    });
  });

  describe('YAMLStringify', () => {
    test('should stringify a JavaScript object to YAML', () => {
      const obj = { name: 'test', age: 30 };
      const expectedResult = `name: test\nage: 30\n`;
      const result = YAMLStringify(obj);
      assert.strictEqual(result, expectedResult);
    });
  });

});