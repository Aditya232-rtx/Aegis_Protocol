// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICoWSwap {
    function placeOrder(address tokenSell, uint256 amount) external returns (bool);
}
