export interface NativeToken {
  symbol?: string
  name?: string
  decimals?: number
  logoUri?: string
}

export interface Chain {
  chainName: string
  blockchainId: string
  subnetId: string
  rpcUrl: string | null
  evmChainId: string | null
  vmName: string | null
  isL1: boolean
  logo: string | null
  description: string | null
  explorerUrl: string | null
  website: string | null
  nativeToken: NativeToken | null
  categories: string[]
}

import chainsData from './chains.json'

export const chains: Chain[] = chainsData

// Get chains that have an EVM chain ID and RPC URL (include both debugEnabled true and false)
export const getActiveChains = () => chains.filter(chain => chain.evmChainId && chain.rpcUrl)