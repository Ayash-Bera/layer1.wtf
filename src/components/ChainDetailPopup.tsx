import React, { useState } from 'react'
import { Chain } from '../data/chains'

interface ChainDetailPopupProps {
  chain: Chain
}

export function ChainDetailPopup({ chain }: ChainDetailPopupProps) {
  const [toast, setToast] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setToast(`${label} copied`)
    setTimeout(() => setToast(null), 1500)
  }

  const isPrimaryNetwork = chain.categories?.includes('L0')
  const networkType = isPrimaryNetwork ? 'Primary Network' : (chain.isL1 ? 'L1' : 'Legacy Subnet')

  return (
    <div className="chain-detail-popup">
      {toast && <div className="copy-toast">{toast}</div>}
      <div className="popup-header">{chain.chainName}</div>

      <div className="popup-grid">
        <div className="popup-row">
          <span className="popup-label">Type</span>
          <span className="popup-value">{networkType}</span>
        </div>

        {chain.evmChainId && (
          <div className="popup-row">
            <span className="popup-label">Chain ID</span>
            <span className="popup-value mono">{chain.evmChainId}</span>
          </div>
        )}

        {chain.nativeToken?.symbol && (
          <div className="popup-row">
            <span className="popup-label">Token</span>
            <span className="popup-value">
              {chain.nativeToken.symbol}
              {chain.nativeToken.name && chain.nativeToken.name !== chain.nativeToken.symbol && (
                <span className="token-name"> ({chain.nativeToken.name})</span>
              )}
            </span>
          </div>
        )}

        {chain.categories && chain.categories.length > 0 && (
          <div className="popup-row">
            <span className="popup-label">Category</span>
            <span className="popup-value popup-categories">
              {chain.categories.map((cat) => (
                <span key={cat} className="category-tag">{cat.toLowerCase()}</span>
              ))}
            </span>
          </div>
        )}

        <div className="popup-row">
          <span className="popup-label">Blockchain ID</span>
          <span
            className="popup-value copyable mono"
            onClick={(e) => copyToClipboard(chain.blockchainId, 'Blockchain ID', e)}
            title="Click to copy"
          >
            {chain.blockchainId.slice(0, 10)}...
          </span>
        </div>

        <div className="popup-row">
          <span className="popup-label">Subnet ID</span>
          <span
            className="popup-value copyable mono"
            onClick={(e) => copyToClipboard(chain.subnetId, 'Subnet ID', e)}
            title="Click to copy"
          >
            {chain.subnetId.slice(0, 10)}...
          </span>
        </div>

        {chain.rpcUrl && (
          <div className="popup-row">
            <span className="popup-label">RPC</span>
            <span
              className="popup-value copyable"
              onClick={(e) => copyToClipboard(chain.rpcUrl!, 'RPC URL', e)}
              title="Click to copy"
            >
              {chain.rpcUrl.length > 35 ? chain.rpcUrl.slice(0, 35) + '...' : chain.rpcUrl}
            </span>
          </div>
        )}
      </div>

      {(chain.explorerUrl || chain.website) && (
        <div className="popup-links">
          {chain.explorerUrl && (
            <a
              href={chain.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-link"
            >
              Explorer
            </a>
          )}
          {chain.website && (
            <a
              href={chain.website}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-link"
            >
              Website
            </a>
          )}
        </div>
      )}
    </div>
  )
}
