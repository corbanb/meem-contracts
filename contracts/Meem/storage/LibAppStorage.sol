// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import {LibMeta} from '../libraries/LibMeta.sol';
import {MeemBase, MeemProperties, Chain} from '../interfaces/MeemStandard.sol';

library LibAppStorage {
	bytes32 constant DIAMOND_STORAGE_POSITION =
		keccak256('meemproject.app.storage');

	struct RoleData {
		mapping(address => bool) members;
		bytes32 adminRole;
	}

	struct AppStorage {
		address proxyRegistryAddress;
		/** AccessControl Role: Admin */
		bytes32 ADMIN_ROLE;
		/** AccessControl Role: Pauser */
		bytes32 PAUSER_ROLE;
		/** AccessControl Role: Minter */
		bytes32 MINTER_ROLE;
		/** AccessControl Role: Upgrader */
		bytes32 UPGRADER_ROLE;
		/** Counter of next incremental token */
		uint256 tokenCounter;
		/** ERC721 Name */
		string name;
		/** ERC721 Symbol */
		string symbol;
		/** Mapping of addresses => all tokens they own */
		mapping(address => uint256[]) ownerTokenIds;
		/** Mapping of addresses => number of tokens owned */
		mapping(address => mapping(uint256 => uint256)) ownerTokenIdIndexes;
		/** Mapping of token to approved address */
		mapping(uint256 => address) approved;
		/** Mapping of address to operators */
		mapping(address => mapping(address => bool)) operators;
		/** Mapping of token => Meem data  */
		mapping(uint256 => MeemBase) meems;
		mapping(uint256 => MeemProperties) meemProperties;
		mapping(uint256 => MeemProperties) meemChildProperties;
		/** The minimum amount that must be allocated to non-owners of a token in splits */
		uint256 nonOwnerSplitAllocationAmount;
		/** The contract URI. Used to describe this NFT collection */
		string contractURI;
		/** The depth allowed for minting of children. If 0, no child copies are allowed. */
		uint256 childDepth;
		/** Mapping of token => URIs for each token */
		mapping(uint256 => string) tokenURIs;
		/** Mapping of token to all children */
		mapping(uint256 => uint256[]) children;
		/** Mapping of token to all decendants */
		mapping(uint256 => uint256[]) decendants;
		/** Keeps track of assigned roles */
		mapping(bytes32 => RoleData) roles;
		/** Mapping from token ID to approved address */
		mapping(uint256 => address) tokenApprovals;
		/** Mapping from owner to operator approvals */
		mapping(address => mapping(address => bool)) operatorApprovals;
		// All tokenIds that have been minted and the corresponding index in allTokens
		uint256[] allTokens;
		// Index of tokenId => allTokens index
		mapping(uint256 => uint256) allTokensIndex;
		// Keep track of whether a tokenId has been minted
		mapping(uint256 => bool) mintedTokens;
		// Keep track of tokens that have already been wrapped
		mapping(Chain => mapping(address => mapping(uint256 => uint256))) chainWrappedNFTs;
		// Mapping of (parent) tokenId to owners and the child tokenIds they own
		mapping(uint256 => mapping(address => uint256[])) childrenOwnerTokens;
		// Keep track of original Meems
		uint256[] originalMeemTokens;
		// Index of tokenId => allTokens index
		mapping(uint256 => uint256) originalMeemTokensIndex;
	}

	function diamondStorage() internal pure returns (AppStorage storage ds) {
		bytes32 position = DIAMOND_STORAGE_POSITION;
		assembly {
			ds.slot := position
		}
	}
}
