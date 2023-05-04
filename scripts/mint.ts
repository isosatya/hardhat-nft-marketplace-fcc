import { ethers, network } from "hardhat"
import { BasicNft } from "../typechain-types/Contracts/test/BasicNft"
import { NftMarketPlace } from "../typechain-types"
import { moveBlocks } from "../utils/move-blocks"

async function mint() {
    const basicNft: BasicNft = await ethers.getContract("BasicNft")
    console.log("Mintingggg.....")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt!.events![0].args!.tokenId

    console.log(`Just minted Token with ID: ${tokenId}`)
    console.log(`NFT Contract Address: ${basicNft.address}`)

    if (network.config.chainId == 31337) {
        // best for moralis if move one at a time
        await moveBlocks(1, 1000)
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
