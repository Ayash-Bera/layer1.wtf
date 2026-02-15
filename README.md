<p align="center">
  <img src="public/logo-full.png" alt="Layer1.wtf" height="80">
</p>

<p align="center">
  Real-time dashboard for monitoring Avalanche L1 chains.<br>
  Tracks TPS, Mgas/s, KB/s, block numbers, and more, fetched directly from RPC endpoints.
</p>

---

## Features

- **Live Metrics** -Aggregate TPS, Mgas/s, and KB/s across all active chains, updated every 5 seconds
- **Chain Table** -Per-chain block number, TPS, gas usage, data throughput, validators, ICM messages, and TPS sparklines
- **Chain Details** -Hover or click any chain to see blockchain ID, subnet ID, RPC URL, explorer link, and website
- **Filtering** -Filter by stack type (Primary Network, Avalanche-L1, Legacy Subnet) and by category (DeFi, Gaming, Health, Infra, etc.)
- **CRT Aesthetic** -Retro terminal look with animated counters and a CRT monitor effect

## Quick Start

```bash
npm install
npm run dev
```

This validates RPC endpoints, builds chain data from the [l1beat-l1-registry](https://www.npmjs.com/package/l1beat-l1-registry), and starts the dev server at `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (validates RPCs + builds chains first) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build:chains` | Rebuild `src/data/chains.json` from registry |
| `npm run validate:rpcs` | Test all RPC endpoints for reachability and CORS |

## Architecture

```
src/
├── App.tsx              # RPC fetching, polling, state management
├── constants.ts         # Named constants (block time, intervals, thresholds)
├── types.ts             # TypeScript interfaces
├── components/
│   ├── Dashboard.tsx    # Layout, aggregate metrics, filtering
│   ├── ChainTable.tsx   # Per-chain rows sorted by Mgas/s
│   ├── MetricsPanel.tsx # Total TPS / Mgas/s / KB/s display
│   ├── ChainDetailPopup.tsx  # Interactive chain info popup
│   └── AnimatedCounter.tsx   # Smooth number transitions
├── utils/
│   ├── formatters.ts    # Number, hash, and timestamp formatting
│   ├── metrics.ts       # TPS and block metric calculations
│   ├── sorting.ts       # Chain sorting functions
│   └── validation.ts    # Hex parsing and RPC response validation
├── data/
│   ├── chains.json      # Generated chain registry (do not edit manually)
│   └── rpc-status.json  # RPC validation results
└── scripts/
    ├── build-chains.cjs    # Generates chains.json from l1beat-l1-registry
    └── validate-rpcs.cjs   # Validates RPC endpoints
```

### Data Flow

1. **App.tsx** fetches `eth_getBlockByNumber` from each chain's RPC every 5 seconds
2. **Dashboard.tsx** aggregates metrics across all active chains
3. **ChainTable.tsx** renders per-chain rows sorted by Mgas/s (highest first)
4. **MetricsPanel.tsx** displays totals with animated counters and C-Chain multipliers

### Metrics

Rate metrics use **dynamic block time** computed from consecutive block timestamps, falling back to 2 seconds on the first poll or when blocks are skipped:

- **TPS** = transactions per block / blockTime
- **Mgas/s** = gas used / 1,000,000 / blockTime
- **KB/s** = block size / 1,024 / blockTime

Chains with blocks older than 60 seconds show zero for rate metrics and sort below active chains.

## Adding a Chain

Chains are sourced from the `l1beat-l1-registry` package and built into `src/data/chains.json`. A chain appears on the dashboard if it has both a `rpcUrl` and `evmChainId`. To add a chain, contribute it to the [registry](https://www.npmjs.com/package/l1beat-l1-registry) and bump the dependency version.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_L1BEAT_API_URL` | Backend API URL for production (validator counts, ICM data) |

See `.env.example` for details.

## Tech Stack

- [React](https://react.dev) 19 + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) for build and dev server
- [Vitest](https://vitest.dev) for unit tests
- [vault66-crt-effect](https://www.npmjs.com/package/vault66-crt-effect) for the CRT look
- [Tippy.js](https://atomiks.github.io/tippyjs/) for tooltips
- [Sparklines](https://www.npmjs.com/package/sparklines) for TPS mini-graphs

## Acknowledgements

Inspired by [rollup.wtf](https://rollup.wtf/).

## License

MIT
