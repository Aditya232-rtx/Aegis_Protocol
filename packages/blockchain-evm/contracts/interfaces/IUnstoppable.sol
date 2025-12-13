// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUnstoppable {
    struct RiskParams {
        uint256 ltv;              // Loan-to-Value (e.g., 75 = 75%)
        uint256 liquidationPenalty; // e.g., 10 = 10%
        uint256 gracePeriod;      // In seconds
    }

    function getRiskParameters(address user) external view returns (RiskParams memory);
    function reverseNameOf(address user) external view returns (string memory);
}
