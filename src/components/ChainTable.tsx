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
          <div className="header-cell sortable">Network</div>
          <div className="header-cell sortable header-block">Block</div>
          <div className="header-cell sortable header-tps">TPS</div>
          <div className="header-cell sortable header-mgas">Mgas/s</div>
          <div className="header-cell sortable header-kbs">KB/s</div>
          <div className="header-cell header-stack">Stack</div>
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
            </div>
          )
        }

        if (chain.error) {
          return (
            <div key={chain.blockchainId} className={`table-row error-row ${chainClass}`}>
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
            <div key={chain.blockchainId} className={`table-row ${chainClass}`}>
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell numeric-cell block-cell">-</div>
              <div className="cell numeric-cell tps-cell">-</div>
              <div className="cell numeric-cell mgas-cell">-</div>
              <div className="cell numeric-cell kbs-cell">-</div>
              <div className="cell stack-cell">{isCChain ? 'primary' : 'avalanche-l1'}</div>
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
          </div>
        )
      })}
    </div>
  )
})
