import { network } from "hardhat"

export const sleep = function (timeMins: number) {
    return new Promise((resolve) => setTimeout(resolve, timeMins))
}

export const moveBlocks = async function (amount: number, sleepAmount?: number) {
    console.log("Moving blocks...")
    for (let index = 0; index < amount; index++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        })
        if (sleepAmount) {
            console.log(`Sleeping for ${sleepAmount}`)
            // sleepAmount --> in miliseconds
            await sleep(sleepAmount)
        }
    }
}
