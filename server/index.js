// ═══════════════════════════════════════════════════════════════════════════════
// NEXMOBILE — Backend API Server
// Express + JSON file database + JWT auth
// ═══════════════════════════════════════════════════════════════════════════════
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { read, update } = require("./db");

const app = express();
const PORT = process.env.PORT || 3456;
const JWT_SECRET = process.env.JWT_SECRET || "nexmobile-secret-key-change-in-production";

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));

// Auth middleware — checks JWT token
function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// POST /api/auth/login — Admin login
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });

  const db = read();
  if (!db.admin?.passwordHash) {
    return res.status(500).json({ error: "Admin not set up. Run: npm run seed" });
  }

  if (!bcrypt.compareSync(password, db.admin.passwordHash)) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, expiresIn: 86400 });
});

// POST /api/auth/change-password — Change admin password
app.post("/api/auth/change-password", authRequired, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both current and new password required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const db = read();
  if (!bcrypt.compareSync(currentPassword, db.admin.passwordHash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  update((d) => {
    d.admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  });
  res.json({ message: "Password changed" });
});

// GET /api/auth/verify — Check if token is valid
app.get("/api/auth/verify", authRequired, (req, res) => {
  res.json({ valid: true });
});

// ─── PHONES ROUTES (public read, admin write) ────────────────────────────────

// GET /api/phones — Get all phones (public)
app.get("/api/phones", (req, res) => {
  const db = read();
  // Public view: hide basePrice
  const phones = (db.phones || []).map(({ basePrice, ...rest }) => rest);
  res.json(phones);
});

// GET /api/phones/full — Get all phones with base prices (admin)
app.get("/api/phones/full", authRequired, (req, res) => {
  const db = read();
  res.json(db.phones || []);
});

// POST /api/phones — Add a phone (admin)
app.post("/api/phones", authRequired, (req, res) => {
  const phone = req.body;
  if (!phone.name || !phone.brand) {
    return res.status(400).json({ error: "Name and brand are required" });
  }

  const db = update((d) => {
    const maxId = d.phones.reduce((m, p) => Math.max(m, p.id || 0), 0);
    phone.id = maxId + 1;
    d.phones.push(phone);
  });
  res.json(phone);
});

// PUT /api/phones/:id — Update a phone (admin)
app.put("/api/phones/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  const updates = req.body;

  const db = read();
  const index = db.phones.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Phone not found" });

  update((d) => {
    d.phones[index] = { ...d.phones[index], ...updates, id };
  });
  res.json({ ...db.phones[index], ...updates, id });
});

// DELETE /api/phones/:id — Delete a phone (admin)
app.delete("/api/phones/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  update((d) => {
    d.phones = d.phones.filter((p) => p.id !== id);
  });
  res.json({ message: "Deleted" });
});

// POST /api/phones/bulk-price — Bulk price update (admin)
app.post("/api/phones/bulk-price", authRequired, (req, res) => {
  const { brand, series, mode, direction, amount } = req.body;
  const val = Number(amount);
  if (!val || val <= 0) return res.status(400).json({ error: "Invalid amount" });

  let count = 0;
  update((d) => {
    d.phones = d.phones.map((p) => {
      if (brand && brand !== "All" && p.brand !== brand) return p;
      if (series && series !== "All" && p.series !== series) return p;
      let newPrice = p.price;
      if (mode === "percent") {
        newPrice = direction === "increase"
          ? Math.round(p.price * (1 + val / 100))
          : Math.round(p.price * (1 - val / 100));
      } else {
        newPrice = direction === "increase" ? p.price + val : p.price - val;
      }
      count++;
      return { ...p, price: Math.max(1, Math.round(newPrice)) };
    });
  });
  res.json({ message: `Updated ${count} phones` });
});

// POST /api/phones/bulk-discount — Bulk discount (admin)
app.post("/api/phones/bulk-discount", authRequired, (req, res) => {
  const { brand, discount } = req.body;
  const val = Number(discount);
  if (val < 0 || val > 100) return res.status(400).json({ error: "Invalid discount" });

  update((d) => {
    d.phones = d.phones.map((p) => {
      if (brand && brand !== "All" && p.brand !== brand) return p;
      return { ...p, discount: val };
    });
  });
  res.json({ message: "Discounts updated" });
});

// POST /api/phones/reset — Reset phones to defaults (admin)
app.post("/api/phones/reset", authRequired, (req, res) => {
  // Re-read the seed data
  try {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(path.join(__dirname, "../src/data/phones.js"), "utf-8");
    const match = src.match(/const PHONES = \[([\s\S]*?)\n\];/);
    if (match) {
      const phones = new Function(`return [${match[1]}];`)();
      update((d) => { d.phones = phones; });
      return res.json({ message: `Reset to ${phones.length} default phones` });
    }
  } catch {}
  res.status(500).json({ error: "Could not reset" });
});

// ─── ORDERS ROUTES ────────────────────────────────────────────────────────────

// GET /api/orders — Get all orders (admin)
app.get("/api/orders", authRequired, (req, res) => {
  const db = read();
  res.json(db.orders || []);
});

// POST /api/orders — Create an order (public — from WhatsApp checkout)
app.post("/api/orders", (req, res) => {
  const order = req.body;
  if (!order.items || !order.total) {
    return res.status(400).json({ error: "Items and total required" });
  }

  order.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  order.date = new Date().toISOString();
  order.status = order.status || "pending";

  update((d) => {
    d.orders = d.orders || [];
    d.orders.unshift(order);
  });
  res.json(order);
});

// PUT /api/orders/:id — Update order status (admin)
app.put("/api/orders/:id", authRequired, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const db = read();
  const order = db.orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  update((d) => {
    const o = d.orders.find((o) => o.id === id);
    if (o) o.status = status;
  });
  res.json({ ...order, status });
});

// DELETE /api/orders — Clear all orders (admin)
app.delete("/api/orders", authRequired, (req, res) => {
  update((d) => { d.orders = []; });
  res.json({ message: "All orders cleared" });
});

// ─── BANNERS ROUTES ───────────────────────────────────────────────────────────

// GET /api/banners — Get active banners (public)
app.get("/api/banners", (req, res) => {
  const db = read();
  res.json((db.banners || []).filter((b) => b.active));
});

// GET /api/banners/all — Get all banners (admin)
app.get("/api/banners/all", authRequired, (req, res) => {
  const db = read();
  res.json(db.banners || []);
});

// POST /api/banners — Add banner (admin)
app.post("/api/banners", authRequired, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text required" });

  const banner = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    active: true,
  };
  update((d) => {
    d.banners = d.banners || [];
    d.banners.push(banner);
  });
  res.json(banner);
});

// PUT /api/banners/:id — Toggle/update banner (admin)
app.put("/api/banners/:id", authRequired, (req, res) => {
  const { id } = req.params;
  update((d) => {
    const b = d.banners.find((b) => b.id === id);
    if (b) Object.assign(b, req.body);
  });
  res.json({ message: "Updated" });
});

// DELETE /api/banners/:id — Delete banner (admin)
app.delete("/api/banners/:id", authRequired, (req, res) => {
  const { id } = req.params;
  update((d) => {
    d.banners = d.banners.filter((b) => b.id !== id);
  });
  res.json({ message: "Deleted" });
});

// ─── SETTINGS ROUTES ──────────────────────────────────────────────────────────

// GET /api/settings — Get public settings
app.get("/api/settings", (req, res) => {
  const db = read();
  const { storeName, waNumber } = db.settings || {};
  res.json({ storeName, waNumber });
});

// PUT /api/settings — Update settings (admin)
app.put("/api/settings", authRequired, (req, res) => {
  const { storeName, waNumber } = req.body;
  update((d) => {
    d.settings = { ...d.settings, storeName, waNumber };
  });
  res.json({ message: "Settings updated" });
});

// ─── BACKUP/RESTORE ───────────────────────────────────────────────────────────

// GET /api/backup — Download full database (admin)
app.get("/api/backup", authRequired, (req, res) => {
  const db = read();
  // Don't include password hash in backup
  const { admin, ...rest } = db;
  res.json(rest);
});

// POST /api/restore — Restore from backup (admin)
app.post("/api/restore", authRequired, (req, res) => {
  const data = req.body;
  if (!data.phones) return res.status(400).json({ error: "Invalid backup data" });

  update((d) => {
    if (data.phones) d.phones = data.phones;
    if (data.orders) d.orders = data.orders;
    if (data.banners) d.banners = data.banners;
    if (data.settings) d.settings = { ...d.settings, ...data.settings };
  });
  res.json({ message: "Restored" });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXMOBILE API running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/api/phones`);
});
