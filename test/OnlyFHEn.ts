import { OnlyFHEn, MockConfidentialFungibleToken } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("OnlyFHEn – confidential token flows", function () {
  let token: MockConfidentialFungibleToken;
  let onlyFhen: OnlyFHEn;
  let onlyFhenAddress: string;
  let tokenAddress: string;
  const toBN = (n: bigint) => n; // readability

  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    // Deploy MockConfidentialFungibleToken contract
    const INITIAL_AMOUNT = 1000000;
    token = await ethers.deployContract('MockConfidentialFungibleToken', [
      deployer.address,
      INITIAL_AMOUNT,
      'Confidential Token',
      'CTKN',
      'https://example.com/token'
    ]);
    tokenAddress = await token.getAddress();

    const OnlyFHEnFactory = await ethers.getContractFactory("OnlyFHEn");
    onlyFhen = (await OnlyFHEnFactory.deploy(tokenAddress)) as OnlyFHEn;
    onlyFhenAddress = await onlyFhen.getAddress();
  });

  it("registers a creator and initializes encrypted balance to 0", async function () {
    const [, alice] = await ethers.getSigners();
    await expect(onlyFhen.connect(alice).registerCreator()).to.emit(onlyFhen, "CreatorRegistered");

    await fhevm.initializeCLIApi();
    const enc = await onlyFhen.getEncryptedBalance(alice.address);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, enc, onlyFhenAddress, alice);
    expect(clear).to.eq(0n);
  });

  it("tipCreator credits the creator with the actual transferred e-amount", async function () {
    const [, alice, bob] = await ethers.getSigners();
    await onlyFhen.connect(alice).registerCreator();

    // Mint supporter tokens
    const initial = toBN(1_000_000n);
    await (await token.mint(bob.address, Number(initial))).wait();

    // Decrypt creator's initial credited balance
    await fhevm.initializeCLIApi();
    let encBalCreator = await onlyFhen.getEncryptedBalance(alice.address);
    let clearCreator = await fhevm.userDecryptEuint(FhevmType.euint64, encBalCreator, onlyFhenAddress, alice);
    expect(clearCreator).to.eq(0n);

    // Supporter tips
    const tipAmt = toBN(123_456n);
    const encInput = await fhevm.createEncryptedInput(onlyFhenAddress, bob.address).add64(tipAmt).encrypt();
    const expirationTimestamp = Math.round(Date.now()) + 60 * 60 * 24; // Now + 24 hours
    await token.connect(bob).setOperator(onlyFhenAddress, expirationTimestamp);
    await expect(
      onlyFhen.connect(bob).tipCreator(alice.address, encInput.handles[0], encInput.inputProof),
    ).to.emit(onlyFhen, "TipReceived");

    // Creator's credited balance increased by tipAmt
    encBalCreator = await onlyFhen.getEncryptedBalance(alice.address);
    clearCreator = await fhevm.userDecryptEuint(FhevmType.euint64, encBalCreator, onlyFhenAddress, alice);
    expect(clearCreator).to.eq(tipAmt);

    // Supporter token balance decreased by tipAmt
    const encBobBal = await token.confidentialBalanceOf(bob.address);
    const clearBobBal = await fhevm.userDecryptEuint(FhevmType.euint64, encBobBal, tokenAddress, bob);
    expect(clearBobBal).to.eq(initial - tipAmt);
  });

  it("tipCreator transfers 0 when supporter has less than requested amount", async function () {
    const [, alice, bob] = await ethers.getSigners();
    await onlyFhen.connect(alice).registerCreator();

    await fhevm.initializeCLIApi();
    const bobInitial = toBN(1n);
    await (await token.mint(bob.address, Number(bobInitial))).wait();
    const tipAmt = toBN(2n);
    const encInput = await fhevm.createEncryptedInput(onlyFhenAddress, bob.address).add64(tipAmt).encrypt();
    const expirationTimestamp = Math.round(Date.now()) + 60 * 60 * 24; // Now + 24 hours
    await token.connect(bob).setOperator(onlyFhenAddress, expirationTimestamp);
    await expect(
      onlyFhen.connect(bob).tipCreator(alice.address, encInput.handles[0], encInput.inputProof),
    ).to.emit(onlyFhen, "TipReceived");

    // Creator remains gets 0
    const encBalCreator = await onlyFhen.getEncryptedBalance(alice.address);
    const clearCreator = await fhevm.userDecryptEuint(FhevmType.euint64, encBalCreator, onlyFhenAddress, alice);
    expect(clearCreator).to.eq(0n);

    // Bob has balance unchanged
    const encBobBal = await token.confidentialBalanceOf(bob.address);
    const clearBobBal = await fhevm.userDecryptEuint(FhevmType.euint64, encBobBal, tokenAddress, bob);
    expect(clearBobBal).to.eq(bobInitial);
  });

  it("Should withdraw exact amount requested when creator has more than amount requested", async function () {
    const [, alice, bob] = await ethers.getSigners();
    await onlyFhen.connect(alice).registerCreator();

    // Fund Bob and tip Alice
    const initial = toBN(1_000_000n);
    const tipAmt = toBN(750_000n);
    await (await token.mint(bob.address, Number(initial))).wait();
    await fhevm.initializeCLIApi();
    const encTip = await fhevm.createEncryptedInput(onlyFhenAddress, bob.address).add64(tipAmt).encrypt();
    const expirationTimestamp = Math.round(Date.now()) + 60 * 60 * 24; // Now + 24 hours
    await token.connect(bob).setOperator(onlyFhenAddress, expirationTimestamp);
    await (await onlyFhen.connect(bob).tipCreator(alice.address, encTip.handles[0], encTip.inputProof)).wait();

    // Alice withdraws req = 100_000 (lower than credited 750k) → should send 100_000
    const reqAmt = toBN(100_000n);
    const encReq = await fhevm.createEncryptedInput(onlyFhenAddress, alice.address).add64(reqAmt).encrypt();
    await expect(onlyFhen.connect(alice).requestWithdraw(encReq.handles[0], encReq.inputProof)).to.emit(
      onlyFhen,
      "WithdrawRequested",
    );

    // Creator token balance increased by 100_000
    const encAliceToken = await token.confidentialBalanceOf(alice.address);
    const clearAliceToken = await fhevm.userDecryptEuint(FhevmType.euint64, encAliceToken, tokenAddress, alice);
    expect(clearAliceToken).to.eq(reqAmt);

    // Creator credited balance is now 650_000
    const encBalCreator = await onlyFhen.getEncryptedBalance(alice.address);
    const clearCreator = await fhevm.userDecryptEuint(FhevmType.euint64, encBalCreator, onlyFhenAddress, alice);
    expect(clearCreator).to.eq(650_000n);
  });

  it("requestWithdraw transfers up to min(request, credited) and updates credited balance", async function () {
    const [, alice, bob] = await ethers.getSigners();
    await onlyFhen.connect(alice).registerCreator();

    // Fund Bob and tip Alice
    const initial = toBN(1_000_000n);
    const tipAmt = toBN(750_000n);
    await (await token.mint(bob.address, Number(initial))).wait();
    await fhevm.initializeCLIApi();
    const encTip = await fhevm.createEncryptedInput(onlyFhenAddress, bob.address).add64(tipAmt).encrypt();
    const expirationTimestamp = Math.round(Date.now()) + 60 * 60 * 24; // Now + 24 hours
    await token.connect(bob).setOperator(onlyFhenAddress, expirationTimestamp);
    await (await onlyFhen.connect(bob).tipCreator(alice.address, encTip.handles[0], encTip.inputProof)).wait();

    // Alice withdraws req = 1_000_000 (greater than credited 750k) → should send 750k
    const reqAmt = toBN(1_000_000n);
    const encReq = await fhevm.createEncryptedInput(onlyFhenAddress, alice.address).add64(reqAmt).encrypt();
    await expect(onlyFhen.connect(alice).requestWithdraw(encReq.handles[0], encReq.inputProof)).to.emit(
      onlyFhen,
      "WithdrawRequested",
    );

    // Creator token balance increased by 750k
    const encAliceToken = await token.confidentialBalanceOf(alice.address);
    const clearAliceToken = await fhevm.userDecryptEuint(FhevmType.euint64, encAliceToken, tokenAddress, alice);
    expect(clearAliceToken).to.eq(tipAmt);

    // Creator credited balance is now 0
    const encBalCreator = await onlyFhen.getEncryptedBalance(alice.address);
    const clearCreator = await fhevm.userDecryptEuint(FhevmType.euint64, encBalCreator, onlyFhenAddress, alice);
    expect(clearCreator).to.eq(0n);
  });

  describe("Validation & Access Control", function () {
    it("reverts when registering twice", async function () {
      const [, alice] = await ethers.getSigners();
      await expect(onlyFhen.connect(alice).registerCreator()).to.emit(onlyFhen, "CreatorRegistered");
      await expect(onlyFhen.connect(alice).registerCreator()).to.be.revertedWith("OnlyFHEn: already registered");
    });

    it("tipCreator reverts when creator not registered", async function () {
      const [, alice, bob] = await ethers.getSigners();
      // Bob has funds but Alice is not registered
      await token.mint(bob.address, 1000);
      await fhevm.initializeCLIApi();
      const encInput = await fhevm.createEncryptedInput(onlyFhenAddress, bob.address).add64(100n).encrypt();
      // Bob authorizes operator to isolate failure cause to registration check
      const expirationTimestamp = Math.round(Date.now()) + 60 * 60 * 24;
      await token.connect(bob).setOperator(onlyFhenAddress, expirationTimestamp);
      await expect(
        onlyFhen.connect(bob).tipCreator(alice.address, encInput.handles[0], encInput.inputProof),
      ).to.be.revertedWith("OnlyFHEn: creator not registered");
    });

    it("requestWithdraw reverts when caller not registered", async function () {
      const [, alice] = await ethers.getSigners();
      await fhevm.initializeCLIApi();
      const encReq = await fhevm.createEncryptedInput(onlyFhenAddress, alice.address).add64(1n).encrypt();
      await expect(
        onlyFhen.connect(alice).requestWithdraw(encReq.handles[0], encReq.inputProof),
      ).to.be.revertedWith("OnlyFHEn: creator not registered");
    });

    it("reinit can be called by creator or owner only and requires registration", async function () {
      const [deployer, alice, bob] = await ethers.getSigners();

      // Unregistered creator cannot be reinit'ed (by anyone)
      await expect(onlyFhen.connect(deployer).reinit(alice.address)).to.be.revertedWith(
        "OnlyFHEn: creator not registered",
      );
      await expect(onlyFhen.connect(alice).reinit(alice.address)).to.be.revertedWith(
        "OnlyFHEn: creator not registered",
      );

      // Register and then test authorization paths
      await expect(onlyFhen.connect(alice).registerCreator()).to.emit(onlyFhen, "CreatorRegistered");

      // Creator can reinit self
      await expect(onlyFhen.connect(alice).reinit(alice.address)).to.not.be.reverted;

      // Owner can reinit creator
      await expect(onlyFhen.connect(deployer).reinit(alice.address)).to.not.be.reverted;

      // Third party cannot reinit
      await expect(onlyFhen.connect(bob).reinit(alice.address)).to.be.revertedWith("OnlyFHEn: not authorized");
    });

    it("tipCreator reverts if operator not set", async function () {
      const [, alice, bob] = await ethers.getSigners();
      await onlyFhen.connect(alice).registerCreator();

      await token.mint(bob.address, 1000);
      await fhevm.initializeCLIApi();
      const encInput = await fhevm.createEncryptedInput(onlyFhenAddress, bob.address).add64(100n).encrypt();

      // Do NOT set operator on token for onlyFhenAddress
      await expect(
        onlyFhen.connect(bob).tipCreator(alice.address, encInput.handles[0], encInput.inputProof),
      ).to.be.reverted; // underlying token likely reverts on missing operator
    });
  });
});
