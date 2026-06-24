const apiStatus = document.querySelector("#api-status");
const collectionsRoot = document.querySelector("#collections");
const productsRoot = document.querySelector("#products");
const resultsCount = document.querySelector("#results-count");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const languageSelect = document.querySelector("#language-select");
const productTemplate = document.querySelector("#product-template");

const supportedLocales = ["en", "fr", "it"];

let currentLocale = "en";
let messages = {};
let currentProducts = [];
let currentCollections = [];
let currentCart = null;
let currentQuery = "";
let apiHealth = null;
let hasLoadedProducts = false;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function getPreferredLocale() {
  const stored = window.localStorage.getItem("marketplace-locale");
  if (stored && supportedLocales.includes(stored)) {
    return stored;
  }

  const browserLocale = navigator.language.slice(0, 2).toLowerCase();
  return supportedLocales.includes(browserLocale) ? browserLocale : "en";
}

function t(key, values = {}) {
  const template = messages[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_match, token) => String(values[token] ?? ""));
}

function translateProduct(product) {
  return {
    ...product,
    title: t(`product.${product.id}.title`),
    category: t(`product.${product.id}.category`),
    accent: t(`product.${product.id}.accent`),
    description: t(`product.${product.id}.description`),
  };
}

function collectionKeyFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function translateCollection(collection) {
  const key = collectionKeyFromName(collection.name);
  return {
    ...collection,
    name: t(`collection.${key}.name`),
    note: t(`collection.${key}.note`),
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(currentLocale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function setStaticTranslations() {
  document.documentElement.lang = currentLocale;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  if (languageSelect) {
    languageSelect.setAttribute("aria-label", t("language.label"));
    languageSelect.value = currentLocale;
  }
}

function updateStatus() {
  if (!apiHealth) {
    apiStatus.textContent = t("status.connecting");
    return;
  }

  apiStatus.textContent = t("status.ok", {
    status: apiHealth.status,
    time: new Date(apiHealth.timestamp).toLocaleTimeString(currentLocale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}

function renderCollections(items) {
  collectionsRoot.innerHTML = "";

  items.map(translateCollection).forEach((collection) => {
    const card = document.createElement("article");
    card.innerHTML = `
      <h3>${collection.name}</h3>
      <p>${collection.note}</p>
    `;
    collectionsRoot.append(card);
  });
}

function renderProducts(items) {
  productsRoot.innerHTML = "";
  resultsCount.textContent = t(
    items.length === 1 ? "results.available_one" : "results.available_other",
    { count: items.length },
  );

  if (!items.length) {
    productsRoot.innerHTML = `
      <article class="product-card">
        <h3 class="product-title">${t("catalog.noneTitle")}</h3>
        <p class="product-description">${t("catalog.noneBody")}</p>
      </article>
    `;
    return;
  }

  items.map(translateProduct).forEach((product, index) => {
    const fragment = productTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".product-card");

    fragment.querySelector(".product-category").textContent = product.category;
    fragment.querySelector(".product-rating").textContent = t("product.rating", {
      rating: product.rating,
    });
    fragment.querySelector(".product-title").textContent = product.title;
    fragment.querySelector(".product-description").textContent = product.description;
    fragment.querySelector(".product-accent").textContent = product.accent;
    fragment.querySelector(".product-price").textContent = formatCurrency(product.price);
    fragment.querySelector(".stock-badge").textContent = t("product.inStock", {
      count: product.stock,
    });

    card.style.animationDelay = `${index * 90}ms`;
    productsRoot.append(fragment);
  });
}

function renderCart(cart) {
  cartCount.textContent = String(cart.itemCount);
  cartTotal.textContent = formatCurrency(cart.total);
}

async function loadProducts(query = "") {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await fetchJson(`/api/products${suffix}`);
  currentProducts = data.items;
  currentQuery = query;
  hasLoadedProducts = true;
  renderProducts(currentProducts);
}

async function loadMessages(locale) {
  const response = await fetch(`/locales/${locale}.json`);
  if (!response.ok) {
    throw new Error(`Locale not found: ${locale}`);
  }
  messages = await response.json();
}

async function setLocale(locale) {
  const nextLocale = supportedLocales.includes(locale) ? locale : "en";
  await loadMessages(nextLocale);
  currentLocale = nextLocale;
  window.localStorage.setItem("marketplace-locale", nextLocale);

  setStaticTranslations();
  updateStatus();

  if (currentCart) {
    renderCart(currentCart);
  }

  if (currentCollections.length) {
    renderCollections(currentCollections);
  }

  if (hasLoadedProducts) {
    renderProducts(currentProducts);
  } else {
    resultsCount.textContent = t("results.loading");
  }
}

async function boot() {
  try {
    await setLocale(getPreferredLocale());

    const [health, collections, cart] = await Promise.all([
      fetchJson("/api/health"),
      fetchJson("/api/collections"),
      fetchJson("/api/cart/summary"),
    ]);

    apiHealth = health;
    currentCollections = collections.items;
    currentCart = cart;

    updateStatus();
    renderCart(cart);
    renderCollections(currentCollections);
    await loadProducts();
  } catch (error) {
    apiStatus.textContent = t("status.unavailable");
    resultsCount.textContent = t("status.unavailable");
    productsRoot.innerHTML = `
      <article class="product-card">
        <h3 class="product-title">${t("catalog.errorTitle")}</h3>
        <p class="product-description">${t("catalog.errorBody", { message: error.message })}</p>
      </article>
    `;
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadProducts(searchInput.value.trim());
});

languageSelect?.addEventListener("change", async (event) => {
  try {
    await setLocale(event.target.value);
  } catch (error) {
    apiStatus.textContent = error.message;
  }
});

boot();
