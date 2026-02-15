import { ChainBlockData } from '../types'
import { parseHexSafe } from './validation'

export function sortChainsByBlockNumber(chains: ChainBlockData[]): ChainBlockData[] {
  return chains.sort((a, b) => {
    const aHasData = a.blockData && !a.loading && !a.error
    const bHasData = b.blockData && !b.loading && !b.error

    if (aHasData && !bHasData) return -1
    if (!aHasData && bHasData) return 1

    if (aHasData && bHasData) {
      const blockNumberA = parseHexSafe(a.blockData!.number)
      const blockNumberB = parseHexSafe(b.blockData!.number)
      return blockNumberB - blockNumberA
    }

    return a.chainName.localeCompare(b.chainName)
  })
}

export function sortChainsByGasUsed(chains: ChainBlockData[]): ChainBlockData[] {
  return [...chains].sort((a, b) => {
    if (a.blockData && !b.blockData) return -1
    if (!a.blockData && b.blockData) return 1

    if (a.blockData && b.blockData) {
      const gasUsedA = parseHexSafe(a.blockData.gasUsed)
      const gasUsedB = parseHexSafe(b.blockData.gasUsed)
      return gasUsedB - gasUsedA
    }

    return b.lastUpdated - a.lastUpdated
  })
}
