import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "node:path";
import fs from "node:fs";
import { vars } from "hardhat/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy a mock confidential token for local/testing unless a TOKEN is provided.
  // Prefer Hardhat vars (secure), fallback to environment variable.
  const tokenVar = (() => {
    try {
      const v = vars.get("TOKEN", "");
      return v || undefined;
    } catch (_e) {
      return undefined;
    }
  })();
  const tokenEnv = process.env.TOKEN?.toString();
  let tokenAddress = tokenVar || tokenEnv;

  if (!tokenAddress) {
    const initialOwner = deployer;
    const initialSupply = 1_000_000; // uint64
    const name = "Mock Confidential Token";
    const symbol = "MCT";
    const tokenURI = "https://example.com/token.json";

    console.log("[DEBUG] Deploying MockConfidentialFungibleToken on network", hre.network.name);
    const token = await deploy("MockConfidentialFungibleToken", {
      from: deployer,
      args: [initialOwner, initialSupply, name, symbol, tokenURI],
      log: true,
      autoMine: true,
    });
    tokenAddress = token.address;
  }

  const onlyfhen = await deploy("OnlyFHEn", {
    from: deployer,
    args: [tokenAddress],
    log: true,
    autoMine: true,
  });

  // Persist addresses for the frontend
  const root = process.cwd();
  const frontendDir = path.join(root, "frontend");
  const envLocalPath = path.join(frontendDir, ".env.local");
  const contractsPath = path.join(frontendDir, "app", "config");
  const contractsJsonPath = path.join(contractsPath, `contracts.${hre.network.name}.json`);

  const chainId = hre.network.config?.chainId ?? 0;
  const data = {
    network: hre.network.name,
    chainId,
    OnlyFHEn: onlyfhen.address,
    Token: tokenAddress,
  };

  // Ensure config dir exists
  fs.mkdirSync(contractsPath, { recursive: true });
  fs.writeFileSync(contractsJsonPath, JSON.stringify(data, null, 2));

  // Write .env.local for Vite
  // Read existing .env.local if it exists
  let existingEnv: Record<string, string> = {};
  if (fs.existsSync(envLocalPath)) {
    const existingContent = fs.readFileSync(envLocalPath, 'utf-8');
    existingContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        existingEnv[match[1]] = match[2];
      }
    });
  }

  if (hre.network.name === "sepolia") {
    existingEnv[`VITE_ONLYFHEN_ADDRESS_SEPOLIA`] = onlyfhen.address;
    existingEnv[`VITE_TOKEN_ADDRESS_SEPOLIA`] = tokenAddress;
  } else if (hre.network.name === "localhost") {
    existingEnv[`VITE_ONLYFHEN_ADDRESS_LOCALHOST`] = onlyfhen.address;
    existingEnv[`VITE_TOKEN_ADDRESS_LOCALHOST`] = tokenAddress;
  }
  else {
    throw new Error(`Unsupported network: ${hre.network.name}`);
  }

  // Write updated env vars back
  const envContents = Object.entries(existingEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(envLocalPath, envContents + '\n');

  // Console output for convenience
  console.log("\n== Deployment Summary ==");
  console.log("Network:", hre.network.name, "(chainId:", chainId, ")");
  console.log("Token:", tokenAddress);
  console.log("OnlyFHEn:", onlyfhen.address);
  console.log("Saved:", path.relative(root, envLocalPath));
  console.log("Saved:", path.relative(root, contractsJsonPath), "\n");
};

export default func;
func.tags = ["OnlyFHEn"];
