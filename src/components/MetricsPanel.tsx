import React from 'react'
import { Tooltip } from './Tooltip'
import { AnimatedCounter } from './AnimatedCounter'
import { ChainBlockData } from '../types'
import { BLOCK_TIME_SECONDS } from '../constants'
import { calculateTps } from '../utils/metrics'
import { parseHexSafe } from '../utils/validation'

interface MetricsPanelProps {
  metrics: {
    totalTps: number
    totalGasPerSecond: number
    averageUtilization: number
  } | null
  loading: boolean
  chainData: ChainBlockData[]
}

export function MetricsPanel({ metrics, loading, chainData }: MetricsPanelProps) {
  // Find C-Chain data for comparison
  const cChainData = chainData.find(chain =>
    chain.chainName === 'C-Chain' || chain.chainName === 'Avalanche C-Chain'
  )

  // Calculate total KB/s
  const totalKbPerSecond = chainData.reduce((sum, chain) => {
    if (chain.blockData && !chain.loading && !chain.error) {
      const blockSize = parseHexSafe(chain.blockData.size)
      return sum + (blockSize / 1024) / BLOCK_TIME_SECONDS
    }
    return sum
  }, 0)

  // Calculate C-Chain KB/s for comparison
  let cChainKbPerSecond = 0
  if (cChainData?.blockData && !cChainData.loading && !cChainData.error) {
    const cChainBlockSize = parseHexSafe(cChainData.blockData.size)
    cChainKbPerSecond = (cChainBlockSize / 1024) / BLOCK_TIME_SECONDS
  }

  // Calculate multipliers compared to C-Chain
  const calculateMultiplier = (totalValue: number, cChainValue: number) => {
    if (!cChainValue || cChainValue === 0) return 0
    return totalValue / cChainValue
  }

  let tpsMultiplier = 0
  let gasMultiplier = 0
  let kbMultiplier = 0

  if (metrics && cChainData?.blockData && !cChainData.loading && !cChainData.error) {
    const cChainTps = calculateTps(cChainData.blockData.transactions.length)
    const cChainGasUsed = parseHexSafe(cChainData.blockData.gasUsed)
    const cChainGasPerSecond = cChainGasUsed / BLOCK_TIME_SECONDS / 1000000

    tpsMultiplier = calculateMultiplier(metrics.totalTps, cChainTps)
    gasMultiplier = calculateMultiplier(metrics.totalGasPerSecond / 1000000, cChainGasPerSecond)
    kbMultiplier = calculateMultiplier(totalKbPerSecond, cChainKbPerSecond)
  }

  if (loading) {
    return (
      <div className="metrics-grid">
        <div className="metric metric-tps">
          <div className="metric-label">
            <Tooltip content="Total transactions per second across all L1s">
              TPS
            </Tooltip>
          </div>
          <div className="metric-value">...</div>
          <div className="metric-change">--</div>
        </div>
        <div className="metric metric-mgas">
          <div className="metric-label">
            <Tooltip content="Total gas consumed per second across all L1s">
              Mgas/s
            </Tooltip>
          </div>
          <div className="metric-value">...</div>
          <div className="metric-change">--</div>
        </div>
        <div className="metric metric-kbs">
          <div className="metric-label">
            <Tooltip content="Total data throughput per second across all L1s">
              KB/s
            </Tooltip>
          </div>
          <div className="metric-value">...</div>
          <div className="metric-change">--</div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="metrics-grid">
        <div className="metric metric-tps">
          <div className="metric-label">
            <Tooltip content="Total transactions per second across all L1s">
              TPS
            </Tooltip>
          </div>
          <div className="metric-value">0.00</div>
          <div className="metric-change">(--x)</div>
        </div>
        <div className="metric metric-mgas">
          <div className="metric-label">
            <Tooltip content="Total gas consumed per second across all L1s">
              Mgas/s
            </Tooltip>
          </div>
          <div className="metric-value">0.00</div>
          <div className="metric-change">(--x)</div>
        </div>
        <div className="metric metric-kbs">
          <div className="metric-label">
            <Tooltip content="Total data throughput per second across all L1s">
              KB/s
            </Tooltip>
          </div>
          <div className="metric-value">0.00</div>
          <div className="metric-change">(--x)</div>
        </div>
      </div>
    )
  }

  const mgasPerSecond = metrics.totalGasPerSecond / 1000000

  return (
    <div className="metrics-grid">
      <div className="metric metric-tps">
        <div className="metric-label">
          <Tooltip content="Total transactions per second across all L1s">
            TPS
          </Tooltip>
        </div>
        <div className="metric-value">
          <AnimatedCounter value={metrics.totalTps} decimals={2} />
        </div>
        <div className="metric-change positive">
          {tpsMultiplier > 0 ? `(${tpsMultiplier.toFixed(2)}x)` : '(--x)'}
        </div>
      </div>
      <div className="metric metric-mgas">
        <div className="metric-label">
          <Tooltip content="Total gas consumed per second across all L1s">
            Mgas/s
          </Tooltip>
        </div>
        <div className="metric-value">
          <AnimatedCounter value={mgasPerSecond} decimals={2} />
        </div>
        <div className="metric-change positive">
          {gasMultiplier > 0 ? `(${gasMultiplier.toFixed(2)}x)` : '(--x)'}
        </div>
      </div>
      <div className="metric metric-kbs">
        <div className="metric-label">
          <Tooltip content="Total data throughput per second across all L1s">
            KB/s
          </Tooltip>
        </div>
        <div className="metric-value">
          <AnimatedCounter value={totalKbPerSecond} decimals={2} />
        </div>
        <div className="metric-change positive">
          {kbMultiplier > 0 ? `(${kbMultiplier.toFixed(2)}x)` : '(--x)'}
        </div>
      </div>
    </div>
  )
}
