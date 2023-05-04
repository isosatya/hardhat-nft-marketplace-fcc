import { ethers, network } from "hardhat"
import { BasicNft } from "../typechain-types/Contracts/test/BasicNft"
import { NftMarketPlace } from "../typechain-types"
import { moveBlocks } from "../utils/move-blocks"

// TOKEN_ID has to be an ID from an NFT that is already minte
// here it is 0 because we minted only the first NFT, which has ID = 0
const TOKEN_ID = 0

async function cancel() {
    const nftMarketPlace: NftMarketPlace = await ethers.getContract("NftMarketPlace")
    const basicNft: BasicNft = await ethers.getContract("BasicNft")
    const tx = await nftMarketPlace.cancelItem(basicNft.address, TOKEN_ID)
    await tx.wait(1)
    console.log("NFT Canceled!!")

    if (network.config.chainId == 31337) {
        // best for moralis if move one at a time
        await moveBlocks(1, 1000)
    }
}

cancel()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
