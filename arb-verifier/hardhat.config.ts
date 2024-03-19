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
    arbDevnetL1: {
      url: 'http://127.0.0.1:8545/',
      accounts: [
        '0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659',
      ],
      deploy: ['deploy_l1/'],
      companionNetworks: {
        l2: 'arbDevnetL2',
      },
    },
    arbDevnetL2: {
      url: 'http://127.0.0.1:8547/',
      accounts: [
        '0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659',
      ],
      deploy: ['deploy_l2/'],
    },
    goerli: {
      url: L1_PROVIDER_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
      deploy: ['deploy_l1/'],
      companionNetworks: {
        l2: 'arbitrumGoerli',
      },
    },
    arbitrumGoerli: {
      url: 'https://rpc.goerli.arbitrum.gateway.fm',
      accounts: [DEPLOYER_PRIVATE_KEY],
      deploy: ['deploy_l2/'],
    },
  },
  etherscan: {
    apiKey: {
      goerli: L1_ETHERSCAN_API_KEY,
      arbitrumGoerli: L2_ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: 'arbitrumGoerli',
        chainId: 421613,
        urls: {
          apiURL: 'https://api-goerli.arbiscan.io/api',
          browserURL: 'https://api-goerli.arbiscan.io.io',
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
};

export default config;
