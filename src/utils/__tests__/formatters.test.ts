import { describe, it, expect } from 'vitest'
import { formatNumber, formatHash, formatTimestamp } from '../formatters'

describe('formatNumber', () => {
  it('formats millions', () => {
    expect(formatNumber(1500000)).toBe('1.5M')
    expect(formatNumber(1000000)).toBe('1.0M')
  })

  it('formats thousands', () => {
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(1000)).toBe('1.0K')
  })

  it('formats small numbers with locale string', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(0)).toBe('0')
  })
})

describe('formatHash', () => {
  it('truncates hash with ellipsis', () => {
    const hash = '0xabcdef1234567890abcdef1234567890abcdef12'
    expect(formatHash(hash)).toBe('0xabcd...ef12')
  })

  it('handles short strings', () => {
    expect(formatHash('0x1234567890')).toBe('0x1234...7890')
  })
})

describe('formatTimestamp', () => {
  it('formats seconds ago', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(formatTimestamp(now - 30)).toBe('30s ago')
  })

  it('formats minutes ago', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(formatTimestamp(now - 120)).toBe('2m ago')
  })

  it('formats hours ago', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(formatTimestamp(now - 7200)).toBe('2h ago')
  })

  it('formats days ago', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(formatTimestamp(now - 172800)).toBe('2d ago')
  })
})
