import { test } from '@substrate-system/tapzero'
import BitField from '../src/index.js'

const data = '011011100110111'.split('').map(Number).map(Boolean)

test('Constructor', t => {
    const field = new BitField(data.length)
    for (let index = 0; index < data.length; index++) {
        t.ok(!field.get(index), 'should be empty when initialized')
    }
})

test('Assume size 0 if no data or size is passed in', t => {
    const field = new BitField()
    t.ok(field.buffer !== null, '.buffer is not null')
    t.equal(field.length, 0, 'should have length zero')
})

test('Use a TypedArray as input', t => {
    const orig = new BitField(0, { grow: 100 })
    orig.set(15)
    const copy = new BitField(orig.buffer)
    t.ok(copy.get(15), 'should have the same data')
})

test('bitfield size', t => {
    t.equal(new BitField(1).buffer.length, 1)
    t.equal(new BitField(1).length, 8)
    t.equal(new BitField(2).buffer.length, 1)
    t.equal(new BitField(3).buffer.length, 1)
    t.equal(new BitField(4).buffer.length, 1)
    t.equal(new BitField(5).buffer.length, 1)
    t.equal(new BitField(6).buffer.length, 1)
    t.equal(new BitField(7).buffer.length, 1)
    t.equal(new BitField(8).buffer.length, 1)
    t.equal(new BitField(9).buffer.length, 2)
    t.equal(new BitField(10).buffer.length, 2)
    t.equal(new BitField(11).buffer.length, 2)
    t.equal(new BitField(12).buffer.length, 2)
    t.equal(new BitField(13).buffer.length, 2)
    t.equal(new BitField(14).buffer.length, 2)
    t.equal(new BitField(15).buffer.length, 2)
    t.equal(new BitField(16).buffer.length, 2)
    t.equal(new BitField(17).buffer.length, 3)
    t.equal(new BitField(17).length, 24)
})

test('`set` should reproduce written data', t => {
    const field = new BitField(data.length)

    for (let index = 0; index < data.length; index++) {
        field.set(index, data[index])
    }

    for (let index = 0; index < data.length; index++) {
        t.equal(field.get(index), data[index], 'should have equal data')
    }
})

test('out-of-bounds reads', t => {
    const field = new BitField(data.length)

    for (let index = data.length; index < 1e3; index++) {
        t.equal(field.get(index), false, 'Out of bounds should be `false`')
    }
})

test('should support disabling a field', t => {
    const field = new BitField(0, { grow: 100 })
    field.set(3, true)
    t.equal(field.get(3), true)
    field.set(3, false)

    // Check the first 10 indices, to ensure we only mutated a single field
    for (let index = 0; index < 10; index++) {
        t.equal(field.get(index), false)
    }

    // Set the first 10 fields, then disable one
    for (let index = 0; index < 10; index++) {
        field.set(index)
    }

    field.set(5, false)
    for (let index = 0; index < 10; index++) {
        if (index === 5) {
            t.equal(field.get(index), false)
        } else {
            t.equal(field.get(index), true)
        }
    }
})

test('Should ignore disables out of bounds', t => {
    const field = new BitField(0, { grow: 100 })
    field.set(3, false)
    t.equal(field.buffer.length, 0)
})

test('should not grow by default', t => {
    const field = new BitField(data.length)

    for (let index = 25; index < 125; index++) {
        index += 8 + Math.floor(32 * Math.random())

        const oldLength = field.buffer.length
        t.equal(field.get(index), false)

        // Should not have grown for get()
        t.equal(field.buffer.length, oldLength, 'should not grow on `get()`')

        field.set(index, true)

        // Should not have grown for set()
        t.equal(field.buffer.length, oldLength, 'should not grow on `set()`')
        t.equal(field.get(index), false, 'should not grow on `set()`')
    }
})

test('should be able to grow to infinity', t => {
    const growField = new BitField(data.length, {
        grow: Number.POSITIVE_INFINITY
    })

    for (let i = 25; i < 125; i++) {
        i += 8 + Math.floor(32 * Math.random())

        const oldLength = growField.buffer.length
        t.equal(growField.get(i), false)
        t.equal(growField.buffer.length, oldLength, 'should not grow on `get()`')

        growField.set(i, true)
        t.ok(growField.buffer.length >= Math.ceil(i + 1) / 8)
        t.equal(growField.get(i), true)
    }
})

test('Pass in a growth option', t => {
    const smallGrowField = new BitField(0, { grow: 50 })
    for (let i = 0; i < 100; i++) {
        const oldLength = smallGrowField.buffer.length
        smallGrowField.set(i, true)
        if (i <= 55) {
            t.ok(smallGrowField.buffer.length >= (i >> 3) + 1)
            t.equal(smallGrowField.get(i), true)
        } else {
            t.equal(smallGrowField.buffer.length, oldLength,
                'should not have grown for `set()`')
            t.equal(smallGrowField.get(i), false, 'should return false oob')
        }
    }
})

test('`setAll`', t => {
    const field = new BitField(data.length)
    field.setAll(data)
    for (let i = 0; i < data.length; i++) {
        t.equal(field.get(i), data[i], 'should reproduce written data')
    }
})

test('offset', t => {
    const field = new BitField(data.length)
    field.setAll(data, 3)

    for (let i = 0; i < data.length; i++) {
        t.equal(field.get(i), i < 3 ? false : data[i - 3])
    }

    for (let i = data.length + 3; i < 1e3; i++) {
        t.equal(field.get(i), false)
    }
})

test('`setAll supports grow', t => {
    const field = new BitField(data.length, { grow: 100 })
    field.setAll(data, 3)

    for (let i = 0; i < data.length + 3; i++) {
        t.equal(field.get(i), i < 3 ? false : data[i - 3])
    }

    for (let i = data.length + 3; i < 1e3; i++) {
        t.equal(field.get(i), false)
    }
})

test('`forEach`', t => {
    const field = new BitField(data.length)
    field.setAll(data)

    const values:boolean[] = []

    field.forEach((bit, i) => {
        t.equal(i, values.length)
        t.equal(field.get(i), bit)
        values.push(bit)
    })

    // Data has 15 entries, append a `false` to make it match.
    t.deepEqual(values, [...data, false])
})

test('should leep through some of the values', t => {
    const field = new BitField(data.length)
    field.setAll(data)
    const values:boolean[] = []

    field.forEach(
        (bit, i) => {
            t.equal(field.get(i), bit)
            values.push(bit)
        },
        3,
        11
    )

    t.deepEqual(values, data.slice(3, 11))
})

test('`isEmpty', t => {
    //  Assuming this creates a BitField with 10 bits, all unset
    const field = new BitField(10)
    t.equal(field.isEmpty(), true, 'a new field should be empty')

    field.set(5)  // set the 6th index
    t.equal(field.isEmpty(), false, 'should not be empty after you add something')

    const anotherField = new BitField(10)

    anotherField.set(3)
    anotherField.set(3, false)  // unset the 4th bit
    t.equal(anotherField.isEmpty(), true,
        'should be empty when you add and then unset')
})
