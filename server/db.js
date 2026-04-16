// ─── Simple JSON File Database ────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.json");

const DEFAULT_DB = {
  admin: { passwordHash: null },
  phones: [],
  orders: [],
  banners: [
    { id: "1", text: "Free delivery on orders over $200!", active: true },
    { id: "2", text: "New Samsung S26 series now available!", active: true },
  ],
  settings: {
    storeName: "NEXMOBILE",
    waNumber: "263781138456",
  },
};

function read() {
  try {
    if (!fs.existsSync(DB_PATH)) return { ...DEFAULT_DB };
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_DB };
  }
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function update(fn) {
  const db = read();
  fn(db);
  write(db);
  return db;
}

module.exports = { read, write, update, DEFAULT_DB };
