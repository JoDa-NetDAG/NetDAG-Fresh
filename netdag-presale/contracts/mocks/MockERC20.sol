// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing (simulates USDT/USDC/BUSD)
 * @dev Anyone can mint for testing purposes
 */
contract MockERC20 is ERC20 {
    
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    /**
     * @notice Mint tokens to any address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function - get free tokens for testing
     */
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    /**
     * @notice Override decimals
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}