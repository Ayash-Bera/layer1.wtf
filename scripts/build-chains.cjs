const fs = require('fs');
const path = require('path');
const registry = require('l1beat-l1-registry');

const REGISTRY_PATH = registry.getDataPath();
const OUTPUT_PATH = path.join(__dirname, '../src/data/chains.json');
const RPC_STATUS_PATH = path.join(__dirname, '../src/data/rpc-status.json');

// Load RPC status if available
function loadRpcStatus() {
  if (fs.existsSync(RPC_STATUS_PATH)) {
    try {
      const status = JSON.parse(fs.readFileSync(RPC_STATUS_PATH, 'utf8'));
      console.log(`Using RPC status from ${status.lastUpdated}`);
      return status.chains || {};
    } catch (e) {
      console.warn('Could not load RPC status:', e.message);
    }
  } else {
    console.log('No RPC status file found - run "npm run validate:rpcs" to validate');
  }
  return null;
}

function parseRegistryChain(registryData, folderName) {
  const chains = [];

  if (!registryData.chains || registryData.chains.length === 0) {
    console.warn(`  Skipping ${folderName}: no chains array`);
    return chains;
  }

  for (const chainData of registryData.chains) {
    // Only include mainnet chains
    if (registryData.network !== 'mainnet') {
      continue;
    }

    // Only include EVM chains
    if (chainData.vmName !== 'EVM') {
      continue;
    }

    const rpcUrl = chainData.rpcUrls && chainData.rpcUrls.length > 0
      ? chainData.rpcUrls[0]
      : null;

    chains.push({
      chainName: chainData.name || registryData.name,
      blockchainId: chainData.blockchainId,
      subnetId: registryData.subnetId,
      rpcUrl: rpcUrl,
      evmChainId: chainData.evmChainId ? String(chainData.evmChainId) : null,
      vmName: chainData.vmName || null,
      isL1: registryData.isL1 ?? true,
      logo: registryData.logo || null,
      description: chainData.description || registryData.description || null,
      explorerUrl: chainData.explorerUrl || null,
      website: registryData.website || null,
      nativeToken: chainData.nativeToken || null,
      categories: registryData.categories || [],
    });
  }

  return chains;
}

function buildChains() {
  console.log('Building chains from l1beat-l1-registry...');
  console.log(`Registry path: ${REGISTRY_PATH}`);

  // Load RPC validation status
  const rpcStatus = loadRpcStatus();

  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Registry path not found: ${REGISTRY_PATH}`);
  }

  const folders = fs.readdirSync(REGISTRY_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => !d.name.startsWith('.') && !d.name.startsWith('_'))
    .map(d => d.name);

  console.log(`Found ${folders.length} chain folders`);

  const allChains = [];
  let skipped = 0;
  let rpcFiltered = 0;

  for (const folder of folders) {
    const chainJsonPath = path.join(REGISTRY_PATH, folder, 'chain.json');

    if (!fs.existsSync(chainJsonPath)) {
      console.warn(`  Skipping ${folder}: chain.json not found`);
      skipped++;
      continue;
    }

    try {
      const rawData = fs.readFileSync(chainJsonPath, 'utf8');
      const registryData = JSON.parse(rawData);
      const parsed = parseRegistryChain(registryData, folder);
      allChains.push(...parsed);
    } catch (error) {
      console.error(`  Error parsing ${folder}:`, error.message);
      skipped++;
    }
  }

  // Apply RPC status filtering - null out invalid RPCs
  if (rpcStatus) {
    for (const chain of allChains) {
      const status = rpcStatus[chain.blockchainId];
      if (status && !status.valid && chain.rpcUrl) {
        chain.rpcUrl = null;
        rpcFiltered++;
      }
    }
  }

  // Sort by chainName for consistent output
  allChains.sort((a, b) => a.chainName.localeCompare(b.chainName));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChains, null, 2));

  console.log('');
  console.log(`Built ${allChains.length} chains to ${OUTPUT_PATH}`);
  console.log(`Skipped ${skipped} folders`);
  if (rpcStatus) {
    console.log(`Filtered ${rpcFiltered} invalid RPCs`);
  }

  // Stats
  const withRpc = allChains.filter(c => c.rpcUrl).length;
  const withLogo = allChains.filter(c => c.logo).length;
  console.log(`  - With valid RPC URL: ${withRpc}`);
  console.log(`  - With logo: ${withLogo}`);
}

buildChains();
