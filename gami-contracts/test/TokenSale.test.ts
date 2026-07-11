import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MerkleTree } from 'merkletreejs';

describe('TokenSale + VestingVault', function () {
  async function deployFixture() {
    const [owner, buyer, other] = await ethers.getSigners();

    const GAMI = await ethers.getContractFactory('GAMI');
    const gami = await GAMI.deploy(owner.address);

    const VestingVault = await ethers.getContractFactory('VestingVault');
    const vesting = await VestingVault.deploy(await gami.getAddress());

    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    const usdc = await MockUSDC.deploy();

    const TokenSale = await ethers.getContractFactory('TokenSale');
    const sale = await TokenSale.deploy(
      await gami.getAddress(),
      await usdc.getAddress(),
      await vesting.getAddress(),
    );

    const price = 12_000n;
    const hardCap = 1_000_000_000n;
    const perWallet = 500_000_000n;
    await sale.setParams(price, hardCap, perWallet);
    await sale.setPhase(3); // PUBLIC

    await usdc.mint(buyer.address, 1_000_000_000n);
    await usdc.connect(buyer).approve(await sale.getAddress(), 1_000_000_000n);

    return { owner, buyer, other, gami, vesting, usdc, sale, price };
  }

  it('accepts USDC contributions in public phase', async function () {
    const { buyer, sale } = await deployFixture();
    const amount = 100_000_000n; // $100 USDC
    await sale.connect(buyer).contributeUSDC(amount, []);
    expect(await sale.contributed(buyer.address)).to.equal(amount);
    expect(await sale.totalRaised()).to.equal(amount);
  });

  it('enforces per-wallet cap', async function () {
    const { buyer, sale } = await deployFixture();
    await expect(sale.connect(buyer).contributeUSDC(600_000_000n, [])).to.be.revertedWith(
      'wallet cap',
    );
  });

  it('requires whitelist in seed phase', async function () {
    const { buyer, other, sale } = await deployFixture();
    await sale.setPhase(1); // SEED

    const otherLeaf = ethers.solidityPackedKeccak256(['address'], [other.address]);
    const tree = new MerkleTree([otherLeaf], ethers.keccak256, { sortPairs: true, hashLeaves: false });
    await sale.setMerkleRoot(tree.getHexRoot());

    await expect(sale.connect(buyer).contributeUSDC(10_000_000n, [])).to.be.revertedWith(
      'not whitelisted',
    );

    const buyerLeaf = ethers.solidityPackedKeccak256(['address'], [buyer.address]);
    const buyerTree = new MerkleTree([buyerLeaf], ethers.keccak256, { sortPairs: true, hashLeaves: false });
    await sale.setMerkleRoot(buyerTree.getHexRoot());
    const proof = buyerTree.getHexProof(buyerLeaf);

    await sale.connect(buyer).contributeUSDC(10_000_000n, proof);
    expect(await sale.contributed(buyer.address)).to.equal(10_000_000n);
  });

  it('creates vesting and allows claim after TGE', async function () {
    const { owner, buyer, gami, vesting, sale } = await deployFixture();
    const amount = 100_000_000n;
    await sale.connect(buyer).contributeUSDC(amount, []);

    const gamiAmount = await sale.allocation(buyer.address);
    const start = BigInt(Math.floor(Date.now() / 1000));

    await vesting.createVesting(buyer.address, gamiAmount, start, 0, 1, 10_000);
    await gami.transfer(await vesting.getAddress(), gamiAmount);

    const claimable = await vesting.claimable(buyer.address);
    expect(claimable).to.equal((gamiAmount * 10_000n) / 10_000n);

    await vesting.connect(buyer).claim();
    expect(await gami.balanceOf(buyer.address)).to.equal(claimable);
  });
});
