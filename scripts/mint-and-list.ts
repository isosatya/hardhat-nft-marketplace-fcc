import { ethers, network } from "hardhat"
import { BasicNft } from "../typechain-types/Contracts/test/BasicNft"
import { NftMarketPlace } from "../typechain-types"
import { moveBlocks } from "../utils/move-blocks"

async function mintAndList() {
    const nftMarketPlace: NftMarketPlace = await ethers.getContract("NftMarketPlace")
    const basicNft: BasicNft = await ethers.getContract("BasicNft")

    console.log("Mintingggg.....")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt!.events![0].args!.tokenId

    console.log("Aprovingggg NFT")
    const approvalTx = await basicNft.approve(nftMarketPlace.address, tokenId)
    await approvalTx.wait(1)

    console.log("Listinggggg NFT")
    const PRICE = ethers.utils.parseEther("0.1")
    const tx = await nftMarketPlace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)

    console.log("Listeeeeedddd")

    if (network.config.chainId == 31337) {
        // best for moralis if move one at a time
        await moveBlocks(1, 1000)
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
