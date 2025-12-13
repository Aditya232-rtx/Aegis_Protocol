// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IUnstoppable.sol";

// Minimal interface for Unstoppable Domains Registry (UNS)
interface IUDRegistry {
    function reverseNameOf(address addr) external view returns (string memory);
}

contract IdentityRegistry is IUnstoppable {
    IUDRegistry public udRegistry;

    constructor(address _udRegistry) {
        udRegistry = IUDRegistry(_udRegistry);
    }

    function reverseNameOf(address user) external view override returns (string memory) {
        try udRegistry.reverseNameOf(user) returns (string memory name) {
            return name;
        } catch {
            return "";
        }
    }

    function getRiskParameters(address user) external view override returns (RiskParams memory) {
        // 1. Reverse Resolution: Get domain from UD
        // In a real scenario, this resolves '0xUser' -> 'whale.crypto'
        string memory domainName = "";
        
        try udRegistry.reverseNameOf(user) returns (string memory name) {
            domainName = name;
        } catch {
            // Fallback if no reverse record exists
            return _defaultParams();
        }

        bytes32 domainHash = keccak256(bytes(domainName));

        // 2. Table 1 Rules Application
        // Parsing the "Badge" from the domain name. 
        // For this architecture, we assume the domain *is* the badge identifier 
        // or contains it. (e.g. "ancient-one" or "whale").

        // "Ancient One" Badge
        if (domainHash == keccak256(bytes("ancient-one")) || domainHash == keccak256(bytes("Ancient One"))) {
            return RiskParams({
                ltv: 80,             // 80%
                liquidationPenalty: 8, // 8%
                gracePeriod: 900     // 15 minutes
            });
        }

        // "Whale" Badge
        if (domainHash == keccak256(bytes("whale")) || domainHash == keccak256(bytes("Whale"))) {
            return RiskParams({
                ltv: 82,             // 82%
                liquidationPenalty: 5, // 5%
                gracePeriod: 1800    // 30 minutes
            });
        }

        // "Clean Sheet" Badge
        if (domainHash == keccak256(bytes("clean-sheet")) || domainHash == keccak256(bytes("Clean Sheet"))) {
            return RiskParams({
                ltv: 77,             // 75% + 2% Bonus
                liquidationPenalty: 10,
                gracePeriod: 0
            });
        }

        // Default Risk Profile
        return _defaultParams();
    }

    function _defaultParams() internal pure returns (RiskParams memory) {
        return RiskParams({
            ltv: 75,
            liquidationPenalty: 10,
            gracePeriod: 0
        });
    }
}
