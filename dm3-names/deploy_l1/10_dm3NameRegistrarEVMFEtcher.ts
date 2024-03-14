import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const OP_VERIFIER_ADDRESS = process.env.OP_VERIFIER_ADDRESS;
  if (!OP_VERIFIER_ADDRESS) throw 'Set $OP_VERIFIER_ADDRESS';
  console.log({ OP_VERIFIER_ADDRESS });

  const PARENT_DOMAIN = process.env.PARENT_DOMAIN;
  if (!PARENT_DOMAIN) throw 'Set $PARENT_DOMAIIN';
  console.log({ PARENT_DOMAIIN: PARENT_DOMAIN });

  const Dm3NameRegistrar = await hre.companionNetworks['l2'].deployments.get('Dm3NameRegistrar');


  await deploy('Dm3NameRegistrarEVMFetcher', {
    from: deployer,
    args: [OP_VERIFIER_ADDRESS, Dm3NameRegistrar.address, PARENT_DOMAIN],
    log: true,
  });
};
export default func;
func.tags = ['Dm3NameRegistrarEVMFetcher'];
