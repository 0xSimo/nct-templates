const { expect } = require('chai')
const { ethers } = require("hardhat");

/**
 * @title NFT test
 * @dev Simple basic tests for the contract of a simple NFT without name.
 *
 * Authors: s.imo
 * Created: 01.07.2021
 */
describe('NFT contract', () => {
    let NFT, nft, owner, addr1, addr2, addr3;

    beforeEach(async () => {

    });

    describe('deployement', () => {
        it('setup', async () => {
            NFT = await ethers.getContractFactory("NFT");
            nft = await NFT.deploy();

            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            // console.debug("NFT address: " + await nft.address);
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

    describe('transfer', () => {
        it('owner transfer 1 token', async () => {
            await nft.connect(owner).transferFrom(owner.address, addr1.address, 0);
        });

        it('not owner transfer 1 token', async () => {
            await expect(
                nft.connect(addr2).transferFrom(owner.address, addr1.address, 0)
            ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
        });

        it('not owner transfer 1 token with approval', async () => {
            await nft.connect(addr1).approve(addr2.address, 0);
            await nft.connect(addr2).transferFrom(addr1.address, addr2.address, 0)
        });

    });


});