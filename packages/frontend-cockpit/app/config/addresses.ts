// Contract Addresses Configuration
// Updated with deployed addresses

export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    contracts: {
        AegisCore: string;
        AegisPool: string;
        BackstopPool: string;
        IdentityRegistry: string;
        AegisLens: string;
        MockOracle: string;
        USDC: string;
        Verifier: string;
    };
}

// Mainnet Fork (reports as Chain ID 1)
export const MAINNET_FORK_CONFIG: NetworkConfig = {
    chainId: 1, // Forked mainnet reports as Chain ID 1
    name: "Mainnet Fork",
    rpcUrl: "http://127.0.0.1:8545",
    contracts: {
        AegisCore: "0x54287AaB4D98eA51a3B1FBceE56dAf27E04a56A6",
        AegisPool: "0xb6aA91E8904d691a10372706e57aE1b390D26353",
        BackstopPool: "0xBe6Eb4ACB499f992ba2DaC7CAD59d56DA9e0D823",
        IdentityRegistry: "0xaD82Ecf79e232B0391C5479C7f632aA1EA701Ed1",
        AegisLens: "0x6fFa22292b86D678fF6621eEdC9B15e68dC44DcD",
        MockOracle: "0xE401FBb0d6828e9f25481efDc9dd18Da9E500983",
        USDC: "0x91A1EeE63f300B8f41AE6AF67eDEa2e2ed8c3f79",
        Verifier: "0x5f246ADDCF057E0f778CD422e20e413be70f9a0c",
    },
};

// Localhost (Hardhat Node without forking)
export const LOCALHOST_CONFIG: NetworkConfig = {
    chainId: 31337, // Hardhat default
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    contracts: {
        AegisCore: "0x54287AaB4D98eA51a3B1FBceE56dAf27E04a56A6",
        AegisPool: "0xb6aA91E8904d691a10372706e57aE1b390D26353",
        BackstopPool: "0xBe6Eb4ACB499f992ba2DaC7CAD59d56DA9e0D823",
        IdentityRegistry: "0xaD82Ecf79e232B0391C5479C7f632aA1EA701Ed1",
        AegisLens: "0x6fFa22292b86D678fF6621eEdC9B15e68dC44DcD",
        MockOracle: "0xE401FBb0d6828e9f25481efDc9dd18Da9E500983",
        USDC: "0x91A1EeE63f300B8f41AE6AF67eDEa2e2ed8c3f79",
        Verifier: "0x5f246ADDCF057E0f778CD422e20e413be70f9a0c",
    },
};

// Sepolia Testnet
export const SEPOLIA_CONFIG: NetworkConfig = {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org",
    contracts: {
        // TODO: Deploy to Sepolia and update these addresses
        AegisCore: "0x0000000000000000000000000000000000000000",
        AegisPool: "0x0000000000000000000000000000000000000000",
        BackstopPool: "0x0000000000000000000000000000000000000000",
        IdentityRegistry: "0x0000000000000000000000000000000000000000",
        AegisLens: "0x0000000000000000000000000000000000000000",
        MockOracle: "0x0000000000000000000000000000000000000000",
        USDC: "0x0000000000000000000000000000000000000000",
    },
};

// Network selector
export const NETWORKS: Record<number, NetworkConfig> = {
    [MAINNET_FORK_CONFIG.chainId]: MAINNET_FORK_CONFIG, // Chain ID 1 (forked mainnet)
    [LOCALHOST_CONFIG.chainId]: LOCALHOST_CONFIG,       // Chain ID 31337
    [SEPOLIA_CONFIG.chainId]: SEPOLIA_CONFIG,           // Chain ID 11155111
};

// Get config for current network
export function getNetworkConfig(chainId: number): NetworkConfig | null {
    return NETWORKS[chainId] || null;
}

// Default to mainnet fork for development (since we're using FORK_MAINNET=true)
export const DEFAULT_NETWORK = MAINNET_FORK_CONFIG;
