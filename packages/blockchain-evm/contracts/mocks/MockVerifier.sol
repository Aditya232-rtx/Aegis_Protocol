// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IVerifier.sol";

contract MockVerifier is IVerifier {
    function verify(bytes memory /* proof */, bytes32 /* inputHash */) external pure override returns (bool) {
        return true;
    }
}
