import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const products = [
  {
    id: "aurora-lamp",
    title: "Aurora Lamp",
    category: "Lighting",
    price: 129,
    accent: "Amber glass",
    rating: 4.9,
    stock: 14,
    description: "A soft hand-blown table lamp that turns corners into warm, quiet focal points.",
  },
  {
    id: "linen-chair",
    title: "Linen Lounge Chair",
    category: "Seating",
    price: 480,
    accent: "Natural oak",
    rating: 4.8,
    stock: 6,
    description: "Low-profile lounge seating with relaxed proportions and tailored Belgian linen.",
  },
  {
    id: "stone-tray",
    title: "Stone Catchall Tray",
    category: "Decor",
    price: 38,
    accent: "Travertine",
    rating: 4.7,
    stock: 31,
    description: "A compact tray for keys, jewelry, and desk objects cut from creamy natural stone.",
  },
  {
    id: "mono-speaker",
    title: "Mono Speaker",
    category: "Audio",
    price: 210,
    accent: "Matte aluminum",
    rating: 4.9,
    stock: 9,
    description: "A compact wireless speaker tuned for detail, wrapped in a restrained sculptural form.",
  },
];

const collections = [
  {
    name: "Quiet Office",
    note: "Desk pieces and audio made for focused mornings.",
  },
  {
    name: "Soft Corners",
    note: "Lighting and accents that warm up neutral interiors.",
  },
  {
    name: "Weekend Reset",
    note: "Simple objects that make home routines feel more deliberate.",
  },
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "marketplace-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/products", (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  const filtered = query
    ? products.filter((product) => {
        const haystack = [
          product.title,
          product.category,
          product.accent,
          product.description,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : products;

  res.json({
    items: filtered,
    total: filtered.length,
  });
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(product);
});

app.get("/api/collections", (_req, res) => {
  res.json({ items: collections });
});

app.get("/api/cart/summary", (_req, res) => {
  const subtotal = products.slice(0, 2).reduce((sum, item) => sum + item.price, 0);
  res.json({
    itemCount: 2,
    subtotal,
    shipping: 0,
    total: subtotal,
    currency: "EUR",
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Marketplace app listening on http://localhost:${port}`);
});
