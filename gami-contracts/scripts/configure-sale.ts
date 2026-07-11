import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_PRICE = 12_000n; // $0.012 per GAMI in 6-decimal USDC units per 1e18 GAMI
const HARD_CAP = 2_160_000_000_000n; // $2.16M USDC (6 decimals)
const PER_WALLET_CAP = 2_500_000_000n; // $2,500 USDC

async function main() {
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const deploymentPath = path.join(__dirname, '..', 'deployments', `${chainId}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Missing deployment file: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')) as {
    contracts: { GAMI: string; TokenSale: string };
  };

  const [deployer] = await ethers.getSigners();
  const gami = await ethers.getContractAt('GAMI', deployment.contracts.GAMI);
  const sale = await ethers.getContractAt('TokenSale', deployment.contracts.TokenSale);

  await (await sale.setParams(PUBLIC_PRICE, HARD_CAP, PER_WALLET_CAP)).wait();
  await (await sale.setPhase(3)).wait(); // Phase.PUBLIC

  const saleAllocation = ethers.parseEther('180000000'); // 18% public allocation
  await (await gami.transfer(deployment.contracts.TokenSale, saleAllocation)).wait();

  console.log('Sale configured:', {
    pricePerToken: PUBLIC_PRICE.toString(),
    hardCap: HARD_CAP.toString(),
    perWalletCap: PER_WALLET_CAP.toString(),
    phase: 'PUBLIC',
    gamiTransferred: ethers.formatEther(saleAllocation),
    deployer: deployer.address,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
