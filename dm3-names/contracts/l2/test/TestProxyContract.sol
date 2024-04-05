pragma solidity 0.8.25;

import {Dm3NameRegistrar} from '../Dm3NameRegistrar.sol';

contract TestProxyContract is Dm3NameRegistrar {
    function parentNode() external view returns (bytes32) {
        return PARENT_NODE;
    }
}
