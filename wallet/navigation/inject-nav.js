// navigation/inject-nav.js
// This creates the navigation menu on every page

export function initNavigation() {
    // Find the navigation container
    const nav = document.querySelector('.nav-right');
    
    // If there's no nav element, exit
    if (!nav) {
        console.warn('Navigation container not found');
        return;
    }
    
    // Create the navigation HTML
    nav.innerHTML = `
        <ul class="nav-menu">
            <li><a href="index.html">Home</a></li>
            <li><a href="about.html">About</a></li>
            <li><a href="staking.html">Staking</a></li>
            <li><a href="roadmap.html">Roadmap</a></li>
            <li>
                <button id="connectWalletBtn" class="btn-connect">
                    Connect Wallet
                </button>
            </li>
        </ul>
    `;
    
    console.log('✅ Navigation loaded');
}