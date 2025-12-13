// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAegisOracle
 * @notice Interface for the Aegis Price and Risk Oracle.
 * Aggregates data for the FSM and Lens logic.
 */
interface IAegisOracle {
    /**
     * @notice Returns the latest price of a token in USD (18 decimals).
     * @param token The address of the token (e.g., WETH).
     */
    function getLatestPrice(address token) external view returns (uint256);

    /**
     * @notice Returns the latest gathered system volatility / risk score.
     * Used by the Sentinel to justify transitions.
     */
    function getRiskScore() external view returns (uint256);
}
