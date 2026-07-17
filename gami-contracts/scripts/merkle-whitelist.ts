import { ethers } from 'hardhat';
import { MerkleTree } from 'merkletreejs';
import * as fs from 'fs';
import * as path from 'path';

interface Participant {
  wallet_address: string;
  kyc_status: string;
}

async function main() {
  const participantsPath = process.env.PARTICIPANTS_JSON;
  let wallets: string[];

  if (participantsPath && fs.existsSync(participantsPath)) {
    const rows = JSON.parse(fs.readFileSync(participantsPath, 'utf8')) as Participant[];
    wallets = rows
      .filter((r) => r.kyc_status === 'approved')
      .map((r) => ethers.getAddress(r.wallet_address));
  } else {
    const [, , ...args] = process.argv;
    wallets = args.map((a) => ethers.getAddress(a));
  }

  if (wallets.length === 0) {
    console.log('No approved wallets. Usage: merkle-whitelist.ts 0xAddr1 0xAddr2');
    console.log('Or set PARTICIPANTS_JSON to a sale_participants / waitlist export.');
    console.log(
      'Tip: npm run export:waitlist -- --format participants --out ./participants.json',
    );
    return;
  }

  const leaves = wallets.map((w) =>
    ethers.solidityPackedKeccak256(['address'], [w]),
  );
  const tree = new MerkleTree(leaves, ethers.keccak256, { sortPairs: true, hashLeaves: false });
  const root = tree.getHexRoot();

  const proofs: Record<string, string[]> = {};
  for (const w of wallets) {
    const leaf = ethers.solidityPackedKeccak256(['address'], [w]);
    proofs[w] = tree.getHexProof(leaf);
  }

  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `merkle-${chainId}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify({ root, wallets, proofs, generatedAt: new Date().toISOString() }, null, 2),
  );

  const deploymentPath = path.join(outDir, `${chainId}.json`);
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8')) as {
      contracts: { TokenSale: string };
    };
    const sale = await ethers.getContractAt('TokenSale', deployment.contracts.TokenSale);
    await (await sale.setMerkleRoot(root)).wait();
    console.log('Merkle root set on TokenSale:', root);
  }

  console.log('Saved', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
