const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const apiStatus = document.querySelector("#api-status");
const collectionsRoot = document.querySelector("#collections");
const productsRoot = document.querySelector("#products");
const resultsCount = document.querySelector("#results-count");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const productTemplate = document.querySelector("#product-template");

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function renderCollections(items) {
  collectionsRoot.innerHTML = "";

  items.forEach((collection) => {
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
  resultsCount.textContent = `${items.length} product${items.length === 1 ? "" : "s"} available`;

  if (!items.length) {
    productsRoot.innerHTML = `
      <article class="product-card">
        <h3 class="product-title">No matching products</h3>
        <p class="product-description">Try a broader term like "audio" or "lighting".</p>
      </article>
    `;
    return;
  }

  items.forEach((product, index) => {
    const fragment = productTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".product-card");

    fragment.querySelector(".product-category").textContent = product.category;
    fragment.querySelector(".product-rating").textContent = `★ ${product.rating}`;
    fragment.querySelector(".product-title").textContent = product.title;
    fragment.querySelector(".product-description").textContent = product.description;
    fragment.querySelector(".product-accent").textContent = product.accent;
    fragment.querySelector(".product-price").textContent = currency.format(product.price);
    fragment.querySelector(".stock-badge").textContent = `${product.stock} in stock`;

    card.style.animationDelay = `${index * 90}ms`;
    productsRoot.append(fragment);
  });
}

async function loadProducts(query = "") {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await fetchJson(`/api/products${suffix}`);
  renderProducts(data.items);
}

async function boot() {
  try {
    const [health, collections, cart] = await Promise.all([
      fetchJson("/api/health"),
      fetchJson("/api/collections"),
      fetchJson("/api/cart/summary"),
    ]);

    apiStatus.textContent = `${health.status} • ${new Date(health.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    cartCount.textContent = String(cart.itemCount);
    cartTotal.textContent = currency.format(cart.total);
    renderCollections(collections.items);
    await loadProducts();
  } catch (error) {
    apiStatus.textContent = "API unavailable";
    resultsCount.textContent = "Failed to load catalog";
    productsRoot.innerHTML = `
      <article class="product-card">
        <h3 class="product-title">Connection error</h3>
        <p class="product-description">${error.message}</p>
      </article>
    `;
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadProducts(searchInput.value.trim());
});

boot();
