import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mainnet deployment script — run only after external audit.
 * Usage: npm run deploy:mainnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (network.chainId !== 8453n) {
    throw new Error('This script is for Base mainnet (chainId 8453) only');
  }

  console.log('MAINNET DEPLOY — ensure audit is complete');
  console.log('Deployer:', deployer.address);

  const GAMI = await ethers.getContractFactory('GAMI');
  const gami = await GAMI.deploy(deployer.address);
  await gami.waitForDeployment();

  const VestingVault = await ethers.getContractFactory('VestingVault');
  const vesting = await VestingVault.deploy(await gami.getAddress());
  await vesting.waitForDeployment();

  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) throw new Error('USDC_ADDRESS required for mainnet');

  const TokenSale = await ethers.getContractFactory('TokenSale');
  const sale = await TokenSale.deploy(
    await gami.getAddress(),
    usdcAddress,
    await vesting.getAddress(),
  );
  await sale.waitForDeployment();

  const treasury = process.env.TREASURY_ADDRESS ?? deployer.address;
  const FeeRouter = await ethers.getContractFactory('FeeRouter');
  const router = await FeeRouter.deploy(
    await gami.getAddress(),
    treasury,
    treasury,
    treasury,
  );
  await router.waitForDeployment();

  const deployments = {
    network: 'base',
    chainId: 8453,
    deployer: deployer.address,
    treasury,
    contracts: {
      GAMI: await gami.getAddress(),
      VestingVault: await vesting.getAddress(),
      TokenSale: await sale.getAddress(),
      FeeRouter: await router.getAddress(),
    },
    deployedAt: new Date().toISOString(),
    auditStatus: 'pending',
  };

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, '8453.json'), JSON.stringify(deployments, null, 2));
  console.log('Mainnet deployments saved. Update wallet + web env vars with these addresses.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
