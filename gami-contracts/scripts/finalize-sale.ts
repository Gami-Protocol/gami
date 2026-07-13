import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

const TGE_UNLOCK_BPS = 1500n; // 15%
const CLIFF_SECONDS = 0n;
const VESTING_SECONDS = 365n * 24n * 60n * 60n;

async function main() {
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const deploymentPath = path.join(__dirname, '..', 'deployments', `${chainId}.json`);
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')) as {
    contracts: { GAMI: string; TokenSale: string; VestingVault: string };
  };

  const [owner] = await ethers.getSigners();
  const sale = await ethers.getContractAt('TokenSale', deployment.contracts.TokenSale);
  const vesting = await ethers.getContractAt('VestingVault', deployment.contracts.VestingVault);
  const gami = await ethers.getContractAt('GAMI', deployment.contracts.GAMI);

  const filter = sale.filters.Contribution();
  const events = await sale.queryFilter(filter);
  const buyers = new Map<string, bigint>();

  for (const ev of events) {
    if (!('args' in ev) || !ev.args) continue;
    const buyer = String(ev.args[0]);
    const gamiAmount = BigInt(ev.args[2]);
    buyers.set(buyer, (buyers.get(buyer) ?? 0n) + gamiAmount);
  }

  const vestingStart = BigInt(Math.floor(Date.now() / 1000));
  let total = 0n;

  for (const [buyer, amount] of buyers) {
    const existing = await vesting.schedules(buyer);
    if (existing.totalAmount > 0n) {
      if (existing.totalAmount !== amount) {
        throw new Error(
          `Existing vesting for ${buyer} is ${existing.totalAmount}, expected ${amount}`,
        );
      }
      console.log('Vesting already exists:', buyer, ethers.formatEther(amount));
      total += amount;
      continue;
    }

    await (
      await vesting.createVesting(
        buyer,
        amount,
        vestingStart,
        CLIFF_SECONDS,
        VESTING_SECONDS,
        TGE_UNLOCK_BPS,
      )
    ).wait();
    total += amount;
    console.log('Vesting created:', buyer, ethers.formatEther(amount));
  }

  const saleBalance = await gami.balanceOf(deployment.contracts.TokenSale);
  if (saleBalance < total) {
    throw new Error(
      `TokenSale has ${ethers.formatEther(saleBalance)} GAMI; ${ethers.formatEther(total)} required`,
    );
  }

  if (await sale.finalized()) {
    console.log('Sale already finalized; vesting vault funding is complete.');
    return;
  }

  await (await sale.finalizeSale(vestingStart, CLIFF_SECONDS, VESTING_SECONDS, TGE_UNLOCK_BPS)).wait();

  console.log('Finalized sale for', buyers.size, 'buyers, total GAMI:', ethers.formatEther(total));
  console.log('Owner:', owner.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
