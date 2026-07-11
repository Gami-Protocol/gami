import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('GAMI Token', function () {
  it('mints max supply to owner', async function () {
    const [owner] = await ethers.getSigners();
    const GAMI = await ethers.getContractFactory('GAMI');
    const gami = await GAMI.deploy(owner.address);
    const supply = await gami.totalSupply();
    expect(supply).to.equal(ethers.parseEther('1000000000'));
  });

  it('allows burning', async function () {
    const [owner] = await ethers.getSigners();
    const GAMI = await ethers.getContractFactory('GAMI');
    const gami = await GAMI.deploy(owner.address);
    await gami.burn(ethers.parseEther('1000'));
    expect(await gami.totalSupply()).to.equal(ethers.parseEther('999999000'));
  });
});

describe('FeeRouter', function () {
  it('routes fees per allocation', async function () {
    const [owner, treasury, staking, liquidity, payer] = await ethers.getSigners();
    const GAMI = await ethers.getContractFactory('GAMI');
    const gami = await GAMI.deploy(owner.address);
    const gamiAddr = await gami.getAddress();

    const FeeRouter = await ethers.getContractFactory('FeeRouter');
    const router = await FeeRouter.deploy(
      gamiAddr,
      treasury.address,
      staking.address,
      liquidity.address,
    );
    const routerAddr = await router.getAddress();

    const amount = ethers.parseEther('10000');
    await gami.transfer(payer.address, amount);
    await gami.connect(payer).approve(routerAddr, amount);
    await router.connect(payer).routeFees(amount);

    expect(await gami.balanceOf(treasury.address)).to.equal(ethers.parseEther('3000'));
    expect(await gami.balanceOf(staking.address)).to.equal(ethers.parseEther('2000'));
    expect(await gami.balanceOf(liquidity.address)).to.equal(ethers.parseEther('1000'));
    expect(await router.totalBurned()).to.equal(ethers.parseEther('4000'));
  });
});
