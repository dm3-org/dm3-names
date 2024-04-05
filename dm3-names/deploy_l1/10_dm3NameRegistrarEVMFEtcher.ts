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

  const DM3_NAMER_REGISTRAR_ADDRESS = process.env.DM3_NAMER_REGISTRAR_ADDRESS;
  if (!DM3_NAMER_REGISTRAR_ADDRESS) throw 'Set $DM3_NAMER_REGISTRAR_ADDRESS';
  console.log({ DM3_NAMER_REGISTRAR_ADDRESS });
  console.log('args ', [OP_VERIFIER_ADDRESS, DM3_NAMER_REGISTRAR_ADDRESS, PARENT_DOMAIN])


  await deploy('Dm3NameRegistrarEVMFetcher', {
    from: deployer,
    args: [OP_VERIFIER_ADDRESS, DM3_NAMER_REGISTRAR_ADDRESS, PARENT_DOMAIN],
    log: true,
  });
};
export default func;
func.tags = ['Dm3NameRegistrarEVMFetcher'];
