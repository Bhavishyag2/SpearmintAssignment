/*** 
 * This script first tries to listen if there's any transfer event emitted from CAKE contract
 * Following which, it will check for IncreaseLiquidity event emission from router contract
 * We're checking the occurrence of above 2 events because those are the first and last events emitted when we add liquidity to CAKE-tBNB pool
 * If both the events are emitted in the same block, then we can 
 * 
 * ***/


import { ethers } from "ethers";
//require("dotenv").config();
import "dotenv/config";

const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.bnbchain.org:8545");

//console.log(provider.blockNumber);

const cakeToken = "0x8d008B313C1d6C7fE2982F62d32Da7507cF43551";
const routerAddress = "0x427bF5b37357632377eCbEC9de3626C71A5396c1";

const swapAddress = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

//const bnbtokenaddr = "0x320016Df590B6e78f0813564E115FcDb066DAf01"; //BNB BSC Testnet Address

//ABI for Transfer event from CAKE contract
const abi1 = [
   "event Transfer (address indexed from, address indexed to, uint256 value)",
    ];

//ABI for IncreaseLiquidity event and swap function from Router contract
const abi2 = [
    "event IncreaseLiquidity (uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
];

const abi3=[
    
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);",
];


const signer = new ethers.Wallet(process.env.PVT_KEY!, provider );

const cakeContract = new ethers.Contract(cakeToken, abi1, signer);

console.log(signer.getAddress());

const routerContract = new ethers.Contract(routerAddress, abi2, signer);

const swapContract = new ethers.Contract(swapAddress, abi3, signer);


const init = async () => {
    await provider.on("block", async (blockNumber) => {
      // This line of code listens to the block mining and every time a block is mined, it will return blocknumber.
      const transferEvent = await cakeContract.queryFilter(
        //Simply used the queryfilter to listen to the transfer event everytime a block is mined.
        "Transfer",
        blockNumber - 1,
        blockNumber
      );  
      if(transferEvent){
        const liquidityEvent = await routerContract.queryFilter(
            "IncreaseLiquidity",
            blockNumber -1,
            blockNumber
        );

        if(liquidityEvent){
            var path: string[] = new Array(1);
            path[0]= swapAddress;
            path[1]=cakeToken;

            const swap = await swapContract.swapExactETHForTokens (
                0,
                path,
                signer.getAddress(),
                blockNumber + 100,
                {value: ethers.utils.parseEther("0.01")} //since it's a payable function
            );

            await swap;
        }
           // console.log(liquidityEvent);
      }
     //console.log(transferEvent);
    });
  };
  
  init().catch((err) => {
    console.log(err);
    process.exit(1);
  });
