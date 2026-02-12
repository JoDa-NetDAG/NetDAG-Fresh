// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_) ERC20(name_, symbol_) {
        if (initialSupply_ > 0) {
            _mint(msg.sender, initialSupply_);
        }
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}