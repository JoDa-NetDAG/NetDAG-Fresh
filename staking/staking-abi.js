// staking/staking-abi.js
// This is the ABI (Application Binary Interface) for your staking contract
// It tells JavaScript how to talk to your smart contract

export const STAKING_ABI = [
    // Read functions (don't cost gas)
    "function balanceOf(address account) external view returns (uint256)",
    "function earned(address account) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "function rewardRate() external view returns (uint256)",
    
    // Write functions (cost gas)
    "function stake(uint256 amount) external",
    "function withdraw(uint256 amount) external",
    "function getReward() external",
    
    // Events
    "event Staked(address indexed user, uint256 amount)",
    "event Withdrawn(address indexed user, uint256 amount)",
    "event RewardPaid(address indexed user, uint256 reward)"
];

// NOTE: Replace this with your actual contract ABI
// You can get it from your contract deployment or from Etherscan