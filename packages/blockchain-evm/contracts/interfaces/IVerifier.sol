// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verify(bytes memory proof, bytes32 inputHash) external returns (bool);
}
