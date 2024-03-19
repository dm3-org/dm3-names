import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import { HardhatUserConfig } from 'hardhat/config';
import 'ethers';
const DEPLOYER_PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ||
  'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const L1_PROVIDER_URL = process.env.L1_PROVIDER_URL || '';
const L1_ETHERSCAN_API_KEY = process.env.L1_ETHERSCAN_API_KEY;
const L2_ETHERSCAN_API_KEY = process.env.L2_ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  solidity: '0.8.25',
  networks: {
    opDevnetL1: {
      url: 'http://localhost:8545/',
      accounts: [DEPLOYER_PRIVATE_KEY],
      deploy: ['deploy_l1/'],
      companionNetworks: {
        l2: 'opDevnetL2',
      },
    },
    opDevnetL2: {
      url: 'http://localhost:9545/',
      accounts: [DEPLOYER_PRIVATE_KEY],
      deploy: ['deploy_l2/'],
    },
    goerli: {
      url: L1_PROVIDER_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
      deploy: ['deploy_l1/'],
      companionNetworks: {
        l2: 'optimismGoerli',
      },
    },
    sepolia: {
      url: L1_PROVIDER_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
      deploy: ['deploy_l1/'],
      companionNetworks: {
        l2: 'optimismGoerli',
      },
    },
    optimismGoerli: {
      url: 'https://sepolia.optimism.io',
      accounts: [DEPLOYER_PRIVATE_KEY],
      deploy: ['deploy_l2/'],
    },
  },
  etherscan: {
    apiKey: {
      goerli: L1_ETHERSCAN_API_KEY,
      sepolia: L1_ETHERSCAN_API_KEY,
      optimismGoerli: L2_ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: 'optimismGoerli',
        chainId: 420,
        urls: {
          apiURL: 'https://api-goerli-optimism.etherscan.io/api',
          browserURL: 'https://goerli-optimism.etherscan.io',
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
};

export default config;
