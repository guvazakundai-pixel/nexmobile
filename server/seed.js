// ─── Seed the database with phone catalog ────────────────────────────────────
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { read, write, DEFAULT_DB } = require("./db");

// Read the phones data from the ES module source and convert
const phonesSource = fs.readFileSync(
  path.join(__dirname, "../src/data/phones.js"),
  "utf-8"
);

// Extract the PHONES array by evaluating it (safe since we control the file)
// We'll parse it manually by extracting the array content
const match = phonesSource.match(/const PHONES = \[([\s\S]*?)\n\];/);
if (!match) {
  console.error("Could not parse phones data");
  process.exit(1);
}

// Build phones array using Function constructor
const phonesCode = `return [${match[1]}];`;
let phones;
try {
  phones = new Function(phonesCode)();
} catch (e) {
  console.error("Error parsing phones:", e.message);
  process.exit(1);
}

// Default admin password
const ADMIN_PASSWORD = process.argv[2] || "nexmobile2024";
const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

const db = {
  ...DEFAULT_DB,
  admin: { passwordHash: hash },
  phones: phones,
};

write(db);
console.log(`Database seeded with ${phones.length} phones`);
console.log(`Admin password set to: ${ADMIN_PASSWORD}`);
console.log(`Database saved to: ${path.join(__dirname, "data.json")}`);
