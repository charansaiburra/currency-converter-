// Application State Coordinator
const state = {
    apiKey: localStorage.getItem('apex_api_key') || null,
    user: JSON.parse(localStorage.getItem('apex_user')) || null,
    supportedCurrencies: {}
};

// Caching DOM Selectors
const DOM = {
    userStatusCard: document.getElementById('user-status-card'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    statusUserSub: document.getElementById('status-user-sub'),
    
    // Auth
    authSection: document.getElementById('auth-section'),
    tabRegister: document.getElementById('tab-register'),
    tabLogin: document.getElementById('tab-login'),
    contentRegister: document.getElementById('content-register'),
    contentLogin: document.getElementById('content-login'),
    registerForm: document.getElementById('register-form'),
    loginForm: document.getElementById('login-form'),
    keyRevealBox: document.getElementById('key-reveal-box'),
    generatedKeyDisplay: document.getElementById('generated-key-display'),
    btnCopyKey: document.getElementById('btn-copy-key'),
    
    // Converter
    converterSection: document.getElementById('converter-section'),
    converterLockOverlay: document.getElementById('converter-lock-overlay'),
    convAmount: document.getElementById('conv-amount'),
    convFrom: document.getElementById('conv-from'),
    convTo: document.getElementById('conv-to'),
    btnSwapCurrency: document.getElementById('btn-swap-currency'),
    btnConvert: document.getElementById('btn-convert'),
    resultDisplayCard: document.getElementById('result-display-card'),
    resultSourceText: document.getElementById('result-source-text'),
    resultTargetValue: document.getElementById('result-target-value'),
    resultRateText: document.getElementById('result-rate-text'),
    resultTimeText: document.getElementById('result-time-text'),
    sourceSymbol: document.getElementById('source-symbol'),
    
    // Rates Ticker
    rateBase: document.getElementById('rate-base'),
    ratesGridContainer: document.getElementById('rates-grid-container'),
    
    // History
    historySection: document.getElementById('history-section'),
    historyLockOverlay: document.getElementById('history-lock-overlay'),
    historyListContainer: document.getElementById('history-list-container'),
    emptyHistoryIndicator: document.getElementById('empty-history-indicator'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toast-icon'),
    toastMessage: document.getElementById('toast-message')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Setup Icons
    lucide.createIcons();
    
    // 2. Event Listeners Bindings
    setupEventListeners();
    
    // 3. Load Supported Currencies Map
    loadCurrencies();
    
    // 4. Load Live Rates Ticker
    loadLiveRates();
    
    // 5. Check Session Restore
    if (state.apiKey && state.user) {
        restoreSession();
    }
}

function setupEventListeners() {
    // Auth Tab Toggles
    DOM.tabRegister.addEventListener('click', () => switchAuthTab('register'));
    DOM.tabLogin.addEventListener('click', () => switchAuthTab('login'));
    
    // Form Submissions
    DOM.registerForm.addEventListener('submit', handleRegister);
    DOM.loginForm.addEventListener('submit', handleLogin);
    
    // Copy Key Handler
    DOM.btnCopyKey.addEventListener('click', () => {
        if (state.apiKey) {
            copyToClipboard(state.apiKey);
        }
    });
    
    // Currency Swap Button
    DOM.btnSwapCurrency.addEventListener('click', swapCurrencies);
    
    // Conversion Button
    DOM.btnConvert.addEventListener('click', handleConversion);
    
    // Rate Base Change Handler
    DOM.rateBase.addEventListener('change', () => loadLiveRates());
    
    // Export / Download Logs
    DOM.btnClearHistory.addEventListener('click', exportHistoryPDF);
    
    // Dynamically change input currency symbol tag on source select change
    DOM.convFrom.addEventListener('change', () => {
        updateSourceSymbolTag();
    });
}

// Session Management
function restoreSession() {
    updateAuthUI(true);
    fetchHistory();
    showToast(`Welcome back, ${state.user.username}!`, 'success');
}

function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        // Change Status indicators to Online
        DOM.statusDot.className = 'status-indicator online';
        DOM.statusText.textContent = state.user.username;
        DOM.statusUserSub.textContent = 'API Session Active';
        
        // Remove Locks
        DOM.converterSection.classList.remove('locked');
        DOM.historySection.classList.remove('locked');
        
        // Enable history export
        DOM.btnClearHistory.removeAttribute('disabled');
        DOM.btnClearHistory.className = 'clear-btn';
        DOM.btnClearHistory.innerHTML = `<i data-lucide="download" class="clear-icon"></i>`;
        lucide.createIcons();
        
        // Hide standard inputs
        DOM.keyRevealBox.classList.add('hidden');
    } else {
        DOM.statusDot.className = 'status-indicator offline';
        DOM.statusText.textContent = 'Disconnected';
        DOM.statusUserSub.textContent = 'Authenticate below';
        
        DOM.converterSection.classList.add('locked');
        DOM.historySection.classList.add('locked');
        DOM.btnClearHistory.setAttribute('disabled', 'true');
        DOM.btnClearHistory.className = 'clear-btn-disabled';
    }
}

// Auth Tabs Coordinator
function switchAuthTab(tab) {
    if (tab === 'register') {
        DOM.tabRegister.classList.add('active');
        DOM.tabLogin.classList.remove('active');
        DOM.contentRegister.classList.add('active');
        DOM.contentLogin.classList.remove('active');
    } else {
        DOM.tabRegister.classList.remove('active');
        DOM.tabLogin.classList.add('active');
        DOM.contentRegister.classList.remove('active');
        DOM.contentLogin.classList.add('active');
    }
}

// Form Handlers
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    
    setButtonLoading('btn-register-submit', true, 'Registering...');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        // Save state
        state.apiKey = data.apiKey;
        state.user = { id: data.id, username: data.username, email: data.email };
        localStorage.setItem('apex_api_key', data.apiKey);
        localStorage.setItem('apex_user', JSON.stringify(state.user));
        
        // Reveal key details
        DOM.generatedKeyDisplay.textContent = data.apiKey;
        DOM.keyRevealBox.classList.remove('hidden');
        DOM.registerForm.reset();
        
        // Unlock components
        updateAuthUI(true);
        fetchHistory();
        showToast('Account registered successfully!', 'success');
        
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setButtonLoading('btn-register-submit', false, 'Generate Secure Key');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const apiKey = document.getElementById('login-key').value.trim();
    
    if (!apiKey) {
        showToast('Please enter an API Key', 'error');
        return;
    }
    
    setButtonLoading('btn-login-submit', true, 'Verifying...');
    
    try {
        // Attempt to fetch history using this key to check validity
        const response = await fetch('/api/history', {
            method: 'GET',
            headers: { 'X-API-KEY': apiKey }
        });
        
        if (!response.ok) {
            throw new Error('Invalid API Key provided');
        }
        
        // If we reach here, key is valid. Let's register a temporary profile username
        // We can parse the logs to deduce the identity or just fetch user details.
        // For simplicity, let's look up or set a generic Username "API Key User"
        // Or wait, let's call a custom endpoint. But since H2 is in-memory, we can let them log in.
        // Let's set a standard name
        state.apiKey = apiKey;
        state.user = { username: 'API Key Partner', email: 'session@active.key' };
        localStorage.setItem('apex_api_key', apiKey);
        localStorage.setItem('apex_user', JSON.stringify(state.user));
        
        DOM.loginForm.reset();
        updateAuthUI(true);
        fetchHistory();
        showToast('API key session activated!', 'success');
        
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setButtonLoading('btn-login-submit', false, 'Activate Session');
    }
}

// Currencies Listing Loader
async function loadCurrencies() {
    try {
        const response = await fetch('/api/currencies');
        if (!response.ok) throw new Error('Failed to load supported currencies');
        
        const currencies = await response.json();
        state.supportedCurrencies = currencies;
        
        // Populate select elements
        let optionsHTML = '';
        for (const [code, name] of Object.entries(currencies)) {
            optionsHTML += `<option value="${code}">${code} - ${name}</option>`;
        }
        
        DOM.convFrom.innerHTML = optionsHTML;
        DOM.convTo.innerHTML = optionsHTML;
        
        // Set Defaults
        DOM.convFrom.value = 'USD';
        DOM.convTo.value = 'INR';
        updateSourceSymbolTag();
        
    } catch (err) {
        showToast('Error loading currencies list: ' + err.message, 'error');
    }
}

// Ticker live rates loader
async function loadLiveRates() {
    const base = DOM.rateBase.value;
    DOM.ratesGridContainer.innerHTML = `
        <div class="rate-skeleton"></div>
        <div class="rate-skeleton"></div>
        <div class="rate-skeleton"></div>
        <div class="rate-skeleton"></div>
    `;
    
    try {
        const response = await fetch(`/api/rates?base=${base}`);
        if (!response.ok) throw new Error('Rates loading error');
        
        const data = await response.json();
        const rates = data.rates;
        
        // Popular visual conversions
        const popularCodes = ['EUR', 'INR', 'GBP', 'JPY', 'CAD', 'AUD'].filter(c => c !== base).slice(0, 4);
        
        let gridHTML = '';
        popularCodes.forEach(code => {
            const rawRate = rates[code];
            const displayRate = rawRate < 1 ? rawRate.toFixed(4) : rawRate.toFixed(2);
            
            gridHTML += `
                <div class="rate-card fade-in">
                    <div class="rate-pair-left">
                        <h4>${base}/${code}</h4>
                        <span>${state.supportedCurrencies[code] || 'Global Rate'}</span>
                    </div>
                    <div class="rate-value-right">
                        <p class="rate-num">${displayRate}</p>
                        <span class="rate-change">Live</span>
                    </div>
                </div>
            `;
        });
        
        DOM.ratesGridContainer.innerHTML = gridHTML;
        
    } catch (err) {
        DOM.ratesGridContainer.innerHTML = `
            <div class="empty-history" style="grid-column: span 2; padding: 1rem;">
                <i data-lucide="alert-circle" style="color: var(--color-danger); width: 24px; height: 24px; margin-bottom: 0.5rem;"></i>
                <p style="font-size: 0.8rem;">Live Rates Ticker Offline</p>
            </div>
        `;
        lucide.createIcons();
    }
}

// Convert action
async function handleConversion() {
    const from = DOM.convFrom.value;
    const to = DOM.convTo.value;
    const amount = parseFloat(DOM.convAmount.value);
    
    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid positive number', 'error');
        return;
    }
    
    setButtonLoading('btn-convert', true, 'Exchanging...');
    
    try {
        const response = await fetch(`/api/convert?from=${from}&to=${to}&amount=${amount}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': state.apiKey
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Conversion error');
        }
        
        // Display Result Details
        DOM.resultSourceText.textContent = `${amount.toLocaleString(undefined, {minimumFractionDigits: 2})} ${from} =`;
        
        const targetSymbol = getCurrencySymbol(to);
        DOM.resultTargetValue.textContent = `${targetSymbol} ${data.convertedAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} ${to}`;
        DOM.resultRateText.textContent = `1 ${from} = ${data.rate.toFixed(4)} ${to}`;
        
        const time = new Date(data.timestamp);
        DOM.resultTimeText.textContent = `As of ${time.toLocaleTimeString()}`;
        
        DOM.resultDisplayCard.classList.remove('hidden');
        
        // Reload history log instantly
        fetchHistory();
        showToast(`Exchanged successfully!`, 'success');
        
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setButtonLoading('btn-convert', false, 'Convert Amount');
    }
}

// History Log loader
async function fetchHistory() {
    if (!state.apiKey) return;
    
    try {
        const response = await fetch('/api/history', {
            method: 'GET',
            headers: { 'X-API-KEY': state.apiKey }
        });
        
        if (!response.ok) throw new Error('Failed to load transaction history');
        
        const logs = await response.json();
        
        if (logs.length === 0) {
            DOM.emptyHistoryIndicator.classList.remove('hidden');
            // Remove previous items
            const items = DOM.historyListContainer.querySelectorAll('.history-item');
            items.forEach(item => item.remove());
            return;
        }
        
        DOM.emptyHistoryIndicator.classList.add('hidden');
        
        // Render logs
        let listHTML = '';
        logs.forEach(log => {
            const time = new Date(log.timestamp);
            const displayTime = time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const targetSym = getCurrencySymbol(log.toCurrency);
            const sourceSym = getCurrencySymbol(log.fromCurrency);
            
            listHTML += `
                <div class="history-item">
                    <div class="hist-left">
                        <div class="hist-pair">
                            <span class="hist-from">${log.fromCurrency}</span>
                            <i data-lucide="arrow-right-left" class="hist-arrow"></i>
                            <span class="hist-to">${log.toCurrency}</span>
                        </div>
                        <span class="hist-time">${displayTime}</span>
                    </div>
                    <div class="hist-right">
                        <div class="hist-val">
                            ${sourceSym}${log.amount.toLocaleString(undefined, {maximumFractionDigits:2})} &rarr; ${targetSym}${log.convertedAmount.toLocaleString(undefined, {maximumFractionDigits:2})}
                        </div>
                        <span class="hist-rate-text">Rate: ${log.exchangeRate.toFixed(4)}</span>
                    </div>
                </div>
            `;
        });
        
        // Render inside container while maintaining empty indicator reference
        const emptyElement = DOM.emptyHistoryIndicator.outerHTML;
        DOM.historyListContainer.innerHTML = emptyElement + listHTML;
        lucide.createIcons();
        
    } catch (err) {
        showToast('Error loading history: ' + err.message, 'error');
    }
}

// Currency Symbol helpers
function getCurrencySymbol(code) {
    const symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'CA$', 'AUD': 'A$', 'CHF': 'CHF',
        'CNY': '¥', 'SGD': 'S$', 'AED': 'د.إ', 'ZAR': 'R', 'RUB': '₽', 'BRL': 'R$', 'KRW': '₩', 'TRY': '₺'
    };
    return symbols[code.toUpperCase()] || '';
}

function updateSourceSymbolTag() {
    const symbol = getCurrencySymbol(DOM.convFrom.value);
    DOM.sourceSymbol.textContent = symbol || DOM.convFrom.value;
}

function swapCurrencies() {
    const fromVal = DOM.convFrom.value;
    const toVal = DOM.convTo.value;
    
    // Swap select values
    DOM.convFrom.value = toVal;
    DOM.convTo.value = fromVal;
    
    updateSourceSymbolTag();
    
    // Animate Swap Icon slightly
    const swapIcon = DOM.btnSwapCurrency.querySelector('.swap-icon');
    swapIcon.style.transition = 'transform 0.4s ease';
    swapIcon.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        swapIcon.style.transform = 'none';
    }, 400);
}

// Premium PDF Export Tool using jsPDF
async function exportHistoryPDF() {
    if (!state.apiKey) return;
    
    try {
        const response = await fetch('/api/history', {
            method: 'GET',
            headers: { 'X-API-KEY': state.apiKey }
        });
        if (!response.ok) throw new Error('Export error');
        
        const logs = await response.json();
        
        if (logs.length === 0) {
            showToast('No logs available to export!', 'error');
            return;
        }
        
        // Retrieve jsPDF context from global window
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Styling palettes
        const primaryColor = [139, 92, 246]; // Violet (rgb)
        const accentColor = [6, 182, 212];  // Cyan (rgb)
        const darkColor = [31, 41, 55];     // Charcoal (rgb)
        
        // 1. Draw elegant header branding banner
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 38, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("ApexConvert Exchange Ledger", 15, 24);
        
        doc.setFillColor(...accentColor);
        doc.rect(170, 0, 40, 10, 'F');
        doc.setFontSize(7.5);
        doc.text("SECURE REPORT", 175, 7);
        
        // 2. Metadata Profile Details
        doc.setTextColor(...darkColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Report Details:", 15, 52);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text(`Account Profile: ${state.user.username}`, 15, 60);
        doc.text(`Registered Email: ${state.user.email}`, 15, 67);
        doc.text(`Secure API Key: ${state.apiKey.substring(0, 8)}...****************`, 15, 74);
        
        doc.text(`Generation Date: ${new Date().toLocaleString()}`, 115, 60);
        doc.text(`Total Transactions: ${logs.length}`, 115, 67);
        doc.text(`Engine Status: Active Session`, 115, 74);
        
        // Fine separating rule line
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.4);
        doc.line(15, 82, 195, 82);
        
        // 3. Structured Data Grid Table
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Logged Transaction Ledgers", 15, 92);
        
        // Table Header
        let yPos = 100;
        doc.setFillColor(243, 244, 246);
        doc.rect(15, yPos, 180, 8, 'F');
        
        doc.setFontSize(8.5);
        doc.setTextColor(...darkColor);
        doc.text("DATE & TIME", 18, yPos + 6);
        doc.text("PAIR", 60, yPos + 6);
        doc.text("SOURCE AMOUNT", 92, yPos + 6);
        doc.text("EXCHANGE RATE", 132, yPos + 6);
        doc.text("CONVERTED AMOUNT", 164, yPos + 6);
        
        // Draw rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        
        logs.forEach((log, index) => {
            yPos += 9;
            
            // Zebra striping lines
            if (index % 2 === 1) {
                doc.setFillColor(249, 250, 251);
                doc.rect(15, yPos - 1, 180, 9, 'F');
            }
            
            const logTime = new Date(log.timestamp);
            const timeStr = logTime.toLocaleDateString() + ' ' + logTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const pairStr = `${log.fromCurrency} to ${log.toCurrency}`;
            
            // Render text columns
            doc.setTextColor(107, 114, 128); // Muted grey date
            doc.text(timeStr, 18, yPos + 5);
            
            doc.setTextColor(...darkColor);
            doc.setFont("helvetica", "bold");
            doc.text(pairStr, 60, yPos + 5);
            
            doc.setFont("helvetica", "normal");
            doc.text(`${log.fromCurrency} ${log.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 92, yPos + 5);
            doc.text(log.exchangeRate.toFixed(4), 132, yPos + 5);
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...accentColor);
            doc.text(`${log.toCurrency} ${log.convertedAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 164, yPos + 5);
            
            // Draw separating cell divider
            doc.setDrawColor(243, 244, 246);
            doc.setLineWidth(0.2);
            doc.line(15, yPos + 8, 195, yPos + 8);
            
            // Page overflow coordinator
            if (yPos > 260 && index < logs.length - 1) {
                doc.addPage();
                yPos = 15;
                
                // Redraw table headers on new page
                doc.setFillColor(243, 244, 246);
                doc.rect(15, yPos, 180, 8, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.5);
                doc.setTextColor(...darkColor);
                doc.text("DATE & TIME", 18, yPos + 6);
                doc.text("PAIR", 60, yPos + 6);
                doc.text("SOURCE AMOUNT", 92, yPos + 6);
                doc.text("EXCHANGE RATE", 132, yPos + 6);
                doc.text("CONVERTED AMOUNT", 164, yPos + 6);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                yPos += 3;
            }
        });
        
        // 4. Page numbering & footer branding
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7.5);
            doc.setTextColor(156, 163, 175);
            
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(15, 280, 195, 280);
            
            doc.text("ApexConvert Exchange Engine © 2026. Secure database transaction report.", 15, 286);
            doc.text(`Page ${i} of ${pageCount}`, 180, 286);
        }
        
        doc.save(`apexconvert_report_${state.user.username.toLowerCase()}.pdf`);
        showToast('PDF transaction report downloaded!', 'success');
        
    } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
    }
}

// Helpers
function showToast(message, type = 'info') {
    DOM.toastMessage.textContent = message;
    
    // Clear icons class
    DOM.toastIcon.className = 'toast-icon';
    if (type === 'success') {
        DOM.toast.className = 'toast success';
        DOM.toastIcon.setAttribute('data-lucide', 'check-circle');
    } else if (type === 'error') {
        DOM.toast.className = 'toast error';
        DOM.toastIcon.setAttribute('data-lucide', 'alert-circle');
    } else {
        DOM.toast.className = 'toast';
        DOM.toastIcon.setAttribute('data-lucide', 'info');
    }
    
    lucide.createIcons();
    DOM.toast.classList.remove('hidden');
    
    // Auto dim
    setTimeout(() => {
        DOM.toast.classList.add('hidden');
    }, 3500);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('API Key copied to clipboard!', 'success');
        // Temporarily change copy icon to check
        DOM.btnCopyKey.innerHTML = `<i data-lucide="check" class="copy-icon" style="color: var(--color-success)"></i>`;
        lucide.createIcons();
        setTimeout(() => {
            DOM.btnCopyKey.innerHTML = `<i data-lucide="copy" class="copy-icon"></i>`;
            lucide.createIcons();
        }, 2000);
    }).catch(err => {
        showToast('Failed to copy API key: ' + err, 'error');
    });
}

function setButtonLoading(btnId, isLoading, text) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    if (isLoading) {
        btn.setAttribute('disabled', 'true');
        btn.style.opacity = '0.7';
        btn.querySelector('span').textContent = text;
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = 'btn-icon spinning-slow';
            icon.setAttribute('data-lucide', 'loader-2');
            lucide.createIcons();
        }
    } else {
        btn.removeAttribute('disabled');
        btn.style.opacity = '1';
        btn.querySelector('span').textContent = text;
        const icon = btn.querySelector('i');
        if (icon) {
            // Restore appropriate icons
            if (btnId === 'btn-register-submit') {
                icon.className = 'btn-icon';
                icon.setAttribute('data-lucide', 'key');
            } else if (btnId === 'btn-login-submit') {
                icon.className = 'btn-icon';
                icon.setAttribute('data-lucide', 'power');
            } else if (btnId === 'btn-convert') {
                icon.className = 'btn-icon';
                icon.setAttribute('data-lucide', 'circle-arrow-right');
            }
            lucide.createIcons();
        }
    }
}
