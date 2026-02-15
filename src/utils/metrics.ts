import { BlockData, ChainMetrics } from '../types'
import { BLOCK_TIME_SECONDS } from '../constants'
import { parseHexSafe } from './validation'

export function calculateTps(txCount: number): number {
  return txCount / BLOCK_TIME_SECONDS
}

export function calculateMetrics(blockData: BlockData): ChainMetrics {
  const blockNumber = parseHexSafe(blockData.number)
  const gasUsed = parseHexSafe(blockData.gasUsed)
  const gasLimit = parseHexSafe(blockData.gasLimit)
  const blockSize = parseHexSafe(blockData.size)
  const timestamp = parseHexSafe(blockData.timestamp)
  const transactionCount = blockData.transactions.length

  const tps = calculateTps(transactionCount)
  const gasUtilization = gasUsed / gasLimit

  return {
    blockNumber,
    tps,
    gasUsed,
    gasLimit,
    gasUtilization,
    blockSize,
    transactionCount,
    timestamp
  }
}
