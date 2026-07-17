import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const GAMI = await ethers.getContractFactory('GAMI');
  const gami = await GAMI.deploy(deployer.address);
  await gami.waitForDeployment();
  const gamiAddress = await gami.getAddress();
  console.log('GAMI:', gamiAddress);

  const VestingVault = await ethers.getContractFactory('VestingVault');
  const vesting = await VestingVault.deploy(gamiAddress);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log('VestingVault:', vestingAddress);

  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log('MockUSDC:', usdcAddress);

  const TokenSale = await ethers.getContractFactory('TokenSale');
  const sale = await TokenSale.deploy(gamiAddress, usdcAddress, vestingAddress);
  await sale.waitForDeployment();
  const saleAddress = await sale.getAddress();
  console.log('TokenSale:', saleAddress);

  const FeeRouter = await ethers.getContractFactory('FeeRouter');
  const router = await FeeRouter.deploy(
    gamiAddress,
    deployer.address, // treasury placeholder
    deployer.address, // staking placeholder
    deployer.address, // liquidity placeholder
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log('FeeRouter:', routerAddress);

  const deployments = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    contracts: {
      GAMI: gamiAddress,
      VestingVault: vestingAddress,
      TokenSale: saleAddress,
      FeeRouter: routerAddress,
      USDC: usdcAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const chainId = deployments.chainId;
  fs.writeFileSync(
    path.join(outDir, `${chainId}.json`),
    JSON.stringify(deployments, null, 2),
  );
  console.log('Saved deployments to', path.join(outDir, `${chainId}.json`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
