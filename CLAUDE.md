# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Layer1.wtf is a real-time dashboard for monitoring Avalanche L1 chains (formerly subnets). It displays metrics like TPS, Mgas/s, KB/s, and block numbers fetched directly from RPC endpoints.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Plain CSS (retro terminal aesthetic)

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start development server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── App.tsx              # Main app with RPC fetching logic
├── components/
│   ├── Dashboard.tsx    # Main layout with tabs, totals, filters, table
│   ├── ChainTable.tsx   # Table displaying chain data
│   ├── MetricsPanel.tsx # Totals section (TPS, Mgas/s, KB/s)
│   ├── AnimatedCounter.tsx
│   ├── ErrorDialog.tsx
│   ├── Header.tsx
│   └── Tooltip.tsx
├── data/
│   ├── chains.json      # Chain configurations (RPC URLs, chain IDs)
│   └── chains.ts        # Helper to get active chains
├── types/
│   └── index.ts         # TypeScript interfaces
├── utils/
│   └── formatters.ts    # Formatting utilities
└── index.css            # All styles
```

## Key Files

- **chains.json**: Contains all Avalanche L1 chain configs. Chains with `rpcUrl: null` are excluded from the dashboard.
- **App.tsx**: Handles RPC calls with CORS proxy fallback for problematic endpoints (like UPTN).
- **index.css**: Retro blue terminal styling inspired by rollup.wtf.

## Adding a New Chain

1. Add entry to `src/data/chains.json` with:
   - `chainName`, `blockchainId`, `subnetId`
   - `rpcUrl` (or `null` if no public RPC)
   - `evmChainId`

2. The chain will automatically appear if it has both `rpcUrl` and `evmChainId`.

## Notes

- Assumes 2-second block time for TPS/Mgas/s calculations
- Chains are sorted by Mgas/s (highest first)
- Highest TPS chain is highlighted in green
- Data refreshes every 5 seconds
