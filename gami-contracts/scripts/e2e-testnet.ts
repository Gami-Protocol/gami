/**
 * End-to-end ICO flow test on local Hardhat network.
 * Run: npm run test:e2e
 */
import { ethers } from 'hardhat';

const PUBLIC_PRICE = 12_000n;
const HARD_CAP = 2_160_000_000_000n;
const PER_WALLET_CAP = 2_500_000_000n;

async function main() {
  const [owner, buyer] = await ethers.getSigners();

  const GAMI = await ethers.getContractFactory('GAMI');
  const gami = await GAMI.deploy(owner.address);
  const gamiAddress = await gami.getAddress();

  const VestingVault = await ethers.getContractFactory('VestingVault');
  const vesting = await VestingVault.deploy(gamiAddress);
  const vestingAddress = await vesting.getAddress();

  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const usdc = await MockUSDC.deploy();
  const usdcAddress = await usdc.getAddress();

  const TokenSale = await ethers.getContractFactory('TokenSale');
  const sale = await TokenSale.deploy(gamiAddress, usdcAddress, vestingAddress);
  const saleAddress = await sale.getAddress();

  await sale.setParams(PUBLIC_PRICE, HARD_CAP, PER_WALLET_CAP);
  await sale.setPhase(3);
  await gami.transfer(saleAddress, ethers.parseEther('180000000'));

  const amount = 100_000_000n;
  await usdc.mint(buyer.address, amount);
  await usdc.connect(buyer).approve(saleAddress, amount);
  await sale.connect(buyer).contributeUSDC(amount, []);

  const allocation = await sale.allocation(buyer.address);
  const start = BigInt(Math.floor(Date.now() / 1000));
  await vesting.createVesting(buyer.address, allocation, start, 0, 1, 10_000);
  await gami.transfer(vestingAddress, allocation);

  const claimable = await vesting.claimable(buyer.address);
  await vesting.connect(buyer).claim();

  console.log('E2E ICO flow OK:', {
    buyer: buyer.address,
    contributedUsdc: ethers.formatUnits(amount, 6),
    allocationGami: ethers.formatEther(allocation),
    claimedGami: ethers.formatEther(claimable),
    totalRaised: ethers.formatUnits(await sale.totalRaised(), 6),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
