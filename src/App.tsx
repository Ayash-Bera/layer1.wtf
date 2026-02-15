import React from 'react'
import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { ChainBlockData } from './types'
import { getActiveChains } from './data/chains'
import { RPC_FETCH_TIMEOUT_MS, POLLING_INTERVAL_MS, BACKEND_REFRESH_INTERVAL_MS, TPS_HISTORY_MAX_LENGTH } from './constants'
import { sortChainsByBlockNumber } from './utils/sorting'
import { isValidBlockData } from './utils/validation'
import { calculateTps } from './utils/metrics'
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
    return await fetchChainDataDirect(rpcUrl, chainName, evmChainId)
  }

  const fetchChainDataDirect = async (rpcUrl: string, chainName: string, evmChainId: string) => {
    try {

      // Create an AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), RPC_FETCH_TIMEOUT_MS)

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

      if (!isValidBlockData(data.result)) {
        throw new Error(`Invalid block data for ${chainName}: missing required fields`)
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
          const tps = calculateTps(blockData.transactions.length)
          const existingHistory = workingChainData[chainIndex].tpsHistory || []
          workingChainData[chainIndex] = {
            ...workingChainData[chainIndex],
            blockData,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
            tpsHistory: [...existingHistory.slice(-(TPS_HISTORY_MAX_LENGTH - 1)), tps]
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Unknown error for ${chain.chainName}`
        console.error(`[RPC] ${chain.chainName}:`, errorMessage)
        // Update the working array with error
        const chainIndex = workingChainData.findIndex(item => item.blockchainId === chain.evmChainId)
        if (chainIndex !== -1) {
          workingChainData[chainIndex] = {
            ...workingChainData[chainIndex],
            loading: false,
            error: errorMessage,
            lastUpdated: Date.now()
          }
        }
      }
    })

    // Wait for all promises to complete
    await Promise.allSettled(promises)

    // Sort the complete data by block number (highest to lowest)
    sortChainsByBlockNumber(workingChainData)

    // Update state with sorted data
    setChainData(workingChainData)
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
        const errorMessage = err instanceof Error ? err.message : `Unknown error for ${chain.chainName}`
        console.error(`[RPC] ${chain.chainName}:`, errorMessage)
        updates.set(chain.evmChainId!, { error: errorMessage })
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
            const tps = calculateTps(update.blockData.transactions.length)
            const existingHistory = tempChainData[chainIndex].tpsHistory || []
            tempChainData[chainIndex] = {
              ...tempChainData[chainIndex],
              blockData: update.blockData,
              loading: false,
              error: null,
              lastUpdated: Date.now(),
              tpsHistory: [...existingHistory.slice(-(TPS_HISTORY_MAX_LENGTH - 1)), tps]
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
      return sortChainsByBlockNumber(tempChainData)
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
    }, POLLING_INTERVAL_MS)

    // Refresh backend data every 5 minutes
    const backendInterval = setInterval(fetchBackendData, BACKEND_REFRESH_INTERVAL_MS)

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
