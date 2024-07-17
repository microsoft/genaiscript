import { XMLParse } from './xml'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

describe('xml', () => {
    test('parse', () => {
        const x = XMLParse('<root><a>1</a><b>2</b></root>')
        assert.deepStrictEqual(x, { root: { a: 1, b: 2 } })
    })
})