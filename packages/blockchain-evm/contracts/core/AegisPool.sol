// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AegisCore.sol";
import "./BackstopPool.sol";
import "../interfaces/IUnstoppable.sol";
import "../interfaces/IAegisOracle.sol";

/**
 * @title AegisPool
 * @notice The "Casino". User-facing lending pool.
 * Handles Deposits (ETH) and Borrows (USDC).
 * Enforces Risk Logic defined by AegisCore and IdentityRegistry.
 */
contract AegisPool is ReentrancyGuard {
    AegisCore public aegisCore;
    IERC20 public usdcToken;
    IUnstoppable public identityRegistry;
    IAegisOracle public oracle;

    // User State
    mapping(address => uint256) public userCollateralETH;
    mapping(address => uint256) public userDebtUSDC;
    mapping(address => uint256) public probationStart;
    
    // LP State
    mapping(address => uint256) public liquidityProviderBalance;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event ProvideLiquidity(address indexed provider, uint256 amount);
    event WithdrawLiquidity(address indexed provider, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);
    event ProbationStarted(address indexed user, uint256 timestamp);

    constructor(
        address _aegisCore,
        address _usdcToken,
        address _identityRegistry,
        address _oracle
    ) {
        aegisCore = AegisCore(_aegisCore);
        usdcToken = IERC20(_usdcToken);
        identityRegistry = IUnstoppable(_identityRegistry);
        oracle = IAegisOracle(_oracle);
    }

    // --- User Actions ---

    /**
     * @notice Deposit ETH as collateral.
     */
    function depositETH() external payable nonReentrant {
        require(msg.value > 0, "Amount must be > 0");
        userCollateralETH[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw ETH collateral.
     * Checks health factor after withdrawal.
     */
    function withdrawETH(uint256 amount) external nonReentrant {
        require(userCollateralETH[msg.sender] >= amount, "Insufficient balance");
        
        userCollateralETH[msg.sender] -= amount;

        // Health Check
        _validateHealth(msg.sender);

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice Borrow USDC against ETH collateral.
     * BLOCKED if RiskState is YELLOW or RED.
     */
    function borrowUSDC(uint256 amount) external nonReentrant {
        // 1. Check Protocol State
        AegisCore.RiskState state = aegisCore.currentState();
        require(state == AegisCore.RiskState.GREEN, "Protocol in Risk Mode: Borrowing Paused");

        // 2. Accounting
        userDebtUSDC[msg.sender] += amount;

        // 3. Health Check
        _validateHealth(msg.sender);

        // 4. Transfer
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Borrow(msg.sender, amount);
    }

    /**
     * @notice Repay USDC debt.
     */
    function repayUSDC(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(userDebtUSDC[msg.sender] >= amount, "Overpayment");

        // Transfer From User
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Transfer From failed");

        userDebtUSDC[msg.sender] -= amount;
        
        emit Repay(msg.sender, amount);
    }

    // --- LP Actions ---
    function provideLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed"); // Provide Liquidty Transfer
        liquidityProviderBalance[msg.sender] += amount; // Update Balance
        emit ProvideLiquidity(msg.sender, amount); // Emit Event
    }

    function withdrawLiquidity(uint256 amount) external nonReentrant {
        require(liquidityProviderBalance[msg.sender] >= amount, "Insufficient LP balance");
        // Ensure pool has liquidity (might be borrowed out)
        uint256 available = usdcToken.balanceOf(address(this));
        require(available >= amount, "Pool utilization too high");
        
        liquidityProviderBalance[msg.sender] -= amount;
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        emit WithdrawLiquidity(msg.sender, amount);
    }

    /**
     * @notice Standard Liquidation Function (Green/Yellow Modes).
     * @param user The borrower address.
     * @param debtToCover Amount of USDC debt to repay.
     */
    function liquidate(address user, uint256 debtToCover) external nonReentrant {
        // 1. State Checks
        AegisCore.RiskState state = aegisCore.currentState();
        require(state != AegisCore.RiskState.RED, "Red Mode: Use Sponge");

        uint256 debt = userDebtUSDC[user];
        require(debtToCover <= debt, "Amount exceeds debt");
        require(debtToCover > 0, "Amount must be > 0");

        // 2. Health & Solvency Check
        (uint256 healthFactor, uint256 collateralValue) = _calculateHealth(user);
        
        // Yellow Mode Rule: "Only deeply insolvent positions"
        if (state == AegisCore.RiskState.YELLOW) {
            // Threshold: HF < 0.95 (Deep)
            // HF is 18 decimals. 0.95 * 1e18 = 95e16
            require(healthFactor < 950000000000000000, "Yellow Mode: Not deeply insolvent");
        } else {
             require(healthFactor < 1e18, "User is healthy");
        }

        // 3. Grace Period - "Two-Step Liquidation"
        IUnstoppable.RiskParams memory params = identityRegistry.getRiskParameters(user);
        if (params.gracePeriod > 0) {
            uint256 start = probationStart[user];
            if (start == 0) {
                // First time detected: Trigger Probation
                probationStart[user] = block.timestamp;
                emit ProbationStarted(user, block.timestamp);
                return; // EXIT. Do not liquidate yet.
            } else {
                // Check expiry
                require(block.timestamp > start + params.gracePeriod, "In Grace Period");
                // Reset probation after successful liquidation (optional, or keep distinct)
                probationStart[user] = 0; 
            }
        }

        // 4. Execution
        // Liquidator pays Debt (USDC)
        require(usdcToken.transferFrom(msg.sender, address(this), debtToCover), "Transfer From failed");
        userDebtUSDC[user] -= debtToCover;

        // Validating Seize Amount
        // Bonus (Liquidation Penalty). Params has e.g. 10 (10%).
        // Seize Value = DebtPaid * (1 + Penalty/100)
        // Seize ETH = Seize Value / ETH Price
        
        uint256 penalty = params.liquidationPenalty; // e.g. 10
        uint256 bonusMultiplier = 100 + penalty; // 110
        
        uint256 price = oracle.getLatestPrice(address(0)); // 18 decimals
        
        // Debt Value (USDC 18 dec) * Multiplier / 100
        // Converted to ETH: Value / Price
        
        uint256 seizeValue = (debtToCover * bonusMultiplier) / 100; // USD Value
        uint256 seizeETH = (seizeValue * 1e18) / price; 
        
        require(userCollateralETH[user] >= seizeETH, "Collateral insufficient for bonus");
        
        userCollateralETH[user] -= seizeETH;
        
        // Transfer Collateral to Liquidator
        (bool success, ) = msg.sender.call{value: seizeETH}("");
        require(success, "ETH Transfer failed");

        emit Liquidated(user, msg.sender, debtToCover, seizeETH);

        // Refund Logic: If debt is fully cleared, return remaining collateral to user
        if (userDebtUSDC[user] == 0) {
            uint256 remaining = userCollateralETH[user];
            if (remaining > 0) {
                userCollateralETH[user] = 0;
                (bool refundSuccess, ) = user.call{value: remaining}("");
                require(refundSuccess, "Refund to user failed");
            }
        }
    }

    // --- Internal Safety ---

    function _calculateHealth(address user) internal view returns (uint256 hf, uint256 colVal) {
        uint256 collateral = userCollateralETH[user];
        uint256 debt = userDebtUSDC[user];
        if (debt == 0) return (type(uint256).max, 0);

        uint256 price = oracle.getLatestPrice(address(0));
        uint256 collateralValue = (collateral * price) / 1e18;
        colVal = collateralValue;

        IUnstoppable.RiskParams memory params = identityRegistry.getRiskParameters(user);
        // HF = (Collateral * LTV) / Debt
        hf = (collateralValue * params.ltv * 1e18) / (debt * 100);
    }

    function _validateHealth(address user) internal view {
        (uint256 hf, ) = _calculateHealth(user);
        require(hf >= 1e18, "Health Factor < 1.0");
    }

    // --- Liquidator Interface (For Backstop) ---
    /**
     * @notice Allows the Backstop/Sponge to Seize Collateral and Repay Debt on behalf of a user.
     * Only callable by BackstopPool.
     */
    function seizeForBackstop(address user, uint256 debtRepaid) external {
        // Access Control: Only the registered Backstop Pool can call this
        require(msg.sender == address(aegisCore.backstopPool()), "Caller is not Backstop Pool");
        
        // Logic: Backstop has paid the debt (via atomic swap or direct transfer elsewhere)
        // We update accounting here.
        
        require(userDebtUSDC[user] >= debtRepaid, "Debt too small");
        userDebtUSDC[user] -= debtRepaid;
        
        // Seize 110% of value? Or just value?
        // Let's settle for simple swap logic.
        // Backstop logic handles calculations.
    }
}
