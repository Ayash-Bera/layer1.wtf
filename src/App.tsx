import React from 'react'
import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { ChainBlockData } from './types'
import { getActiveChains } from './data/chains'
import CRTEffect from 'vault66-crt-effect'
import 'vault66-crt-effect/dist/vault66-crt-effect.css'

function App() {
  const [chainData, setChainData] = useState<ChainBlockData[]>([])
  const [loading, setLoading] = useState(true)
  const [allDataFetched, setAllDataFetched] = useState(false)
  const [validatorCounts, setValidatorCounts] = useState<Record<string, number>>({})
  const [icmCounts, setIcmCounts] = useState<Record<string, number>>({})

  const fetchBackendData = async () => {
    try {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const api = isDev ? '/api/l1beat' : import.meta.env.VITE_L1BEAT_API_URL
      const [validatorRes, icmRes] = await Promise.allSettled([
        fetch(`${api}/validators/network/stats`).then(r => r.json()),
        fetch(`${api}/teleporter/messages/daily-count`).then(r => r.json())
      ])

      if (validatorRes.status === 'fulfilled' && validatorRes.value?.data?.allChains) {
        const counts: Record<string, number> = {}
        for (const chain of validatorRes.value.data.allChains) {
          counts[chain.chainName] = chain.validatorCount
          if (chain.evmChainId) counts[String(chain.evmChainId)] = chain.validatorCount
        }
        setValidatorCounts(counts)
      }

      if (icmRes.status === 'fulfilled' && icmRes.value?.data) {
        const counts: Record<string, number> = {}
        for (const msg of icmRes.value.data) {
          counts[msg.sourceChain] = (counts[msg.sourceChain] || 0) + msg.messageCount
          counts[msg.destinationChain] = (counts[msg.destinationChain] || 0) + msg.messageCount
        }
        // Keep as daily totals (raw counts are already for the full time window)
        // Also index by evmChainId using validator chain data for better matching
        if (validatorRes.status === 'fulfilled' && validatorRes.value?.data?.allChains) {
          for (const chain of validatorRes.value.data.allChains) {
            if (chain.evmChainId && counts[chain.chainName] !== undefined) {
              counts[String(chain.evmChainId)] = counts[chain.chainName]
            }
          }
        }
        setIcmCounts(counts)
      }
    } catch (err) {
      console.warn('Failed to fetch backend data:', err)
    }
  }

  const fetchChainData = async (rpcUrl: string, chainName: string, evmChainId: string) => {
    // Use proxy for UPTN to avoid CORS issues
    if (rpcUrl.includes('node-api.uptn.io')) {
      return await fetchChainDataViaProxy(rpcUrl, chainName, evmChainId)
    }
    // Use direct RPC URL for other chains
    return await fetchChainDataDirect(rpcUrl, chainName, evmChainId)
  }

  const fetchChainDataViaProxy = async (rpcUrl: string, chainName: string, evmChainId: string) => {
    // Try standalone proxy server first (runs on port 3001)
    try {
      // In production, use the external API directly; in development, use proxy
      const rpcProxyBase = import.meta.env.VITE_RPC_PROXY_URL || '/api/rpc'
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      const apiUrl = isProduction
        ? `${rpcProxyBase}/${evmChainId}/rpc`
        : `/api/rpc/${evmChainId}/rpc`

      // Proxy RPC call for ${chainName}

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          method: 'eth_getBlockByNumber',
          params: ['latest', true],
          id: 1,
          jsonrpc: '2.0'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // If API fails with 500 and chain config not found, try direct RPC
        if (response.status === 500) {
          try {
            const errorText = await response.text()
            if (errorText.includes('Chain config not found')) {
              return await fetchChainDataDirect(rpcUrl, chainName, evmChainId)
            }
          } catch (textError) {
          }
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch data for chain ${chainName}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(`RPC Error for ${chainName}: ${data.error.message || 'Unknown RPC error'}`)
      }

      return data.result
    } catch (err) {
      // Proxy failed, trying direct fallback
    }

    // Final fallback: Try direct request
    try {
      return await fetchChainDataDirect(rpcUrl, chainName, evmChainId)
    } catch (err) {
      console.warn(`All RPC methods failed for ${chainName}`)
      throw new Error(`Failed to fetch ${chainName} data: All proxy methods failed.`)
    }
  }

  const fetchChainDataDirect = async (rpcUrl: string, chainName: string, evmChainId: string) => {
    try {

      // Create an AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(rpcUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          method: 'eth_getBlockByNumber',
          params: ['latest', true],
          id: 1,
          jsonrpc: '2.0'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch data for chain ${chainName} via direct RPC`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`RPC Error for ${chainName}: ${data.error.message || 'Unknown RPC error'}`)
      }

      return data.result
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Timeout: Failed to fetch data for chain ${chainName} via direct RPC`)
      }
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error(`CORS/Network error: ${chainName} RPC endpoint may not allow browser requests.`)
      }
      throw err
    }
  }

  const fetchAllChainData = async () => {
    const activeChains = getActiveChains()

    // Initialize chain data with loading state and set it immediately
    const initialChainData: ChainBlockData[] = activeChains.map(chain => ({
      chainName: chain.chainName,
      blockchainId: chain.evmChainId || chain.blockchainId,
      blockData: null,
      loading: true,
      error: null,
      lastUpdated: Date.now()
    }))

    // Set initial loading state
    setChainData(initialChainData)
    setLoading(false)

    // Create a working copy for updates
    const workingChainData = [...initialChainData]

    // Fetch data for each chain
    const promises = activeChains.filter(chain => chain.evmChainId && chain.rpcUrl).map(async (chain) => {
      try {
        const blockData = await fetchChainData(chain.rpcUrl!, chain.chainName, chain.evmChainId!)
        // Update the working array
        const chainIndex = workingChainData.findIndex(item => item.blockchainId === chain.evmChainId)
        if (chainIndex !== -1) {
          const tps = blockData.transactions.length / 2
          const existingHistory = workingChainData[chainIndex].tpsHistory || []
          workingChainData[chainIndex] = {
            ...workingChainData[chainIndex],
            blockData,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
            tpsHistory: [...existingHistory.slice(-19), tps]
          }
        }
      } catch (err) {
        // Update the working array with error
        const chainIndex = workingChainData.findIndex(item => item.blockchainId === chain.evmChainId)
        if (chainIndex !== -1) {
          workingChainData[chainIndex] = {
            ...workingChainData[chainIndex],
            loading: false,
            error: err instanceof Error ? err.message : `Unknown error for ${chain.chainName}`,
            lastUpdated: Date.now()
          }
        }
      }
    })

    // Wait for all promises to complete
    await Promise.allSettled(promises)

    // Sort the complete data by block number (highest to lowest)
    const sortedChainData = workingChainData.sort((a, b) => {
      const aHasData = a.blockData && !a.loading && !a.error
      const bHasData = b.blockData && !b.loading && !b.error

      // Chains with data come first
      if (aHasData && !bHasData) return -1
      if (!aHasData && bHasData) return 1

      // If both have data, sort by block number (highest first)
      if (aHasData && bHasData) {
        const blockNumberA = parseInt(a.blockData!.number, 16)
        const blockNumberB = parseInt(b.blockData!.number, 16)
        return blockNumberB - blockNumberA
      }

      // For chains without data, sort alphabetically
      return a.chainName.localeCompare(b.chainName)
    })

    // Update state with sorted data
    setChainData(sortedChainData)
    setAllDataFetched(true)
  }

  // Separate function for subsequent updates that maintains order
  const updateChainData = async () => {
    if (!allDataFetched) return

    const activeChains = getActiveChains()

    // Fetch all data first
    const updates: Map<string, { blockData?: any; error?: string }> = new Map()

    const promises = activeChains.filter(chain => chain.evmChainId && chain.rpcUrl).map(async (chain) => {
      try {
        const blockData = await fetchChainData(chain.rpcUrl!, chain.chainName, chain.evmChainId!)
        updates.set(chain.evmChainId!, { blockData })
      } catch (err) {
        updates.set(chain.evmChainId!, { error: err instanceof Error ? err.message : `Unknown error for ${chain.chainName}` })
      }
    })

    await Promise.allSettled(promises)

    // Use functional setState to get current state
    setChainData(prevChainData => {
      const tempChainData = [...prevChainData]

      updates.forEach((update, evmChainId) => {
        const chainIndex = tempChainData.findIndex(item => item.blockchainId === evmChainId)
        if (chainIndex !== -1) {
          if (update.blockData) {
            const tps = update.blockData.transactions.length / 2
            const existingHistory = tempChainData[chainIndex].tpsHistory || []
            tempChainData[chainIndex] = {
              ...tempChainData[chainIndex],
              blockData: update.blockData,
              loading: false,
              error: null,
              lastUpdated: Date.now(),
              tpsHistory: [...existingHistory.slice(-19), tps]
            }
          } else if (update.error) {
            tempChainData[chainIndex] = {
              ...tempChainData[chainIndex],
              loading: false,
              error: update.error,
              lastUpdated: Date.now()
            }
          }
        }
      })

      // Re-sort after updates to maintain proper order
      return tempChainData.sort((a, b) => {
        const aHasData = a.blockData && !a.loading && !a.error
        const bHasData = b.blockData && !b.loading && !b.error

        if (aHasData && !bHasData) return -1
        if (!aHasData && bHasData) return 1

        if (aHasData && bHasData) {
          const blockNumberA = parseInt(a.blockData!.number, 16)
          const blockNumberB = parseInt(b.blockData!.number, 16)
          return blockNumberB - blockNumberA
        }

        return a.chainName.localeCompare(b.chainName)
      })
    })
  }

  useEffect(() => {
    fetchAllChainData()
    fetchBackendData()

    // After initial fetch, use update function for subsequent calls
    const interval = setInterval(() => {
      if (allDataFetched) {
        updateChainData()
      }
    }, 5000)

    // Refresh backend data every 5 minutes
    const backendInterval = setInterval(fetchBackendData, 300000)

    return () => {
      clearInterval(interval)
      clearInterval(backendInterval)
    }
  }, [allDataFetched])

  return (
    <CRTEffect preset="minimal">
      <div className="app">
        <Dashboard
          chainData={chainData}
          loading={loading}
          validatorCounts={validatorCounts}
          icmCounts={icmCounts}
          onRefresh={() => {
            if (allDataFetched) {
              updateChainData()
            } else {
              fetchAllChainData()
            }
          }}
        />
      </div>
    </CRTEffect>
  )
}

export default App
