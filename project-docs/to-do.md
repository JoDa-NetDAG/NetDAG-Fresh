# 🚀 NetDAG Presale TO-DO List
**Target Launch Date:** 28 February 2026 (16 days!)  
**Last Updated:** 12 February 2026

---

## ⚠️ CRITICAL PATH (DO FIRST)

### 🔴 PHASE 1: Smart Contract Testing & Deployment (Days 1-7)

#### 1.1 Local Development Setup
- [ ] Navigate to `netdag-presale/` folder
- [ ] Run `npm install` to install dependencies
- [ ] Check `hardhat.config.js` configuration
- [ ] Create `.env` file with test private key
- [ ] Run `npx hardhat compile` - verify contracts compile
- [ ] Review Presale.sol and NDGToken.sol for any issues

#### 1.2 Unit Testing
- [ ] Write tests for NDGToken.sol (minting, transfers)
- [ ] Write tests for Presale.sol (tier logic, purchases, limits)
- [ ] Test BNB purchase flow
- [ ] Test stablecoin purchase flow
- [ ] Test contribution limits (min/max)
- [ ] Test pause/unpause functionality
- [ ] Test withdrawal function
- [ ] Run all tests: `npx hardhat test`
- [ ] Achieve 100% test coverage

#### 1.3 BSC Testnet Deployment
- [ ] Get BSC Testnet BNB from faucet: https://testnet.bnbchain.org/faucet-smart
- [ ] Update `.env` with real testnet private key
- [ ] Deploy mock price feed (Chainlink) for testnet
- [ ] Deploy NDGToken to BSC Testnet
- [ ] Deploy Presale contract to BSC Testnet
- [ ] Verify contracts on https://testnet.bscscan.com
- [ ] Set up presale tiers (define pricing structure)
- [ ] Add accepted stablecoins (USDT, USDC, BUSD testnet addresses)
- [ ] Transfer test NDG tokens to Presale contract
- [ ] Test purchase with BNB on testnet
- [ ] Test purchase with stablecoins on testnet
- [ ] Test all admin functions

#### 1.4 Security Review
- [ ] Run Slither security analysis
- [ ] Run MythX or similar automated audit tool
- [ ] Peer review by another developer (if available)
- [ ] Optional: Get professional audit (if budget allows)
- [ ] Fix any vulnerabilities found
- [ ] Document security measures

#### 1.5 BSC Mainnet Deployment
- [ ] Fund deployment wallet with BNB for gas
- [ ] Deploy NDGToken to BSC Mainnet
- [ ] Mint 500,000,000 NDG tokens
- [ ] Deploy Presale contract to BSC Mainnet with real Chainlink oracle
- [ ] Verify contracts on https://bscscan.com
- [ ] Set up production presale tiers
- [ ] Add accepted stablecoins (mainnet addresses)
- [ ] Transfer 500M NDG to Presale contract
- [ ] Test with small amount first
- [ ] Set contribution limits
- [ ] PAUSE presale until launch day
- [ ] Document all contract addresses

---

### 🟡 PHASE 2: Frontend Integration (Days 4-9)

#### 2.1 Contract Configuration
- [ ] Update `config/contract-config.js` with mainnet addresses
- [ ] Add Presale contract address
- [ ] Add NDGToken contract address
- [ ] Add Presale ABI to project
- [ ] Add NDGToken ABI to project
- [ ] Configure Chainlink price feed address

#### 2.2 Wallet Connection
- [ ] Install Web3/Ethers.js dependencies
- [ ] Implement MetaMask connection
- [ ] Implement WalletConnect integration
- [ ] Implement Trust Wallet support
- [ ] Implement Coinbase Wallet support
- [ ] Add wallet connection button
- [ ] Display connected wallet address
- [ ] Display wallet BNB balance
- [ ] Add network switching (to BSC)
- [ ] Add error handling for unsupported networks

#### 2.3 Purchase Flow Implementation
- [ ] Create buy modal UI (already exists in `partials/ndg-buy-modal.html`)
- [ ] Implement BNB purchase function
- [ ] Implement USDT purchase function
- [ ] Implement USDC purchase function
- [ ] Add token approval flow for stablecoins
- [ ] Add transaction confirmation modal
- [ ] Add transaction pending state
- [ ] Add transaction success notification
- [ ] Add transaction error handling
- [ ] Test on testnet thoroughly

#### 2.4 Real-time Presale Stats
- [ ] Fetch total USD raised from contract
- [ ] Fetch remaining tokens available
- [ ] Display current tier price
- [ ] Display next tier price
- [ ] Calculate and display progress bar
- [ ] Auto-update stats every 10 seconds
- [ ] Display user's contribution
- [ ] Display user's NDG balance

#### 2.5 End-to-End Testing
- [ ] Test wallet connection on mobile
- [ ] Test BNB purchase flow completely
- [ ] Test stablecoin purchase flow completely
- [ ] Test with different wallet apps
- [ ] Test error scenarios (insufficient funds, rejected tx)
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on desktop browsers (Chrome, Firefox, Edge)

---

### 🟢 PHASE 3: Website Deployment (Days 8-10)

#### 3.1 Hosting Setup
- [ ] Choose hosting platform: GitHub Pages / Netlify / Vercel
- [ ] If GitHub Pages: Enable in repo settings
- [ ] If Netlify/Vercel: Connect GitHub repo
- [ ] Configure build settings
- [ ] Test deployment to staging environment
- [ ] Get custom domain (netdag.com) if not already owned
- [ ] Configure DNS records
- [ ] Set up SSL certificate (automatic with hosts)
- [ ] Test HTTPS works

#### 3.2 Final Website QA
- [ ] Check all pages load correctly
- [ ] Check all images display
- [ ] Check all links work (no 404s)
- [ ] Test navigation menu
- [ ] Test mobile responsive design
- [ ] Test presale modal opens/closes
- [ ] Verify whitepaper loads
- [ ] Check FAQ page
- [ ] Test contact/support links
- [ ] Run Google Lighthouse audit
- [ ] Fix performance issues
- [ ] Test page load speed
- [ ] Add Google Analytics (optional)

---

### 🔵 PHASE 4: Legal & Compliance (Days 8-12)

#### 4.1 Legal Documents
- [ ] Draft Terms of Service
- [ ] Draft Privacy Policy
- [ ] Draft Token Sale Agreement
- [ ] Add risk disclaimers to presale page
- [ ] Add legal disclaimers to footer
- [ ] Consult lawyer (if budget allows)
- [ ] Determine if KYC/AML required
- [ ] If KYC required: integrate KYC provider
- [ ] Add cookie consent (GDPR compliance)
- [ ] Document token distribution plan

---

### 🟣 PHASE 5: Marketing & Community (Days 1-16, Ongoing)

#### 5.1 Social Media Setup
- [ ] Create Twitter/X account @NetDAG
- [ ] Create Telegram group
- [ ] Create Telegram announcement channel
- [ ] Create Discord server
- [ ] Set up social media posting schedule
- [ ] Design social media graphics
- [ ] Create announcement templates

#### 5.2 Content Creation
- [ ] Finalize whitepaper content
- [ ] Create explainer video (2-3 min)
- [ ] Create tokenomics infographic
- [ ] Create bonding curve explainer
- [ ] Write Medium articles
- [ ] Create pitch deck
- [ ] Prepare press release

#### 5.3 Community Building
- [ ] Post daily updates on Twitter
- [ ] Engage with crypto communities
- [ ] Join relevant Telegram groups
- [ ] Partner announcements
- [ ] Influencer outreach
- [ ] AMA (Ask Me Anything) sessions
- [ ] Bounty program (optional)
- [ ] Referral program (optional)

#### 5.4 Launch Marketing
- [ ] Schedule countdown posts (7 days, 3 days, 1 day)
- [ ] Prepare launch day announcement
- [ ] Coordinate with partners for cross-promotion
- [ ] Submit to crypto calendars (CoinMarketCal, etc.)
- [ ] Reach out to crypto news sites
- [ ] Prepare email newsletter (if list exists)

---

### 🟠 PHASE 6: Operations & Monitoring (Days 13-16)

#### 6.1 Monitoring Setup
- [ ] Set up BSCScan alerts for presale contract
- [ ] Create admin dashboard for monitoring
- [ ] Set up transaction logger
- [ ] Create emergency contact list
- [ ] Test pause function (emergency stop)
- [ ] Set up wallet for withdrawing funds
- [ ] Document withdrawal procedures
- [ ] Create incident response plan

#### 6.2 Customer Support
- [ ] Create FAQ page (already exists in menu/faq.html)
- [ ] Expand FAQ with presale-specific questions
- [ ] Set up support email (support@netdag.com)
- [ ] Assign support team members
- [ ] Create support response templates
- [ ] Set up Telegram support bot (optional)
- [ ] Train team on common issues
- [ ] Create troubleshooting guide

#### 6.3 Launch Day Preparation
- [ ] Final smart contract check
- [ ] Final website check
- [ ] Test purchase flow one last time
- [ ] Prepare launch announcement
- [ ] Unpause presale contract at launch time
- [ ] Monitor first transactions
- [ ] Be ready for support inquiries
- [ ] Celebrate! 🎉

---

## 🎯 POST-PRESALE (After 28 Feb)

#### After Presale Ends
- [ ] Calculate total raised
- [ ] Announce presale results
- [ ] Prepare for DEX listing
- [ ] Set up liquidity pool (22% buy-back reserve)
- [ ] List on PancakeSwap
- [ ] Apply to CoinMarketCap
- [ ] Apply to CoinGecko
- [ ] Distribute tokens to presale participants
- [ ] Begin roadmap implementation

---

## ✅ DAILY PRIORITIES (What to Focus on Each Day)

**Week 1 (Days 1-7): Smart Contracts**
- Mon-Wed: Testing
- Thu-Fri: Testnet deployment
- Sat-Sun: Security review

**Week 2 (Days 8-14): Integration & Launch Prep**
- Mon-Tue: Frontend integration
- Wed-Thu: Website deployment
- Fri-Sat: Marketing ramp-up
- Sun: Final testing

**Week 3 (Days 15-16): Final Push**
- Day 15: All systems check
- Day 16: Launch preparation
- **Day 17: LAUNCH! 🚀**

---

**Remember:** Check off tasks as you complete them! Update `DAILY-LOG.md` every day with progress!