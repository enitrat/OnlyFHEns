import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

function asAddress(v: string | undefined): string | undefined {
  return v && v.toLowerCase().startsWith("0x") ? v : undefined;
}

task("onlyfhen:address", "Prints the OnlyFHEn address").setAction(async (_args, hre) => {
  const { deployments } = hre;
  const d = await deployments.get("OnlyFHEn");
  console.log("OnlyFHEn:", d.address);
});

task("onlyfhen:register", "Register caller as a creator")
  .addOptionalParam("address", "OnlyFHEn contract address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const d = args.address ? { address: args.address } : await deployments.get("OnlyFHEn");
    const [signer] = await ethers.getSigners();
    const onlyFhen = await ethers.getContractAt("OnlyFHEn", d.address);
    const tx = await onlyFhen.connect(signer).registerCreator();
    console.log(`Registering creator. tx:${tx.hash}`);
    await tx.wait();
  });

task("onlyfhen:decrypt-balance", "Decrypt a creator's encrypted balance")
  .addOptionalParam("address", "OnlyFHEn contract address")
  .addOptionalParam("creator", "Creator address (defaults to caller)")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();
    const d = args.address ? { address: args.address } : await deployments.get("OnlyFHEn");
    const [signer] = await ethers.getSigners();
    const creator = asAddress(args.creator) ?? signer.address;
    const onlyFhen = await ethers.getContractAt("OnlyFHEn", d.address);
    const enc = await onlyFhen.getEncryptedBalance(creator);
    if (enc === ethers.ZeroHash) {
      console.log("Encrypted balance:", enc);
      console.log("Clear balance    : 0");
      return;
    }
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, enc, d.address, signer);
    console.log("Encrypted balance:", enc);
    console.log("Clear balance    :", clear.toString());
  });

// JSON-only helpers for automation
task("onlyfhen:encrypt-input-json", "Create encrypted input for a uint64 amount and output JSON")
  .addParam("address", "Contract address that will consume the input")
  .addParam("user", "User address allowed to import ciphertexts")
  .addParam("amount", "Amount (uint64)")
  .setAction(async (args: TaskArguments, hre) => {
    const { fhevm } = hre;
    await fhevm.initializeCLIApi();
    const amount = BigInt(args.amount);
    const enc = await fhevm.createEncryptedInput(args.address, args.user).add64(amount).encrypt();
    const encodedAmount = enc.handles[0];
    console.error("json stringifying", { handle: encodedAmount, inputProof: enc.inputProof })
    process.stdout.write(
      JSON.stringify({ handle: encodedAmount, inputProof: enc.inputProof }) + "\n",
    );
  });

task("onlyfhen:user-decrypt-json", "User-decrypt a handle and output JSON")
  .addParam("address", "Contract address")
  .addParam("handle", "Ciphertext handle (bytes32)")
  .addOptionalParam("creator", "Creator/signer address (defaults to first account)")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, fhevm } = hre;
    await fhevm.initializeCLIApi();
    const signer = args.creator ? await ethers.getSigner(args.creator) : (await ethers.getSigners())[0];
    const value = await fhevm.userDecryptEuint(FhevmType.euint64, args.handle, args.address, signer);
    process.stdout.write(JSON.stringify({ value: value.toString() }) + "\n");
  });

task("onlyfhen:tip", "Send an encrypted tip to a creator")
  .addOptionalParam("address", "OnlyFHEn contract address")
  .addParam("creator", "Creator address to tip")
  .addParam("amount", "Encrypted amount (uint64)")
  .addOptionalParam("value", "ETH value to send in wei (defaults to amount)")
  .addOptionalParam("handle", "Supporter handle", "")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();
    const amount = BigInt(args.amount);
    if (amount < 0n) throw new Error("--amount must be >= 0");
    const value = args.value ? BigInt(args.value) : amount;
    if (value > (1n << 64n) - 1n) throw new Error("--value exceeds uint64");

    const d = args.address ? { address: args.address } : await deployments.get("OnlyFHEn");
    const [signer] = await ethers.getSigners();
    const onlyFhen = await ethers.getContractAt("OnlyFHEn", d.address);

    const encAmount = await fhevm.createEncryptedInput(d.address, signer.address).add64(amount).encrypt();
    const tx = await onlyFhen
      .connect(signer)
      .tipCreator(args.creator, encAmount.handles[0], encAmount.inputProof);
    console.log(`Tipping ${args.creator} amount=${amount} value=${value} tx:${tx.hash}`);
    await tx.wait();
  });

task("onlyfhen:request-withdraw", "Request a withdrawal (creator)")
  .addOptionalParam("address", "OnlyFHEn contract address")
  .addParam("amount", "Withdrawal amount in wei (uint64)")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const amount = BigInt(args.amount);
    if (amount <= 0n) throw new Error("--amount must be > 0");
    if (amount > (1n << 64n) - 1n) throw new Error("--amount exceeds uint64");
    const d = args.address ? { address: args.address } : await deployments.get("OnlyFHEn");
    const [signer] = await ethers.getSigners();
    const onlyFhen = await ethers.getContractAt("OnlyFHEn", d.address);
    const encAmount = await fhevm.createEncryptedInput(d.address, signer.address).add64(amount).encrypt();
    const tx = await onlyFhen.connect(signer).requestWithdraw(encAmount.handles[0], encAmount.inputProof);
    console.log(`Requesting withdrawal amount=${amount} tx:${tx.hash}`);
    await tx.wait();
  });
