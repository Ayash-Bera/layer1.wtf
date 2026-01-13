import React from 'react'
import { ChainBlockData } from '../types'
import { AnimatedCounter } from './AnimatedCounter'

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
          <div className="header-cell sortable">✧ Network</div>
          <div className="header-cell sortable">✧ Block</div>
          <div className="header-cell sortable">✧ TPS</div>
          <div className="header-cell sortable">✧ Mgas/s</div>
          <div className="header-cell sortable">✧ KB/s</div>
          <div className="header-cell sortable">✧ Stack</div>
        </div>
        <div className="loading-row">Loading chain data...</div>
      </div>
    )
  }

  if (chainData.length === 0) {
    return (
      <div className="chain-table">
        <div className="table-header">
          <div className="header-cell sortable">✧ Network</div>
          <div className="header-cell sortable">✧ Block</div>
          <div className="header-cell sortable">✧ TPS</div>
          <div className="header-cell sortable">✧ Mgas/s</div>
          <div className="header-cell sortable">✧ KB/s</div>
          <div className="header-cell sortable">✧ Stack</div>
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
        <div className="header-cell sortable">✧ Network</div>
        <div className="header-cell sortable">✧ Block</div>
        <div className="header-cell sortable">✧ TPS</div>
        <div className="header-cell sortable">✧ Mgas/s ^</div>
        <div className="header-cell sortable">✧ KB/s</div>
        <div className="header-cell sortable">✧ Stack</div>
      </div>

      {chainData.map((chain) => {
        if (chain.loading) {
          return (
            <div key={chain.blockchainId} className="table-row">
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell numeric-cell">...</div>
              <div className="cell numeric-cell">-</div>
              <div className="cell numeric-cell">-</div>
              <div className="cell numeric-cell">-</div>
              <div className="cell">avalanche-l1</div>
            </div>
          )
        }

        if (chain.error) {
          return (
            <div key={chain.blockchainId} className="table-row error-row">
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell error-cell" style={{ gridColumn: 'span 5' }}>
                Error
              </div>
            </div>
          )
        }

        if (!chain.blockData) {
          return (
            <div key={chain.blockchainId} className="table-row">
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell numeric-cell">-</div>
              <div className="cell numeric-cell">-</div>
              <div className="cell numeric-cell">-</div>
              <div className="cell numeric-cell">-</div>
              <div className="cell">avalanche-l1</div>
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
          <div key={chain.blockchainId} className={`table-row ${isHighlighted ? 'highlighted' : ''}`}>
            <div className="cell network-cell">
              <span className="network-name">{chain.chainName}</span>
            </div>
            <div className="cell numeric-cell">
              <AnimatedCounter value={blockNumber} decimals={0} />
            </div>
            <div className="cell numeric-cell">
              <AnimatedCounter value={tps} decimals={1} />
            </div>
            <div className="cell numeric-cell">
              <AnimatedCounter value={mgasPerSecond} decimals={2} />
            </div>
            <div className="cell numeric-cell">
              <AnimatedCounter value={kbPerSecond} decimals={2} />
            </div>
            <div className="cell">avalanche-l1</div>
          </div>
        )
      })}
    </div>
  )
})
