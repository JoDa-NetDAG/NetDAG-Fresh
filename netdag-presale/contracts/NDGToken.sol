// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NDGToken
 * @notice NetDAG (NDG) ERC20 Token
 * @dev Standard ERC20 with mint and burn capabilities
 */
contract NDGToken is ERC20, Ownable {
    
    // ==================== EVENTS ====================
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    // ==================== CONSTRUCTOR ====================

    /**
     * @param initialSupply Initial token supply (with 18 decimals)
     */
    constructor(uint256 initialSupply) ERC20("NetDAG", "NDG") {
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
            emit TokensMinted(msg.sender, initialSupply);
        }
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Mint new tokens (owner only)
     * @param to Address to receive tokens
     * @param amount Amount to mint (18 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Mint to zero address");
        require(amount > 0, "Amount is zero");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Burn tokens from caller's balance
     * @param amount Amount to burn (18 decimals)
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount is zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Burn tokens from specific address (requires allowance)
     * @param from Address to burn from
     * @param amount Amount to burn (18 decimals)
     */
    function burnFrom(address from, uint256 amount) external {
        require(amount > 0, "Amount is zero");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "Insufficient allowance");
        
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
        
        emit TokensBurned(from, amount);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @notice Get token decimals (always 18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}