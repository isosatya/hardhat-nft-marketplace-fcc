import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { BasicNft, NftMarketPlace } from "../../typechain-types"
import { assert, expect } from "chai"
import "@nomiclabs/hardhat-ethers"
import "hardhat-deploy"
import { Address } from "hardhat-deploy/dist/types"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Tests", () => {
          let basicNft: BasicNft,
              deployerAddress: Address,
              nftmarketplace: NftMarketPlace,
              user,
              accounts,
              deployer,
              playerConnectedNftMarketplace: NftMarketPlace,
              error

          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async function () {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployer = accounts[0]
              user = accounts[1]

              await deployments.fixture(["all"])

              nftmarketplace = await ethers.getContract("NftMarketPlace")
              basicNft = await ethers.getContract("BasicNft")

              const mint = await basicNft.mintNft()
              await mint.wait(1)
              await basicNft.approve(nftmarketplace.address, TOKEN_ID)
          })

          describe("list item", () => {
              xit("it emits an even after listing an item", async () => {
                  expect(await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  )
              })

              xit("already listed items cant be listed", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftmarketplace.getListing(basicNft.address, TOKEN_ID)

                  console.log("already listed items cant be listed")
                  console.log("listing.price.toString()", listing.price.toString())
                  console.log("PRICE.toString()", PRICE.toString())

                  await expect(
                      nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketPlace__AlreadyListed")
              })

              xit("exclusively allows owners to list", async function () {
                  playerConnectedNftMarketplace = nftmarketplace.connect(user)
                  await expect(
                      playerConnectedNftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketPlace__NotOwner")
              })

              xit("needs approvals to list item", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketPlace__NotApprovedForMarketplace")
              })

              xit("Updates listing with seller and price", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftmarketplace.getListing(basicNft.address, TOKEN_ID)

                  console.log("Updates listing with seller and price")
                  console.log("listing.price.toString()", listing.price.toString())
                  console.log("PRICE.toString()", PRICE.toString())

                  assert(listing.price.toString() == PRICE.toString())
                  assert(listing.seller.toString() == deployer.address)
              })

              xit("reverts if the price be 0", async () => {
                  const zeroPrice = ethers.utils.parseEther("0")
                  await expect(
                      nftmarketplace.listItem(basicNft.address, TOKEN_ID, zeroPrice)
                  ).to.be.revertedWith("NftMarketPlace__PriceMustBeAboveZero")
              })
          })

          describe("cancelListing", function () {
              xit("reverts if there is no listing", async function () {
                  await expect(
                      nftmarketplace.cancelItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketPlace__NotListed")
              })

              xit("reverts if anyone but the owner tries to call", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  playerConnectedNftMarketplace = nftmarketplace.connect(user)
                  await expect(
                      playerConnectedNftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketPlace__NotOwner")
              })

              xit("emits event and removes listing", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftmarketplace.cancelItem(basicNft.address, TOKEN_ID)).to.emit(
                      "ItemCancelled"
                  )

                  const listing = await nftmarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == "0")
              })
          })

          describe("buyItem", function () {
              xit("reverts if the item isnt listed", async function () {
                  await expect(
                      nftmarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.be.revertedWith("NftMarketPlace__NotListed")
              })

              xit("reverts if the price isnt met", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  const LOW_PRICE = ethers.utils.parseEther("0.01")

                  await expect(
                      nftmarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: LOW_PRICE,
                      })
                  ).to.be.revertedWith("NftMarketPlace__PriceNotMet")
              })

              xit("transfers the nft to the buyer and updates internal proceeds record", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  playerConnectedNftMarketplace = nftmarketplace.connect(user)
                  expect(
                      await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit("ItemBought")

                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftmarketplace.getProceeds(deployer.address)

                  assert(newOwner.toString() == user.address)
                  assert(deployerProceeds.toString() == PRICE.toString())
              })
          })

          describe("updateListing", function () {
              xit("must be owner and listed", async function () {
                  await expect(
                      nftmarketplace.updateListing(basicNft.address, TOKEN_ID, NEW_PRICE)
                  ).to.be.revertedWith("NftMarketPlace__NotListed")

                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  playerConnectedNftMarketplace = nftmarketplace.connect(user)
                  const NEW_PRICE = ethers.utils.parseEther("0.11")

                  await expect(
                      playerConnectedNftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          NEW_PRICE
                      )
                  ).to.be.revertedWith("NftMarketPlace__NotOwner")
              })

              xit("reverts if new price is 0", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  const NEW_PRICE = ethers.utils.parseEther("0")

                  await expect(
                      nftmarketplace.updateListing(basicNft.address, TOKEN_ID, NEW_PRICE)
                  ).to.be.revertedWith("NftMarketPlace__PriceMustBeAboveZero")
              })

              xit("updates the price of the item", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  const NEW_PRICE = ethers.utils.parseEther("0.11")
                  await nftmarketplace.updateListing(basicNft.address, TOKEN_ID, NEW_PRICE)
                  const listing = await nftmarketplace.getListing(basicNft.address, TOKEN_ID)

                  assert(listing.price.toString() == NEW_PRICE.toString())
              })
          })

          describe("withdrawProceeds", function () {
              xit("doesn't allow 0 proceed withdrawls", async function () {
                  await expect(nftmarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketPlace__NoProceeds"
                  )
              })

              it("withdraws proceeds", async function () {
                  await nftmarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  playerConnectedNftMarketplace = nftmarketplace.connect(user)
                  expect(
                      await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit("ItemBought")
                  const deployerProceedsBefore = await nftmarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()

                  const txWithdraw = await nftmarketplace.withdrawProceeds()
                  const txReceipt = await txWithdraw.wait(1)

                  const deployerProceedsAfter = await nftmarketplace.getProceeds(deployer.address)
                  assert(deployerProceedsAfter.toString(), "0")

                  const deployerBalanceAfter = await deployer.getBalance()

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  assert(
                      deployerBalanceBefore.add(deployerProceedsBefore).toString() ==
                          deployerBalanceAfter.add(gasCost).toString()
                  )
              })
          })
      })
