export interface Chain {
  chainName: string
  blockchainId: string
  subnetId: string
  rpcUrl: string | null
  evmChainId: string | null
  blocksCount: string | null
  estimatedTxCount: string | null
  glacierChainId?: string
  comment: string | null
  debugEnabled: boolean
}

import chainsData from './chains.json'

export const chains: Chain[] = chainsData

// Get chains that have an EVM chain ID and RPC URL (include both debugEnabled true and false)
export const getActiveChains = () => chains.filter(chain => chain.evmChainId && chain.rpcUrl)