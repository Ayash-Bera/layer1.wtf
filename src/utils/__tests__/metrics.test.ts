import { describe, it, expect } from 'vitest'
import { calculateMetrics, calculateTps } from '../metrics'
import { BlockData } from '../../types'

describe('calculateTps', () => {
  it('divides transaction count by block time', () => {
    expect(calculateTps(10)).toBe(5)
    expect(calculateTps(0)).toBe(0)
    expect(calculateTps(1)).toBe(0.5)
  })
})

describe('calculateMetrics', () => {
  const mockBlockData: BlockData = {
    baseFeePerGas: '0x0',
    blobGasUsed: '0x0',
    blockGasCost: '0x0',
    difficulty: '0x0',
    excessBlobGas: '0x0',
    extraData: '0x',
    gasLimit: '0xf4240',   // 1,000,000
    gasUsed: '0x7a120',    // 500,000
    hash: '0xabc',
    logsBloom: '0x',
    miner: '0x',
    mixHash: '0x',
    nonce: '0x0',
    number: '0x64',        // 100
    parentBeaconBlockRoot: '0x',
    parentHash: '0x',
    receiptsRoot: '0x',
    sha3Uncles: '0x',
    size: '0x400',         // 1024
    stateRoot: '0x',
    timestamp: '0x65b0c800',
    totalDifficulty: '0x0',
    transactions: [{} as any, {} as any, {} as any, {} as any], // 4 txs
    transactionsRoot: '0x',
    uncles: []
  }

  it('parses block number from hex', () => {
    const metrics = calculateMetrics(mockBlockData)
    expect(metrics.blockNumber).toBe(100)
  })

  it('calculates TPS from transaction count', () => {
    const metrics = calculateMetrics(mockBlockData)
    expect(metrics.tps).toBe(2) // 4 txs / 2s
  })

  it('parses gas values from hex', () => {
    const metrics = calculateMetrics(mockBlockData)
    expect(metrics.gasUsed).toBe(500000)
    expect(metrics.gasLimit).toBe(1000000)
  })

  it('calculates gas utilization', () => {
    const metrics = calculateMetrics(mockBlockData)
    expect(metrics.gasUtilization).toBe(0.5)
  })

  it('parses block size from hex', () => {
    const metrics = calculateMetrics(mockBlockData)
    expect(metrics.blockSize).toBe(1024)
  })

  it('counts transactions', () => {
    const metrics = calculateMetrics(mockBlockData)
    expect(metrics.transactionCount).toBe(4)
  })
})
