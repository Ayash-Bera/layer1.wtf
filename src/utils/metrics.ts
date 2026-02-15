import { BlockData, ChainMetrics } from '../types'
import { BLOCK_TIME_SECONDS } from '../constants'
import { parseHexSafe } from './validation'

export function calculateTps(txCount: number, blockTime: number = BLOCK_TIME_SECONDS): number {
  return txCount / blockTime
}

export function calculateMetrics(blockData: BlockData, blockTime: number = BLOCK_TIME_SECONDS): ChainMetrics {
  const blockNumber = parseHexSafe(blockData.number)
  const gasUsed = parseHexSafe(blockData.gasUsed)
  const gasLimit = parseHexSafe(blockData.gasLimit)
  const blockSize = parseHexSafe(blockData.size)
  const timestamp = parseHexSafe(blockData.timestamp)
  const transactionCount = blockData.transactions.length

  const tps = calculateTps(transactionCount, blockTime)
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
