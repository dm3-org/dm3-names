// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IAddrResolver} from '@ensdomains/ens-contracts/contracts/resolvers/profiles/IAddrResolver.sol';
import {INameResolver} from '@ensdomains/ens-contracts/contracts/resolvers/profiles/INameResolver.sol';
import {ITextResolver} from '@ensdomains/ens-contracts/contracts/resolvers/profiles/ITextResolver.sol';
import {ResolverBase} from '@ensdomains/ens-contracts/contracts/resolvers/ResolverBase.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/// @title Dm3NameRegistrar
/// @notice This contract is used for registering names in the ENS system. It is a combination of ENSResolver and ReverseRegistrar contracts. Allowing to register names and set text records for each name. By beeing compatible with ENSResolver and ReverseRegistrar

contract Dm3NameRegistrar is
    Initializable,
    Ownable,
    ResolverBase,
    IAddrResolver,
    INameResolver,
    ITextResolver
{
    //Lookup table for hexadecimal conversion
    //Taken from ENS ReverseRegistrar contract
    //https://github.com/ensdomains/ens-contracts/blob/21736916300b26cb8ea1802dbf6c9ff054adaeab/contracts/reverseRegistrar/ReverseRegistrar.sol#L12
    bytes32 private constant lookup =
        0x3031323334353637383961626364656600000000000000000000000000000000;

    // Constant for reverse node address
    //Taken from ENS ReverseRegistrar contract
    //https://github.com/ensdomains/ens-contracts/blob/21736916300b26cb8ea1802dbf6c9ff054adaeab/contracts/reverseRegistrar/ReverseRegistrar.sol#L12
    bytes32 private constant ADDR_REVERSE_NODE =
        0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

    //Node of the L1 domain. in case of OP name that would be namehash(op.dm3.eth)
    //Is not immutable so it can be retrieved from the storage using CCIP
    bytes32 public PARENT_NODE;

    // Mapping to store the owner of each node
    mapping(bytes32 => address) public owner;

    // Mapping to store the reverse record of each node
    mapping(bytes32 => string) public reverse;

    // Mapping to store text records for each node
    mapping(uint64 => mapping(bytes32 => mapping(string => string)))
        public texts;

    // Event emitted when a name is registered
    event NameRegistered(address indexed addr, string indexed name);

    // Event emitted when a name is removed
    event NameRemoved(address indexed addr, string indexed name);

    constructor() Ownable(msg.sender) {}

    function initialize(bytes32 _parentNode) public initializer {
        PARENT_NODE = _parentNode;
    }
    function isAuthorised(bytes32 node) internal view override returns (bool) {
        return owner[node] == msg.sender;
    }

    /// @notice Register a name in the ENS system
    /// @param _name The name to register
    function register(string calldata _name) external {
        string memory oldName = reverse[makeReverseNode(msg.sender)];
        //Delete name
        if (bytes(_name).length == 0) {
            //clear text records
            clearRecords(makeLabelNode(oldName));
            // Clear name if the new name is empty
            delete owner[makeLabelNode(oldName)];
            delete reverse[makeReverseNode(msg.sender)];
            emit NameRemoved(msg.sender, oldName);
            return;
        }
        //Check if the name is already registered. If so, revert
        require(
            owner[makeLabelNode(_name)] == address(0),
            'Name already registered'
        );
        //Select new name
        if (bytes(oldName).length > 0) {
            //clear text records
            clearRecords(makeLabelNode(oldName));
            // Clear old name if it exists
            delete owner[makeLabelNode(oldName)];
            emit NameRemoved(msg.sender, oldName);
        }
        _mint(_name, msg.sender);
    }

    /// @notice Allows the contract owner to mint a new name
    /// @dev This function can only be called by the contract owner
    /// @param _name The name to be minted
    /// @param _owner The address that will own the minted name
    function ownerRegister(
        string calldata _name,
        address _owner
    ) external onlyOwner {
        //Even the owner can't mint a name that is already registered
        require(
            owner[makeLabelNode(_name)] == address(0),
            'Name already registered'
        );
        _mint(_name, _owner);
    }

    /// @notice Set text for a node
    /// @param node The node to set the text for
    /// @param key The key for the text
    /// @param value The text to set
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external {
        address _owner = owner[node];
        require(_owner != address(0), 'Name not registered');
        require(_owner == msg.sender, 'Only owner');
        texts[recordVersions[node]][node][key] = value;
        //  emit TextChanged(node, key, key, value);
    }
    /// @notice Get the address of a node
    /// @param node The node to get the address for
    /// @return The address of the node
    function addr(bytes32 node) external view returns (address payable) {
        return payable(owner[node]);
    }

    /// @notice Get the name of a node
    /// @param node The node to get the name for
    /// @return The name of the node
    function name(bytes32 node) external view returns (string memory) {
        return reverse[node];
    }

    /// @notice Get the text of a node
    /// @param node The node to get the text for
    /// @param key The key for the text
    /// @return The text of the node
    function text(
        bytes32 node,
        string calldata key
    ) external view override returns (string memory) {
        return texts[recordVersions[node]][node][key];
    }
    function _mint(string calldata _name, address _owner) internal {
        //set owner record
        owner[makeLabelNode(_name)] = _owner;
        //set reverse record
        reverse[makeReverseNode(_owner)] = _name;
        //emit NameRegistered event
        emit NameRegistered(_owner, _name);
    }

    /// @notice Make a label node using the PARENT_NODE
    /// @param label The label to make a node for
    /// @return The node of the label
    function makeLabelNode(string memory label) private view returns (bytes32) {
        return
            keccak256(abi.encodePacked(PARENT_NODE, keccak256(bytes(label))));
    }
    /// @notice Make a label node used for the reverse record using the ADDR_REVERSE_NODE
    function makeReverseNode(address _addr) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(ADDR_REVERSE_NODE, sha3HexAddress(_addr))
            );
    }

    /// @notice Convert an address to a hexadecimal string and hash it
    /// @param _addr The address to convert and hash
    /// @dev taken from ENS ReverseRegistrar contract
    /// @dev https://github.com/ensdomains/ens-contracts/blob/21736916300b26cb8ea1802dbf6c9ff054adaeab/contracts/reverseRegistrar/ReverseRegistrar.sol#L164
    function sha3HexAddress(address _addr) private pure returns (bytes32 ret) {
        assembly {
            for {
                let i := 40
            } gt(i, 0) {

            } {
                i := sub(i, 1)
                mstore8(i, byte(and(_addr, 0xf), lookup))
                _addr := div(_addr, 0x10)
                i := sub(i, 1)
                mstore8(i, byte(and(_addr, 0xf), lookup))
                _addr := div(_addr, 0x10)
            }

            ret := keccak256(0, 40)
        }
    }
}
