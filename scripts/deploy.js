const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log(" Iniciando Deploy do Smart Contract: CartorioNotarial");
  console.log(" Rede selecionada:", hre.network.name);
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Conta que está executando o Deploy:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Saldo da Conta:", hre.ethers.formatEther(balance), "ETH");

  // Compilar e obter a Factory
  const CartorioNotarial = await hre.ethers.getContractFactory("CartorioNotarial");
  console.log("Enviando transação de implantação...");
  const cartorio = await CartorioNotarial.deploy();
  await cartorio.waitForDeployment();

  const contractAddress = await cartorio.getAddress();
  console.log(">>> Smart Contract implantado com SUCESSO! <<<");
  console.log("Endereço do Contrato:", contractAddress);
  console.log("Hash da Transação:", cartorio.deploymentTransaction().hash);

  // Extrair o Artifact completo (ABI)
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/CartorioNotarial.sol/CartorioNotarial.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const configData = {
    contractAddress: contractAddress,
    networkName: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: artifact.abi,
  };

  // Salvar no Backend
  const backendConfigDir = path.join(__dirname, "../backend/src/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendConfigDir, "contractConfig.json"),
    JSON.stringify(configData, null, 2)
  );
  console.log("Configuração sincronizada com o Backend -> backend/src/config/contractConfig.json");

  // Salvar no Frontend
  const frontendConfigDir = path.join(__dirname, "../frontend/src/config");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendConfigDir, "contractConfig.json"),
    JSON.stringify(configData, null, 2)
  );
  console.log("Configuração sincronizada com o Frontend -> frontend/src/config/contractConfig.json");

  console.log("==================================================");
  console.log(" Deploy concluído e pronto para uso!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Erro durante o deploy:", error);
  process.exitCode = 1;
});
