import React, { useRef, useEffect, useState } from 'react'
import { ChainBlockData } from '../types'
import { AnimatedCounter } from './AnimatedCounter'
import { ChainDetailPopup } from './ChainDetailPopup'
import { chains, Chain } from '../data/chains'
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

      const min = Math.min(...data)
      const max = Math.max(...data)
      const range = max - min

      let displayData = data
      if (range < 0.1) {
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
  validatorCounts: Record<string, number>
  icmCounts: Record<string, number>
  onRefresh: () => void
}

interface ChainRowProps {
  chain: ChainBlockData
  isCChain: boolean
  chainClass: string
  isHighlighted: boolean
  children: React.ReactNode
  onHover: (chainMeta: Chain | null, event: React.MouseEvent | null) => void
  onClick: (chainMeta: Chain | null, event: React.MouseEvent) => void
}

const ChainRow = ({ chain, isCChain, chainClass, isHighlighted, children, onHover, onClick }: ChainRowProps) => {
  const chainMeta = chains.find(c => c.chainName === chain.chainName)

  return (
    <div
      className={`table-row ${chainClass} ${isHighlighted ? 'highlighted' : ''}`}
      onMouseEnter={(e) => onHover(chainMeta || null, e)}
      onMouseLeave={() => onHover(null, null)}
      onClick={(e) => onClick(chainMeta || null, e)}
    >
      {children}
    </div>
  )
}

export const ChainTable = React.memo(function ChainTable({ chainData, loading, validatorCounts, icmCounts, onRefresh }: ChainTableProps) {
  const [hoveredChain, setHoveredChain] = useState<Chain | null>(null)
  const [pinnedChain, setPinnedChain] = useState<Chain | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  const activeChain = pinnedChain || hoveredChain

  useEffect(() => {
    if (!pinnedChain) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPinnedChain(null)
        setHoveredChain(null)
        setIsVisible(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [pinnedChain])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleHover = (chainMeta: Chain | null, event: React.MouseEvent | null) => {
    if (pinnedChain) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (chainMeta && event) {
      setMousePos({ x: event.clientX, y: event.clientY })
      timeoutRef.current = window.setTimeout(() => {
        setHoveredChain(chainMeta)
        setIsVisible(true)
      }, 80)
    } else {
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false)
        setHoveredChain(null)
      }, 100)
    }
  }

  const handleClick = (chainMeta: Chain | null, event: React.MouseEvent) => {
    if (pinnedChain) return // Let document click handler handle closing
    if (chainMeta) {
      event.stopPropagation()
      setMousePos({ x: event.clientX, y: event.clientY })
      setPinnedChain(chainMeta)
      setIsVisible(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isVisible && !pinnedChain) {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handlePopupEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handlePopupLeave = () => {
    if (pinnedChain) return
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false)
      setHoveredChain(null)
    }, 100)
  }

  if (loading && chainData.length === 0) {
    return (
      <div className="chain-table">
        <div className="table-header">
          <div className="header-cell sortable">Network</div>
          <div className="header-cell sortable header-block">Block</div>
          <div className="header-cell">Token</div>
          <div className="header-cell numeric-cell">ICM/h</div>
          <div className="header-cell numeric-cell">Validators</div>
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
          <div className="header-cell">Token</div>
          <div className="header-cell numeric-cell">ICM/h</div>
          <div className="header-cell numeric-cell">Validators</div>
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
    <div className="chain-table" onMouseMove={handleMouseMove}>
      <div className="table-header">
        <div className="header-cell sortable">Network</div>
        <div className="header-cell sortable header-block">Block</div>
        <div className="header-cell">Token</div>
        <div className="header-cell numeric-cell">ICM/h</div>
        <div className="header-cell numeric-cell">Validators</div>
        <div className="header-cell sortable header-tps">TPS</div>
        <div className="header-cell sortable header-mgas">Mgas/s ^</div>
        <div className="header-cell sortable header-kbs">KB/s</div>
        <div className="header-cell header-stack">Stack</div>
        <div className="header-cell header-sparkline">TPS Graph</div>
      </div>

      {chainData.map((chain) => {
        const isCChain = chain.chainName === 'C-Chain' || chain.chainName === 'Avalanche C-Chain'
        const chainClass = isCChain ? 'c-chain' : 'l1-chain'
        const isHighlighted = chain.blockchainId === highestTpsId && highestTps > 0
        const meta = chains.find(c => c.chainName === chain.chainName)
        const networkType = meta?.categories?.includes('L0') ? 'primary' : (meta?.isL1 ? 'avalanche-l1' : 'Legacy Subnet')
        const validatorCount = validatorCounts[chain.chainName] ?? validatorCounts[chain.blockchainId] ?? null
        const icmRate = icmCounts[chain.chainName] ?? icmCounts[meta?.chainName || ''] ?? null

        if (chain.loading) {
          return (
            <ChainRow 
              key={chain.blockchainId}
              chain={chain}
              isCChain={isCChain}
              chainClass={chainClass}
              isHighlighted={false}
              onHover={handleHover}
              onClick={handleClick}
            >
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell numeric-cell block-cell">...</div>
              <div className="cell">{meta?.nativeToken?.symbol || '-'}</div>
              <div className="cell numeric-cell">{icmRate !== null ? icmRate.toFixed(2) : '-'}</div>
              <div className="cell numeric-cell">{validatorCount !== null ? validatorCount : '-'}</div>
              <div className="cell numeric-cell tps-cell">-</div>
              <div className="cell numeric-cell mgas-cell">-</div>
              <div className="cell numeric-cell kbs-cell">-</div>
              <div className="cell stack-cell">{networkType}</div>
              <div className="cell sparkline-cell"></div>
            </ChainRow>
          )
        }

        if (chain.error) {
          return (
            <ChainRow 
              key={chain.blockchainId}
              chain={chain}
              isCChain={isCChain}
              chainClass={`${chainClass} error-row`}
              isHighlighted={false}
              onHover={handleHover}
              onClick={handleClick}
            >
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell error-cell" style={{ gridColumn: 'span 9' }}>
                Error
              </div>
            </ChainRow>
          )
        }

        if (!chain.blockData) {
          return (
            <ChainRow 
              key={chain.blockchainId}
              chain={chain}
              isCChain={isCChain}
              chainClass={chainClass}
              isHighlighted={false}
              onHover={handleHover}
              onClick={handleClick}
            >
              <div className="cell network-cell">
                <span className="network-name">{chain.chainName}</span>
              </div>
              <div className="cell numeric-cell block-cell">-</div>
              <div className="cell">{meta?.nativeToken?.symbol || '-'}</div>
              <div className="cell numeric-cell">{icmRate !== null ? icmRate.toFixed(2) : '-'}</div>
              <div className="cell numeric-cell">{validatorCount !== null ? validatorCount : '-'}</div>
              <div className="cell numeric-cell tps-cell">-</div>
              <div className="cell numeric-cell mgas-cell">-</div>
              <div className="cell numeric-cell kbs-cell">-</div>
              <div className="cell stack-cell">{networkType}</div>
              <div className="cell sparkline-cell"></div>
            </ChainRow>
          )
        }

        const blockNumber = parseInt(chain.blockData.number, 16)
        const gasUsed = parseInt(chain.blockData.gasUsed, 16)
        const blockSize = parseInt(chain.blockData.size, 16)
        const tps = chain.blockData.transactions.length / 2
        const mgasPerSecond = (gasUsed / 1000000) / 2
        const kbPerSecond = (blockSize / 1024) / 2

        return (
          <ChainRow
            key={chain.blockchainId}
            chain={chain}
            isCChain={isCChain}
            chainClass={chainClass}
            isHighlighted={isHighlighted}
            onHover={handleHover}
            onClick={handleClick}
          >
            <div className="cell network-cell">
              <span className="network-name">{chain.chainName}</span>
            </div>
            <div className="cell numeric-cell block-cell">
              <AnimatedCounter value={blockNumber} decimals={0} />
            </div>
            <div className="cell">{meta?.nativeToken?.symbol || '-'}</div>
            <div className="cell numeric-cell">{icmRate !== null ? icmRate.toFixed(2) : '-'}</div>
            <div className="cell numeric-cell">{validatorCount !== null ? validatorCount : '-'}</div>
            <div className="cell numeric-cell tps-cell">
              <AnimatedCounter value={tps} decimals={1} />
            </div>
            <div className="cell numeric-cell mgas-cell">
              <AnimatedCounter value={mgasPerSecond} decimals={2} />
            </div>
            <div className="cell numeric-cell kbs-cell">
              <AnimatedCounter value={kbPerSecond} decimals={2} />
            </div>
            <div className="cell stack-cell">{networkType}</div>
            <div className="cell sparkline-cell">
              <SparklineChart data={chain.tpsHistory || []} />
            </div>
          </ChainRow>
        )
      })}

      {isVisible && activeChain && (() => {
        const popupWidth = 300
        const popupHeight = 320
        let x = mousePos.x + 15
        let y = mousePos.y + 15
        
        if (x + popupWidth > window.innerWidth - 10) {
          x = mousePos.x - popupWidth - 15
        }
        if (y + popupHeight > window.innerHeight - 10) {
          y = mousePos.y - popupHeight - 15
        }
        if (x < 10) x = 10
        if (y < 10) y = 10

        return (
          <div
            ref={popupRef}
            className={`chain-popup-wrapper ${pinnedChain ? 'pinned' : ''}`}
            style={{
              position: 'fixed',
              left: x,
              top: y,
              zIndex: 999999,
            }}
            onMouseEnter={handlePopupEnter}
            onMouseLeave={handlePopupLeave}
          >
            <ChainDetailPopup chain={activeChain} />
            {pinnedChain && (
              <div className="popup-hint">click anywhere to close</div>
            )}
          </div>
        )
      })()}
    </div>
  )
})
