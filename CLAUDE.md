# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Layer1.wtf is a real-time dashboard for monitoring Avalanche L1 chains (formerly subnets). It displays metrics like TPS, Mgas/s, KB/s, and block numbers fetched directly from RPC endpoints.

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture

### Data Flow

1. **App.tsx** fetches block data from RPC endpoints every 5 seconds
2. Data passes to **Dashboard.tsx** which calculates aggregate metrics (total TPS, Mgas/s)
3. **ChainTable.tsx** renders individual chain rows sorted by Mgas/s
4. **MetricsPanel.tsx** displays totals with animated counters

### RPC Fetching Strategy (App.tsx)

The app uses a two-tier approach for RPC calls:
- **Direct RPC**: Most chains use direct `eth_getBlockByNumber` calls
- **Proxy fallback**: Chains with CORS issues (like UPTN) route through `idx6.solokhin.com` API in production, or Vite's dev proxy locally

### Chain Configuration

Chains are defined in `src/data/chains.json`. A chain appears on the dashboard if it has both:
- `rpcUrl` (non-null)
- `evmChainId` (non-null)

To add a new chain, add an entry with: `chainName`, `blockchainId`, `subnetId`, `rpcUrl`, `evmChainId`

### Metrics Calculation

- Assumes 2-second block time for TPS/Mgas/s calculations
- Only chains with blocks within the last hour contribute to totals
- Chains sorted by Mgas/s (gas used per second), highest first

### Proxy Configuration

- **vite.config.ts**: Dev proxy rewrites `/api/rpc/*` to `idx6.solokhin.com/api/*`
- **proxy-server.js**: Standalone Node proxy for UPTN (port 3001), run with `npm run dev:proxy`
