const { expect } = require('chai')
const { ethers } = require("hardhat");

/**
 * @title UC2 test
 * @dev NFT with an external name database contract.
 *
 * Authors: s.imo
 * Created: 01.07.2021
 */
describe('UC2: NFT with an external contract for naming', () => {
    let NCT, nct, NFT, nft, DB, db, owner, addr1, addr2, addr3;

    beforeEach(async () => {

    });

    describe('deployement', () => {
        it('setup', async () => {
            NCT = await ethers.getContractFactory("NCT");
            nct = await NCT.deploy(ethers.utils.parseUnits("10000.0", "18"));

            NFT = await ethers.getContractFactory("NFT");
            nft = await NFT.deploy();

            DB  = await ethers.getContractFactory("UC2");
            db  = await DB.deploy(nft.address, nct.address);

            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            // console.debug("NCT address: " + await nct.address);
        });

        it('should assign all the NCT supply to the owner', async () => {
            expect(await nct.totalSupply()).to.equal(await nct.balanceOf(owner.address));
            // console.debug("owner: " + await nct.balanceOf(owner.address));
            // console.debug("addr1: " + await nct.balanceOf(addr1.address));
        });

        it('transfer some NCT to others wallet', async () => {
            numTokens = ethers.utils.parseUnits("2500.0", "18");

            await nct.connect(owner).transfer(addr1.address, numTokens);
            await nct.connect(owner).transfer(addr2.address, numTokens);

            // console.debug("owner: " + await nct.balanceOf(owner.address));
            // console.debug("addr1: " + await nct.balanceOf(addr1.address));
            // console.debug("addr2: " + await nct.balanceOf(addr2.address));

            expect(await nct.balanceOf(addr1.address)).to.equal(numTokens);
            expect(await nct.balanceOf(addr2.address)).to.equal(numTokens);
        });
    });


    describe('minting', () => {
        it('mint 1 token for each address', async () => {
            await nft.connect(owner).mintNFT(1, { value: ethers.utils.parseEther("0.1") });
            await nft.connect(addr1).mintNFT(1, { value: ethers.utils.parseEther("0.1") });
            await nft.connect(addr2).mintNFT(1, { value: ethers.utils.parseEther("0.1") });

            expect(await nft.ownerOf(0)).to.equal(owner.address);
            expect(await nft.ownerOf(1)).to.equal(addr1.address);
            expect(await nft.ownerOf(2)).to.equal(addr2.address);

        });

        it('mint 10 token for addr1', async () => {
            await nft.connect(addr1).mintNFT(10, { value: ethers.utils.parseEther("1") });

            let k = await nft.totalSupply();
            for (let i = 1; i <= 10; i++) {
                expect(await nft.ownerOf(k - i)).to.equal(addr1.address);
            }
        });

        it('mint all remaining tokens', async () => {
            let minters = [addr1, addr2, addr3];
            let maxNfts = await nft.MAX_NFT_SUPPLY();

            for(j = 0;; j++){
                let numNfts = await nft.totalSupply();

                let k = Math.min(20, maxNfts - numNfts);
                if(k <= 0) break;

                let price = k * 0.1;
                await nft.connect(minters[j % 3]).mintNFT(k, {value: ethers.utils.parseEther(price.toString())});
            }

            expect(await nft.totalSupply()).to.equal(maxNfts);

        }).timeout(40000); // NOTE: we are minting all the tokens, can be time consuming
    });

    describe('changing name', () => {
        it('owner change name of a NFT token', async () => {
            // console.log("NCT address: " + nct.address)
            // console.log("OWN address: " + owner.address)
            // console.log("NCT balance: " + await nct.connect(owner).balanceOf(owner.address))

            await nct.connect(owner).increaseAllowance(db.address, ethers.utils.parseUnits("10.0", "18"));
            await db.connect(owner).changeName("0", "hello world");

        });

        it('only the owner can change name of a NFT token', async () => {

            await expect(
                db.connect(addr1).changeName("0", "hello world")
            ).to.be.revertedWith("Caller is not the owner");

        });

        it('no duplicated names', async () => {

            await nct.connect(addr1).increaseAllowance(nft.address, ethers.utils.parseUnits("10", "18"));

            await expect(
                db.connect(addr1).changeName("1", "hello world")
            ).to.be.revertedWith("Name already reserved");

        });


    });

});