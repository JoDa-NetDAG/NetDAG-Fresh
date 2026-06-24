// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NDGToken
 * @notice NetDAG (NDG) ERC20 Token
 * @dev Fixed supply ERC20 token. Total supply is minted once at deployment.
 */
contract NDGToken is ERC20, Ownable {
    
    event TokensBurned(address indexed from, uint256 amount);

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;

    constructor() ERC20("NetDAG", "NDG") {
        _mint(msg.sender, MAX_SUPPLY);
    }

    function burn(uint256 amount) external {
        require(amount > 0, "Amount is zero");
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        require(amount > 0, "Amount is zero");

        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "Insufficient allowance");

        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);

        emit TokensBurned(from, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}