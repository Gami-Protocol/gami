import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? '0x0000000000000000000000000000000000000000000000000000000000000001';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC ?? 'https://sepolia.base.org',
      chainId: 84532,
      accounts: [PRIVATE_KEY],
    },
    base: {
      url: process.env.BASE_MAINNET_RPC ?? 'https://mainnet.base.org',
      chainId: 8453,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY ?? '',
      base: process.env.BASESCAN_API_KEY ?? '',
    },
    customChains: [
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
    ],
  },
};

export default config;
