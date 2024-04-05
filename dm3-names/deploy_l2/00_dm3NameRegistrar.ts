import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';

import { ethers as ethersT } from 'ethers';



const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const Factory = await ethers.getContractFactory('Dm3NameRegistrar');

  const PARENT_DOMAIN = process.env.PARENT_DOMAIN;
  if (!PARENT_DOMAIN) throw 'Set $PARENT_DOMAIIN';
  console.log({ PARENT_DOMAIIN: PARENT_DOMAIN });

  const parentNode = ethers.namehash(PARENT_DOMAIN);
  console.log({ parentNode });

  const dm3NameRegistrar = await upgrades.deployProxy(Factory, [parentNode]);
  await dm3NameRegistrar.waitForDeployment();

  console.log(
    `Dm3NameRegistrar is deployed at ${await dm3NameRegistrar.getAddress()}`
  );
};
export default func;
func.tags = ['Dm3NameRegistrar'];
