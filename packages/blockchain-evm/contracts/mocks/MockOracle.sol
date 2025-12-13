// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAegisOracle.sol";

contract MockOracle is IAegisOracle {
    uint256 public price = 2500 * 1e18; // $2500
    uint256 public risk = 0;

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function setRisk(uint256 _risk) external {
        risk = _risk;
    }

    function getLatestPrice(address /* token */) external view override returns (uint256) {
        return price;
    }

    function getRiskScore() external view override returns (uint256) {
        return risk;
    }
}
