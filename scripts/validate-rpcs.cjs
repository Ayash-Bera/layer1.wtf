const fs = require('fs');
const path = require('path');

const CHAINS_PATH = path.join(__dirname, '../src/data/chains.json');
const STATUS_PATH = path.join(__dirname, '../src/data/rpc-status.json');

const TIMEOUT_MS = 10000;

async function checkCors(rpcUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Simulate browser preflight request
    const response = await fetch(rpcUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://layer1.wtf',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Check if the server allows our origin
    const allowOrigin = response.headers.get('access-control-allow-origin');
    if (!allowOrigin) return { cors: false, error: 'No CORS headers' };
    if (allowOrigin !== '*' && !allowOrigin.includes('layer1.wtf')) {
      return { cors: false, error: `CORS blocked (allows: ${allowOrigin})` };
    }

    return { cors: true };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') return { cors: false, error: 'CORS check timeout' };
    return { cors: false, error: `CORS check failed: ${err.message}` };
  }
}

async function validateRpc(rpcUrl, chainName) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
        id: 1
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (data.error) {
      return { valid: false, error: data.error.message || 'RPC error' };
    }

    if (data.result && data.result.number) {
      const blockNum = parseInt(data.result.number, 16);

      // Also check CORS
      const corsResult = await checkCors(rpcUrl);
      if (!corsResult.cors) {
        return { valid: false, error: corsResult.error };
      }

      return { valid: true, blockNumber: blockNum };
    }

    return { valid: false, error: 'No result' };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { valid: false, error: 'Timeout' };
    }
    return { valid: false, error: err.message };
  }
}

async function validateAllRpcs() {
  console.log('Validating RPC endpoints (RPC + CORS)...\n');

  const chains = JSON.parse(fs.readFileSync(CHAINS_PATH, 'utf8'));
  const chainsWithRpc = chains.filter(c => c.rpcUrl);

  console.log(`Found ${chainsWithRpc.length} chains with RPC URLs\n`);

  const status = {
    lastUpdated: new Date().toISOString(),
    chains: {}
  };

  let valid = 0;
  let invalid = 0;

  for (const chain of chainsWithRpc) {
    process.stdout.write(`  ${chain.chainName.padEnd(25)}`);

    const result = await validateRpc(chain.rpcUrl, chain.chainName);
    status.chains[chain.blockchainId] = {
      chainName: chain.chainName,
      rpcUrl: chain.rpcUrl,
      ...result,
      checkedAt: new Date().toISOString()
    };

    if (result.valid) {
      console.log(`OK (block ${result.blockNumber})`);
      valid++;
    } else {
      console.log(`FAIL: ${result.error}`);
      invalid++;
    }
  }

  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log(`Valid: ${valid}, Invalid: ${invalid}`);
  console.log(`Status saved to ${STATUS_PATH}`);
}

validateAllRpcs().catch(console.error);
