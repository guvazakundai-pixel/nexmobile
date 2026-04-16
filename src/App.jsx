import { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import PHONES_DEFAULT, { BRANDS, SERIES_LIST } from "./data/phones";

/* ═══════════════════════════════════════════════════════════════════════════════
   NEXMOBILE — Complete E-Commerce Store + Admin Panel
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CFG = { brand: "NEXMOBILE", tagline: "Zimbabwe's #1 Phone Store", wa: "263781138456", adminPw: "nexmobile2024", perPage: 20 };
const waLink = (m) => `https://wa.me/${CFG.wa}?text=${encodeURIComponent(m)}`;
const waOrder = (p) => waLink(`Hi ${CFG.brand}! I'm interested in:\n\n${p.name}\n${p.storage} / ${p.ram}\nPrice: $${p.price}\n\nIs it available?`);
const fmt = (n) => `$${Number(n).toLocaleString()}`;
const starStr = (n) => "\u2605".repeat(Math.round(n)) + "\u2606".repeat(5 - Math.round(n));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────
const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(`nex_${k}`); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(`nex_${k}`, JSON.stringify(v)); } catch {} },
};

// ─── STORE CONTEXT ────────────────────────────────────────────────────────────
const StoreCtx = createContext();
function StoreProvider({ children }) {
  const [phones, setPhones] = useState(() => ls.get("phones", PHONES_DEFAULT));
  const [cart, setCart] = useState(() => ls.get("cart", []));
  const [wishlist, setWishlist] = useState(() => ls.get("wish", []));
  const [orders, setOrders] = useState(() => ls.get("orders", []));
  const [banners, setBanners] = useState(() => ls.get("banners", [{ id: "1", text: "Free delivery on orders over $200!", active: true }, { id: "2", text: "New Samsung S26 series now available!", active: true }]));
  const [settings, setSettings] = useState(() => ls.get("settings", { storeName: CFG.brand, waNumber: CFG.wa, adminPw: CFG.adminPw }));
  const [dark, setDark] = useState(() => ls.get("dark", false));
  const [toast, setToast] = useState(null);

  useEffect(() => { ls.set("phones", phones); }, [phones]);
  useEffect(() => { ls.set("cart", cart); }, [cart]);
  useEffect(() => { ls.set("wish", wishlist); }, [wishlist]);
  useEffect(() => { ls.set("orders", orders); }, [orders]);
  useEffect(() => { ls.set("banners", banners); }, [banners]);
  useEffect(() => { ls.set("settings", settings); }, [settings]);
  useEffect(() => { ls.set("dark", dark); document.body.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  const addToCart = useCallback((phone, storage) => {
    setCart(prev => {
      const key = `${phone.id}_${storage}`;
      const existing = prev.find(i => i.key === key);
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key, id: phone.id, name: phone.name, brand: phone.brand, storage, price: phone.price, qty: 1 }];
    });
    setToast(`${phone.name} added to cart`);
  }, []);

  const updateCartQty = useCallback((key, delta) => {
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  }, []);

  const removeFromCart = useCallback((key) => { setCart(prev => prev.filter(i => i.key !== key)); }, []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleWish = useCallback((id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const value = {
    phones, setPhones, cart, addToCart, updateCartQty, removeFromCart, clearCart, cartTotal, cartCount,
    wishlist, toggleWish, orders, setOrders, banners, setBanners, settings, setSettings,
    dark, setDark, toast, setToast,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
const useStore = () => useContext(StoreCtx);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}

function AppRouter() {
  const [view, setView] = useState("store"); // store | admin
  const [adminAuth, setAdminAuth] = useState(false);

  if (view === "admin") {
    if (!adminAuth) return <AdminLogin onAuth={() => setAdminAuth(true)} onBack={() => setView("store")} />;
    return <AdminPanel onLogout={() => { setAdminAuth(false); setView("store"); }} />;
  }
  return <StoreFront onAdmin={() => setView("admin")} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// STOREFRONT
// ═════════════════════════════════════════════════════════════════════════════
function StoreFront({ onAdmin }) {
  const { phones, dark, setDark, cartCount, wishlist, banners, toast } = useStore();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [series, setSeries] = useState("All");
  const [sort, setSort] = useState("popular");
  const [detail, setDetail] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showWish, setShowWish] = useState(false);

  const filtered = useMemo(() => {
    let list = [...phones];
    if (brand !== "All") list = list.filter(p => p.brand === brand);
    if (series !== "All") list = list.filter(p => p.series === series);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.series.toLowerCase().includes(q) || p.processor.toLowerCase().includes(q));
    }
    if (showWish) list = list.filter(p => wishlist.includes(p.id));
    switch (sort) {
      case "price-low": list.sort((a, b) => a.price - b.price); break;
      case "price-high": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "newest": list.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0)); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.reviews - a.reviews);
    }
    return list;
  }, [phones, brand, series, search, sort, wishlist, showWish]);

  const totalPages = Math.ceil(filtered.length / CFG.perPage);
  const paginated = filtered.slice((page - 1) * CFG.perPage, page * CFG.perPage);
  useEffect(() => setPage(1), [brand, series, search, sort, showWish]);

  const activeBanners = banners.filter(b => b.active);

  return (
    <div className="fade-in">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar__inner">
          <div className="navbar__logo" onClick={() => { setBrand("All"); setSeries("All"); setSearch(""); setShowWish(false); }}>
            {CFG.brand} <span>ZW</span>
          </div>
          <div className="navbar__search">
            <input placeholder="Search phones..." value={search} onChange={e => setSearch(e.target.value)} />
            <span className="navbar__search-icon">&#128269;</span>
          </div>
          <div className="navbar__actions">
            <button className="navbar__btn hide-mobile" onClick={() => setShowWish(!showWish)} title="Wishlist">
              {showWish ? "\u2665" : "\u2661"}
              {wishlist.length > 0 && <span className="navbar__badge">{wishlist.length}</span>}
            </button>
            <button className="navbar__btn" onClick={() => setCartOpen(true)} title="Cart">
              &#128722;{cartCount > 0 && <span className="navbar__badge">{cartCount}</span>}
            </button>
            <button className="navbar__btn" onClick={() => setDark(!dark)} title="Theme">
              {dark ? "\u2600" : "\u263E"}
            </button>
            <button className="navbar__cat-btn hide-mobile" onClick={onAdmin}>Admin</button>
          </div>
        </div>
      </nav>

      {/* Category Chips */}
      <div className="cat-bar">
        {["All", "Samsung", "Apple", "Google"].map(b => (
          <button key={b} className={`cat-chip ${brand === b ? "cat-chip--active" : ""}`} onClick={() => { setBrand(b); setSeries("All"); setShowWish(false); }}>{b}</button>
        ))}
        <span style={{ width: 1, height: 24, background: dark ? "#334155" : "#e2e8f0", flexShrink: 0 }} />
        {["All", ...SERIES_LIST].map(s => (
          <button key={s} className={`cat-chip ${series === s ? "cat-chip--active" : ""}`} onClick={() => { setSeries(s); setShowWish(false); }}>{s}</button>
        ))}
      </div>

      {/* Hero Banner */}
      {!search && brand === "All" && !showWish && (
        <div className="hero">
          <div className="hero__card">
            <h2>{activeBanners[0]?.text || "Welcome to NEXMOBILE"}</h2>
            <p>Premium smartphones at Zimbabwe's best prices. Boxed & sealed with warranty.</p>
            <button className="hero__btn" onClick={() => setBrand("Samsung")}>Shop Samsung &#8594;</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-bar">
        <span className="controls-bar__count">{filtered.length} phone{filtered.length !== 1 ? "s" : ""} found</span>
        <div className="controls-bar__right">
          <select className="controls-bar__sort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest First</option>
            <option value="name">Name A-Z</option>
          </select>
          <button className="navbar__cat-btn show-mobile" onClick={onAdmin}>Admin</button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {paginated.map(phone => (
          <ProductCard key={phone.id} phone={phone} onClick={() => setDetail(phone)} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">&#128270;</div>
          <div className="empty-state__text">{showWish ? "Your wishlist is empty" : "No phones match your search"}</div>
          <button className="empty-state__btn" onClick={() => { setSearch(""); setBrand("All"); setSeries("All"); setShowWish(false); }}>Show All Phones</button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>&#8249;</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`pagination__btn ${p === page ? "pagination__btn--active" : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>&#8250;</button>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__col">
            <h4>{CFG.brand}</h4>
            <p>{CFG.tagline}</p>
            <p>Boxed & sealed phones with warranty</p>
          </div>
          <div className="footer__col">
            <h4>Quick Links</h4>
            <a href="#" onClick={e => { e.preventDefault(); setBrand("Samsung"); }}>Samsung</a>
            <a href="#" onClick={e => { e.preventDefault(); setBrand("Apple"); }}>iPhone</a>
            <a href="#" onClick={e => { e.preventDefault(); setBrand("Google"); }}>Google Pixel</a>
          </div>
          <div className="footer__col">
            <h4>Contact</h4>
            <a href={waLink(`Hi ${CFG.brand}!`)} target="_blank" rel="noopener noreferrer">WhatsApp: +{CFG.wa}</a>
            <p>Zimbabwe</p>
          </div>
          <div className="footer__col">
            <h4>Info</h4>
            <p>All phones are boxed & sealed</p>
            <p>Prices in USD</p>
            <a href="#" onClick={e => { e.preventDefault(); onAdmin(); }}>Admin Panel</a>
          </div>
        </div>
        <div className="footer__bottom">&copy; 2024-2026 {CFG.brand}. All rights reserved.</div>
      </footer>

      {/* Product Detail Modal */}
      {detail && <ProductDetail phone={detail} onClose={() => setDetail(null)} />}

      {/* Cart Sidebar */}
      {cartOpen && <CartPanel onClose={() => setCartOpen(false)} />}

      {/* WhatsApp Float */}
      <a className="wa-float" href={waLink(`Hi ${CFG.brand}! I'd like to browse your phones.`)} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">
        &#128172;
      </a>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ phone, onClick }) {
  const { addToCart, wishlist, toggleWish } = useStore();
  const isWished = wishlist.includes(phone.id);
  const discountedPrice = phone.discount > 0 ? Math.round(phone.price * (1 - phone.discount / 100)) : phone.price;
  const brandInfo = BRANDS[phone.brand] || {};
  const badgeType = phone.badge?.toLowerCase().includes("hot") ? "hot" : phone.badge?.toLowerCase().includes("new") || phone.badge?.toLowerCase().includes("latest") ? "new" : phone.badge?.toLowerCase().includes("value") || phone.badge?.toLowerCase().includes("seller") || phone.badge?.toLowerCase().includes("popular") ? "value" : phone.badge?.toLowerCase().includes("pro") || phone.badge?.toLowerCase().includes("flag") ? "pro" : "";

  return (
    <div className="product-card">
      <div className="product-card__img" onClick={onClick}>
        <div className="product-card__img-placeholder" style={{ background: `linear-gradient(135deg, ${brandInfo.bg || "#f1f5f9"} 0%, ${brandInfo.bg || "#e2e8f0"} 100%)`, color: brandInfo.color || "#cbd5e1" }}>
          {phone.brand === "Apple" ? "\uF8FF" : phone.name.split(" ").pop().charAt(0)}
        </div>
        <div className="product-card__badges">
          {phone.badge && <span className={`product-card__badge product-card__badge--${badgeType || "value"}`}>{phone.badge}</span>}
          {phone.discount > 0 && <span className="product-card__badge product-card__badge--disc">-{phone.discount}%</span>}
        </div>
      </div>
      <button className={`product-card__wish ${isWished ? "product-card__wish--active" : ""}`} onClick={e => { e.stopPropagation(); toggleWish(phone.id); }}>
        {isWished ? "\u2665" : "\u2661"}
      </button>
      <div className="product-card__body">
        <div className="product-card__brand">{phone.brand}</div>
        <div className="product-card__name" onClick={onClick}>{phone.name}</div>
        <div className="product-card__specs">{phone.storage} &middot; {phone.ram} RAM</div>
        <div className="product-card__rating">
          <span className="product-card__stars">{starStr(phone.rating)}</span>
          <span className="product-card__reviews">({phone.reviews})</span>
        </div>
        <div className="product-card__price-row">
          <span className="product-card__price">{fmt(discountedPrice)}</span>
          {phone.discount > 0 && <span className="product-card__price-old">{fmt(phone.price)}</span>}
        </div>
        <div className="product-card__actions">
          <button className="product-card__cart-btn" onClick={() => addToCart({ ...phone, price: discountedPrice }, phone.storage)}>
            &#128722; Add
          </button>
          <a className="product-card__wa-btn" href={waOrder(phone)} target="_blank" rel="noopener noreferrer" title="WhatsApp">
            &#128172;
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
function ProductDetail({ phone, onClose }) {
  const { addToCart, wishlist, toggleWish } = useStore();
  const [selStorage, setSelStorage] = useState(phone.storage);
  const isWished = wishlist.includes(phone.id);
  const discountedPrice = phone.discount > 0 ? Math.round(phone.price * (1 - phone.discount / 100)) : phone.price;
  const brandInfo = BRANDS[phone.brand] || {};

  const specs = [
    { label: "Display", value: phone.display },
    { label: "Processor", value: phone.processor },
    { label: "Camera", value: phone.camera },
    { label: "Front Camera", value: phone.frontCamera },
    { label: "Battery", value: phone.battery },
    { label: "RAM", value: phone.ram },
    { label: "Storage", value: phone.storageOptions?.join(" / ") || phone.storage },
    { label: "OS", value: phone.os },
  ];

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail" onClick={e => e.stopPropagation()}>
        <div className="detail__top">
          <button className="detail__close" onClick={onClose}>&times;</button>
          <div className="detail__img" style={{ background: `linear-gradient(135deg, ${brandInfo.bg || "#f8fafc"} 0%, #f1f5f9 100%)` }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: brandInfo.color || "#cbd5e1" }}>
              {phone.brand === "Apple" ? "\uF8FF" : phone.name.split(" ").pop().charAt(0)}
            </span>
          </div>
        </div>
        <div className="detail__body">
          <div className="detail__brand">{phone.brand} &middot; {phone.series}</div>
          <h1 className="detail__name">{phone.name}</h1>
          <div className="detail__rating">
            <span className="detail__stars">{starStr(phone.rating)}</span>
            <span className="detail__reviews">{phone.rating} ({phone.reviews} reviews)</span>
          </div>
          <div className="detail__price-row">
            <span className="detail__price">{fmt(discountedPrice)}</span>
            {phone.discount > 0 && <span className="detail__price-old">{fmt(phone.price)}</span>}
          </div>
          <div className={`detail__stock ${phone.stock > 5 ? "detail__stock--in" : phone.stock > 0 ? "detail__stock--low" : "detail__stock--out"}`}>
            {phone.stock > 5 ? "In Stock" : phone.stock > 0 ? `Only ${phone.stock} left` : "Out of Stock"}
          </div>

          {phone.storageOptions && phone.storageOptions.length > 1 && (
            <div className="detail__storage-options">
              {phone.storageOptions.map(s => (
                <button key={s} className={`detail__storage-btn ${s === selStorage ? "detail__storage-btn--active" : ""}`} onClick={() => setSelStorage(s)}>{s}</button>
              ))}
            </div>
          )}

          <p className="detail__desc">{phone.description}</p>

          <div className="detail__specs">
            {specs.map(s => (
              <div key={s.label} className="detail__spec">
                <div className="detail__spec-label">{s.label}</div>
                <div className="detail__spec-value">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="detail__actions">
            <button className="detail__cart-btn" onClick={() => { addToCart({ ...phone, price: discountedPrice }, selStorage); onClose(); }}>
              &#128722; Add to Cart
            </button>
            <a className="detail__wa-btn" href={waOrder({ ...phone, storage: selStorage })} target="_blank" rel="noopener noreferrer">
              &#128172; WhatsApp Order
            </a>
            <button className={`detail__wish-btn ${isWished ? "detail__wish-btn--active" : ""}`} onClick={() => toggleWish(phone.id)}>
              {isWished ? "\u2665" : "\u2661"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CART PANEL ───────────────────────────────────────────────────────────────
function CartPanel({ onClose }) {
  const { cart, updateCartQty, removeFromCart, clearCart, cartTotal, setOrders, setToast } = useStore();
  const brandInitial = (b) => (BRANDS[b]?.icon || "?");

  const checkout = () => {
    if (cart.length === 0) return;
    const items = cart.map(i => `${i.name} (${i.storage}) x${i.qty} = ${fmt(i.price * i.qty)}`).join("\n");
    const msg = `Hi ${CFG.brand}!\n\nI'd like to order:\n\n${items}\n\nTotal: ${fmt(cartTotal)}\n\nPlease confirm availability.`;
    const order = { id: uid(), items: [...cart], total: cartTotal, date: new Date().toISOString(), status: "pending" };
    setOrders(prev => [order, ...prev]);
    window.open(waLink(msg), "_blank");
    setToast("Order sent via WhatsApp!");
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-panel">
        <div className="cart-panel__header">
          <span className="cart-panel__title">Cart ({cart.length})</span>
          <button className="cart-panel__close" onClick={onClose}>&times;</button>
        </div>
        <div className="cart-panel__items">
          {cart.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">&#128722;</div>
              <div className="empty-state__text">Your cart is empty</div>
            </div>
          ) : cart.map(item => (
            <div key={item.key} className="cart-item">
              <div className="cart-item__img">{brandInitial(item.brand)}</div>
              <div className="cart-item__info">
                <div className="cart-item__name">{item.name}</div>
                <div className="cart-item__storage">{item.storage}</div>
                <div className="cart-item__bottom">
                  <span className="cart-item__price">{fmt(item.price * item.qty)}</span>
                  <div className="cart-item__qty">
                    <button onClick={() => updateCartQty(item.key, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateCartQty(item.key, 1)}>+</button>
                  </div>
                  <button className="cart-item__remove" onClick={() => removeFromCart(item.key)}>&times;</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="cart-panel__footer">
            <div className="cart-panel__total">
              <span>Total</span><span>{fmt(cartTotal)}</span>
            </div>
            <button className="cart-panel__checkout" onClick={checkout}>
              &#128172; Checkout via WhatsApp
            </button>
            <button className="cart-panel__clear" onClick={clearCart}>Clear Cart</button>
          </div>
        )}
      </div>
    </>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═════════════════════════════════════════════════════════════════════════════

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onAuth, onBack }) {
  const { settings } = useStore();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (pw === settings.adminPw) onAuth();
    else setErr("Incorrect password");
  };
  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo">{CFG.brand}</div>
        <div className="login__sub">Admin Panel Login</div>
        <input className="login__input" type="password" placeholder="Enter password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} autoFocus />
        <button className="login__btn" type="submit">Login</button>
        {err && <div className="login__error">{err}</div>}
        <button type="button" style={{ marginTop: 16, color: "#6b7280", fontSize: 13 }} onClick={onBack}>&larr; Back to Store</button>
      </form>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
const ADMIN_SECTIONS = [
  { id: "dashboard", icon: "\u2302", label: "Dashboard" },
  { id: "products", icon: "\u260E", label: "Products" },
  { id: "categories", icon: "\u2630", label: "Categories" },
  { id: "pricing", icon: "\u0024", label: "Pricing Tools" },
  { id: "orders", icon: "\u2709", label: "Orders" },
  { id: "promotions", icon: "\u2605", label: "Promotions" },
  { id: "settings", icon: "\u2699", label: "Settings" },
];

function AdminPanel({ onLogout }) {
  const { dark, setDark } = useStore();
  const [section, setSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <AdminDashboard />;
      case "products": return <AdminProducts />;
      case "categories": return <AdminCategories />;
      case "pricing": return <AdminPricing />;
      case "orders": return <AdminOrders />;
      case "promotions": return <AdminPromotions />;
      case "settings": return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="admin">
      <aside className={`admin__sidebar ${sidebarOpen ? "admin__sidebar--open" : ""}`}>
        <div className="admin__sidebar-header">
          <div className="admin__sidebar-logo">{CFG.brand}</div>
          <div className="admin__sidebar-sub">Admin Panel</div>
        </div>
        <nav className="admin__nav">
          {ADMIN_SECTIONS.map(s => (
            <button key={s.id} className={`admin__nav-item ${section === s.id ? "admin__nav-item--active" : ""}`} onClick={() => { setSection(s.id); setSidebarOpen(false); }}>
              <span className="admin__nav-icon">{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: "1px solid var(--border, #e8edf2)" }}>
          <button className="admin__nav-item" onClick={() => setDark(!dark)}>
            <span className="admin__nav-icon">{dark ? "\u2600" : "\u263E"}</span>{dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="admin__nav-item" style={{ color: "#ef4444" }} onClick={onLogout}>
            <span className="admin__nav-icon">&larr;</span>Exit Admin
          </button>
        </div>
      </aside>
      <main className="admin__content">{renderSection()}</main>
      <button className="admin__mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? "\u2715" : "\u2630"}
      </button>
    </div>
  );
}

// ─── ADMIN: DASHBOARD ─────────────────────────────────────────────────────────
function AdminDashboard() {
  const { phones, orders, cart } = useStore();
  const totalRevenuePotential = phones.reduce((s, p) => s + p.price * p.stock, 0);
  const totalProfit = phones.reduce((s, p) => s + (p.price - p.basePrice) * p.stock, 0);
  const lowStock = phones.filter(p => p.stock <= 3).length;
  const outOfStock = phones.filter(p => p.stock === 0).length;
  const avgPrice = Math.round(phones.reduce((s, p) => s + p.price, 0) / phones.length);

  return (
    <div className="fade-in">
      <div className="admin__header">
        <h1 className="admin__title">Dashboard</h1>
      </div>
      <div className="admin__stats">
        <div className="admin__stat-card">
          <div className="admin__stat-label">Total Products</div>
          <div className="admin__stat-value">{phones.length}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label">Revenue Potential</div>
          <div className="admin__stat-value">{fmt(totalRevenuePotential)}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label">Potential Profit</div>
          <div className="admin__stat-value" style={{ color: "#10b981" }}>{fmt(totalProfit)}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label">Avg. Price</div>
          <div className="admin__stat-value">{fmt(avgPrice)}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label">Low Stock Alerts</div>
          <div className="admin__stat-value" style={{ color: lowStock > 0 ? "#f59e0b" : "#10b981" }}>{lowStock}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label">Out of Stock</div>
          <div className="admin__stat-value" style={{ color: outOfStock > 0 ? "#ef4444" : "#10b981" }}>{outOfStock}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label">Total Orders</div>
          <div className="admin__stat-value">{orders.length}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label">Items in Carts</div>
          <div className="admin__stat-value">{cart.length}</div>
        </div>
      </div>

      {/* Brand Breakdown */}
      <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>By Brand</h3>
      <div className="admin__stats" style={{ marginBottom: 24 }}>
        {Object.keys(BRANDS).map(b => {
          const brandPhones = phones.filter(p => p.brand === b);
          return (
            <div key={b} className="admin__stat-card">
              <div className="admin__stat-label" style={{ color: BRANDS[b].color }}>{b}</div>
              <div className="admin__stat-value">{brandPhones.length}</div>
              <div className="admin__stat-change" style={{ color: "#6b7280" }}>
                {fmt(Math.min(...brandPhones.map(p => p.price)))} - {fmt(Math.max(...brandPhones.map(p => p.price)))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Items */}
      {lowStock > 0 && (
        <>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>Low Stock Items</h3>
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead><tr><th>Product</th><th>Stock</th><th>Price</th></tr></thead>
              <tbody>
                {phones.filter(p => p.stock <= 3).map(p => (
                  <tr key={p.id}><td>{p.name}</td><td style={{ color: p.stock === 0 ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>{p.stock}</td><td>{fmt(p.price)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN: PRODUCTS ──────────────────────────────────────────────────────────
function AdminProducts() {
  const { phones, setPhones, setToast } = useStore();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [editPhone, setEditPhone] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    let list = [...phones];
    if (brandFilter !== "All") list = list.filter(p => p.brand === brandFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [phones, search, brandFilter]);

  const deletePhone = (id) => {
    if (!confirm("Delete this product?")) return;
    setPhones(prev => prev.filter(p => p.id !== id));
    setToast("Product deleted");
  };

  const savePhone = (data) => {
    if (data.id) {
      setPhones(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
      setToast("Product updated");
    } else {
      const newId = Math.max(0, ...phones.map(p => p.id)) + 1;
      setPhones(prev => [...prev, { ...data, id: newId }]);
      setToast("Product added");
    }
    setEditPhone(null);
    setShowAdd(false);
  };

  return (
    <div className="fade-in">
      <div className="admin__header">
        <h1 className="admin__title">Products ({phones.length})</h1>
        <div className="admin__header-actions">
          <button className="admin__btn admin__btn--primary" onClick={() => setShowAdd(true)}>+ Add Product</button>
          <button className="admin__btn admin__btn--outline" onClick={() => { if (confirm("Reset all products to defaults?")) { setPhones(PHONES_DEFAULT); setToast("Products reset"); } }}>Reset</button>
        </div>
      </div>

      <div className="admin__filter-bar">
        <input className="admin__search" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="admin__select" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
          <option value="All">All Brands</option>
          <option value="Samsung">Samsung</option>
          <option value="Apple">Apple</option>
          <option value="Google">Google</option>
        </select>
      </div>

      <div className="admin__table-wrap" style={{ overflowX: "auto" }}>
        <table className="admin__table">
          <thead>
            <tr><th>Name</th><th>Brand</th><th>Storage</th><th>Base</th><th>Sell</th><th>Profit</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, maxWidth: 200 }}>{p.name}</td>
                <td>{p.brand}</td>
                <td>{p.storage}</td>
                <td>{fmt(p.basePrice)}</td>
                <td style={{ fontWeight: 700, color: "#0056d2" }}>{fmt(p.price)}</td>
                <td style={{ color: "#10b981", fontWeight: 600 }}>{fmt(p.price - p.basePrice)}</td>
                <td style={{ color: p.stock <= 3 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>{p.stock}</td>
                <td>
                  <div className="admin__table-actions">
                    <button className="admin__table-btn" onClick={() => setEditPhone(p)}>Edit</button>
                    <button className="admin__table-btn admin__table-btn--danger" onClick={() => deletePhone(p.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editPhone || showAdd) && (
        <ProductForm
          phone={editPhone || {}}
          onSave={savePhone}
          onClose={() => { setEditPhone(null); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

// ─── PRODUCT FORM (Add/Edit) ──────────────────────────────────────────────────
function ProductForm({ phone, onSave, onClose }) {
  const [form, setForm] = useState({
    name: phone.name || "", brand: phone.brand || "Samsung", series: phone.series || "Galaxy S",
    ram: phone.ram || "8GB", storage: phone.storage || "128GB",
    storageOptions: phone.storageOptions?.join(", ") || "128GB, 256GB",
    basePrice: phone.basePrice || 0, price: phone.price || 0,
    display: phone.display || "", camera: phone.camera || "", frontCamera: phone.frontCamera || "",
    battery: phone.battery || "", processor: phone.processor || "", os: phone.os || "",
    rating: phone.rating || 4.0, reviews: phone.reviews || 0,
    discount: phone.discount || 0, badge: phone.badge || "",
    hot: phone.hot || false, newArrival: phone.newArrival || false,
    stock: phone.stock || 10, description: phone.description || "",
  });
  const u = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    onSave({
      ...phone, ...form,
      basePrice: Number(form.basePrice), price: Number(form.price),
      rating: Number(form.rating), reviews: Number(form.reviews),
      discount: Number(form.discount), stock: Number(form.stock),
      storageOptions: form.storageOptions.split(",").map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="admin__modal-overlay" onClick={onClose}>
      <div className="admin__modal" onClick={e => e.stopPropagation()}>
        <div className="admin__modal-header">
          <span className="admin__modal-title">{phone.id ? "Edit Product" : "Add Product"}</span>
          <button className="admin__modal-close" onClick={onClose}>&times;</button>
        </div>
        <form className="admin__modal-body" onSubmit={save}>
          <div className="admin__form-group">
            <label className="admin__form-label">Phone Name</label>
            <input className="admin__form-input" value={form.name} onChange={e => u("name", e.target.value)} required />
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">Brand</label>
              <select className="admin__form-input" value={form.brand} onChange={e => u("brand", e.target.value)}>
                <option>Samsung</option><option>Apple</option><option>Google</option>
              </select>
            </div>
            <div className="admin__form-group">
              <label className="admin__form-label">Series</label>
              <input className="admin__form-input" value={form.series} onChange={e => u("series", e.target.value)} />
            </div>
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">RAM</label>
              <input className="admin__form-input" value={form.ram} onChange={e => u("ram", e.target.value)} />
            </div>
            <div className="admin__form-group">
              <label className="admin__form-label">Default Storage</label>
              <input className="admin__form-input" value={form.storage} onChange={e => u("storage", e.target.value)} />
            </div>
          </div>
          <div className="admin__form-group">
            <label className="admin__form-label">Storage Options (comma-separated)</label>
            <input className="admin__form-input" value={form.storageOptions} onChange={e => u("storageOptions", e.target.value)} />
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">Base Price (USD)</label>
              <input className="admin__form-input" type="number" value={form.basePrice} onChange={e => u("basePrice", e.target.value)} />
            </div>
            <div className="admin__form-group">
              <label className="admin__form-label">Sell Price (USD)</label>
              <input className="admin__form-input" type="number" value={form.price} onChange={e => u("price", e.target.value)} />
            </div>
          </div>
          <div className="admin__form-group">
            <label className="admin__form-label">Display</label>
            <input className="admin__form-input" value={form.display} onChange={e => u("display", e.target.value)} />
          </div>
          <div className="admin__form-group">
            <label className="admin__form-label">Camera</label>
            <input className="admin__form-input" value={form.camera} onChange={e => u("camera", e.target.value)} />
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">Front Camera</label>
              <input className="admin__form-input" value={form.frontCamera} onChange={e => u("frontCamera", e.target.value)} />
            </div>
            <div className="admin__form-group">
              <label className="admin__form-label">Battery</label>
              <input className="admin__form-input" value={form.battery} onChange={e => u("battery", e.target.value)} />
            </div>
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">Processor</label>
              <input className="admin__form-input" value={form.processor} onChange={e => u("processor", e.target.value)} />
            </div>
            <div className="admin__form-group">
              <label className="admin__form-label">OS</label>
              <input className="admin__form-input" value={form.os} onChange={e => u("os", e.target.value)} />
            </div>
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">Rating (1-5)</label>
              <input className="admin__form-input" type="number" step="0.1" min="1" max="5" value={form.rating} onChange={e => u("rating", e.target.value)} />
            </div>
            <div className="admin__form-group">
              <label className="admin__form-label">Reviews Count</label>
              <input className="admin__form-input" type="number" value={form.reviews} onChange={e => u("reviews", e.target.value)} />
            </div>
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">Stock</label>
              <input className="admin__form-input" type="number" value={form.stock} onChange={e => u("stock", e.target.value)} />
            </div>
            <div className="admin__form-group">
              <label className="admin__form-label">Discount %</label>
              <input className="admin__form-input" type="number" min="0" max="100" value={form.discount} onChange={e => u("discount", e.target.value)} />
            </div>
          </div>
          <div className="admin__form-row">
            <div className="admin__form-group">
              <label className="admin__form-label">Badge</label>
              <input className="admin__form-input" value={form.badge} onChange={e => u("badge", e.target.value)} placeholder="Hot, New, Best Value..." />
            </div>
            <div className="admin__form-group" style={{ display: "flex", gap: 16, alignItems: "flex-end", paddingBottom: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                <input type="checkbox" checked={form.hot} onChange={e => u("hot", e.target.checked)} /> Hot
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                <input type="checkbox" checked={form.newArrival} onChange={e => u("newArrival", e.target.checked)} /> New Arrival
              </label>
            </div>
          </div>
          <div className="admin__form-group">
            <label className="admin__form-label">Description</label>
            <textarea className="admin__form-textarea" value={form.description} onChange={e => u("description", e.target.value)} />
          </div>
          <div className="admin__modal-footer" style={{ padding: 0, border: "none", marginTop: 8 }}>
            <button type="button" className="admin__btn admin__btn--outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin__btn admin__btn--primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ADMIN: CATEGORIES ────────────────────────────────────────────────────────
function AdminCategories() {
  const { phones } = useStore();
  const brands = useMemo(() => {
    const map = {};
    phones.forEach(p => {
      if (!map[p.brand]) map[p.brand] = {};
      if (!map[p.brand][p.series]) map[p.brand][p.series] = [];
      map[p.brand][p.series].push(p);
    });
    return map;
  }, [phones]);

  return (
    <div className="fade-in">
      <div className="admin__header">
        <h1 className="admin__title">Categories</h1>
      </div>
      {Object.entries(brands).map(([brand, seriesMap]) => (
        <div key={brand} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: BRANDS[brand]?.color || "#6b7280", display: "inline-block" }} />
            {brand}
          </h3>
          <div className="admin__stats">
            {Object.entries(seriesMap).map(([series, list]) => (
              <div key={series} className="admin__stat-card">
                <div className="admin__stat-label">{series}</div>
                <div className="admin__stat-value">{list.length}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  {fmt(Math.min(...list.map(p => p.price)))} - {fmt(Math.max(...list.map(p => p.price)))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN: PRICING TOOLS ─────────────────────────────────────────────────────
function AdminPricing() {
  const { phones, setPhones, setToast } = useStore();
  const [mode, setMode] = useState("percent"); // percent | fixed
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("increase");
  const [target, setTarget] = useState("All");
  const [seriesTarget, setSeriesTarget] = useState("All");

  const apply = () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    setPhones(prev => prev.map(p => {
      if (target !== "All" && p.brand !== target) return p;
      if (seriesTarget !== "All" && p.series !== seriesTarget) return p;
      let newPrice = p.price;
      if (mode === "percent") {
        newPrice = direction === "increase" ? Math.round(p.price * (1 + val / 100)) : Math.round(p.price * (1 - val / 100));
      } else {
        newPrice = direction === "increase" ? p.price + val : p.price - val;
      }
      return { ...p, price: Math.max(1, Math.round(newPrice)) };
    }));
    setToast(`Prices ${direction}d by ${mode === "percent" ? val + "%" : fmt(val)}`);
    setAmount("");
  };

  const margins = useMemo(() => {
    const groups = {};
    phones.forEach(p => {
      const key = p.brand;
      if (!groups[key]) groups[key] = { total: 0, count: 0, min: Infinity, max: -Infinity };
      const margin = ((p.price - p.basePrice) / p.basePrice * 100);
      groups[key].total += margin;
      groups[key].count++;
      groups[key].min = Math.min(groups[key].min, margin);
      groups[key].max = Math.max(groups[key].max, margin);
    });
    return Object.entries(groups).map(([brand, data]) => ({
      brand, avg: Math.round(data.total / data.count), min: Math.round(data.min), max: Math.round(data.max),
    }));
  }, [phones]);

  return (
    <div className="fade-in">
      <div className="admin__header">
        <h1 className="admin__title">Pricing Tools</h1>
      </div>

      {/* Margin Overview */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Margin Overview</h3>
      <div className="admin__stats" style={{ marginBottom: 24 }}>
        {margins.map(m => (
          <div key={m.brand} className="admin__stat-card">
            <div className="admin__stat-label">{m.brand} Margin</div>
            <div className="admin__stat-value">{m.avg}%</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{m.min}% - {m.max}%</div>
          </div>
        ))}
      </div>

      {/* Bulk Price Editor */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Bulk Price Adjustment</h3>
      <div className="admin__stat-card" style={{ marginBottom: 24 }}>
        <div className="admin__filter-bar" style={{ marginBottom: 0 }}>
          <select className="admin__select" value={target} onChange={e => setTarget(e.target.value)}>
            <option value="All">All Brands</option>
            <option value="Samsung">Samsung</option>
            <option value="Apple">Apple</option>
            <option value="Google">Google</option>
          </select>
          <select className="admin__select" value={seriesTarget} onChange={e => setSeriesTarget(e.target.value)}>
            <option value="All">All Series</option>
            {SERIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="admin__select" value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
          <select className="admin__select" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="percent">By %</option>
            <option value="fixed">By $ Amount</option>
          </select>
          <input className="admin__search" style={{ maxWidth: 120 }} type="number" placeholder={mode === "percent" ? "%" : "$"} value={amount} onChange={e => setAmount(e.target.value)} />
          <button className="admin__btn admin__btn--primary" onClick={apply}>Apply</button>
        </div>
      </div>

      {/* Price Table */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>All Prices</h3>
      <div className="admin__table-wrap" style={{ overflowX: "auto" }}>
        <table className="admin__table">
          <thead><tr><th>Product</th><th>Base Cost</th><th>Sell Price</th><th>Profit</th><th>Margin %</th></tr></thead>
          <tbody>
            {phones.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{fmt(p.basePrice)}</td>
                <td style={{ fontWeight: 700, color: "#0056d2" }}>{fmt(p.price)}</td>
                <td style={{ color: "#10b981", fontWeight: 600 }}>{fmt(p.price - p.basePrice)}</td>
                <td>{Math.round((p.price - p.basePrice) / p.basePrice * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADMIN: ORDERS ────────────────────────────────────────────────────────────
function AdminOrders() {
  const { orders, setOrders } = useStore();

  const updateStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <div className="fade-in">
      <div className="admin__header">
        <h1 className="admin__title">Orders ({orders.length})</h1>
        {orders.length > 0 && (
          <button className="admin__btn admin__btn--danger" onClick={() => { if (confirm("Clear all orders?")) setOrders([]); }}>Clear All</button>
        )}
      </div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">&#128230;</div>
          <div className="empty-state__text">No orders yet. Orders appear here when customers checkout via WhatsApp.</div>
        </div>
      ) : (
        <div className="admin__cards">
          {orders.map(order => (
            <div key={order.id} className="admin__card">
              <div className="admin__card-header">
                <div>
                  <div className="admin__card-title">Order #{order.id.slice(0, 8)}</div>
                  <div className="admin__card-meta">{new Date(order.date).toLocaleString()}</div>
                </div>
                <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: order.status === "completed" ? "#ecfdf5" : order.status === "processing" ? "#eff6ff" : "#fef3c7", color: order.status === "completed" ? "#059669" : order.status === "processing" ? "#2563eb" : "#d97706" }}>
                  {order.status}
                </span>
              </div>
              {order.items.map(item => (
                <div key={item.key} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                  {item.name} ({item.storage}) x{item.qty} = {fmt(item.price * item.qty)}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0056d2" }}>Total: {fmt(order.total)}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="admin__table-btn" onClick={() => updateStatus(order.id, "processing")}>Processing</button>
                  <button className="admin__table-btn" onClick={() => updateStatus(order.id, "completed")}>Complete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN: PROMOTIONS ────────────────────────────────────────────────────────
function AdminPromotions() {
  const { phones, setPhones, banners, setBanners, setToast } = useStore();
  const [discBrand, setDiscBrand] = useState("All");
  const [discVal, setDiscVal] = useState("");
  const [bannerText, setBannerText] = useState("");

  const applyDiscount = () => {
    const val = Number(discVal);
    if (!val || val < 0 || val > 100) return;
    setPhones(prev => prev.map(p => {
      if (discBrand !== "All" && p.brand !== discBrand) return p;
      return { ...p, discount: val };
    }));
    setToast(`${val}% discount applied to ${discBrand === "All" ? "all" : discBrand} products`);
    setDiscVal("");
  };

  const clearDiscounts = () => {
    setPhones(prev => prev.map(p => ({ ...p, discount: 0 })));
    setToast("All discounts cleared");
  };

  const addBanner = () => {
    if (!bannerText.trim()) return;
    setBanners(prev => [...prev, { id: uid(), text: bannerText, active: true }]);
    setBannerText("");
    setToast("Banner added");
  };

  const toggleBanner = (id) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const removeBanner = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="fade-in">
      <div className="admin__header">
        <h1 className="admin__title">Promotions & Deals</h1>
      </div>

      {/* Discount Manager */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Bulk Discounts</h3>
      <div className="admin__stat-card" style={{ marginBottom: 24 }}>
        <div className="admin__filter-bar" style={{ marginBottom: 0 }}>
          <select className="admin__select" value={discBrand} onChange={e => setDiscBrand(e.target.value)}>
            <option value="All">All Brands</option>
            <option value="Samsung">Samsung</option>
            <option value="Apple">Apple</option>
            <option value="Google">Google</option>
          </select>
          <input className="admin__search" style={{ maxWidth: 100 }} type="number" placeholder="%" value={discVal} onChange={e => setDiscVal(e.target.value)} />
          <button className="admin__btn admin__btn--primary" onClick={applyDiscount}>Apply Discount</button>
          <button className="admin__btn admin__btn--danger" onClick={clearDiscounts}>Clear All</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          Currently {phones.filter(p => p.discount > 0).length} products have active discounts
        </div>
      </div>

      {/* Banner Manager */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Banners</h3>
      <div className="admin__stat-card" style={{ marginBottom: 16 }}>
        <div className="admin__filter-bar" style={{ marginBottom: 0 }}>
          <input className="admin__search" placeholder="Banner text..." value={bannerText} onChange={e => setBannerText(e.target.value)} />
          <button className="admin__btn admin__btn--primary" onClick={addBanner}>Add Banner</button>
        </div>
      </div>
      {banners.map(b => (
        <div key={b.id} className="admin__card" style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12 }}>
          <span style={{ flex: 1, fontSize: 14, opacity: b.active ? 1 : 0.5 }}>{b.text}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="admin__table-btn" onClick={() => toggleBanner(b.id)}>{b.active ? "Disable" : "Enable"}</button>
            <button className="admin__table-btn admin__table-btn--danger" onClick={() => removeBanner(b.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN: SETTINGS ──────────────────────────────────────────────────────────
function AdminSettings() {
  const { settings, setSettings, setToast } = useStore();
  const [form, setForm] = useState({ ...settings });
  const u = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    setSettings(form);
    setToast("Settings saved");
  };

  return (
    <div className="fade-in">
      <div className="admin__header">
        <h1 className="admin__title">Settings</h1>
      </div>
      <div className="admin__stat-card">
        <div className="admin__form-group">
          <label className="admin__form-label">Store Name</label>
          <input className="admin__form-input" value={form.storeName} onChange={e => u("storeName", e.target.value)} />
        </div>
        <div className="admin__form-group">
          <label className="admin__form-label">WhatsApp Number (with country code)</label>
          <input className="admin__form-input" value={form.waNumber} onChange={e => u("waNumber", e.target.value)} />
        </div>
        <div className="admin__form-group">
          <label className="admin__form-label">Admin Password</label>
          <input className="admin__form-input" type="password" value={form.adminPw} onChange={e => u("adminPw", e.target.value)} />
        </div>
        <button className="admin__btn admin__btn--primary" onClick={save}>Save Settings</button>
      </div>

      <div className="admin__stat-card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Data Management</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="admin__btn admin__btn--outline" onClick={() => {
            const data = JSON.stringify({ phones: JSON.parse(localStorage.getItem("nex_phones")), orders: JSON.parse(localStorage.getItem("nex_orders")), banners: JSON.parse(localStorage.getItem("nex_banners")), settings: JSON.parse(localStorage.getItem("nex_settings")) });
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "nexmobile-backup.json"; a.click();
            URL.revokeObjectURL(url);
            setToast("Backup downloaded");
          }}>Export Backup</button>
          <button className="admin__btn admin__btn--outline" onClick={() => {
            const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
            input.onchange = (e) => {
              const file = e.target.files[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target.result);
                  if (data.phones) localStorage.setItem("nex_phones", JSON.stringify(data.phones));
                  if (data.orders) localStorage.setItem("nex_orders", JSON.stringify(data.orders));
                  if (data.banners) localStorage.setItem("nex_banners", JSON.stringify(data.banners));
                  if (data.settings) localStorage.setItem("nex_settings", JSON.stringify(data.settings));
                  setToast("Backup restored! Refreshing...");
                  setTimeout(() => window.location.reload(), 1000);
                } catch { setToast("Invalid backup file"); }
              };
              reader.readAsText(file);
            };
            input.click();
          }}>Import Backup</button>
          <button className="admin__btn admin__btn--danger" onClick={() => {
            if (!confirm("This will clear ALL data and reset everything. Continue?")) return;
            Object.keys(localStorage).filter(k => k.startsWith("nex_")).forEach(k => localStorage.removeItem(k));
            window.location.reload();
          }}>Factory Reset</button>
        </div>
      </div>
    </div>
  );
}
