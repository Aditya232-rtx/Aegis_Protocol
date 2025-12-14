// Script to extract ABIs from compiled contracts and generate frontend config
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIFACTS_DIR = path.join(__dirname, '../artifacts/contracts');
const OUTPUT_DIR = path.join(__dirname, '../../frontend-cockpit/app/config');

// Contracts to extract
const CONTRACTS = [
    { name: 'AegisCore', path: 'core/AegisCore.sol/AegisCore.json' },
    { name: 'AegisPool', path: 'core/AegisPool.sol/AegisPool.json' },
    { name: 'BackstopPool', path: 'core/BackstopPool.sol/BackstopPool.json' },
    { name: 'IdentityRegistry', path: 'mocks/MockIdentityRegistry.sol/MockIdentityRegistry.json' },
    { name: 'AegisLens', path: 'core/AegisLens.sol/AegisLens.json' },
    { name: 'MockOracle', path: 'mocks/MockOracle.sol/MockOracle.json' },
    { name: 'MockERC20', path: 'mocks/MockERC20.sol/MockERC20.json' },
];

function extractABIs() {
    console.log('📦 Extracting Contract ABIs...\\n');

    const abis = {};

    for (const contract of CONTRACTS) {
        const artifactPath = path.join(ARTIFACTS_DIR, contract.path);

        try {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            abis[contract.name] = artifact.abi;
            console.log(`✅ Extracted ${contract.name}`);
        } catch (error) {
            console.error(`❌ Failed to extract ${contract.name}:`, error.message);
        }
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write ABIs file
    const abisContent = `// Auto-generated Contract ABIs
// Generated: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY

export const AEGIS_CORE_ABI = ${JSON.stringify(abis.AegisCore, null, 2)} as const;

export const AEGIS_POOL_ABI = ${JSON.stringify(abis.AegisPool, null, 2)} as const;

export const BACKSTOP_POOL_ABI = ${JSON.stringify(abis.BackstopPool, null, 2)} as const;

export const IDENTITY_REGISTRY_ABI = ${JSON.stringify(abis.IdentityRegistry, null, 2)} as const;

export const AEGIS_LENS_ABI = ${JSON.stringify(abis.AegisLens, null, 2)} as const;

export const MOCK_ORACLE_ABI = ${JSON.stringify(abis.MockOracle, null, 2)} as const;

export const MOCK_ERC20_ABI = ${JSON.stringify(abis.MockERC20, null, 2)} as const;
`;

    const outputPath = path.join(OUTPUT_DIR, 'abis.ts');
    fs.writeFileSync(outputPath, abisContent);

    console.log(`\\n✨ ABIs exported to: ${outputPath}`);
}

extractABIs();
