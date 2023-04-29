import { network } from "hardhat"
import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains } from "../helper-hardhat-config"
import { verify } from "../utils/verify"
import { NftMarketPlace } from "../typechain-types/Contracts/NftMarketPlace"

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const args: string[] = []
    const nftMarketPlace: NftMarketPlace = await deploy("NftMarketPlace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: VERIFICATION_BLOCK_CONFIRMATIONS || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying....")
        await verify(nftMarketPlace.address, args)
    }
}

module.exports.tags = ["all", "nftmarketplace", "main"]
