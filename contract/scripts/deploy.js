require("dotenv").config();

const hre = require("hardhat");

const deploy = async () => {
  const teamWalletAddresses = [
    "0x963d1821b0C1cA2787F9E273dF1e501007e74A47",
    "0xEFeA36Cc43918b1680f0C41744BA110157ecF35D",
    "0x9B64C71f9fb4B5AfA1fd324C5848d80631EE9Aff",
    "0x7f5d87dea170227d0623d1e3a298364357637e6e",
  ];
  const teamPayoutRatios = [25, 25, 25, 25];
  const HilowCommissionsPayoutFactory = await hre.ethers.getContractFactory(
    "HilowCommissionsPayout"
  );
  const HilowCommissionsPayout = await HilowCommissionsPayoutFactory.deploy(
    teamWalletAddresses,
    teamPayoutRatios
  );
  await HilowCommissionsPayout.deployed();
  console.log("Team contract deployed to -", HilowCommissionsPayout.address);

  const HilowNFTFactory = await hre.ethers.getContractFactory(
    "HilowSupporterNFT"
  );
  const HilowNFT = await HilowNFTFactory.deploy();
  await HilowNFT.deployed();
  console.log("Supporters NFT deployed to -", HilowNFT.address);

  const CardsHoldingFactory = await hre.ethers.getContractFactory(
    "CardsHolding"
  );
  const CardsHolding = await CardsHoldingFactory.deploy(process.env.MAX_WORDS);
  await CardsHolding.deployed();
  console.log("Cards Holding contract deployed to -", CardsHolding.address);

  const HilowFactory = await hre.ethers.getContractFactory("Hilow");
  const Hilow = await HilowFactory.deploy(
    process.env.CHAINLINK_VRF_SUBSCRIPTION_ID,
    HilowCommissionsPayout.address,
    HilowNFT.address,
    CardsHolding.address,
    process.env.MAX_WORDS,
    {
      value: hre.ethers.utils.parseEther("1"),
    }
  );
  await Hilow.deployed();
  console.log("Game deployed to -", Hilow.address);

  const setGameContractTxn = await HilowNFT.setGameContract(Hilow.address);
  await setGameContractTxn.wait();
  console.log("Game contract has been set on NFT");

  let grantRoleTxn;
  teamWalletAddresses.forEach(async (address) => {
    grantRoleTxn = await HilowNFT.grantAdminRoleToAddress(address);
    await grantRoleTxn.wait();

    grantRoleTxn = await HilowNFT.grantFundGameRoleToAddress(address);
    await grantRoleTxn.wait();
  });
};

const runDeploy = async () => {
  try {
    await deploy();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runDeploy();
