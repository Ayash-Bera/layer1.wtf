import React from "react";
import { ChainBlockData } from "../types";
import { MetricsPanel } from "./MetricsPanel";
import { ChainTable } from "./ChainTable";
import { ErrorDialog } from "./ErrorDialog";
import { useState } from "react";

interface DashboardProps {
  chainData: ChainBlockData[];
  loading: boolean;
  onRefresh: () => void;
}

export function Dashboard({ chainData, loading, onRefresh }: DashboardProps) {
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleIcmClick = () => {
    setShowErrorDialog(true);
  };

  // Sort chains by Mgas/s (highest first)
  const sortedChainData = [...chainData].sort((a, b) => {
    if (a.blockData && !b.blockData) return -1;
    if (!a.blockData && b.blockData) return 1;

    if (a.blockData && b.blockData) {
      const gasUsedA = parseInt(a.blockData.gasUsed, 16);
      const gasUsedB = parseInt(b.blockData.gasUsed, 16);
      return gasUsedB - gasUsedA;
    }

    return b.lastUpdated - a.lastUpdated;
  });

  // Calculate aggregate metrics
  const metrics =
    sortedChainData.length > 0
      ? {
          totalTps: sortedChainData.reduce((sum, chain) => {
            const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
            if (chain.blockData && !chain.loading && !chain.error) {
              const blockTimestamp = parseInt(chain.blockData.timestamp, 16);
              if (blockTimestamp > oneHourAgo) {
                const tps = chain.blockData.transactions.length / 2;
                return sum + tps;
              }
            }
            return sum;
          }, 0),
          totalGasPerSecond: sortedChainData.reduce((sum, chain) => {
            const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
            if (chain.blockData && !chain.loading && !chain.error) {
              const blockTimestamp = parseInt(chain.blockData.timestamp, 16);
              if (blockTimestamp > oneHourAgo) {
                const gasUsed = parseInt(chain.blockData.gasUsed, 16);
                return sum + gasUsed / 2;
              }
            }
            return sum;
          }, 0),
          averageUtilization: (() => {
            const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
            const recentChains = sortedChainData.filter(
              (chain) =>
                chain.blockData &&
                !chain.loading &&
                !chain.error &&
                parseInt(chain.blockData.timestamp, 16) > oneHourAgo,
            );

            if (recentChains.length === 0) return 0;

            return (
              recentChains.reduce((sum, chain) => {
                const gasUsed = parseInt(chain.blockData!.gasUsed, 16);
                const gasLimit = parseInt(chain.blockData!.gasLimit, 16);
                return sum + gasUsed / gasLimit;
              }, 0) / recentChains.length
            );
          })(),
        }
      : null;

  return (
    <div className="app">
      {/* Header - Outside container */}
      <h1 className="site-logo">Layer!wtf</h1>

      <div className="main-container">
        {/* Tabs */}
        <div className="tabs-section">
          <div className="tab active">L1s</div>
          <div className="tab inactive" onClick={handleIcmClick}>
            ICM
          </div>
        </div>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-header">Totals</div>
          <MetricsPanel
            metrics={metrics}
            loading={loading}
            chainData={sortedChainData}
          />
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-header">Filters</div>
          <button className="expand-button">Expand</button>
        </div>

        {/* Table */}
        <ChainTable
          chainData={sortedChainData}
          loading={loading}
          onRefresh={onRefresh}
        />

        <ErrorDialog
          isVisible={showErrorDialog}
          onClose={() => setShowErrorDialog(false)}
          title="Layer1.wtf"
          message="ICM metrics are coming soon. Meanwhile be part of the adoption at"
          linkUrl="https://l1beat.io"
          linkText="l1beat.io"
        />
      </div>
    </div>
  );
}
