import { CSVParse } from './csv'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

describe('csv', () => {
    test('parses simple CSV with default options', () => {
        const csvText = 'name,age\nAlice,30\nBob,25'
        const result = CSVParse(csvText)
        assert.deepStrictEqual(result, [
            { name: 'Alice', age: '30' },
            { name: 'Bob', age: '25' }
        ])
    })

    // Additional tests for CSVParse...
})
