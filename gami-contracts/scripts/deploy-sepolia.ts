import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying to Base Sepolia with:', deployer.address);

  const GAMI = await ethers.getContractFactory('GAMI');
  const gami = await GAMI.deploy(deployer.address);
  await gami.waitForDeployment();
  const gamiAddress = await gami.getAddress();

  const VestingVault = await ethers.getContractFactory('VestingVault');
  const vesting = await VestingVault.deploy(gamiAddress);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();

  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();

  const TokenSale = await ethers.getContractFactory('TokenSale');
  const sale = await TokenSale.deploy(gamiAddress, usdcAddress, vestingAddress);
  await sale.waitForDeployment();
  const saleAddress = await sale.getAddress();

  const FeeRouter = await ethers.getContractFactory('FeeRouter');
  const router = await FeeRouter.deploy(
    gamiAddress,
    deployer.address,
    deployer.address,
    deployer.address,
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();

  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const deployments = {
    network: 'baseSepolia',
    chainId,
    deployer: deployer.address,
    contracts: {
      GAMI: gamiAddress,
      VestingVault: vestingAddress,
      TokenSale: saleAddress,
      FeeRouter: routerAddress,
      USDC: usdcAddress,
    },
    saleParams: {
      pricePerToken: '12000',
      hardCapUsdc: '2160000000000',
      perWalletCapUsdc: '2500000000',
      phase: 'PUBLIC',
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${chainId}.json`), JSON.stringify(deployments, null, 2));
  console.log('Saved deployments to', path.join(outDir, `${chainId}.json`));

  execSync('npx hardhat run scripts/configure-sale.ts --network baseSepolia', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
