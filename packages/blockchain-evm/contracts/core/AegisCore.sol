// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IVerifier.sol";
import "../interfaces/IUnstoppable.sol";
import "./BackstopPool.sol";

contract AegisCore is AccessControl, Pausable {
    bytes32 public constant SENTINEL_ROLE = keccak256("SENTINEL_ROLE");
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    
    enum RiskState { GREEN, YELLOW, RED }
    RiskState public currentState;
    
    IVerifier public verifier;
    IUnstoppable public identityRegistry;
    BackstopPool public backstopPool;
    
    event GlobalRiskCondition(bool active, uint256 timestamp, uint256 riskScore);
    event RiskStateChanged(RiskState oldState, RiskState newState);

    constructor(
        address _verifier, 
        address _identityRegistry, 
        address _backstopPool,
        address _sentinel,
        address _governor
    ) {
        verifier = IVerifier(_verifier);
        identityRegistry = IUnstoppable(_identityRegistry);
        backstopPool = BackstopPool(_backstopPool);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SENTINEL_ROLE, _sentinel);
        _grantRole(GOVERNOR_ROLE, _governor);
        
        currentState = RiskState.GREEN;
    }

    // State Transitions
    function setRiskState(RiskState _newState, bytes memory proof, bytes32 inputHash) external {
        require(hasRole(SENTINEL_ROLE, msg.sender) || hasRole(GOVERNOR_ROLE, msg.sender), "Caller is not authorized");
        
        if (_newState == RiskState.RED) {
             // Require ZK-proof verification for RED mode transition
             require(verifier.verify(proof, inputHash), "Invalid ZK proof for Red Mode");
             emit GlobalRiskCondition(true, block.timestamp, 100);
        } else {
             // If transitioning out of RED or to YELLOW/GREEN, we might emit risk condition false
             emit GlobalRiskCondition(false, block.timestamp, 0);
        }

        RiskState oldState = currentState;
        currentState = _newState;
        
        emit RiskStateChanged(oldState, _newState);
        
        if (_newState == RiskState.RED) {
            _pause();
        } else {
            _unpause();
        }
    }
}
