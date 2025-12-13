// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IERC1271.sol";
import "../interfaces/ICoWSwap.sol";
import "../interfaces/IUnstoppable.sol";

contract BackstopPool is ReentrancyGuard, IERC1271 {
    address public aegisCore;
    IERC20 public usdcToken;
    ICoWSwap public cowSwap;
    IUnstoppable public identityRegistry;
    mapping(address => uint256) public probationStart;

    event ProbationStarted(address indexed borrower, uint256 timestamp);
    event CollateralSeized(address indexed borrower, uint256 collateralAmount, uint256 debtAbsorbed);
    event DarkPoolRouteActive(address indexed borrower, uint256 amount);

    modifier onlyCoordinator() {
        require(msg.sender == aegisCore, "Only Aegis Core can initiate absorption");
        _;
    }

    modifier onlyVerifiedAgent() {
        string memory name = identityRegistry.reverseNameOf(msg.sender);
        // Simple "Contains/EndsWith" check for Hackathon
        // Check if name has ".agent" or "agent" suffix/substring
        bool isAgent = _contains(name, "agent") || _contains(name, "Agent");
        require(isAgent, "Caller is not a Verified Agent");
        _;
    }

    function _contains(string memory where, string memory what) internal pure returns (bool) {
        bytes memory whereBytes = bytes(where);
        bytes memory whatBytes = bytes(what);
        if (whatBytes.length > whereBytes.length) return false;
        
        // Simple substring check
        for (uint i = 0; i <= whereBytes.length - whatBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < whatBytes.length; j++) {
                if (whereBytes[i + j] != whatBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    constructor(address _usdcToken, address _cowSwap, address _identityRegistry) {
        usdcToken = IERC20(_usdcToken);
        cowSwap = ICoWSwap(_cowSwap);
        identityRegistry = IUnstoppable(_identityRegistry);
    }

    function setAegisCore(address _aegisCore) external {
        require(aegisCore == address(0), "Core already set");
        aegisCore = _aegisCore;
    }

    function triggerProbation(address borrower) external onlyVerifiedAgent {
        IUnstoppable.RiskParams memory params = identityRegistry.getRiskParameters(borrower);
        require(params.gracePeriod > 0, "No grace period for user");
        
        probationStart[borrower] = block.timestamp;
        emit ProbationStarted(borrower, block.timestamp);
    }

    // EIP-1271 Implementation
    function isValidSignature(bytes32 _hash, bytes memory _signature) external view override returns (bytes4) {
        return 0x1626ba7e;
    }

    function absorbPosition(address borrower, uint256 collateralAmount, uint256 debtAmount) external nonReentrant onlyCoordinator {
        // 1. Eligibility Check (Health Factor)
        IUnstoppable.RiskParams memory params = identityRegistry.getRiskParameters(borrower);
        
        uint256 healthScore = (collateralAmount * params.ltv);
        uint256 debtThreshold = debtAmount * 100; // 2 decimals precision adjustment
        
        require(healthScore < debtThreshold, "User is Solvable (HF >= 1.0)");

        // 2. Grace Period Check
        if (params.gracePeriod > 0) {
            uint256 start = probationStart[borrower];
            require(start > 0, "Probation not started");
            require(block.timestamp > start + params.gracePeriod, "In Grace Period");
        }

        uint256 spongeBalance = usdcToken.balanceOf(address(this));

        // 3. The "Insolvency Paradox" Solution
        if (spongeBalance >= debtAmount) {
            // Branch A: Sponge Full - Atomic Swap
            // IMPROVEMENT: Actually spend the sponge's capital to reflect insolvency absorption
            // Sending to 0xdead to simulate burning/paying off the protocol debt
            usdcToken.transfer(address(0x000000000000000000000000000000000000dEaD), debtAmount);
            
            emit CollateralSeized(borrower, collateralAmount, debtAmount);
        } else {
            // Branch B: Sponge Empty - Route to Dark Pool
            cowSwap.placeOrder(address(0), collateralAmount); 
            
            emit DarkPoolRouteActive(borrower, collateralAmount);
        }
    }
}
