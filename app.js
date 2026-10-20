// Java Backend REST API Endpoint
const JAVA_API_URL = "http://localhost:8080/api/convert";

// Currency Symbols Map
const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "C$"
};

// Fallback / Initial Table Data
const POPULAR_CURRENCIES = [
  { code: "EUR", name: "Euro", flag: "🇪🇺", defaultRate: 0.89047, change: "+0.000041%", isPositive: true },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", defaultRate: 0.75009, change: "-0.033%", isPositive: false },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", defaultRate: 158.25, change: "+0.1%", isPositive: true },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", defaultRate: 1.4083, change: "-0.28%", isPositive: false }
];

// DOM Elements
const amountInput = document.getElementById("amount-input");
const fromCurrencySelect = document.getElementById("from-currency");
const toCurrencySelect = document.getElementById("to-currency");
const convertedOutput = document.getElementById("converted-output");
const swapBtn = document.getElementById("swap-currencies-btn");
const convertBtn = document.getElementById("btn-convert");
const headlineRate = document.getElementById("headline-rate");
const timestampInfo = document.getElementById("timestamp-info");
const baseSymbol = document.getElementById("base-symbol");
const targetSymbol = document.getElementById("target-symbol");
const ratesContainer = document.getElementById("rates-list-container");

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  renderRatesTable();
  executeConversion();

  // Event Listeners
  convertBtn.addEventListener("click", executeConversion);
  amountInput.addEventListener("input", executeConversion);
  fromCurrencySelect.addEventListener("change", () => {
    updateSymbols();
    executeConversion();
    renderRatesTable();
  });
  toCurrencySelect.addEventListener("change", () => {
    updateSymbols();
    executeConversion();
  });

  swapBtn.addEventListener("click", swapCurrencies);

  // Tab switching logic
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
});

// Update symbols ($ or € etc.) based on chosen currencies
function updateSymbols() {
  baseSymbol.textContent = CURRENCY_SYMBOLS[fromCurrencySelect.value] || "$";
  targetSymbol.textContent = CURRENCY_SYMBOLS[toCurrencySelect.value] || "€";
}

// Swap From & To Currencies
function swapCurrencies() {
  const temp = fromCurrencySelect.value;
  fromCurrencySelect.value = toCurrencySelect.value;
  toCurrencySelect.value = temp;
  updateSymbols();
  executeConversion();
  renderRatesTable();
}

// Core Function: Java Backend Connection via Fetch API
async function executeConversion() {
  const from = fromCurrencySelect.value;
  const to = toCurrencySelect.value;
  const amount = parseFloat(amountInput.value) || 0;

  if (from === to) {
    convertedOutput.value = amount.toFixed(2);
    headlineRate.textContent = `1.00 ${from} = 1.000000 ${to}`;
    return;
  }

  try {
    // Calling the Java Backend Server
    const response = await fetch(`${JAVA_API_URL}?from=${from}&to=${to}&amount=${amount}`);
    
    if (!response.ok) {
      throw new Error("Java server response error");
    }

    const data = await response.json();
    
    // UI Update with Live Java Result
    convertedOutput.value = Number(data.convertedAmount).toFixed(2);
    headlineRate.textContent = `1.00 ${data.base} = ${Number(data.rate).toFixed(6)} ${data.target}`;
    timestampInfo.textContent = `Mid-market rate • Live Java Calculation (${new Date().toLocaleTimeString()})`;
    document.getElementById("chart-live-rate").textContent = `${Number(data.rate).toFixed(6)} ${data.target}`;

  } catch (error) {
    // Graceful Fallback if Java Backend is not yet started in terminal
    console.warn("Java backend unreached, calculating via client fallback matrix:", error.message);
    fallbackClientConversion(from, to, amount);
  }
}

// Client Fallback Calculation
function fallbackClientConversion(from, to, amount) {
  const rateMatrix = {
    USD: 1.0,
    EUR: 0.8904,
    GBP: 0.7501,
    INR: 83.52,
    JPY: 158.25,
    CAD: 1.4083
  };

  const rate = (1.0 / (rateMatrix[from] || 1.0)) * (rateMatrix[to] || 1.0);
  const total = amount * rate;

  convertedOutput.value = total.toFixed(2);
  headlineRate.textContent = `1.00 ${from} = ${rate.toFixed(6)} ${to}`;
  timestampInfo.textContent = `Mid-market rate • Offline simulation mode`;
}

// Render Table with Mini SVG Sparklines (Screenshot 1)
function renderRatesTable() {
  const currentBase = fromCurrencySelect.value;
  document.getElementById("table-base-name").textContent = fromCurrencySelect.options[fromCurrencySelect.selectedIndex].text;
  document.getElementById("table-base-amount").textContent = amountInput.value || "1";

  ratesContainer.innerHTML = "";

  POPULAR_CURRENCIES.forEach(item => {
    if (item.code === currentBase) return;

    const row = document.createElement("div");
    row.className = "rate-row";

    // Generate random sparkline SVG path based on positive/negative
    const sparkColor = item.isPositive ? "#10b981" : "#ef4444";
    const sparkPath = item.isPositive
      ? "M 5 20 Q 25 10 45 18 T 85 5"
      : "M 5 5 Q 25 18 45 8 T 85 22";

    row.innerHTML = `
      <div class="currency-name-col">
        <span class="flag">${item.flag}</span>
        <span>${item.name}</span>
      </div>
      <div class="rate-val-col">${item.defaultRate}</div>
      <div>
        <span class="change-pill ${item.isPositive ? 'positive' : 'negative'}">
          ${item.change}
        </span>
      </div>
      <div>
        <svg class="mini-sparkline" viewBox="0 0 90 28">
          <path d="${sparkPath}" fill="none" stroke="${sparkColor}" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <button class="btn-row-send">✈ Send</button>
      </div>
    `;

    ratesContainer.appendChild(row);
  });
}