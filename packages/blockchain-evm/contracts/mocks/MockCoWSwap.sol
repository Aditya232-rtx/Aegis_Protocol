// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ICoWSwap.sol";

contract MockCoWSwap is ICoWSwap {
    event OrderPlaced(address indexed tokenSell, uint256 amount);

    function placeOrder(address tokenSell, uint256 amount) external override returns (bool) {
        emit OrderPlaced(tokenSell, amount);
        return true;
    }
}
