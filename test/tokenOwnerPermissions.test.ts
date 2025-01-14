import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'hardhat'
import { deployDiamond } from '../tasks'
import {
	MeemPermissionsFacet,
	MeemBaseFacet,
	MeemQueryFacet
} from '../typechain'
import { meemMintData } from './helpers/meemProperties'
import { Chain, PermissionType } from './helpers/meemStandard'
import { zeroAddress } from './helpers/utils'

chai.use(chaiAsPromised)

describe('Token Owner Permissions', function Test() {
	let meemPermissionsFacet: MeemPermissionsFacet
	let meemFacet: MeemBaseFacet
	let queryFacet: MeemQueryFacet
	let signers: SignerWithAddress[]

	const token0 = 100000

	before(async () => {
		signers = await ethers.getSigners()
		console.log({ signers })
		const { DiamondProxy: DiamondAddress } = await deployDiamond({
			ethers
		})

		meemPermissionsFacet = (await ethers.getContractAt(
			'MeemPermissionsFacet',
			DiamondAddress
		)) as MeemPermissionsFacet

		meemFacet = (await ethers.getContractAt(
			'MeemBaseFacet',
			DiamondAddress
		)) as MeemBaseFacet

		queryFacet = (await ethers.getContractAt(
			'MeemQueryFacet',
			DiamondAddress
		)) as MeemQueryFacet

		const { status } = await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: signers[1].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: zeroAddress,
					parentTokenId: 0,
					rootChain: Chain.Polygon,
					root: zeroAddress,
					rootTokenId: 0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()
		assert.equal(status, 1)
	})

	it('Can set total children as owner', async () => {
		const { status } = await (
			await meemPermissionsFacet
				.connect(signers[1])
				.setTotalChildren(token0, 5000)
		).wait()
		assert.equal(status, 1)

		const meem = await queryFacet.connect(signers[1]).getMeem(token0)
		console.log({ meem })
		assert.equal(meem.properties.totalChildren.toNumber(), 5000)
	})

	it('Can not set total children as non-owner', async () => {
		await assert.isRejected(
			meemPermissionsFacet.connect(signers[2]).setTotalChildren(token0, 5000)
		)
	})

	it('Can lock total children as owner', async () => {
		const { status } = await (
			await meemPermissionsFacet.connect(signers[1]).lockTotalChildren(token0)
		).wait()
		assert.equal(status, 1)

		await assert.isRejected(
			meemPermissionsFacet.connect(signers[1]).setTotalChildren(token0, 5000)
		)
	})

	it('Can set total children per wallet as owner', async () => {
		const { status } = await (
			await meemPermissionsFacet
				.connect(signers[1])
				.setChildrenPerWallet(token0, 1)
		).wait()
		assert.equal(status, 1)

		const meem = await queryFacet.connect(signers[1]).getMeem(token0)
		console.log({ meem })
		assert.equal(meem.properties.totalChildren.toNumber(), 5000)
	})

	it('Can not set total children per wallet as non-owner', async () => {
		await assert.isRejected(
			meemPermissionsFacet
				.connect(signers[2])
				.setChildrenPerWallet(token0, 5000)
		)
	})

	it('Can lock total children per wallet as owner', async () => {
		const { status } = await (
			await meemPermissionsFacet
				.connect(signers[1])
				.lockChildrenPerWallet(token0)
		).wait()
		assert.equal(status, 1)

		await assert.isRejected(
			meemPermissionsFacet
				.connect(signers[1])
				.setChildrenPerWallet(token0, 5000)
		)
	})
})
