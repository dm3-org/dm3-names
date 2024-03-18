// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {EVMFetcher} from '@ensdomains/evm-verifier/contracts/EVMFetcher.sol';
import {EVMFetchTarget} from '@ensdomains/evm-verifier/contracts/EVMFetchTarget.sol';
import {BytesUtils} from '@ensdomains/ens-contracts/contracts/dnssec-oracle/BytesUtils.sol';
import {IAddrResolver} from '@ensdomains/ens-contracts/contracts/resolvers/profiles/IAddrResolver.sol';
import {ITextResolver} from '@ensdomains/ens-contracts/contracts/resolvers/profiles/ITextResolver.sol';
import {INameResolver} from '@ensdomains/ens-contracts/contracts/resolvers/profiles/INameResolver.sol';
import {IEVMVerifier} from '@ensdomains/evm-verifier/contracts/IEVMVerifier.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './strings.sol';

contract Dm3NameRegistrarEVMFetcher is EVMFetchTarget, Ownable {
    using EVMFetcher for EVMFetcher.EVMFetchRequest;
    using BytesUtils for bytes;
    using strings for *;

    IEVMVerifier public verifier;
    address public target;
    string public parentDomain;

    uint256 private constant RECORD_VERSIONS_SLOT = 1;
    uint256 private constant PARENT_NODE_SLOT = 2;
    uint256 private constant OWNER_SLOT = 3;
    uint256 private constant REVERSE_SLOT = 4;
    uint256 private constant TEXTS_SLOT = 5;

    error UnknownSelector();

    /**
     * @notice Creates a new Dm3NameRegistrarEVMFetcher contract. Tha can be used to fetch data from the Dm3NameRegistrar contract using CCIP.
     * @param _verifier The EVM Verifier to be used by this contract.
     * @param _target The target address to be used by this contract.
     * @param _parentDomain The parent domain to be used by this contract.
     */
    constructor(
        IEVMVerifier _verifier,
        address _target,
        string memory _parentDomain
    ) {
        verifier = _verifier;
        target = _target;
        parentDomain = _parentDomain;
    }
    /**
     * @notice Sets the EVM Verifier.
     * @dev Can only be called by the contract owner.
     * @param _verifier The new EVM Verifier.
     */
    function setVerifier(IEVMVerifier _verifier) external onlyOwner {
        verifier = _verifier;
    }
    /**
     * @notice Sets the target address.
     * @dev Can only be called by the contract owner.
     * @param _target The new target address.
     */
    function setTarget(address _target) external onlyOwner {
        target = _target;
    }

    /**
     * @notice Sets the parent domain.
     * @dev Can only be called by the contract owner.
     * @param _parentDomain The new parent domain.
     */
    function setParentDomain(string memory _parentDomain) external onlyOwner {
        parentDomain = _parentDomain;
    }
    /**
     * @notice Resolves the given name and data.
     * @param data The data to resolve.
     * @return result The result of the resolution.
     */
    function resolve(
        bytes calldata,
        bytes calldata data
    ) external view returns (bytes memory result) {
        bytes4 selector = bytes4(data);

        if (selector == INameResolver.name.selector) {
            bytes32 node = abi.decode(data[4:], (bytes32));
            return _name(node);
        }
        if (selector == ITextResolver.text.selector) {
            (bytes32 node, string memory key) = abi.decode(
                data[4:],
                (bytes32, string)
            );
            return bytes(_text(node, key));
        }
        if (selector == IAddrResolver.addr.selector) {
            bytes32 node = abi.decode(data[4:], (bytes32));
            return _addr(node);
        }
        //Revert if the selector is unknown
        revert UnknownSelector();
    }
    /**
     * @notice Resolves the address for the given node.
     * @param node The node to resolve the address for.
     */
    function _addr(bytes32 node) private view returns (bytes memory) {
        EVMFetcher
            .newFetchRequest(verifier, target)
            .getStatic(OWNER_SLOT)
            .element(node)
            .fetch(this.addrCallback.selector, '');
    }
    /**
     * @notice Resolves the name for the given node.
     * @param node The node to resolve the name for.
     */
    function _name(bytes32 node) private view returns (bytes memory) {
        EVMFetcher
            .newFetchRequest(verifier, target)
            .getStatic(PARENT_NODE_SLOT)
            .getDynamic(REVERSE_SLOT)
            .element(node)
            .fetch(this.nameCallback.selector, '');
    }

    /**
     * @notice Resolves the text for the given node and key.
     * @param node The node to resolve the text for.
     * @param key The key to resolve the text for.
     */
    function _text(
        bytes32 node,
        string memory key
    ) private view returns (bytes memory) {
        EVMFetcher
            .newFetchRequest(verifier, target)
            .getStatic(RECORD_VERSIONS_SLOT)
            .element(node)
            .getDynamic(TEXTS_SLOT)
            .ref(0)
            .element(node)
            .element(key)
            .fetch(this.textCallback.selector, '');
    }
    /**
     * @notice Callback function for text resolution.
     * @param values The values to encode.
     * @return The value of the text record abi encoded.
     */
    function textCallback(
        bytes[] memory values,
        bytes memory
    ) public pure returns (bytes memory) {
        return abi.encode(string(values[1]));
    }
    /**
     * @notice Callback function for name resolution.
     * @param values The values to encode.
     * @return The name registered with the parent domain abi encoded.
     */
    function nameCallback(
        bytes[] memory values,
        bytes memory
    ) public view returns (bytes memory) {
        strings.slice[] memory s = new strings.slice[](3);
        //The label i.e alice
        s[0] = string(values[1]).toSlice();
        //Separator
        s[1] = '.'.toSlice();
        //The parent domain i.e example.com
        s[2] = parentDomain.toSlice();
        return abi.encode(''.toSlice().join(s));
    }
    /**
     * @notice Callback function for address resolution.
     * @param values The values to encode.
     */
    function addrCallback(
        bytes[] memory values,
        bytes memory
    ) public pure returns (bytes memory) {
        return abi.encode(address(uint160(uint256(bytes32(values[0])))));
    }
}
