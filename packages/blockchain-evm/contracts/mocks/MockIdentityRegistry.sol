// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IUnstoppable.sol";

contract MockIdentityRegistry is IUnstoppable {
    mapping(address => string) public userBadges;
    mapping(address => string) public userNames;

    function setMockBadge(address user, string memory badgeType) external {
        userBadges[user] = badgeType;
    }

    function setMockName(address user, string memory name) external {
        userNames[user] = name;
    }

    function reverseNameOf(address user) external view override returns (string memory) {
        return userNames[user];
    }

    function getRiskParameters(address user) external view override returns (RiskParams memory) {
        string memory badge = userBadges[user];
        
        // Default values
        if (bytes(badge).length == 0) {
            return RiskParams(75, 10, 0);
        }

        if (keccak256(bytes(badge)) == keccak256(bytes("Ancient One"))) {
            return RiskParams(80, 8, 900); // 15 mins = 900 sec
        }
        
        if (keccak256(bytes(badge)) == keccak256(bytes("Whale"))) {
            return RiskParams(82, 5, 1800); // 30 mins = 1800 sec
        }

        if (keccak256(bytes(badge)) == keccak256(bytes("Clean Sheet"))) {
            // Adds a +2% Bonus to LTV (Assuming base is Default 75 + 2 = 77)
            return RiskParams(77, 10, 0);
        }

        // Fallback to default if unrecognized badge, or handle as needed. 
        // For safety, return default.
        return RiskParams(75, 10, 0);
    }
}
