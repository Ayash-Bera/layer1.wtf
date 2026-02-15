import { describe, it, expect } from 'vitest'
import { parseHexSafe, isValidBlockData } from '../validation'

describe('parseHexSafe', () => {
  it('parses valid hex strings', () => {
    expect(parseHexSafe('0x64')).toBe(100)
    expect(parseHexSafe('0xff')).toBe(255)
    expect(parseHexSafe('0x0')).toBe(0)
  })

  it('parses hex without 0x prefix', () => {
    expect(parseHexSafe('ff')).toBe(255)
    expect(parseHexSafe('64')).toBe(100)
  })

  it('returns 0 for invalid input', () => {
    expect(parseHexSafe('')).toBe(0)
    expect(parseHexSafe('not-hex')).toBe(0)
    expect(parseHexSafe('xyz')).toBe(0)
  })
})

describe('isValidBlockData', () => {
  const validBlock = {
    number: '0x1',
    gasUsed: '0x0',
    gasLimit: '0xf4240',
    size: '0x400',
    timestamp: '0x65b0c800',
    hash: '0xabc',
    transactions: [],
  }

  it('accepts valid block data', () => {
    expect(isValidBlockData(validBlock)).toBe(true)
  })

  it('accepts block data with extra fields', () => {
    expect(isValidBlockData({ ...validBlock, extraField: 'ok' })).toBe(true)
  })

  it('rejects null', () => {
    expect(isValidBlockData(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValidBlockData(undefined)).toBe(false)
  })

  it('rejects non-objects', () => {
    expect(isValidBlockData('string')).toBe(false)
    expect(isValidBlockData(42)).toBe(false)
  })

  it('rejects missing required hex fields', () => {
    const { number, ...missing } = validBlock
    expect(isValidBlockData(missing)).toBe(false)
  })

  it('rejects non-string hex fields', () => {
    expect(isValidBlockData({ ...validBlock, number: 123 })).toBe(false)
  })

  it('rejects missing transactions array', () => {
    const { transactions, ...missing } = validBlock
    expect(isValidBlockData(missing)).toBe(false)
  })

  it('rejects non-array transactions', () => {
    expect(isValidBlockData({ ...validBlock, transactions: 'not-array' })).toBe(false)
  })
})
