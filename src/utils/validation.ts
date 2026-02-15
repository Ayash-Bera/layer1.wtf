import { BlockData } from '../types'

export function parseHexSafe(hex: string): number {
  const parsed = parseInt(hex, 16)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function isValidBlockData(data: unknown): data is BlockData {
  if (typeof data !== 'object' || data === null) return false

  const obj = data as Record<string, unknown>

  const requiredHexFields = ['number', 'gasUsed', 'gasLimit', 'size', 'timestamp', 'hash']
  for (const field of requiredHexFields) {
    if (typeof obj[field] !== 'string') return false
  }

  if (!Array.isArray(obj.transactions)) return false

  return true
}
