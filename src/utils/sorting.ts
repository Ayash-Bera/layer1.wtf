import { ChainBlockData } from '../types'
import { STALENESS_THRESHOLD_SECONDS } from '../constants'
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
  const nowSeconds = Math.floor(Date.now() / 1000)

  return [...chains].sort((a, b) => {
    const aFresh = a.blockData && nowSeconds - parseHexSafe(a.blockData.timestamp) <= STALENESS_THRESHOLD_SECONDS
    const bFresh = b.blockData && nowSeconds - parseHexSafe(b.blockData.timestamp) <= STALENESS_THRESHOLD_SECONDS

    if (aFresh && !bFresh) return -1
    if (!aFresh && bFresh) return 1

    if (aFresh && bFresh) {
      const gasUsedA = parseHexSafe(a.blockData!.gasUsed)
      const gasUsedB = parseHexSafe(b.blockData!.gasUsed)
      return gasUsedB - gasUsedA
    }

    return b.lastUpdated - a.lastUpdated
  })
}
