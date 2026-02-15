import React, { useMemo } from "react";
import { ChainBlockData } from "../types";
import { MetricsPanel } from "./MetricsPanel";
import { ChainTable } from "./ChainTable";
import { ErrorDialog } from "./ErrorDialog";
import { useState } from "react";
import { chains } from "../data/chains";
import { STALENESS_THRESHOLD_SECONDS, BLOCK_TIME_SECONDS } from "../constants";
import { sortChainsByGasUsed } from "../utils/sorting";
import { calculateTps } from "../utils/metrics";
import { parseHexSafe } from "../utils/validation";

const INFRASTRUCTURE_CATEGORIES = new Set(["L0", "L1", "EVM"]);
const STACK_OPTIONS = ["primary", "avalanche-l1", "Legacy Subnet"] as const;

interface DashboardProps {
  chainData: ChainBlockData[];
  loading: boolean;
  validatorCounts: Record<string, number>;
  icmCounts: Record<string, number>;
  onRefresh: () => void;
}

function getStackType(chainName: string): string {
  const meta = chains.find((c) => c.chainName === chainName);
  if (meta?.categories?.includes("L0")) return "primary";
  if (meta?.isL1) return "avalanche-l1";
  return "Legacy Subnet";
}

function getChainCategories(chainName: string): string[] {
  const meta = chains.find((c) => c.chainName === chainName);
  if (!meta?.categories) return [];
  return meta.categories
    .map((c) => c.toUpperCase())
    .filter((c) => !INFRASTRUCTURE_CATEGORIES.has(c));
}

export function Dashboard({ chainData, loading, validatorCounts, icmCounts, onRefresh }: DashboardProps) {
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedStacks, setSelectedStacks] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const handleIcmClick = () => {
    setShowErrorDialog(true);
  };

  // Sort chains by Mgas/s (highest first)
  const sortedChainData = sortChainsByGasUsed(chainData);

  // Compute unique categories from active chains
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    for (const chain of sortedChainData) {
      for (const cat of getChainCategories(chain.chainName)) {
        catSet.add(cat);
      }
    }
    return [...catSet].sort();
  }, [sortedChainData]);

  // Filter chain data based on selected stacks and categories
  const filteredChainData = useMemo(() => {
    return sortedChainData.filter((chain) => {
      // Stack filter (OR within group, empty = show all)
      if (selectedStacks.size > 0) {
        const stack = getStackType(chain.chainName);
        if (!selectedStacks.has(stack)) return false;
      }
      // Categories filter (OR within group, empty = show all)
      if (selectedCategories.size > 0) {
        const cats = getChainCategories(chain.chainName);
        if (!cats.some((c) => selectedCategories.has(c))) return false;
      }
      return true;
    });
  }, [sortedChainData, selectedStacks, selectedCategories]);

  // Calculate aggregate metrics from filtered data
  const metrics =
    filteredChainData.length > 0
      ? {
          totalTps: filteredChainData.reduce((sum, chain) => {
            const oneHourAgo = Math.floor(Date.now() / 1000) - STALENESS_THRESHOLD_SECONDS;
            if (chain.blockData && !chain.loading && !chain.error) {
              const blockTimestamp = parseHexSafe(chain.blockData.timestamp);
              if (blockTimestamp > oneHourAgo) {
                return sum + calculateTps(chain.blockData.transactions.length);
              }
            }
            return sum;
          }, 0),
          totalGasPerSecond: filteredChainData.reduce((sum, chain) => {
            const oneHourAgo = Math.floor(Date.now() / 1000) - STALENESS_THRESHOLD_SECONDS;
            if (chain.blockData && !chain.loading && !chain.error) {
              const blockTimestamp = parseHexSafe(chain.blockData.timestamp);
              if (blockTimestamp > oneHourAgo) {
                const gasUsed = parseHexSafe(chain.blockData.gasUsed);
                return sum + gasUsed / BLOCK_TIME_SECONDS;
              }
            }
            return sum;
          }, 0),
          averageUtilization: (() => {
            const oneHourAgo = Math.floor(Date.now() / 1000) - STALENESS_THRESHOLD_SECONDS;
            const recentChains = filteredChainData.filter(
              (chain) =>
                chain.blockData &&
                !chain.loading &&
                !chain.error &&
                parseHexSafe(chain.blockData.timestamp) > oneHourAgo,
            );

            if (recentChains.length === 0) return 0;

            return (
              recentChains.reduce((sum, chain) => {
                const gasUsed = parseHexSafe(chain.blockData!.gasUsed);
                const gasLimit = parseHexSafe(chain.blockData!.gasLimit);
                return sum + gasUsed / gasLimit;
              }, 0) / recentChains.length
            );
          })(),
        }
      : null;

  const toggleStack = (stack: string) => {
    setSelectedStacks((prev) => {
      const next = new Set(prev);
      if (next.has(stack)) next.delete(stack);
      else next.add(stack);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const errorCount = useMemo(
    () => chainData.filter((c) => c.error && !c.loading).length,
    [chainData],
  );

  return (
    <div className="app">
      {/* Header - Outside container */}
      <div className="site-header">
        <img src="/logo.png" alt="Layer!wtf" className="site-logo-img" />
        <h1 className="site-logo">layer!wtf</h1>
      </div>

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
          <div className="totals-header">Metrics Panel</div>
          <MetricsPanel
            metrics={metrics}
            loading={loading}
            chainData={filteredChainData}
          />
          {errorCount > 0 && (
            <div className="error-count">
              {errorCount} chain{errorCount > 1 ? "s" : ""} unreachable
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-header">Filters</div>
          <button
            className="expand-button"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            {filtersExpanded ? "Collapse" : "Expand"}
          </button>
          {filtersExpanded && (
            <div className="filters-panel">
              <div className="filter-group">
                <div className="filter-group-title">Stack</div>
                <div className="filter-tags">
                  {STACK_OPTIONS.map((stack) => (
                    <span
                      key={stack}
                      className={`filter-tag${selectedStacks.has(stack) ? " active" : ""}`}
                      onClick={() => toggleStack(stack)}
                    >
                      {stack}
                    </span>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-group-title">Categories</div>
                <div className="filter-tags">
                  {availableCategories.map((cat) => (
                    <span
                      key={cat}
                      className={`filter-tag${selectedCategories.has(cat) ? " active" : ""}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <ChainTable
          chainData={filteredChainData}
          loading={loading}
          validatorCounts={validatorCounts}
          icmCounts={icmCounts}
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

      {/* Footer */}
      <footer className="site-footer">
        built with love by <a href="https://l1beat.io" target="_blank" rel="noopener noreferrer">L1Beat</a> team
      </footer>
    </div>
  );
}
