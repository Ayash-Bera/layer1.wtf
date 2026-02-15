import { describe, it, expect } from 'vitest'
import { sortChainsByBlockNumber, sortChainsByGasUsed } from '../sorting'
import { ChainBlockData } from '../../types'

function makeChain(name: string, overrides: Partial<ChainBlockData> = {}): ChainBlockData {
  return {
    chainName: name,
    blockchainId: name,
    blockData: null,
    loading: false,
    error: null,
    lastUpdated: Date.now(),
    ...overrides,
  }
}

function makeBlockData(number: string, gasUsed: string, timestamp?: string) {
  return {
    number,
    gasUsed,
    gasLimit: '0xf4240',
    size: '0x400',
    timestamp: timestamp || ('0x' + Math.floor(Date.now() / 1000).toString(16)),
    hash: '0xabc',
    baseFeePerGas: '0x0',
    blobGasUsed: '0x0',
    blockGasCost: '0x0',
    difficulty: '0x0',
    excessBlobGas: '0x0',
    extraData: '0x',
    logsBloom: '0x',
    miner: '0x',
    mixHash: '0x',
    nonce: '0x0',
    parentBeaconBlockRoot: '0x',
    parentHash: '0x',
    receiptsRoot: '0x',
    sha3Uncles: '0x',
    stateRoot: '0x',
    totalDifficulty: '0x0',
    transactions: [],
    transactionsRoot: '0x',
    uncles: [],
  } as any
}

describe('sortChainsByBlockNumber', () => {
  it('puts chains with data before chains without', () => {
    const chains = [
      makeChain('NoData'),
      makeChain('HasData', { blockData: makeBlockData('0xa', '0x1') }),
    ]
    const sorted = sortChainsByBlockNumber(chains)
    expect(sorted[0].chainName).toBe('HasData')
    expect(sorted[1].chainName).toBe('NoData')
  })

  it('sorts chains with data by block number descending', () => {
    const chains = [
      makeChain('Low', { blockData: makeBlockData('0xa', '0x1') }),    // 10
      makeChain('High', { blockData: makeBlockData('0x64', '0x1') }),  // 100
    ]
    const sorted = sortChainsByBlockNumber(chains)
    expect(sorted[0].chainName).toBe('High')
    expect(sorted[1].chainName).toBe('Low')
  })

  it('sorts chains without data alphabetically', () => {
    const chains = [
      makeChain('Zebra'),
      makeChain('Alpha'),
    ]
    const sorted = sortChainsByBlockNumber(chains)
    expect(sorted[0].chainName).toBe('Alpha')
    expect(sorted[1].chainName).toBe('Zebra')
  })

  it('treats errored chains as no-data', () => {
    const chains = [
      makeChain('Errored', { blockData: makeBlockData('0xff', '0x1'), error: 'fail' }),
      makeChain('Good', { blockData: makeBlockData('0x1', '0x1') }),
    ]
    const sorted = sortChainsByBlockNumber(chains)
    expect(sorted[0].chainName).toBe('Good')
  })
})

describe('sortChainsByGasUsed', () => {
  it('sorts by gas used descending', () => {
    const chains = [
      makeChain('LowGas', { blockData: makeBlockData('0x1', '0x100') }),    // 256
      makeChain('HighGas', { blockData: makeBlockData('0x1', '0x10000') }), // 65536
    ]
    const sorted = sortChainsByGasUsed(chains)
    expect(sorted[0].chainName).toBe('HighGas')
    expect(sorted[1].chainName).toBe('LowGas')
  })

  it('puts chains with data before chains without', () => {
    const chains = [
      makeChain('NoData', { lastUpdated: 1000 }),
      makeChain('HasData', { blockData: makeBlockData('0x1', '0x100') }),
    ]
    const sorted = sortChainsByGasUsed(chains)
    expect(sorted[0].chainName).toBe('HasData')
  })

  it('does not mutate the original array', () => {
    const chains = [
      makeChain('B', { blockData: makeBlockData('0x1', '0x100') }),
      makeChain('A', { blockData: makeBlockData('0x1', '0x10000') }),
    ]
    const original = [...chains]
    sortChainsByGasUsed(chains)
    expect(chains[0].chainName).toBe(original[0].chainName)
  })
})
