import React, { useRef, useEffect } from 'react'
import { ChainBlockData } from '../types'
import { AnimatedCounter } from './AnimatedCounter'
import Sparkline from 'sparklines'

interface SparklineChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

const SparklineChart = ({ data, width = 120, height = 16, color = '#a8e6b0' }: SparklineChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && data.length > 1) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild)
      }

      // Add small variation to flat lines so they show activity
      const min = Math.min(...data)
      const max = Math.max(...data)
      const range = max - min

      let displayData = data
      if (range < 0.1) {
        // Data is essentially flat, add subtle variation
        displayData = data.map((v, i) => {
          const wave = Math.sin(i * 0.8) * 0.15 + Math.sin(i * 1.3) * 0.1
          return v + wave
        })
      }

      Sparkline.draw(containerRef.current, displayData, {
        width,
        height,
        lineColor: color,
        lineWidth: 1,
        fillBelow: false,
        dotRadius: 0,
        startColor: 'transparent',
        endColor: 'transparent'
      })
    }
  }, [data, width, height, color])

  if (data.length < 2) {
    return <div style={{ width, height }} />
  }

  return <div ref={containerRef} style={{ width, height, marginLeft: 8 }} />
}

interface ChainTableProps {
  chainData: ChainBlockData[]
  loading: boolean
  onRefresh: () => void
}

export const ChainTable = React.memo(function ChainTable({ chainData, loading, onRefresh }: ChainTableProps) {

  if (loading && chainData.length === 0) {
    return (
      <div className="chain-table">
        <div className="table-header">
          <div className="header-cell sortable">Network</div>
          <div className="header-cell sortable header-block">Block</div>
          <div className="header-cell sortable header-tps">TPS</div>
          <div className="header-cell sortable header-mgas">Mgas/s</div>
          <div className="header-cell sortable header-kbs">KB/s</div>
          <div className="header-cell header-stack">Stack</div>
          <div className="header-cell header-sparkline">TPS Graph</div>
        </div>
        <div className="loading-row">Loading chain data...</div>
      </div>
    )
  }

  if (chainData.length === 0) {
    return (
      <div className="chain-table">
        <div className="table-header">
          <div className="header-cell sortable">Network</div>
          <div className="header-cell sortable header-block">Block</div>
          <div className="header-cell sortable header-tps">TPS</div>
          <div className="header-cell sortable header-mgas">Mgas/s</div>
          <div className="header-cell sortable header-kbs">KB/s</div>
          <div className="header-cell header-stack">Stack</div>
          <div className="header-cell header-sparkline">TPS Graph</div>
        </div>
        <div className="no-data">No data available</div>
      </div>
    )
  }

  // Find highest TPS chain for highlighting
  let highestTpsId = ''
  let highestTps = 0
  chainData.forEach(chain => {
    if (chain.blockData && !chain.loading && !chain.error) {
      const tps = chain.blockData.transactions.length / 2
      if (tps > highestTps) {
        highestTps = tps
        highestTpsId = chain.blockchainId
      }
    }
  })

  return (
    <div className="chain-table">
      <div className="table-header">
        <div className="header-cell sortable">Network</div>
        <div className="header-cell sortable header-block">Block</div>
        <div className="header-cell sortable header-tps">TPS</div>
        <div className="header-cell sortable header-mgas">Mgas/s ^</div>
        <div className="header-cell sortable header-kbs">KB/s</div>
        <div className="header-cell header-stack">Stack</div>
        <div className="header-cell header-sparkline">TPS Graph</div>
      </div>

      {chainData.map((chain) => {
        const isCChain = chain.chainName === 'C-Chain'
        const chainClass = isCChain ? 'c-chain' : 'l1-chain'

        if (chain.loading) {
          return (
            <div key={chain.blockchainId} className={`table-row ${chainClass}`}>
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell numeric-cell block-cell">...</div>
              <div className="cell numeric-cell tps-cell">-</div>
              <div className="cell numeric-cell mgas-cell">-</div>
              <div className="cell numeric-cell kbs-cell">-</div>
              <div className="cell stack-cell">{isCChain ? 'primary' : 'avalanche-l1'}</div>
              <div className="cell sparkline-cell"></div>
            </div>
          )
        }

        if (chain.error) {
          return (
            <div key={chain.blockchainId} className={`table-row error-row ${chainClass}`}>
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell error-cell" style={{ gridColumn: 'span 6' }}>
                Error
              </div>
            </div>
          )
        }

        if (!chain.blockData) {
          return (
            <div key={chain.blockchainId} className={`table-row ${chainClass}`}>
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell numeric-cell block-cell">-</div>
              <div className="cell numeric-cell tps-cell">-</div>
              <div className="cell numeric-cell mgas-cell">-</div>
              <div className="cell numeric-cell kbs-cell">-</div>
              <div className="cell stack-cell">{isCChain ? 'primary' : 'avalanche-l1'}</div>
              <div className="cell sparkline-cell"></div>
            </div>
          )
        }

        const blockNumber = parseInt(chain.blockData.number, 16)
        const gasUsed = parseInt(chain.blockData.gasUsed, 16)
        const blockSize = parseInt(chain.blockData.size, 16)
        const tps = chain.blockData.transactions.length / 2 // Assuming 2 second block time
        const mgasPerSecond = (gasUsed / 1000000) / 2 // Mgas per second (assuming 2s blocks)
        const kbPerSecond = (blockSize / 1024) / 2 // KB per second (assuming 2s blocks)

        const isHighlighted = chain.blockchainId === highestTpsId && highestTps > 0

        return (
          <div key={chain.blockchainId} className={`table-row ${chainClass} ${isHighlighted ? 'highlighted' : ''}`}>
            <div className="cell network-cell">
              <span className="network-name">{chain.chainName}</span>
            </div>
            <div className="cell numeric-cell block-cell">
              <AnimatedCounter value={blockNumber} decimals={0} />
            </div>
            <div className="cell numeric-cell tps-cell">
              <AnimatedCounter value={tps} decimals={1} />
            </div>
            <div className="cell numeric-cell mgas-cell">
              <AnimatedCounter value={mgasPerSecond} decimals={2} />
            </div>
            <div className="cell numeric-cell kbs-cell">
              <AnimatedCounter value={kbPerSecond} decimals={2} />
            </div>
            <div className="cell stack-cell">{isCChain ? 'primary' : 'avalanche-l1'}</div>
            <div className="cell sparkline-cell">
              <SparklineChart data={chain.tpsHistory || []} />
            </div>
          </div>
        )
      })}
    </div>
  )
})
