import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'ethers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const PARENT_DOMAIN = process.env.PARENT_DOMAIN;
  if (!PARENT_DOMAIN) throw 'Set $PARENT_DOMAIIN';
  console.log({ PARENT_DOMAIIN: PARENT_DOMAIN });

  const parentNode = ethers.namehash(PARENT_DOMAIN);

  const deployment = await deploy('Dm3NameRegistrar', {
    from: deployer,
    args: [parentNode],
    log: true,
  });

  console.log(`Dm3NameRegistrar is deployed at ${deployment.address}`);
};
export default func;
func.tags = ['Dm3NameRegistrar'];
