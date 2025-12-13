// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IUnstoppable.sol";
import "../interfaces/IAegisOracle.sol";
import "./AegisPool.sol";

/**
 * @title AegisLens
 * @notice Pure View Logic for the Frontend "Cockpit".
 */
contract AegisLens {
    IUnstoppable public identityRegistry;
    IAegisOracle public oracle;
    
    constructor(address _identityRegistry, address _oracle) {
        identityRegistry = IUnstoppable(_identityRegistry);
        oracle = IAegisOracle(_oracle);
    }

    struct UserAccountData {
        uint256 totalCollateralUSD;
        uint256 totalDebtUSD;
        uint256 availableBorrowsUSD;
        uint256 currentLiquidationThreshold;
        uint256 ltv;
        uint256 healthFactor;
        uint256 liquidationPrice;
    }

    /**
     * @notice Convenience function to fetch balances and calculate risk in one call.
     */
    function getUserPosition(address pool, address user) external view returns (UserAccountData memory) {
        // Fetch balances from Pool
        uint256 col = AegisPool(pool).userCollateralETH(user);
        uint256 debt = AegisPool(pool).userDebtUSDC(user);
        
        // Delegate to calculation logic
        return getUserAccountData(user, col, debt);
    }

    /**
     * @notice Calculates the complete risk profile for a user given their balances.
     * @param user The user address (to check Badge/Risk Params)
     * @param collateralETH Amount of ETH collateral (wei)
     * @param debtUSDC Amount of USDC debt (18 decimals)
     */
    function getUserAccountData(
        address user, 
        uint256 collateralETH, 
        uint256 debtUSDC
    ) public view returns (UserAccountData memory) {
        
        // 1. Get Risk Parameters based on Badge (Whale, Ancient One, etc.)
        IUnstoppable.RiskParams memory params = identityRegistry.getRiskParameters(user);

        // 2. Value Calculation
        uint256 price = oracle.getLatestPrice(address(0));
        uint256 collateralValue = (collateralETH * price) / 1e18; // USD value 18 decimals
        uint256 debtValue = debtUSDC;

        // 3. Thresholds
        // LTV is in %, e.g. 80.
        uint256 maxBorrow = (collateralValue * params.ltv) / 100;
        
        uint256 available = 0;
        if (maxBorrow > debtValue) {
            available = maxBorrow - debtValue;
        }

        // 4. Health Factor
        // HF = (Collateral * LTV) / Debt
        // If Debt is 0, HF is max
        uint256 hf = type(uint256).max;
        if (debtValue > 0) {
            hf = (collateralValue * params.ltv * 1e18) / (debtValue * 100); 
            // Note: multiplied by 1e18 for precision, divided by 100 for percentage
        }

        // 5. Liquidation Price
        // Price where Collateral * LTV = Debt
        // Debt = (CollateralAmount * Price * LTV) / 100
        // Price = (Debt * 100) / (CollateralAmount * LTV)
        uint256 liqPrice = 0;
        if (collateralETH > 0 && params.ltv > 0) {
            liqPrice = (debtValue * 100 * 1e18) / (collateralETH * params.ltv);
        }

        return UserAccountData({
            totalCollateralUSD: collateralValue,
            totalDebtUSD: debtValue,
            availableBorrowsUSD: available,
            currentLiquidationThreshold: params.ltv,
            ltv: params.ltv,
            healthFactor: hf,
            liquidationPrice: liqPrice
        });
    }
}
