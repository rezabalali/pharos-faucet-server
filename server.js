import express from "express";
import { ethers } from "ethers";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// RPC شبکه Pharos Testnet
const provider = new ethers.JsonRpcProvider("https://testnet.dplabs-internal.com");

// کلید خصوصی کیف پول سرور رو از Environment Variables بخون
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// آدرس توکن PHRS
const tokenAddress = "0xf63Aa73B5e980606f389Eee29cAFb83409177d16";

// ABI ساده ERC20
const tokenAbi = [
  "function transfer(address to, uint256 amount) public returns (bool)"
];

const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);

// ذخیره آدرس‌هایی که claim کردن
let claimed = {};

app.post("/claim", async (req, res) => {
  const { address } = req.body;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  if (claimed[address] && Date.now() - claimed[address] < 24 * 60 * 60 * 1000) {
    return res.status(400).json({ error: "Already claimed today" });
  }

  try {
    const amount = ethers.parseUnits("10", 18); // 10 PHRS هر claim
    const tx = await tokenContract.transfer(address, amount);
    await tx.wait();

    claimed[address] = Date.now();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Faucet server running on port ${PORT}`));
