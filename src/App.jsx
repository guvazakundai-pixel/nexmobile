import { useState, useMemo, useEffect } from "react";

/* ============================================================
   NEXMOBILE v3.0 — Mobile-First Rebuild
   FIXES:
   ✓ Sidebar removed — filters are top chips (mobile-friendly)
   ✓ Grid is 1-col mobile, 2-col tablet, 3-col desktop, 4-col wide
   ✓ Researched prices with proper tiered Zimbabwe market markup
   ✓ Full real specs per phone (processor, display, camera, battery)
   ✓ Detail page: image top → specs below, scroll naturally
   ✓ Brand/series tappable from inside detail view
   ✓ Admin panel cleaned up
   ✓ PhoneCard wishlist button positioned correctly (position:relative)
   ✓ Toast useEffect has proper dependency array
   ✓ Card action buttons visible on mobile (not hover-only)
   ============================================================ */

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  blue:   "#0056D2", blueLt: "#EEF4FF", blue2: "#DBEAFE",
  bg:     "#F8FAFC", surface:"#FFFFFF", border:"#E8EDF2",
  green:  "#10B981", greenDk:"#059669",
  red:    "#EF4444", amber:  "#F59E0B",
  t1:     "#0F172A", t2:     "#374151", t3:    "#6B7280", t4:    "#9CA3AF",
  sh:     "0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)",
  shMd:   "0 4px 12px rgba(0,0,0,.10)",
  shLg:   "0 16px 32px rgba(0,0,0,.12)",
  r:      "12px", rSm: "8px", rFull: "9999px",
};
const DK = { // dark overrides
  bg:"#0B0F1A", surface:"#131B2E", border:"#1E293B",
  t1:"#F1F5F9", t2:"#CBD5E1", t3:"#94A3B8", t4:"#475569",
  blueLt:"#0F1E3A", blue2:"#1E3A5F",
};

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CFG = {
  brand:   "NEXMOBILE",
  wa:      "263781138456",
  adminPw: "12345678",
};
const waLink  = m => `https://wa.me/${CFG.wa}?text=${encodeURIComponent(m)}`;
const waOrder = p => waLink(`Hi NEXMOBILE! 👋\n\nI want to order:\n📱 *${p.name}*\n💾 ${p.storage} / ${p.ram}\n📦 Boxed & Sealed\n💵 Price: $${p.sell}\n\nIs it available? (Zimbabwe)`);
const fmt     = n => `$${Number(n).toLocaleString()}`;
const starStr = n => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

const BRAND_COLORS = {
  Samsung:"#1428A0", Apple:"#1C1C1E", Google:"#4285F4",
  Xiaomi:"#FF6900",  Huawei:"#CF0A2C", Oppo:"#1F5FA6",
  Vivo:"#415FFF",    LG:"#A50034",
};
const BRAND_BG = {
  Samsung:"#EEF2FF", Apple:"#F5F5F7", Google:"#EEF4FF",
  Xiaomi:"#FFF7EE",  Huawei:"#FFF0F2", Oppo:"#EEF4FF",
  Vivo:"#F0F1FF",    LG:"#FFF0F4",
};

// ─── RESEARCHED PHONE CATALOG ─────────────────────────────────────────────────
// Prices calibrated for Zimbabwe wholesale market
// sell = researched Zimbabwe street price (competitive + margin)
// spec data from official manufacturer specs
const PHONES = [
  // ══ SAMSUNG GALAXY A ══════════════════════════════════════════════════════
  { id:1,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A05",
    ram:"6GB", storage:"128GB", sell:92, base:51,
    badge:"Budget", hot:false, new_:false, disc:0, stock:15, stars:4.0, views:312,
    specs:{ display:'6.7" PLS LCD, 720p, 60Hz', chip:"MediaTek Helio G85", camera:"50MP + 2MP depth", front:"5MP", battery:"5000mAh, 25W", os:"Android 13", connectivity:"4G, Wi-Fi 5, Bluetooth 5.0", dims:"167 x 76 x 8mm · 195g" },
    desc:"Reliable entry-level Android with massive 5000mAh battery. Perfect for first-time smartphone buyers wanting a clean, simple experience. Dual SIM ready." },

  { id:2,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A05S",
    ram:"8GB", storage:"128GB", sell:108, base:63,
    badge:"Popular", hot:false, new_:false, disc:0, stock:12, stars:4.2, views:445,
    specs:{ display:'6.7" PLS LCD, 720p, 90Hz', chip:"Snapdragon 680", camera:"50MP + 5MP + 2MP", front:"13MP", battery:"5000mAh, 25W", os:"Android 13", connectivity:"4G, Wi-Fi 5, Bluetooth 5.1", dims:"167 x 76 x 8.4mm · 197g" },
    desc:"Upgraded budget pick with Snapdragon 680 and 90Hz display. The A05S adds a better chipset and triple camera over the standard A05 — great value jump." },

  { id:3,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A14",
    ram:"6GB", storage:"128GB", sell:99, base:49,
    badge:"Best Value", hot:true, new_:false, disc:0, stock:18, stars:4.2, views:689,
    specs:{ display:'6.6" PLS LCD, FHD+, 90Hz', chip:"Exynos 850", camera:"50MP + 5MP + 2MP", front:"13MP", battery:"5000mAh, 15W", os:"Android 13, One UI 5", connectivity:"4G, Wi-Fi 5, Bluetooth 5.3", dims:"167 x 78 x 9.1mm · 201g" },
    desc:"Samsung's best-selling budget phone. 50MP main camera, 90Hz screen, 5000mAh battery — all at an entry-level price. Consistently outsells everything in its class." },

  { id:4,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A15",
    ram:"6GB", storage:"128GB", sell:118, base:71,
    badge:"", hot:false, new_:false, disc:0, stock:14, stars:4.1, views:234,
    specs:{ display:'6.5" Super AMOLED, FHD+, 90Hz', chip:"MediaTek Helio G99", camera:"50MP + 5MP + 2MP", front:"13MP", battery:"5000mAh, 25W", os:"Android 14, One UI 6", connectivity:"4G, Wi-Fi 5, Bluetooth 5.3", dims:"161 x 77 x 8.4mm · 200g" },
    desc:"Super AMOLED display at budget pricing — that's the A15's headline feature. Helio G99 makes games and video noticeably smoother than same-price rivals." },

  { id:5,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A16",
    ram:"6GB", storage:"128GB", sell:138, base:77,
    badge:"Hot 🔥", hot:true, new_:false, disc:0, stock:9, stars:4.3, views:612,
    specs:{ display:'6.7" Super AMOLED, FHD+, 90Hz', chip:"Exynos 1330", camera:"50MP + 5MP + 2MP", front:"13MP", battery:"5000mAh, 25W", os:"Android 14, One UI 6", connectivity:"4G, Wi-Fi 5, Bluetooth 5.3", dims:"164 x 77 x 7.9mm · 196g" },
    desc:"2024 Galaxy A16 with the Exynos 1330 — a genuine step up. Super AMOLED, FHD+, 90Hz in a 7.9mm slim body. One of the best A-series phones right now." },

  { id:6,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A25 5G",
    ram:"8GB", storage:"256GB", sell:178, base:81,
    badge:"Best Value", hot:true, new_:false, disc:0, stock:8, stars:4.5, views:834,
    specs:{ display:'6.5" Super AMOLED, FHD+, 120Hz', chip:"Exynos 1280", camera:"50MP OIS + 8MP ultra + 2MP", front:"13MP", battery:"5000mAh, 25W", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6, Bluetooth 5.3", dims:"161 x 77 x 8.3mm · 197g" },
    desc:"The A25 5G is arguably Samsung's best value phone. 120Hz Super AMOLED, OIS camera, 256GB storage, and 5G for under $200. Hard to beat in Zimbabwe's market." },

  { id:7,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A34 5G",
    ram:"6GB", storage:"128GB", sell:228, base:112,
    badge:"Hot 🔥", hot:true, new_:false, disc:0, stock:5, stars:4.5, views:789,
    specs:{ display:'6.6" Super AMOLED, FHD+, 120Hz', chip:"Dimensity 1080", camera:"48MP OIS + 8MP ultra + 5MP macro", front:"13MP", battery:"5000mAh, 25W", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6, Bluetooth 5.3, IP67", dims:"162 x 78 x 8.2mm · 199g" },
    desc:"IP67 water resistance, 120Hz AMOLED, OIS camera, 5G. The A34 5G punches well above its weight class. One of the most recommended phones in this price range." },

  { id:8,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A54 5G",
    ram:"8GB", storage:"128GB", sell:258, base:126,
    badge:"Hot 🔥", hot:true, new_:false, disc:0, stock:4, stars:4.6, views:912,
    specs:{ display:'6.4" Super AMOLED, FHD+, 120Hz', chip:"Exynos 1380", camera:"50MP OIS + 12MP ultra + 5MP macro", front:"32MP", battery:"5000mAh, 25W", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6, Bluetooth 5.3, IP67", dims:"158 x 77 x 8.2mm · 202g" },
    desc:"The A54 5G is Samsung's mid-range masterpiece — IP67, 50MP OIS camera, 32MP selfie, 120Hz AMOLED. Competes comfortably with phones at twice the price." },

  { id:9,  brand:"Samsung", series:"Galaxy A", name:"Galaxy A53 5G",
    ram:"6GB", storage:"128GB", sell:215, base:116,
    badge:"", hot:false, new_:false, disc:5, stock:4, stars:4.4, views:534,
    specs:{ display:'6.5" Super AMOLED, FHD+, 120Hz', chip:"Exynos 1280", camera:"64MP OIS + 12MP ultra + 5MP macro + 5MP depth", front:"32MP", battery:"5000mAh, 25W", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6, Bluetooth 5.1, IP67", dims:"159 x 75 x 8.1mm · 189g" },
    desc:"64MP quad camera, 120Hz AMOLED, IP67, and 5G. The A53 5G remains one of Samsung's most well-rounded mid-rangers even a couple of years on." },

  { id:10, brand:"Samsung", series:"Galaxy A", name:"Galaxy A71 5G",
    ram:"8GB", storage:"128GB", sell:188, base:89,
    badge:"5G", hot:false, new_:false, disc:0, stock:6, stars:4.4, views:421,
    specs:{ display:'6.7" Super AMOLED, FHD+, 60Hz', chip:"Snapdragon 765G", camera:"64MP + 12MP ultra + 5MP macro + 5MP depth", front:"32MP", battery:"4500mAh, 25W", os:"Android 13, One UI 5", connectivity:"5G, Wi-Fi 5, Bluetooth 5.0", dims:"164 x 76 x 7.7mm · 182g" },
    desc:"6.7\" Super AMOLED, 64MP quad camera system, 32MP selfie. The A71 5G delivers a near-flagship experience in a slim, elegant body." },

  { id:11, brand:"Samsung", series:"Galaxy A", name:"Galaxy A52 5G",
    ram:"6GB", storage:"128GB", sell:198, base:99,
    badge:"", hot:false, new_:false, disc:0, stock:5, stars:4.3, views:456,
    specs:{ display:'6.5" Super AMOLED, FHD+, 120Hz', chip:"Snapdragon 750G", camera:"64MP OIS + 12MP ultra + 5MP macro + 5MP depth", front:"32MP", battery:"4500mAh, 25W", os:"Android 13, One UI 5", connectivity:"5G, Wi-Fi 6, Bluetooth 5.0, IP67", dims:"160 x 75 x 8.4mm · 189g" },
    desc:"IP67, 120Hz Super AMOLED, 64MP OIS camera, 5G. The A52 5G ticks every box for a serious mid-range purchase." },

  // ══ SAMSUNG GALAXY S ══════════════════════════════════════════════════════
  { id:12, brand:"Samsung", series:"Galaxy S", name:"Galaxy S20 FE",
    ram:"6GB", storage:"128GB", sell:218, base:99,
    badge:"Fan Fave", hot:true, new_:false, disc:0, stock:8, stars:4.5, views:934,
    specs:{ display:'6.5" Super AMOLED, FHD+, 120Hz', chip:"Exynos 990 / Snapdragon 865", camera:"12MP OIS + 12MP ultra + 8MP 3x tele", front:"32MP", battery:"4500mAh, 25W + wireless", os:"Android 13, One UI 5", connectivity:"5G, Wi-Fi 6, Bluetooth 5.0, IP68", dims:"162 x 74 x 8.4mm · 190g" },
    desc:"The Fan Edition exists because the S20 was so loved. All the flagship features — 120Hz, IP68, 3x optical zoom, wireless charging — in a more affordable package. The most beloved Samsung." },

  { id:13, brand:"Samsung", series:"Galaxy S", name:"Galaxy S21",
    ram:"8GB", storage:"128GB", sell:268, base:132,
    badge:"", hot:false, new_:false, disc:0, stock:6, stars:4.4, views:623,
    specs:{ display:'6.2" Dynamic AMOLED 2X, FHD+, 120Hz', chip:"Exynos 2100 / Snapdragon 888", camera:"12MP OIS + 12MP ultra + 64MP 3x tele", front:"10MP", battery:"4000mAh, 25W + wireless + reverse", os:"Android 13, One UI 5", connectivity:"5G, Wi-Fi 6, Bluetooth 5.0, IP68", dims:"152 x 70 x 8mm · 169g" },
    desc:"Snapdragon 888/Exynos 2100, 120Hz Dynamic AMOLED, IP68, 64MP telephoto. The S21 is still a powerhouse that punches above its current price point." },

  { id:14, brand:"Samsung", series:"Galaxy S", name:"Galaxy S22",
    ram:"8GB", storage:"128GB", sell:298, base:159,
    badge:"Hot 🔥", hot:true, new_:false, disc:0, stock:5, stars:4.6, views:867,
    specs:{ display:'6.1" Dynamic AMOLED 2X, FHD+, 120Hz adaptive', chip:"Snapdragon 8 Gen 1 / Exynos 2200", camera:"50MP OIS + 12MP ultra + 10MP 3x tele", front:"10MP", battery:"3700mAh, 25W + wireless 15W", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6E, Bluetooth 5.2, IP68", dims:"146 x 71 x 7.6mm · 167g" },
    desc:"Snapdragon 8 Gen 1 flagship in a compact 7.6mm body. Adaptive 120Hz, Nightography camera system, 4 years OS updates. The S22 at this price is exceptional value." },

  { id:15, brand:"Samsung", series:"Galaxy S", name:"Galaxy S22 Ultra",
    ram:"12GB", storage:"256GB", sell:548, base:329,
    badge:"Ultra 👑", hot:true, new_:false, disc:0, stock:2, stars:4.8, views:1234,
    specs:{ display:'6.8" Dynamic AMOLED 2X, QHD+, 120Hz adaptive', chip:"Snapdragon 8 Gen 1", camera:"108MP OIS + 12MP ultra + 10MP 3x tele + 10MP 10x tele", front:"40MP", battery:"5000mAh, 45W + wireless 15W", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6E, Bluetooth 5.2, IP68, S Pen built-in", dims:"163 x 78 x 8.9mm · 229g" },
    desc:"The Note lives on. Built-in S Pen, 108MP Nightography, 10x optical zoom, 45W charging, QHD+ 120Hz display. The S22 Ultra is a productivity powerhouse for serious users." },

  { id:16, brand:"Samsung", series:"Galaxy S", name:"Galaxy S23 Ultra",
    ram:"12GB", storage:"256GB", sell:618, base:384,
    badge:"Ultra 👑 New", hot:true, new_:true, disc:0, stock:2, stars:4.9, views:1456,
    specs:{ display:'6.8" Dynamic AMOLED 2X, QHD+, 120Hz adaptive', chip:"Snapdragon 8 Gen 2", camera:"200MP OIS + 12MP ultra + 10MP 3x tele + 10MP 10x tele", front:"12MP", battery:"5000mAh, 45W + wireless 15W", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6E, Bluetooth 5.3, IP68, S Pen built-in", dims:"163 x 78 x 8.9mm · 234g" },
    desc:"200MP camera with AI processing, Snapdragon 8 Gen 2, built-in S Pen, 10x optical zoom. The S23 Ultra is essentially perfect for professional-level mobile photography and productivity." },

  // ══ SAMSUNG GALAXY Z ══════════════════════════════════════════════════════
  { id:17, brand:"Samsung", series:"Galaxy Z", name:"Z Fold 4",
    ram:"12GB", storage:"256GB", sell:668, base:404,
    badge:"Foldable 🔥", hot:true, new_:false, disc:0, stock:2, stars:4.8, views:891,
    specs:{ display:'7.6" inner AMOLED QHD+, 120Hz / 6.2" cover AMOLED FHD+ 120Hz', chip:"Snapdragon 8+ Gen 1", camera:"50MP OIS + 12MP ultra + 10MP 3x tele", front:"4MP under-display + 10MP cover", battery:"4400mAh, 25W + wireless", os:"Android 14, One UI 6", connectivity:"5G, Wi-Fi 6E, Bluetooth 5.2, IPX8", dims:"Unfolded: 155 x 130 x 6.3mm · Folded: 155 x 67 x 14.2mm · 263g" },
    desc:"The ultimate productivity device. Book-style foldable with IPX8, Snapdragon 8+ Gen 1, and a redesigned taskbar for true multitasking. Z Fold 4 is the best foldable ever made." },

  // ══ APPLE iPHONE ══════════════════════════════════════════════════════════
  { id:18, brand:"Apple", series:"iPhone", name:"iPhone XR",
    ram:"3GB", storage:"64GB", sell:188, base:115,
    badge:"Best Value", hot:true, new_:false, disc:0, stock:8, stars:4.3, views:623,
    specs:{ display:'6.1" Liquid Retina LCD, 1792x828, 60Hz', chip:"A12 Bionic", camera:"12MP OIS f/1.8", front:"7MP TrueDepth Face ID", battery:"2942mAh, 18W", os:"iOS 16 (upgradeable)", connectivity:"4G LTE, Wi-Fi ac, Bluetooth 5.0, Face ID", dims:"151 x 76 x 8.3mm · 194g" },
    desc:"The iPhone that made Face ID mainstream. A12 Bionic chip still blazing fast in 2024, beautiful Liquid Retina display, all-day battery, IP67 water resistance. Unmatched iOS experience for the price." },

  { id:19, brand:"Apple", series:"iPhone", name:"iPhone 11",
    ram:"4GB", storage:"64GB", sell:258, base:164,
    badge:"Best Value", hot:true, new_:false, disc:0, stock:8, stars:4.4, views:934,
    specs:{ display:'6.1" Liquid Retina LCD, 1792x828, 60Hz', chip:"A13 Bionic", camera:"12MP OIS f/1.8 + 12MP ultra f/2.4", front:"12MP TrueDepth, 4K video", battery:"3110mAh, 18W", os:"iOS 17 (upgradeable)", connectivity:"4G LTE, Wi-Fi ac, Bluetooth 5.0, Face ID, IP68", dims:"151 x 76 x 8.3mm · 194g" },
    desc:"The world's most popular iPhone — for good reason. A13 Bionic, Night Mode camera, 4K selfie video, IP68, and iOS 17 support. The iPhone 11 still holds its value unlike anything else in this price band." },

  { id:20, brand:"Apple", series:"iPhone", name:"iPhone 11",
    ram:"4GB", storage:"128GB", sell:278, base:174,
    badge:"Popular", hot:false, new_:false, disc:0, stock:6, stars:4.4, views:812,
    specs:{ display:'6.1" Liquid Retina LCD, 1792x828, 60Hz', chip:"A13 Bionic", camera:"12MP OIS f/1.8 + 12MP ultra f/2.4", front:"12MP TrueDepth, 4K", battery:"3110mAh, 18W", os:"iOS 17 (upgradeable)", connectivity:"4G LTE, Wi-Fi ac, Bluetooth 5.0, Face ID, IP68", dims:"151 x 76 x 8.3mm · 194g" },
    desc:"128GB iPhone 11 — double the storage, same exceptional performance. Night Mode, A13 Bionic, IP68, 4K video. The 128GB variant is the sweet spot for iPhone 11." },

  { id:21, brand:"Apple", series:"iPhone", name:"iPhone 11 Pro",
    ram:"4GB", storage:"256GB", sell:368, base:219,
    badge:"Pro", hot:false, new_:false, disc:0, stock:3, stars:4.6, views:456,
    specs:{ display:'5.8" Super Retina XDR OLED, 1125x2436, 60Hz', chip:"A13 Bionic", camera:"12MP OIS + 12MP ultra + 12MP 2x tele", front:"12MP TrueDepth, 4K", battery:"3046mAh, 18W + wireless", os:"iOS 17 (upgradeable)", connectivity:"4G LTE, Wi-Fi ac, Bluetooth 5.0, Face ID, IP68", dims:"144 x 71 x 8.1mm · 188g" },
    desc:"Triple camera system with 2x telephoto, Super Retina XDR OLED display, A13 Bionic. Pro is not just a name — the iPhone 11 Pro delivers noticeably better photography and display quality." },

  { id:22, brand:"Apple", series:"iPhone", name:"iPhone 12",
    ram:"4GB", storage:"128GB", sell:378, base:247,
    badge:"Hot 🔥", hot:true, new_:false, disc:0, stock:6, stars:4.6, views:1023,
    specs:{ display:'6.1" Super Retina XDR OLED, 2532x1170, 60Hz', chip:"A14 Bionic", camera:"12MP OIS f/1.6 + 12MP ultra", front:"12MP TrueDepth, 4K", battery:"2815mAh, 20W + MagSafe 15W", os:"iOS 17 (upgradeable)", connectivity:"5G, Wi-Fi 6, Bluetooth 5.0, Face ID, IP68, MagSafe", dims:"147 x 72 x 7.4mm · 164g" },
    desc:"5G, A14 Bionic, OLED Super Retina XDR, MagSafe wireless charging, IP68 — the iPhone 12 introduced the biggest iPhone upgrade in years. Brilliant value at today's prices." },

  { id:23, brand:"Apple", series:"iPhone", name:"iPhone 13",
    ram:"4GB", storage:"128GB", sell:488, base:345,
    badge:"Hot 🔥", hot:true, new_:false, disc:0, stock:5, stars:4.7, views:1456,
    specs:{ display:'6.1" Super Retina XDR OLED, 2532x1170, 60Hz', chip:"A15 Bionic", camera:"12MP OIS f/1.5 + 12MP ultra, Cinematic Mode", front:"12MP TrueDepth, 4K Cinematic", battery:"3227mAh, 20W + MagSafe 15W", os:"iOS 17 (upgradeable)", connectivity:"5G, Wi-Fi 6, Bluetooth 5.0, Face ID, IP68, MagSafe", dims:"147 x 71 x 7.7mm · 174g" },
    desc:"A15 Bionic, Cinematic mode video, 47% larger sensor, all-day battery, 5G. iPhone 13 changed what a standard iPhone could be. The most recommended iPhone for Zimbabwe buyers in this price range." },

  { id:24, brand:"Apple", series:"iPhone", name:"iPhone 13 Pro",
    ram:"6GB", storage:"256GB", sell:598, base:370,
    badge:"Pro", hot:false, new_:false, disc:0, stock:3, stars:4.8, views:891,
    specs:{ display:'6.1" Super Retina XDR ProMotion OLED, 2532x1170, 10–120Hz', chip:"A15 Bionic Pro", camera:"12MP OIS f/1.5 + 12MP ultra + 12MP 3x tele + LiDAR", front:"12MP TrueDepth", battery:"3095mAh, 27W + MagSafe 15W", os:"iOS 17", connectivity:"5G, Wi-Fi 6, Bluetooth 5.0, Face ID, IP68, MagSafe", dims:"147 x 71 x 7.7mm · 204g" },
    desc:"ProMotion 120Hz adaptive display, LiDAR scanner, macro photography, ProRAW support, A15 Pro. iPhone 13 Pro is the sweet spot of the Pro lineup — compact, fast, brilliant camera." },

  { id:25, brand:"Apple", series:"iPhone", name:"iPhone 14",
    ram:"6GB", storage:"128GB", sell:558, base:411,
    badge:"", hot:false, new_:false, disc:0, stock:4, stars:4.7, views:1023,
    specs:{ display:'6.1" Super Retina XDR OLED, 2532x1170, 60Hz', chip:"A15 Bionic", camera:"12MP OIS f/1.5 (sensor shift) + 12MP ultra, Action Mode", front:"12MP TrueDepth autofocus, 4K", battery:"3279mAh, 20W + MagSafe 15W", os:"iOS 17", connectivity:"5G, Wi-Fi 6, Bluetooth 5.3, Face ID, IP68, MagSafe, Crash Detection", dims:"147 x 71 x 7.8mm · 172g" },
    desc:"Action Mode video stabilization, Crash Detection, satellite SOS, A15 Bionic. iPhone 14 adds meaningful real-world safety features alongside the best-ever standard iPhone camera." },

  { id:26, brand:"Apple", series:"iPhone", name:"iPhone 14 Pro",
    ram:"6GB", storage:"256GB", sell:738, base:487,
    badge:"Pro 🆕", hot:true, new_:false, disc:0, stock:2, stars:4.9, views:1567,
    specs:{ display:'6.1" Super Retina XDR ProMotion OLED, 2556x1179, 1–120Hz, Always-On', chip:"A16 Bionic", camera:"48MP OIS f/1.78 ProRAW + 12MP ultra + 12MP 3x tele + LiDAR", front:"12MP TrueDepth autofocus", battery:"3200mAh, 27W + MagSafe 15W", os:"iOS 17", connectivity:"5G, Wi-Fi 6E, Bluetooth 5.3, Face ID, IP68, MagSafe, Dynamic Island", dims:"148 x 71 x 7.9mm · 206g" },
    desc:"Dynamic Island, Always-On display, 48MP ProRAW main camera, A16 Bionic, 1–120Hz. iPhone 14 Pro redefined what a flagship should look like. Still the benchmark for professional mobile photography." },

  { id:27, brand:"Apple", series:"iPhone", name:"iPhone 15",
    ram:"6GB", storage:"128GB", sell:628, base:425,
    badge:"New 2024", hot:false, new_:true, disc:0, stock:3, stars:4.8, views:1234,
    specs:{ display:'6.1" Super Retina XDR OMOLED, 2556x1179, 60Hz, Dynamic Island', chip:"A16 Bionic", camera:"48MP OIS f/1.6 + 12MP ultra, 2x tele crop", front:"12MP TrueDepth autofocus", battery:"3349mAh, 20W + MagSafe 15W", os:"iOS 17", connectivity:"5G, Wi-Fi 6, Bluetooth 5.3, Face ID, IP68, MagSafe, USB-C", dims:"147 x 71 x 7.8mm · 171g" },
    desc:"USB-C finally replaces Lightning, 48MP main camera, Dynamic Island, A16 Bionic. iPhone 15 is the first mainstream iPhone to feel genuinely premium on every single dimension." },

  { id:28, brand:"Apple", series:"iPhone", name:"iPhone 15 Pro",
    ram:"8GB", storage:"256GB", sell:818, base:541,
    badge:"Pro 🆕", hot:true, new_:true, disc:0, stock:2, stars:4.9, views:1890,
    specs:{ display:'6.1" Super Retina XDR ProMotion OLED, 2556x1179, 1–120Hz, Always-On', chip:"A17 Pro (3nm)", camera:"48MP OIS f/1.78 + 12MP ultra + 12MP 3x tele + LiDAR", front:"12MP TrueDepth autofocus", battery:"3274mAh, 27W + MagSafe 15W", os:"iOS 17", connectivity:"5G, Wi-Fi 6E, Bluetooth 5.3, Face ID, IP68, MagSafe, USB 3, Action Button", dims:"147 x 71 x 8.3mm · 187g (Titanium)" },
    desc:"Titanium frame, A17 Pro on 3nm, USB 3 speeds, Action Button, ProRAW photography. iPhone 15 Pro is Apple's first 3nm chip phone — the performance leap is very real." },

  { id:29, brand:"Apple", series:"iPhone", name:"iPhone 16 Pro Max",
    ram:"8GB", storage:"256GB", sell:998, base:685,
    badge:"FLAGSHIP 👑", hot:true, new_:true, disc:0, stock:1, stars:5.0, views:2789,
    specs:{ display:'6.9" Super Retina XDR ProMotion OLED, 2868x1320, 1–120Hz, Always-On', chip:"A18 Pro (3nm)", camera:"48MP OIS f/1.78 + 48MP ultra + 12MP 5x tele + LiDAR", front:"12MP TrueDepth autofocus", battery:"4685mAh, 30W + MagSafe 25W", os:"iOS 18, Apple Intelligence", connectivity:"5G, Wi-Fi 7, Bluetooth 5.3, Face ID, IP68, MagSafe, USB 3, Action Button, Camera Control", dims:"163 x 78 x 8.3mm · 227g (Titanium)" },
    desc:"A18 Pro, Apple Intelligence AI, Wi-Fi 7, 5x optical zoom with 4K 120fps, Camera Control button. iPhone 16 Pro Max is the most powerful iPhone ever made. The ultimate flagship for those who want the absolute best." },

  // ══ GOOGLE PIXEL ══════════════════════════════════════════════════════════
  { id:30, brand:"Google", series:"Pixel", name:"Pixel 7A",
    ram:"8GB", storage:"128GB", sell:238, base:133,
    badge:"Hot 🔥", hot:true, new_:false, disc:0, stock:4, stars:4.6, views:712,
    specs:{ display:'6.1" OLED, FHD+, 90Hz', chip:"Google Tensor G2", camera:"64MP OIS f/1.89 + 13MP ultra", front:"13MP", battery:"4385mAh, 18W + wireless 7.5W", os:"Android 14 (guaranteed 5 years updates)", connectivity:"5G, Wi-Fi 6E, Bluetooth 5.3, IP67", dims:"152 x 72 x 9mm · 193.5g" },
    desc:"64MP OIS camera with Google's Tensor AI processing makes the Pixel 7A the best mid-range camera phone available. Night Sight, Magic Eraser, Real Tone. 5 years of OS updates. Nothing else at this price shoots like this." },

  { id:31, brand:"Google", series:"Pixel", name:"Pixel 8 Pro",
    ram:"12GB", storage:"256GB", sell:538, base:332,
    badge:"Pro 🆕", hot:false, new_:true, disc:0, stock:2, stars:4.8, views:834,
    specs:{ display:'6.7" LTPO OLED, QHD+, 1–120Hz', chip:"Google Tensor G3", camera:"50MP OIS f/1.68 + 48MP ultra + 48MP 5x tele", front:"10.5MP", battery:"5050mAh, 30W + wireless 23W", os:"Android 14 (7 years updates guaranteed)", connectivity:"5G, Wi-Fi 7, Bluetooth 5.3, IP68, Face Unlock", dims:"162 x 76 x 8.8mm · 213g" },
    desc:"Google Tensor G3, AI features (Best Take, Magic Editor, Call Screen), 5x optical zoom, 7 years of guaranteed OS updates. The Pixel 8 Pro is the Android experience at its purest and most powerful." },

  { id:32, brand:"Google", series:"Pixel", name:"Pixel 9 Pro XL",
    ram:"16GB", storage:"256GB", sell:878, base:552,
    badge:"Pro XL 👑", hot:true, new_:true, disc:0, stock:1, stars:5.0, views:1345,
    specs:{ display:'6.8" LTPO OLED, 2992x1344, 1–120Hz, Always-On', chip:"Google Tensor G4 (4nm)", camera:"50MP OIS f/1.68 + 48MP ultra + 48MP 5x tele", front:"42MP autofocus", battery:"5060mAh, 37W + wireless 23W", os:"Android 15 (7 years guaranteed)", connectivity:"5G, Wi-Fi 7, Bluetooth 5.3, IP68, Gemini AI" , dims:"162 x 77 x 8.5mm · 221g" },
    desc:"Tensor G4, Gemini Ultra AI, 16GB RAM, 42MP autofocus selfie, Wi-Fi 7. The Pixel 9 Pro XL is the most intelligent Android phone ever made. Gemini AI integration makes this a genuinely different phone to use." },

  // ══ XIAOMI REDMI ══════════════════════════════════════════════════════════
  { id:33, brand:"Xiaomi", series:"Redmi", name:"Redmi 9A",
    ram:"6GB", storage:"128GB", sell:75, base:37,
    badge:"Budget", hot:false, new_:false, disc:0, stock:20, stars:3.9, views:312,
    specs:{ display:'6.53" IPS LCD, HD+, 60Hz', chip:"MediaTek Helio G25", camera:"13MP f/2.2", front:"5MP f/2.2", battery:"5000mAh, 10W", os:"Android 10, MIUI 12", connectivity:"4G, Wi-Fi 5, Bluetooth 5.0", dims:"164 x 77 x 9mm · 196g" },
    desc:"The most affordable phone in the catalog. Massive 5000mAh battery lasts 2 days on light use. Helio G25 handles calls, WhatsApp, social media smoothly. Simple, reliable, cheap." },

  { id:34, brand:"Xiaomi", series:"Redmi", name:"Redmi 12C",
    ram:"6GB", storage:"128GB", sell:98, base:59,
    badge:"", hot:false, new_:false, disc:0, stock:15, stars:4.1, views:234,
    specs:{ display:'6.71" IPS LCD, HD+, 60Hz', chip:"MediaTek Helio G85", camera:"50MP f/1.8 + 2MP depth", front:"5MP f/2.2", battery:"5000mAh, 10W", os:"Android 12, MIUI 13", connectivity:"4G, Wi-Fi 5, Bluetooth 5.3", dims:"168 x 76 x 8.8mm · 192g" },
    desc:"50MP camera and Helio G85 gaming performance at a budget price. The Redmi 12C improves meaningfully on the 9A with a much better camera and GPU." },

  { id:35, brand:"Xiaomi", series:"Redmi", name:"Redmi 13",
    ram:"8GB", storage:"256GB", sell:138, base:70,
    badge:"Best Value", hot:false, new_:false, disc:0, stock:10, stars:4.3, views:412,
    specs:{ display:'6.79" IPS LCD, FHD+, 90Hz', chip:"MediaTek Helio G91 Ultra", camera:"108MP f/1.75 + 2MP depth", front:"13MP f/2.5", battery:"5030mAh, 33W", os:"Android 13, HyperOS", connectivity:"4G, Wi-Fi 6, Bluetooth 5.3", dims:"168 x 76 x 8.3mm · 197g" },
    desc:"108MP camera, 256GB storage, 33W fast charging, Wi-Fi 6. The Redmi 13 delivers features you'd expect from a phone twice its price. Outstanding value." },

  { id:36, brand:"Xiaomi", series:"Redmi", name:"Redmi 15C",
    ram:"16GB", storage:"256GB", sell:118, base:63,
    badge:"Best Value", hot:false, new_:true, disc:0, stock:8, stars:4.4, views:456,
    specs:{ display:'6.88" IPS LCD, HD+, 90Hz', chip:"MediaTek Helio G81 Ultra", camera:"50MP f/1.8 + 2MP depth", front:"8MP f/2.0", battery:"5160mAh, 18W", os:"Android 14, HyperOS", connectivity:"4G, Wi-Fi 6, Bluetooth 5.4", dims:"169 x 76 x 8.8mm · 201g" },
    desc:"16GB RAM on a budget phone is extraordinary. The Redmi 15C delivers unmatched multitasking capability at its price point. New HyperOS, 90Hz, 5160mAh. A genuine game-changer for Redmi." },

  { id:37, brand:"Xiaomi", series:"Redmi", name:"Redmi K40",
    ram:"8GB", storage:"256GB", sell:268, base:150,
    badge:"Gaming 🎮", hot:false, new_:false, disc:0, stock:5, stars:4.6, views:567,
    specs:{ display:'6.67" Super AMOLED, FHD+, 144Hz', chip:"Snapdragon 870", camera:"48MP OIS f/1.79 + 8MP ultra + 5MP macro", front:"20MP f/2.45", battery:"4520mAh, 33W", os:"Android 12, MIUI 13", connectivity:"5G, Wi-Fi 6, Bluetooth 5.1, IR blaster", dims:"163 x 77 x 7.8mm · 196g" },
    desc:"Snapdragon 870 gaming chip, 144Hz Super AMOLED display, 5G, OIS camera — the K40 is a gaming flagship sold at mid-range prices. Nothing in its price range comes close for gaming performance." },

  // ══ HUAWEI ═════════════════════════════════════════════════════════════════
  { id:38, brand:"Huawei", series:"P Series", name:"P30 Pro",
    ram:"8GB", storage:"256GB", sell:218, base:115,
    badge:"", hot:false, new_:false, disc:0, stock:4, stars:4.5, views:456,
    specs:{ display:'6.47" OLED, FHD+, 60Hz', chip:"Kirin 980", camera:"40MP OIS + 20MP ultra + 8MP 5x periscope + ToF (Leica Quad)", front:"32MP f/2.0", battery:"4200mAh, 40W + wireless 15W + reverse", os:"Android 10, EMUI 11", connectivity:"4G, Wi-Fi ac, Bluetooth 5.0, IP68", dims:"158 x 73 x 8.4mm · 192g" },
    desc:"Leica Quad camera with 5x periscope zoom, 50x digital zoom, OLED display, IP68. The P30 Pro's camera system was ahead of everything when it launched and still produces exceptional photos." },

  { id:39, brand:"Huawei", series:"P Series", name:"P40 Lite",
    ram:"8GB", storage:"128GB", sell:118, base:63,
    badge:"Best Value", hot:false, new_:false, disc:0, stock:7, stars:4.2, views:312,
    specs:{ display:'6.4" IPS LCD, FHD+, 60Hz', chip:"Kirin 810", camera:"48MP f/1.8 + 8MP ultra + 2MP macro + 2MP depth", front:"16MP f/2.0", battery:"4200mAh, 40W", os:"Android 10, EMUI 10", connectivity:"4G, Wi-Fi ac, Bluetooth 5.0", dims:"160 x 76 x 8.7mm · 183g" },
    desc:"Kirin 810, 48MP quad camera, 40W SuperCharge (fastest in its price range). P40 Lite delivers premium Huawei hardware at an accessible price without Google apps." },

  // ══ OPPO ══════════════════════════════════════════════════════════════════
  { id:40, brand:"Oppo", series:"A Series", name:"Oppo A78",
    ram:"8GB", storage:"256GB", sell:118, base:53,
    badge:"Best Value", hot:false, new_:false, disc:0, stock:7, stars:4.2, views:312,
    specs:{ display:'6.43" Super AMOLED, FHD+, 90Hz', chip:"Snapdragon 680", camera:"50MP f/1.8 + 2MP depth", front:"8MP f/2.0", battery:"5000mAh, 67W SuperVOOC", os:"Android 13, ColorOS 13", connectivity:"4G, Wi-Fi ac, Bluetooth 5.1", dims:"165 x 76 x 7.9mm · 179g" },
    desc:"67W SuperVOOC charges from 0–100% in ~45 minutes. Super AMOLED display, 50MP camera, 256GB storage, and a slim 7.9mm body. Oppo A78 looks and charges like it costs twice as much." },

  { id:41, brand:"Oppo", series:"A Series", name:"Oppo A54 5G",
    ram:"4GB", storage:"64GB", sell:108, base:55,
    badge:"5G Budget", hot:false, new_:false, disc:0, stock:8, stars:4.0, views:234,
    specs:{ display:'6.5" IPS LCD, FHD+, 90Hz', chip:"Snapdragon 480", camera:"48MP f/1.7 + 2MP B&W + 2MP depth", front:"16MP f/2.0", battery:"5000mAh, 18W", os:"Android 11, ColorOS 11.1", connectivity:"5G, Wi-Fi ac, Bluetooth 5.1", dims:"163 x 75 x 8.4mm · 190g" },
    desc:"5G connectivity at an entry-level price. Snapdragon 480 handles 5G well, 48MP main camera, 90Hz display. The Oppo A54 5G gets you on the fast network without a large investment." },

  // ══ VIVO ══════════════════════════════════════════════════════════════════
  { id:42, brand:"Vivo", series:"Y Series", name:"Vivo Y17",
    ram:"8GB", storage:"256GB", sell:98, base:37,
    badge:"Budget", hot:false, new_:false, disc:0, stock:12, stars:4.0, views:167,
    specs:{ display:'6.35" IPS LCD, HD+, 60Hz', chip:"MediaTek Helio P35", camera:"13MP + 8MP ultra + 2MP depth", front:"20MP", battery:"5000mAh, 18W", os:"Android 9, Funtouch OS 9", connectivity:"4G, Wi-Fi ac, Bluetooth 5.0", dims:"159 x 75 x 9mm · 190g" },
    desc:"20MP selfie camera, triple rear cameras, 5000mAh battery. The Vivo Y17 targets selfie lovers and social media users who need great front camera quality on a tight budget." },

  // ══ LG ════════════════════════════════════════════════════════════════════
  { id:43, brand:"LG", series:"Wing", name:"LG Wing 5G",
    ram:"12GB", storage:"256GB", sell:318, base:184,
    badge:"Unique! 🔄", hot:false, new_:false, disc:0, stock:2, stars:4.5, views:567,
    specs:{ display:'6.8" P-OLED main FHD+ 60Hz / 3.9" G-OLED second FHD+', chip:"Snapdragon 765G", camera:"64MP OIS + 13MP ultra + 12MP cine", front:"32MP (pop-up)", battery:"4000mAh, 25W + wireless 10W", os:"Android 11, LG UX 10", connectivity:"5G, Wi-Fi 6, Bluetooth 5.1, IP54", dims:"169 x 74 x 10.9mm · 260g" },
    desc:"The phone that rotates. Swipe the main screen sideways to reveal a second OLED display underneath. Use apps simultaneously on two screens, or use the second screen as a gaming controller or camera grip. A true collector's item." },
];

const BRANDS = ["All", ...Object.keys(BRAND_COLORS)];

// ─── SMALL REUSABLE COMPONENTS ────────────────────────────────────────────────
function Badge({ text }) {
  if (!text) return null;
  const map = {
    "Hot 🔥":{"bg":"#FEF2F2","c":"#DC2626","b":"#FECACA"},
    "Best Value":{"bg":"#F0FDF4","c":"#16A34A","b":"#BBF7D0"},
    "Popular":{"bg":"#EEF2FF","c":"#4338CA","b":"#C7D2FE"},
    "Budget":{"bg":"#F5F3FF","c":"#7C3AED","b":"#DDD6FE"},
    "New 2024":{"bg":"#ECFDF5","c":"#047857","b":"#6EE7B7"},
    "Fan Fave":{"bg":"#FDF2F8","c":"#9D174D","b":"#FBCFE8"},
    "Ultra 👑":{"bg":"#FFFBEB","c":"#92400E","b":"#FDE68A"},
    "Ultra 👑 New":{"bg":"#FFFBEB","c":"#92400E","b":"#FDE68A"},
    "Premium 👑":{"bg":"#FFFBEB","c":"#92400E","b":"#FDE68A"},
    "FLAGSHIP 👑":{"bg":"#FFF7ED","c":"#7C2D12","b":"#FED7AA"},
    "5G":{"bg":"#EFF6FF","c":"#1D4ED8","b":"#BFDBFE"},
    "5G Budget":{"bg":"#EFF6FF","c":"#1D4ED8","b":"#BFDBFE"},
    "Pro":{"bg":"#F8FAFC","c":"#334155","b":"#CBD5E1"},
    "Pro 🆕":{"bg":"#F8FAFC","c":"#1E293B","b":"#CBD5E1"},
    "Pro XL 👑":{"bg":"#FFFBEB","c":"#92400E","b":"#FDE68A"},
    "Foldable 🔥":{"bg":"#FEF2F2","c":"#DC2626","b":"#FECACA"},
    "Gaming 🎮":{"bg":"#F5F3FF","c":"#4C1D95","b":"#DDD6FE"},
    "Unique! 🔄":{"bg":"#ECFEFF","c":"#0E7490","b":"#A5F3FC"},
  };
  const s = map[text] || { bg:"#F1F5F9", c:"#374151", b:"#E2E8F0" };
  return (
    <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:"9999px",fontSize:10,fontWeight:600,letterSpacing:.2,background:s.bg,color:s.c,border:`1px solid ${s.b}`,whiteSpace:"nowrap",lineHeight:1.6}}>
      {text}
    </span>
  );
}

const WA_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function FloatWA() {
  return (
    <a href={waLink("Hi NEXMOBILE! 👋 I'm browsing your catalog and have a question.")}
      target="_blank" rel="noreferrer"
      style={{position:"fixed",bottom:20,right:20,zIndex:999,width:54,height:54,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",boxShadow:"0 4px 14px rgba(37,211,102,.45)",textDecoration:"none",animation:"waPulse 2.5s ease-in-out infinite"}}>
      {WA_ICON}
    </a>
  );
}

function Toast({ msg, type, onDone }) {
  // FIX: added [onDone] dependency so timer isn't reset every render
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const bg = type==="error"?"#FEF2F2":type==="info"?"#EEF4FF":"#F0FDF4";
  const co = type==="error"?"#991B1B":type==="info"?"#1E40AF":"#166534";
  return (
    <div style={{position:"fixed",bottom:88,right:20,zIndex:9999,background:bg,color:co,borderRadius:10,padding:"11px 18px",fontSize:13,fontWeight:500,boxShadow:"0 4px 14px rgba(0,0,0,.12)",display:"flex",gap:8,alignItems:"center",maxWidth:300,animation:"slideUp .3s ease"}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:co,flexShrink:0}}/>
      {msg}
    </div>
  );
}

// ─── PHONE ILLUSTRATION ───────────────────────────────────────────────────────
function PhoneIllo({ brand, size = 90 }) {
  const c = BRAND_COLORS[brand] || "#555";
  const bg = BRAND_BG[brand] || "#f5f5f5";
  return (
    <svg width={size} height={size*1.75} viewBox="0 0 60 105" fill="none">
      <rect x="5" y="3" width="50" height="99" rx="10" fill={bg} stroke={`${c}30`} strokeWidth="1.5"/>
      <rect x="9" y="7" width="42" height="85" rx="7" fill={`${c}14`}/>
      {brand==="Apple"
        ? <path d="M24 10 Q30 7.5 36 10 Q34 13 30 13 Q26 13 24 10Z" fill={c} opacity=".6"/>
        : <rect x="20" y="9" width="20" height="3" rx="1.5" fill={c} opacity=".35"/>}
      <circle cx="30" cy="95" r="3.5" stroke={c} strokeWidth="1.5" fill="none" opacity=".6"/>
      <text x="30" y="55" textAnchor="middle" fill={c} fontSize="7.5" fontWeight="700" opacity=".45" fontFamily="system-ui,sans-serif">
        {brand==="Apple"?"iPhone":brand==="Google"?"Pixel":brand.slice(0,7)}
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [dark, setDark]           = useState(false);
  const [view, setView]           = useState("store"); // store | admin | login
  const [page, setPage]           = useState("home");  // home | list | detail
  const [detail, setDetail]       = useState(null);
  const [catalog, setCatalog]     = useState(PHONES);
  const [search, setSearch]       = useState("");
  const [brand, setBrand]         = useState("All");
  const [sortBy, setSortBy]       = useState("featured");
  const [onlyHot, setOnlyHot]     = useState(false);
  const [onlyNew, setOnlyNew]     = useState(false);
  const [only5G, setOnly5G]       = useState(false);
  const [minP, setMinP]           = useState(0);
  const [maxP, setMaxP]           = useState(1500);
  const [wishlist, setWishlist]   = useState(new Set());
  const [cart, setCart]           = useState([]);
  const [cartOpen, setCartOpen]   = useState(false);
  const [adminTab, setAdminTab]   = useState("dash");
  const [loginPw, setLoginPw]     = useState("");
  const [loginErr, setLoginErr]   = useState("");
  const [editPhone, setEditPhone] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [delId, setDelId]         = useState(null);
  const [actLog, setActLog]       = useState([]);
  const [toast, setToast]         = useState(null);
  const [bulkPct, setBulkPct]     = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const sk = useMemo(() => dark ? { ...C, bg:DK.bg, surface:DK.surface, border:DK.border, t1:DK.t1, t2:DK.t2, t3:DK.t3, t4:DK.t4, blueLt:DK.blueLt, blue2:DK.blue2 } : C, [dark]);

  const visPhones = useMemo(() => catalog.filter(p => view==="admin" || p.visible !== false), [catalog, view]);

  const filtered = useMemo(() => {
    let r = visPhones;
    if (brand !== "All") r = r.filter(p => p.brand === brand);
    if (search) { const q = search.toLowerCase(); r = r.filter(p => `${p.brand} ${p.name} ${p.storage} ${p.ram}`.toLowerCase().includes(q)); }
    r = r.filter(p => p.sell >= minP && p.sell <= maxP);
    if (onlyHot)  r = r.filter(p => p.hot);
    if (onlyNew)  r = r.filter(p => p.new_);
    if (only5G)   r = r.filter(p => p.specs?.connectivity?.includes("5G") || p.badge?.includes("5G") || p.name.toLowerCase().includes("5g"));
    const sorters = { "price-asc":(a,b)=>a.sell-b.sell, "price-desc":(a,b)=>b.sell-a.sell, "rating":(a,b)=>b.stars-a.stars, "views":(a,b)=>b.views-a.views, "newest":(a,b)=>b.id-a.id };
    return sorters[sortBy] ? [...r].sort(sorters[sortBy]) : r;
  }, [visPhones, brand, search, minP, maxP, onlyHot, onlyNew, only5G, sortBy]);

  const hotDeals    = catalog.filter(p => p.visible!==false && p.hot).slice(0, 8);
  const newArrivals = catalog.filter(p => p.visible!==false && p.new_).slice(0, 6);
  const topViewed   = [...catalog].filter(p => p.visible!==false).sort((a,b) => b.views-a.views).slice(0, 6);

  const toast_   = (msg, type="success") => setToast({ msg, type });
  const log_     = (msg) => setActLog(l => [{ t: new Date().toLocaleTimeString(), msg }, ...l.slice(0, 99)]);
  const openDetail = (p) => {
    setCatalog(prev => prev.map(ph => ph.id===p.id ? {...ph, views: ph.views+1} : ph));
    setDetail({ ...p, views: p.views+1 });
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goToBrand = (b) => { setBrand(b); setPage("list"); setDetail(null); window.scrollTo({ top: 0 }); };
  const addCart   = (p) => { setCart(c => [...c, p]); toast_(`${p.name} added to cart`, "info"); };
  const toggleWish = (id) => setWishlist(w => { const n = new Set(w); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const savePhone  = (ph) => {
    if (editPhone) { setCatalog(prev => prev.map(p => p.id===ph.id ? ph : p)); log_(`Edited: ${ph.name}`); toast_("Updated!"); }
    else { setCatalog(prev => [{ ...ph, id: Date.now(), views: 0, visible: true }, ...prev]); log_(`Added: ${ph.name}`); toast_("Added!"); }
    setShowForm(false); setEditPhone(null);
  };
  const deletePhone = (id) => { const p = catalog.find(x => x.id===id); setCatalog(prev => prev.filter(p => p.id!==id)); log_(`Deleted: ${p?.name}`); toast_("Deleted","error"); setDelId(null); };
  const toggleVis   = (id) => { const p = catalog.find(x => x.id===id); setCatalog(prev => prev.map(x => x.id===id ? {...x, visible: x.visible===false ? true : false} : x)); log_(`${p.visible===false?"Shown":"Hidden"}: ${p.name}`); };
  const login       = () => { if (loginPw===CFG.adminPw) { setView("admin"); setLoginPw(""); setLoginErr(""); } else setLoginErr("Wrong password — hint: " + CFG.adminPw); };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (view === "login") return (
    <div style={{ minHeight:"100vh", background:sk.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <style>{GCSS}</style>
      <div style={{ background:sk.surface, borderRadius:20, padding:40, width:"100%", maxWidth:380, boxShadow:C.shLg }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:26, fontWeight:800, color:C.blue, letterSpacing:-.5, marginBottom:4 }}>{CFG.brand}</div>
          <div style={{ fontSize:13, color:sk.t3 }}>Admin Panel Login</div>
        </div>
        <input type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key==="Enter" && login()}
          placeholder="Enter password" style={{ width:"100%", border:`1.5px solid ${loginErr?C.red:sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"12px 14px", fontSize:14, color:sk.t1, outline:"none", boxSizing:"border-box", marginBottom:8 }} />
        {loginErr && <p style={{ fontSize:12, color:C.red, marginBottom:8 }}>{loginErr}</p>}
        <p style={{ fontSize:11, color:sk.t4, marginBottom:18 }}>Password: {CFG.adminPw}</p>
        <button onClick={login} style={{ width:"100%", background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:13, fontSize:15, fontWeight:600, cursor:"pointer" }}>Login</button>
        <button onClick={() => setView("store")} style={{ width:"100%", background:"none", border:"none", color:sk.t3, fontSize:13, cursor:"pointer", marginTop:14, padding:8 }}>← Back to Store</button>
      </div>
    </div>
  );

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  if (view === "admin") return (
    <div style={{ minHeight:"100vh", background:dark?"#0B0F1A":"#F1F5F9", fontFamily:"system-ui,-apple-system,sans-serif", color:sk.t1 }}>
      <style>{GCSS}</style>
      <nav style={{ background:sk.surface, borderBottom:`1px solid ${sk.border}`, height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", position:"sticky", top:0, zIndex:100, boxShadow:C.sh }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:19, fontWeight:800, color:C.blue }}>{CFG.brand}</span>
          <span style={{ background:C.blueLt, color:C.blue, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:C.rFull }}>ADMIN</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setView("store")} style={{ background:"none", border:`1px solid ${sk.border}`, color:sk.t3, borderRadius:C.rSm, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>← Store</button>
          <button onClick={() => { setView("login"); }} style={{ background:"#FEF2F2", border:"1px solid #FECACA", color:C.red, borderRadius:C.rSm, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>Logout</button>
        </div>
      </nav>
      <div style={{ display:"flex", minHeight:"calc(100vh - 56px)" }}>
        <aside style={{ width:180, background:sk.surface, borderRight:`1px solid ${sk.border}`, padding:14, flexShrink:0 }}>
          {[["dash","📊","Dashboard"],["phones","📱","All Phones"],["bulk","⚡","Bulk Tools"],["log","📋","Activity"]].map(([tab,ic,lbl]) => (
            <button key={tab} onClick={() => setAdminTab(tab)}
              style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"10px 12px", background:adminTab===tab?C.blueLt:"transparent", border:"none", borderRadius:C.rSm, color:adminTab===tab?C.blue:sk.t3, fontSize:13, cursor:"pointer", marginBottom:2, fontWeight:adminTab===tab?600:400, textAlign:"left" }}>
              {ic} {lbl}
            </button>
          ))}
        </aside>
        <main style={{ flex:1, padding:28, overflowY:"auto" }}>
          {adminTab==="dash"   && <AdminDash catalog={catalog} actLog={actLog} sk={sk} />}
          {adminTab==="phones" && <AdminPhones catalog={catalog} onEdit={p=>{setEditPhone(p);setShowForm(true);}} onDelete={setDelId} onToggle={toggleVis} onAdd={()=>{setEditPhone(null);setShowForm(true);}} sk={sk} />}
          {adminTab==="bulk"   && <AdminBulk bulkPct={bulkPct} setBulkPct={setBulkPct} onApply={() => { if(!bulkPct) return; setCatalog(prev => prev.map(p => ({...p, sell: Math.round(p.sell*(1+bulkPct/100)), base: Math.round(p.base*(1+bulkPct/100))}))); log_(`Bulk ${bulkPct>0?"+":""}${bulkPct}%`); toast_(`Bulk ${bulkPct>0?"+":""}${bulkPct}% applied`); setBulkPct(0); }} catalog={catalog} setCatalog={setCatalog} log_={log_} toast_={toast_} sk={sk} />}
          {adminTab==="log"    && <AdminLog entries={actLog} sk={sk} />}
        </main>
      </div>
      {showForm && <AdminFormModal phone={editPhone} onSave={savePhone} onClose={() => { setShowForm(false); setEditPhone(null); }} sk={sk} />}
      {delId    && <ConfirmModal onConfirm={() => deletePhone(delId)} onClose={() => setDelId(null)} sk={sk} />}
      {toast    && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STORE
  // ─────────────────────────────────────────────────────────────────────────
  const activeFiltersCount = [brand!=="All", onlyHot, onlyNew, only5G, minP>0, maxP<1500].filter(Boolean).length;

  return (
    <div style={{ minHeight:"100vh", background:sk.bg, fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", color:sk.t1 }}>
      <style>{GCSS}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header style={{ background:sk.surface, borderBottom:`1px solid ${sk.border}`, position:"sticky", top:0, zIndex:200, boxShadow:C.sh }}>
        {/* Announcement */}
        <div style={{ background:C.blue, color:"#fff", textAlign:"center", padding:"6px 16px", fontSize:11, fontWeight:500, letterSpacing:.2 }}>
          📦 All phones Boxed & Sealed · Zimbabwe · WhatsApp: {CFG.wa.replace("263","0")}
        </div>
        {/* Main bar */}
        <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 16px", display:"flex", alignItems:"center", gap:10, height:60 }}>
          {/* Back arrow if not home */}
          {page !== "home" && (
            <button onClick={() => { if(page==="detail") { setPage("list"); setDetail(null); } else { setPage("home"); setBrand("All"); setSearch(""); } }}
              style={{ background:"none", border:"none", color:sk.t3, cursor:"pointer", padding:"8px 4px", display:"flex", alignItems:"center", flexShrink:0, fontSize:22, lineHeight:1 }}>
              ‹
            </button>
          )}
          <button onClick={() => { setPage("home"); setBrand("All"); setSearch(""); setOnlyHot(false); setOnlyNew(false); setOnly5G(false); }}
            style={{ background:"none", border:"none", fontSize:18, fontWeight:800, color:C.blue, cursor:"pointer", letterSpacing:-.5, padding:0, flexShrink:0 }}>
            {CFG.brand}
          </button>
          {/* Search */}
          <div style={{ flex:1, position:"relative", maxWidth:480 }}>
            <input value={search} onChange={e => { setSearch(e.target.value); if(e.target.value) setPage("list"); }}
              placeholder="Search phones..."
              style={{ width:"100%", border:`1.5px solid ${sk.border}`, background:sk.bg, borderRadius:C.r, padding:"9px 36px 9px 14px", fontSize:14, color:sk.t1, outline:"none", boxSizing:"border-box", transition:"border-color .2s" }}
              onFocus={e => e.target.style.borderColor=C.blue}
              onBlur={e => e.target.style.borderColor=sk.border} />
            {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:sk.t4, cursor:"pointer", fontSize:16, lineHeight:1 }}>✕</button>}
          </div>
          {/* Actions */}
          <div style={{ display:"flex", gap:6, marginLeft:"auto", alignItems:"center" }}>
            <button onClick={() => setCartOpen(o => !o)} style={{ background:sk.bg, border:`1px solid ${sk.border}`, borderRadius:C.rSm, padding:"8px 10px", cursor:"pointer", color:sk.t2, position:"relative", display:"flex" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {cart.length > 0 && <span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"#fff", fontSize:9, fontWeight:700, borderRadius:"50%", width:15, height:15, display:"flex", alignItems:"center", justifyContent:"center" }}>{cart.length}</span>}
            </button>
            <button onClick={() => setDark(d => !d)} style={{ background:sk.bg, border:`1px solid ${sk.border}`, borderRadius:C.rSm, padding:"8px 10px", cursor:"pointer", color:sk.t2, display:"flex", fontSize:15 }}>
              {dark ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setView("login")} style={{ background:"none", border:`1px solid ${sk.border}`, borderRadius:C.rSm, padding:"7px 12px", cursor:"pointer", color:sk.t3, fontSize:12 }}>Admin</button>
          </div>
        </div>
        {/* Brand tab bar — horizontal scroll, no blocking sidebar */}
        <div style={{ borderTop:`1px solid ${sk.border}`, overflowX:"auto", scrollbarWidth:"none" }}>
          <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 16px", display:"flex", gap:0, minWidth:"max-content" }}>
            {BRANDS.map(b => (
              <button key={b} onClick={() => { setBrand(b); setPage(b==="All" ? "home" : "list"); setSearch(""); }}
                style={{ whiteSpace:"nowrap", padding:"10px 14px", background:"none", border:"none", color:brand===b?C.blue:sk.t3, fontSize:13, fontWeight:brand===b?700:400, cursor:"pointer", borderBottom:`2px solid ${brand===b?C.blue:"transparent"}`, transition:"all .15s", flexShrink:0 }}>
                {b}
                {b!=="All" && <span style={{ fontSize:10, color:brand===b?C.blue:sk.t4, marginLeft:3 }}>({catalog.filter(p=>p.brand===b&&p.visible!==false).length})</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── FILTER CHIPS ROW (BELOW NAV, NOT SIDEBAR) ─────────────────────── */}
      {(page === "list" || search) && (
        <div style={{ background:sk.surface, borderBottom:`1px solid ${sk.border}`, padding:"10px 16px", overflowX:"auto", scrollbarWidth:"none" }}>
          <div style={{ maxWidth:1440, margin:"0 auto", display:"flex", gap:8, alignItems:"center", minWidth:"max-content" }}>
            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rFull, padding:"5px 12px", fontSize:12, color:sk.t2, cursor:"pointer", outline:"none", flexShrink:0 }}>
              {[["featured","Featured"],["price-asc","Price ↑"],["price-desc","Price ↓"],["rating","Top Rated"],["views","Popular"],["newest","Newest"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {/* Toggle chips */}
            {[[onlyHot, setOnlyHot, "🔥 Hot"], [onlyNew, setOnlyNew, "🆕 New"], [only5G, setOnly5G, "📶 5G"]].map(([v, s, l]) => (
              <button key={l} onClick={() => s(!v)}
                style={{ padding:"5px 12px", borderRadius:C.rFull, border:`1px solid ${v?C.blue:sk.border}`, background:v?C.blueLt:sk.bg, color:v?C.blue:sk.t3, fontSize:12, fontWeight:v?600:400, cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
                {l}
              </button>
            ))}
            {/* Price chip */}
            <button onClick={() => setShowFilters(f => !f)}
              style={{ padding:"5px 12px", borderRadius:C.rFull, border:`1px solid ${showFilters||minP>0||maxP<1500?C.blue:sk.border}`, background:showFilters||minP>0||maxP<1500?C.blueLt:sk.bg, color:showFilters||minP>0||maxP<1500?C.blue:sk.t3, fontSize:12, cursor:"pointer", flexShrink:0 }}>
              💵 ${minP}–${maxP}
            </button>
            {activeFiltersCount > 0 && (
              <button onClick={() => { setBrand("All"); setOnlyHot(false); setOnlyNew(false); setOnly5G(false); setMinP(0); setMaxP(1500); setSortBy("featured"); }}
                style={{ padding:"5px 12px", borderRadius:C.rFull, border:`1px solid #FECACA`, background:"#FEF2F2", color:C.red, fontSize:12, cursor:"pointer", flexShrink:0, fontWeight:500 }}>
                Clear ×{activeFiltersCount}
              </button>
            )}
            <span style={{ color:sk.t4, fontSize:12, flexShrink:0, marginLeft:4 }}>{filtered.length} phones</span>
          </div>
          {/* Price dropdown */}
          {showFilters && (
            <div style={{ maxWidth:360, margin:"10px 0 0", display:"flex", gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:sk.t4, fontWeight:600, marginBottom:4 }}>MIN $</div>
                <input type="number" value={minP} onChange={e => setMinP(Number(e.target.value))} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"8px 10px", fontSize:13, color:sk.t1, outline:"none", boxSizing:"border-box" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:sk.t4, fontWeight:600, marginBottom:4 }}>MAX $</div>
                <input type="number" value={maxP} onChange={e => setMaxP(Number(e.target.value))} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"8px 10px", fontSize:13, color:sk.t1, outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>
          )}
        </div>
      )}

      <main style={{ maxWidth:1440, margin:"0 auto", padding:"0 16px" }}>

        {/* ── DETAIL PAGE ─────────────────────────────────────────────── */}
        {page === "detail" && detail && (() => {
          const p = detail;
          const bd = BRAND_COLORS[p.brand];
          const bbg = BRAND_BG[p.brand] || "#f5f5f5";
          return (
            <div style={{ paddingBottom:64 }}>
              {/* Breadcrumb — TAPPABLE brand navigation */}
              <div style={{ padding:"14px 0 10px", display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
                <button onClick={() => { setPage("home"); setBrand("All"); }} style={{ background:"none", border:"none", color:sk.t3, cursor:"pointer", padding:0, fontWeight:400 }}>Home</button>
                <span style={{ color:sk.t4 }}>›</span>
                <button onClick={() => goToBrand(p.brand)} style={{ background:"none", border:"none", color:C.blue, cursor:"pointer", padding:0, fontWeight:600 }}>{p.brand}</button>
                <span style={{ color:sk.t4 }}>›</span>
                <span style={{ color:sk.t2, fontWeight:500 }}>{p.name}</span>
              </div>

              {/* Phone image — full width on mobile, centered on desktop */}
              <div style={{ background:bbg, borderRadius:20, padding:"32px 24px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, minHeight:280, position:"relative" }}>
                <PhoneIllo brand={p.brand} size={140} />
                {p.badge && <div style={{ position:"absolute", top:14, left:14 }}><Badge text={p.badge} /></div>}
                {p.new_ && <div style={{ position:"absolute", top:14, right:14 }}><Badge text="New Arrival" /></div>}
                <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", background:"rgba(255,255,255,.9)", borderRadius:C.rFull, padding:"4px 14px", fontSize:11, fontWeight:600, color:C.green, whiteSpace:"nowrap" }}>
                  📦 Factory Boxed & Sealed
                </div>
              </div>

              {/* Brand chip — tappable */}
              <div style={{ marginBottom:8 }}>
                <button onClick={() => goToBrand(p.brand)}
                  style={{ background:`${bd}18`, border:`1px solid ${bd}30`, borderRadius:C.rFull, padding:"4px 14px", fontSize:12, fontWeight:600, color:bd, cursor:"pointer" }}>
                  {p.brand} ↗
                </button>
              </div>

              <h1 style={{ fontSize:26, fontWeight:800, color:sk.t1, letterSpacing:-.5, marginBottom:6 }}>{p.name}</h1>
              <div style={{ color:C.amber, fontSize:14, marginBottom:10 }}>{starStr(p.stars)} <span style={{ color:sk.t4, fontSize:12 }}>({p.views} views)</span></div>

              {/* Spec pills */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
                {[p.storage, p.ram].map(s => <span key={s} style={{ background:sk.bg, border:`1px solid ${sk.border}`, borderRadius:C.rFull, padding:"5px 14px", fontSize:13, fontWeight:500, color:sk.t2 }}>{s}</span>)}
              </div>

              {/* Price block */}
              <div style={{ background:sk.bg, border:`1px solid ${sk.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
                <div style={{ fontSize:11, color:sk.t4, fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Selling Price</div>
                {p.disc > 0 && <div style={{ fontSize:14, color:sk.t4, textDecoration:"line-through" }}>{fmt(Math.round(p.sell/(1-p.disc/100)))}</div>}
                <div style={{ fontSize:38, fontWeight:900, color:C.blue, letterSpacing:-1, lineHeight:1.1 }}>{fmt(p.sell)}</div>
                {p.disc > 0 && <div style={{ fontSize:12, color:C.green, marginTop:2 }}>{p.disc}% discount applied</div>}
              </div>

              {/* CTAs */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
                <a href={waOrder(p)} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.green, color:"#fff", borderRadius:C.r, padding:"15px 20px", fontSize:15, fontWeight:600, textDecoration:"none", boxShadow:`0 4px 12px rgba(16,185,129,.3)` }}>
                  {WA_ICON} Order via WhatsApp
                </a>
                <button onClick={() => addCart(p)} style={{ background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:14, fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 12px ${C.blue}30` }}>
                  🛒 Add to Cart
                </button>
                <button onClick={() => toggleWish(p.id)} style={{ background:"none", border:`1.5px solid ${sk.border}`, borderRadius:C.r, padding:"11px", fontSize:14, cursor:"pointer", color:sk.t3, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {wishlist.has(p.id) ? "❤️ Saved" : "🤍 Save to Wishlist"}
                </button>
              </div>

              {/* Description */}
              <div style={{ marginBottom:24 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:sk.t1, marginBottom:8 }}>About this phone</h2>
                <p style={{ fontSize:15, color:sk.t2, lineHeight:1.75 }}>{p.desc}</p>
              </div>

              {/* FULL SPECS TABLE — all real specs */}
              {p.specs && (
                <div style={{ background:sk.surface, borderRadius:16, padding:20, boxShadow:C.sh, marginBottom:24 }}>
                  <h2 style={{ fontSize:16, fontWeight:700, color:sk.t1, marginBottom:14 }}>Full Specifications</h2>
                  {Object.entries(p.specs).map(([key, val]) => (
                    <div key={key} style={{ display:"flex", borderBottom:`1px solid ${sk.border}`, padding:"11px 0" }}>
                      <div style={{ width:"38%", fontSize:13, fontWeight:600, color:sk.t3, textTransform:"capitalize", flexShrink:0 }}>
                        {key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}
                      </div>
                      <div style={{ fontSize:13, color:sk.t1, lineHeight:1.5 }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* More from same brand */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <h2 style={{ fontSize:16, fontWeight:700, color:sk.t1 }}>More from {p.brand}</h2>
                  <button onClick={() => goToBrand(p.brand)} style={{ background:"none", border:`1px solid ${sk.border}`, borderRadius:C.rSm, padding:"6px 12px", fontSize:12, color:sk.t3, cursor:"pointer" }}>View All</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
                  {catalog.filter(x => x.brand===p.brand && x.id!==p.id && x.visible!==false).slice(0,4).map(x => (
                    <div key={x.id} onClick={() => openDetail(x)}
                      style={{ background:sk.surface, borderRadius:12, padding:12, cursor:"pointer", boxShadow:C.sh, transition:"all .2s" }}
                      onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform="none"}>
                      <div style={{ background:BRAND_BG[x.brand]||"#f5f5f5", borderRadius:8, height:80, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 }}>
                        <PhoneIllo brand={x.brand} size={36} />
                      </div>
                      <div style={{ fontSize:11, fontWeight:600, color:sk.t2, marginBottom:2 }}>{x.name}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.blue }}>{fmt(x.sell)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── HOME PAGE ───────────────────────────────────────────────── */}
        {page === "home" && !search && (
          <>
            {/* Hero */}
            <div style={{ padding:"44px 0 36px" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.blueLt, border:`1px solid ${C.blue2}`, borderRadius:C.rFull, padding:"5px 14px", fontSize:11, fontWeight:600, color:C.blue, marginBottom:16 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:C.green }}/>
                LIVE STOCK · ZIMBABWE'S BEST PRICES
              </div>
              <h1 style={{ fontSize:"clamp(30px,6vw,54px)", fontWeight:800, lineHeight:1.1, color:sk.t1, letterSpacing:-1, marginBottom:14 }}>
                Every Phone.<br/>
                <span style={{ color:C.blue }}>Boxed. Sealed.</span><br/>
                Best Price.
              </h1>
              <p style={{ fontSize:16, color:sk.t3, lineHeight:1.7, marginBottom:24, maxWidth:480 }}>
                Factory-sealed smartphones at wholesale prices. Samsung, Apple, Google, Xiaomi & more — delivered across Zimbabwe.
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button onClick={() => setPage("list")} style={{ background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:"13px 24px", fontSize:15, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 14px ${C.blue}40` }}>
                  Browse All {catalog.filter(p=>p.visible!==false).length} Phones →
                </button>
                <a href={waLink("Hi NEXMOBILE! I'd like to enquire about your phones.")} target="_blank" rel="noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.green, color:"#fff", borderRadius:C.r, padding:"13px 20px", fontSize:14, fontWeight:600, textDecoration:"none" }}>
                  {WA_ICON} WhatsApp
                </a>
              </div>
              <div style={{ display:"flex", gap:24, marginTop:28, flexWrap:"wrap" }}>
                {[["43+","Models"],["8","Brands"],["📦","Boxed & Sealed"],["✓","Nationwide Delivery"]].map(([n,l]) => (
                  <div key={l}>
                    <div style={{ fontSize:21, fontWeight:800, color:C.blue, letterSpacing:-.5 }}>{n}</div>
                    <div style={{ fontSize:11, color:sk.t3, marginTop:1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand grid */}
            <div style={{ marginBottom:40 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:sk.t1, marginBottom:14 }}>Shop by Brand</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))", gap:8 }}>
                {Object.entries(BRAND_COLORS).map(([b, bc]) => (
                  <button key={b} onClick={() => goToBrand(b)}
                    style={{ background:BRAND_BG[b]||"#f5f5f5", border:`1px solid ${bc}22`, borderRadius:12, padding:"12px 8px", cursor:"pointer", textAlign:"center", transition:"all .2s", boxShadow:C.sh }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=C.shMd; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=C.sh; }}>
                    <div style={{ fontSize:11, fontWeight:700, color:bc, letterSpacing:.3 }}>{b}</div>
                    <div style={{ fontSize:10, color:sk.t4, marginTop:2 }}>{catalog.filter(p=>p.brand===b&&p.visible!==false).length} phones</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hot Deals */}
            {hotDeals.length > 0 && (
              <HomeSection title="🔥 Hot Deals" sub="Limited stock — act fast" sk={sk} onAll={() => { setOnlyHot(true); setPage("list"); }}>
                <PhoneGrid phones={hotDeals} sk={sk} onCard={openDetail} wishlist={wishlist} onWish={toggleWish} onCart={addCart} />
              </HomeSection>
            )}
            {/* New Arrivals */}
            {newArrivals.length > 0 && (
              <HomeSection title="🆕 New Arrivals" sub="Just landed in stock" sk={sk} onAll={() => { setOnlyNew(true); setPage("list"); }}>
                <PhoneGrid phones={newArrivals} sk={sk} onCard={openDetail} wishlist={wishlist} onWish={toggleWish} onCart={addCart} />
              </HomeSection>
            )}
            {/* Top Viewed */}
            <HomeSection title="⭐ Most Popular" sub="What buyers are checking out" sk={sk} onAll={() => { setSortBy("views"); setPage("list"); }}>
              <PhoneGrid phones={topViewed} sk={sk} onCard={openDetail} wishlist={wishlist} onWish={toggleWish} onCart={addCart} />
            </HomeSection>

            <div style={{ textAlign:"center", paddingBottom:60 }}>
              <button onClick={() => setPage("list")} style={{ background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:"15px 36px", fontSize:15, fontWeight:600, cursor:"pointer" }}>
                Browse All {catalog.filter(p=>p.visible!==false).length} Phones →
              </button>
            </div>
          </>
        )}

        {/* ── LIST PAGE (CATALOG) ──────────────────────────────────────── */}
        {(page === "list" || search) && page !== "detail" && (
          <div style={{ paddingBottom:60 }}>
            <div style={{ padding:"16px 0 12px" }}>
              <h2 style={{ fontSize:20, fontWeight:700, color:sk.t1, letterSpacing:-.3 }}>
                {search ? `"${search}"` : brand!=="All" ? `${brand} Phones` : "All Phones"}
              </h2>
              <p style={{ fontSize:12, color:sk.t3, marginTop:2 }}>{filtered.length} phones · All Boxed & Sealed</p>
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"72px 0", color:sk.t3 }}>
                <div style={{ fontSize:48 }}>📭</div>
                <div style={{ fontSize:17, fontWeight:600, marginTop:12, color:sk.t2 }}>No phones match</div>
                <button onClick={() => { setBrand("All"); setSearch(""); setOnlyHot(false); setOnlyNew(false); setOnly5G(false); setMinP(0); setMaxP(1500); }} style={{ marginTop:18, background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:"11px 24px", fontSize:14, cursor:"pointer" }}>Clear Filters</button>
              </div>
            ) : (
              <PhoneGrid phones={filtered} sk={sk} onCard={openDetail} wishlist={wishlist} onWish={toggleWish} onCart={addCart} />
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      {page === "home" && !search && (
        <footer style={{ background:sk.surface, borderTop:`1px solid ${sk.border}`, padding:"36px 16px 20px" }}>
          <div style={{ maxWidth:1440, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:24, marginBottom:20 }}>
            <div>
              <div style={{ fontSize:19, fontWeight:800, color:C.blue, marginBottom:6 }}>{CFG.brand}</div>
              <p style={{ fontSize:13, color:sk.t3, lineHeight:1.65 }}>Zimbabwe's #1 wholesale phone store. Factory boxed & sealed. Best prices guaranteed.</p>
            </div>
            <div>
              <div style={{ fontWeight:600, color:sk.t1, marginBottom:10 }}>Order</div>
              <a href={waLink("Hi NEXMOBILE!")} style={{ display:"flex", alignItems:"center", gap:6, color:C.green, fontSize:13 }}>{WA_ICON} {CFG.wa.replace("263","0")}</a>
            </div>
            <div>
              <div style={{ fontWeight:600, color:sk.t1, marginBottom:10 }}>Why Us</div>
              {["Factory Boxed & Sealed","Researched Market Prices","8 Brands, 43+ Models","WhatsApp Support","Nationwide Delivery ZW"].map(t => <div key={t} style={{ fontSize:12, color:sk.t3, marginBottom:5 }}>✓ {t}</div>)}
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${sk.border}`, paddingTop:14, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
            <span style={{ fontSize:11, color:sk.t4 }}>© 2025 NEXMOBILE. All phones Factory Boxed & Sealed. Zimbabwe.</span>
          </div>
        </footer>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:400 }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)" }} onClick={() => setCartOpen(false)} />
          <div style={{ position:"absolute", top:0, right:0, width:Math.min(360, window.innerWidth), height:"100vh", background:sk.surface, boxShadow:C.shLg, padding:20, overflowY:"auto", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:16, color:sk.t1 }}>Cart ({cart.length})</div>
              <button onClick={() => setCartOpen(false)} style={{ background:sk.bg, border:`1px solid ${sk.border}`, borderRadius:C.rSm, padding:"7px 9px", cursor:"pointer", color:sk.t3, fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:"auto" }}>
              {cart.length === 0 ? <div style={{ textAlign:"center", padding:"60px 0", color:sk.t4 }}>🛒<br/>Empty cart</div> :
                cart.map((p, i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:12, padding:12, background:sk.bg, borderRadius:12 }}>
                    <div style={{ background:BRAND_BG[p.brand]||"#f5f5f5", borderRadius:8, padding:8, flexShrink:0 }}>
                      <PhoneIllo brand={p.brand} size={32} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:sk.t1 }}>{p.name}</div>
                      <div style={{ fontSize:11, color:sk.t3 }}>{p.storage} / {p.ram}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.blue }}>{fmt(p.sell)}</div>
                    </div>
                    <button onClick={() => setCart(c => c.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:sk.t4, cursor:"pointer", fontSize:16, alignSelf:"flex-start" }}>✕</button>
                  </div>
                ))
              }
            </div>
            {cart.length > 0 && (
              <div style={{ borderTop:`1px solid ${sk.border}`, paddingTop:14, marginTop:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, marginBottom:14, fontSize:15, color:sk.t1 }}>
                  <span>Total</span><span style={{ color:C.blue }}>{fmt(cart.reduce((a,p)=>a+p.sell,0))}</span>
                </div>
                <a href={waLink(`Hi NEXMOBILE! 👋\n\nCart:\n${cart.map(p=>`• ${p.name} ${p.storage}/${p.ram} — ${fmt(p.sell)}`).join("\n")}\n\nTotal: ${fmt(cart.reduce((a,p)=>a+p.sell,0))}`)}
                  target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.green, color:"#fff", borderRadius:C.r, padding:"14px", fontSize:14, fontWeight:600, textDecoration:"none" }}>
                  {WA_ICON} Order All via WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <FloatWA />
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── HOME SECTION WRAPPER ─────────────────────────────────────────────────────
function HomeSection({ title, sub, sk, onAll, children }) {
  return (
    <section style={{ marginBottom:44 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:14 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:sk.t1 }}>{title}</h2>
          <p style={{ fontSize:12, color:sk.t3, marginTop:2 }}>{sub}</p>
        </div>
        {onAll && <button onClick={onAll} style={{ background:"none", border:`1px solid ${sk.border}`, borderRadius:C.rSm, padding:"6px 12px", fontSize:12, color:sk.t2, cursor:"pointer" }}>View All ›</button>}
      </div>
      {children}
    </section>
  );
}

// ─── PHONE GRID ───────────────────────────────────────────────────────────────
function PhoneGrid({ phones, sk, onCard, wishlist, onWish, onCart }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
      {phones.map(p => <PhoneCard key={p.id} phone={p} sk={sk} onCard={onCard} isWished={wishlist.has(p.id)} onWish={onWish} onCart={onCart} />)}
    </div>
  );
}

// ─── PHONE CARD ───────────────────────────────────────────────────────────────
function PhoneCard({ phone: p, sk, onCard, isWished, onWish, onCart }) {
  const [hov, setHov] = useState(false);
  const bc = BRAND_COLORS[p.brand] || "#555";
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      // FIX: added position:"relative" so wishlist button and other absolute children position correctly
      style={{ background:sk.surface, borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"transform .22s, box-shadow .22s", transform:hov?"translateY(-4px)":"none", boxShadow:hov?C.shMd:C.sh, position:"relative" }}>
      {/* Wishlist */}
      <button onClick={e=>{e.stopPropagation();onWish(p.id);}} style={{ position:"absolute", top:8, left:8, zIndex:2, background:"rgba(255,255,255,.9)", border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, boxShadow:"0 1px 4px rgba(0,0,0,.1)" }}>
        {isWished?"❤️":"🤍"}
      </button>
      {/* Image area */}
      <div onClick={() => onCard(p)} style={{ background:BRAND_BG[p.brand]||"#f5f5f5", height:148, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", paddingTop:8 }}>
        <PhoneIllo brand={p.brand} size={60} />
        {p.badge && <div style={{ position:"absolute", bottom:6, left:6 }}><Badge text={p.badge} /></div>}
        {p.disc > 0 && <div style={{ position:"absolute", bottom:6, right:6, background:C.red, color:"#fff", borderRadius:C.rFull, padding:"1px 7px", fontSize:10, fontWeight:700 }}>-{p.disc}%</div>}
        {p.new_ && <div style={{ position:"absolute", top:6, right:6, background:"#065F46", color:"#fff", borderRadius:C.rFull, padding:"1px 7px", fontSize:9, fontWeight:700 }}>NEW</div>}
      </div>
      {/* Info */}
      <div style={{ padding:"10px 12px 8px" }} onClick={() => onCard(p)}>
        <div style={{ fontSize:9, fontWeight:700, color:bc, textTransform:"uppercase", letterSpacing:.5, marginBottom:2 }}>{p.brand}</div>
        <div style={{ fontWeight:600, fontSize:13, color:sk.t1, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
        <div style={{ color:C.amber, fontSize:11, marginBottom:5 }}>{starStr(p.stars)}</div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
          {[p.storage, p.ram].map(s => <span key={s} style={{ background:sk.bg, border:`1px solid ${sk.border}`, borderRadius:C.rFull, padding:"2px 7px", fontSize:10, color:sk.t3, fontWeight:500 }}>{s}</span>)}
        </div>
        <div style={{ fontSize:19, fontWeight:800, color:C.blue, letterSpacing:-.3 }}>{fmt(p.sell)}</div>
      </div>
      {/* FIX: Action buttons always visible (not hover-only) so mobile users can tap them */}
      <div style={{ padding:"0 12px 10px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <button onClick={e=>{e.stopPropagation();onCart(p);}} style={{ background:C.blue, color:"#fff", border:"none", borderRadius:C.rSm, padding:"7px", fontSize:11, fontWeight:600, cursor:"pointer" }}>🛒 Cart</button>
        <a href={waOrder(p)} target="_blank" rel="noreferrer" style={{ background:C.green, color:"#fff", borderRadius:C.rSm, padding:"7px", fontSize:11, fontWeight:600, textDecoration:"none", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
          {WA_ICON}
        </a>
      </div>
    </div>
  );
}

// ─── ADMIN COMPONENTS ─────────────────────────────────────────────────────────
function AdminDash({ catalog, actLog, sk }) {
  const total = catalog.length, vis = catalog.filter(p => p.visible !== false).length;
  return (
    <div>
      <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:-.5, marginBottom:20, color:sk.t1 }}>Dashboard</h1>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:28 }}>
        {[["📱","Total",total],["✅","Live",vis],["🏷️","Brands",Object.keys(BRAND_COLORS).length],["👁","Views",catalog.reduce((a,p)=>a+p.views,0).toLocaleString()]].map(([ic,l,v])=>(
          <div key={l} style={{ background:sk.surface, borderRadius:14, padding:18, boxShadow:C.sh }}>
            <div style={{ fontSize:22 }}>{ic}</div>
            <div style={{ fontSize:10, color:sk.t3, fontWeight:700, margin:"6px 0 3px", textTransform:"uppercase", letterSpacing:.5 }}>{l}</div>
            <div style={{ fontSize:26, fontWeight:800, color:C.blue }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:sk.surface, borderRadius:14, padding:20, boxShadow:C.sh }}>
        <h3 style={{ fontWeight:700, marginBottom:14, color:sk.t1 }}>Recent Activity</h3>
        {actLog.length === 0 ? <p style={{ color:sk.t4, fontSize:13 }}>No activity yet.</p> :
          actLog.slice(0,10).map((e,i)=>(
            <div key={i} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:`1px solid ${sk.border}`, fontSize:12 }}>
              <span style={{ color:C.blue, fontFamily:"monospace", flexShrink:0 }}>{e.t}</span>
              <span style={{ color:sk.t2 }}>{e.msg}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function AdminPhones({ catalog, onEdit, onDelete, onToggle, onAdd, sk }) {
  const [q, setQ] = useState(""), [fb, setFb] = useState("All");
  const list = catalog.filter(p => { const mq = !q || `${p.brand} ${p.name}`.toLowerCase().includes(q.toLowerCase()); return mq && (fb==="All"||p.brand===fb); });
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:sk.t1, letterSpacing:-.5 }}>Phones ({catalog.length})</h1>
        <button onClick={onAdd} style={{ background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Add Phone</button>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..." style={{ flex:1, maxWidth:260, border:`1px solid ${sk.border}`, background:sk.surface, borderRadius:C.rSm, padding:"8px 12px", fontSize:13, color:sk.t1, outline:"none" }} />
        <select value={fb} onChange={e=>setFb(e.target.value)} style={{ border:`1px solid ${sk.border}`, background:sk.surface, borderRadius:C.rSm, padding:"8px 12px", fontSize:13, color:sk.t2, cursor:"pointer", outline:"none" }}>
          {BRANDS.map(b=><option key={b}>{b}</option>)}
        </select>
        <span style={{ color:sk.t4, fontSize:13, alignSelf:"center" }}>{list.length}</span>
      </div>
      <div style={{ background:sk.surface, borderRadius:14, boxShadow:C.sh, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:sk.bg }}>
            {["Phone","Storage/RAM","Sell Price","Stock","Visible","Badge","Actions"].map(h=>(
              <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:10, color:sk.t4, fontWeight:700, textTransform:"uppercase", letterSpacing:.5 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {list.map(p=>(
              <tr key={p.id} style={{ borderTop:`1px solid ${sk.border}` }}
                onMouseEnter={e=>e.currentTarget.style.background=sk.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"11px 12px" }}>
                  <div style={{ fontWeight:600, fontSize:13, color:sk.t1 }}>{p.name}</div>
                  <div style={{ fontSize:10, color:BRAND_COLORS[p.brand]||"#888", fontWeight:700 }}>{p.brand}</div>
                </td>
                <td style={{ padding:"11px 12px", fontSize:12, color:sk.t3 }}>{p.storage} / {p.ram}</td>
                <td style={{ padding:"11px 12px", fontWeight:700, fontSize:14, color:C.blue }}>${p.sell}</td>
                <td style={{ padding:"11px 12px", fontWeight:600, fontSize:12, color:p.stock<=3?C.red:C.green }}>{p.stock}</td>
                <td style={{ padding:"11px 12px" }}>
                  <button onClick={()=>onToggle(p.id)} style={{ background:p.visible===false?"#FEF2F2":"#F0FDF4", color:p.visible===false?C.red:"#16A34A", border:`1px solid ${p.visible===false?"#FECACA":"#BBF7D0"}`, borderRadius:C.rFull, padding:"3px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>
                    {p.visible===false?"Hidden":"Live"}
                  </button>
                </td>
                <td style={{ padding:"11px 12px" }}><Badge text={p.badge} /></td>
                <td style={{ padding:"11px 12px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>onEdit(p)} style={{ background:C.blueLt, color:C.blue, border:"none", borderRadius:C.rSm, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Edit</button>
                    <button onClick={()=>onDelete(p.id)} style={{ background:"#FEF2F2", color:C.red, border:"none", borderRadius:C.rSm, padding:"4px 10px", fontSize:11, cursor:"pointer" }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminBulk({ bulkPct, setBulkPct, onApply, catalog, setCatalog, log_, toast_, sk }) {
  const [dp, setDp] = useState(0), [db, setDb] = useState("All");
  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, color:sk.t1, letterSpacing:-.5, marginBottom:20 }}>⚡ Bulk Tools</h1>
      <div style={{ display:"grid", gap:14 }}>
        {[
          { t:"💰 Bulk Price Adjustment", s:"Adjust all sell prices by %", c:(
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <input type="number" value={bulkPct} onChange={e=>setBulkPct(Number(e.target.value))} style={{ border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 12px", fontSize:14, color:sk.t1, width:110, outline:"none" }} placeholder="+10 or -5" />
              <span style={{ color:sk.t3 }}>%</span>
              <button onClick={onApply} style={{ background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:"10px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Apply to All</button>
            </div>
          )},
          { t:"🏷️ Bulk Discount", s:"Apply a discount % by brand", c:(
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              <select value={db} onChange={e=>setDb(e.target.value)} style={{ border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 12px", fontSize:13, color:sk.t2, cursor:"pointer", outline:"none" }}>
                {BRANDS.map(b=><option key={b}>{b}</option>)}
              </select>
              <input type="number" value={dp} onChange={e=>setDp(Number(e.target.value))} style={{ border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 12px", fontSize:14, color:sk.t1, width:90, outline:"none" }} />
              <span style={{ color:sk.t3 }}>% off</span>
              <button onClick={()=>{ setCatalog(prev=>prev.map(p=>(db==="All"||p.brand===db)?{...p,disc:Number(dp)}:p)); log_(`Discount: ${dp}% on ${db}`); toast_(`${dp}% applied to ${db}`); }} style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:C.r, padding:"10px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Apply</button>
            </div>
          )},
        ].map(({t,s,c})=>(
          <div key={t} style={{ background:sk.surface, borderRadius:14, padding:20, boxShadow:C.sh }}>
            <h3 style={{ fontWeight:700, fontSize:14, color:sk.t1, marginBottom:4 }}>{t}</h3>
            <p style={{ fontSize:12, color:sk.t3, marginBottom:14 }}>{s}</p>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminLog({ entries, sk }) {
  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, color:sk.t1, letterSpacing:-.5, marginBottom:20 }}>📋 Activity Log</h1>
      <div style={{ background:sk.surface, borderRadius:14, padding:20, boxShadow:C.sh }}>
        {entries.length===0 ? <p style={{ color:sk.t4, textAlign:"center", padding:"40px 0" }}>No activity yet.</p> :
          entries.map((e,i)=>(
            <div key={i} style={{ display:"flex", gap:14, padding:"9px 0", borderBottom:`1px solid ${sk.border}`, fontSize:12 }}>
              <span style={{ color:C.blue, fontFamily:"monospace", flexShrink:0, width:70 }}>{e.t}</span>
              <span style={{ color:sk.t2 }}>{e.msg}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── ADMIN FORM MODAL ─────────────────────────────────────────────────────────
function AdminFormModal({ phone, onSave, onClose, sk }) {
  const blank = { brand:"Samsung", series:"Galaxy A", name:"", ram:"8GB", storage:"128GB", sell:150, base:80, badge:"", desc:"", stock:10, disc:0, new_:false, hot:false, stars:4.0, specs:{} };
  const [f, setF] = useState(phone || blank);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:sk.surface, borderRadius:20, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", boxShadow:C.shLg }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontWeight:800, fontSize:19, color:sk.t1, marginBottom:22 }}>{phone?"Edit Phone":"Add Phone"}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["Brand","brand",["Samsung","Apple","Google","Xiaomi","Huawei","Oppo","Vivo","LG"]],
            ["Series","series",["Galaxy A","Galaxy M","Galaxy S","Galaxy Note","Galaxy Z","iPhone","Pixel","Redmi","P Series","A Series","Y Series","Wing"]],
          ].map(([l,k,opts])=>(
            <div key={k} style={{ marginBottom:0 }}>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:sk.t3, marginBottom:4, textTransform:"uppercase", letterSpacing:.4 }}>{l}</label>
              <select value={f[k]} onChange={e=>set(k,e.target.value)} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 10px", fontSize:13, color:sk.t1, cursor:"pointer", outline:"none" }}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, color:sk.t3, marginBottom:4, textTransform:"uppercase", letterSpacing:.4 }}>Model Name</label>
            <input value={f.name} onChange={e=>set("name",e.target.value)} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 12px", fontSize:13, color:sk.t1, outline:"none", boxSizing:"border-box" }} />
          </div>
          {[["Storage","storage",["32GB","64GB","128GB","256GB","512GB","1TB"]],
            ["RAM","ram",["2GB","3GB","4GB","6GB","8GB","12GB","16GB"]],
          ].map(([l,k,opts])=>(
            <div key={k}>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:sk.t3, marginBottom:4, textTransform:"uppercase" }}>{l}</label>
              <select value={f[k]} onChange={e=>set(k,e.target.value)} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 10px", fontSize:13, color:sk.t1, cursor:"pointer", outline:"none" }}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {[["Sell Price ($)","sell"],["Base Price ($)","base"],["Stock","stock"],["Discount (%)","disc"]].map(([l,k])=>(
            <div key={k}>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:sk.t3, marginBottom:4, textTransform:"uppercase" }}>{l}</label>
              <input type="number" value={f[k]??""} onChange={e=>set(k,Number(e.target.value))} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 12px", fontSize:13, color:sk.t1, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, color:sk.t3, marginBottom:4, textTransform:"uppercase" }}>Badge</label>
            <select value={f.badge} onChange={e=>set("badge",e.target.value)} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 10px", fontSize:13, color:sk.t1, cursor:"pointer", outline:"none" }}>
              {["","Hot 🔥","Best Value","Popular","Budget","Fan Fave","5G","5G Budget","Ultra 👑","Premium 👑","New 2024","FLAGSHIP 👑","Foldable 🔥","Gaming 🎮","Unique! 🔄","Pro","Pro 🆕","Pro XL 👑"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, color:sk.t3, marginBottom:4, textTransform:"uppercase" }}>Description</label>
            <textarea value={f.desc} onChange={e=>set("desc",e.target.value)} rows={3} style={{ width:"100%", border:`1px solid ${sk.border}`, background:sk.bg, borderRadius:C.rSm, padding:"9px 12px", fontSize:13, color:sk.t1, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", margin:"14px 0 18px" }}>
          {[["🆕 New Arrival","new_"],["🔥 Hot Deal","hot"]].map(([l,k])=>(
            <label key={k} style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:13, color:sk.t2 }}>
              <input type="checkbox" checked={!!f[k]} onChange={e=>set(k,e.target.checked)} style={{ accentColor:C.blue }} /> {l}
            </label>
          ))}
        </div>
        <div style={{ background:C.blueLt, border:`1px solid ${C.blue2}`, borderRadius:C.rSm, padding:"11px 14px", marginBottom:18, fontSize:13 }}>
          Selling price: <strong style={{ color:C.blue, fontSize:16 }}>${f.sell}</strong>
          {f.disc > 0 && <span style={{ color:sk.t3 }}> → ${Math.round(f.sell*(1-f.disc/100))} after {f.disc}% off</span>}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>{ if(!f.name) return; onSave({...f}); }} style={{ flex:1, background:C.blue, color:"#fff", border:"none", borderRadius:C.r, padding:"13px", fontSize:14, fontWeight:600, cursor:"pointer" }}>Save Phone</button>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${sk.border}`, borderRadius:C.r, padding:"13px 18px", fontSize:14, cursor:"pointer", color:sk.t3 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ onConfirm, onClose, sk }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:sk.surface, borderRadius:18, padding:28, maxWidth:320, width:"90%", boxShadow:C.shLg, textAlign:"center" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
        <div style={{ fontWeight:700, fontSize:17, color:sk.t1, marginBottom:6 }}>Delete this phone?</div>
        <p style={{ fontSize:13, color:sk.t3, marginBottom:24 }}>This cannot be undone.</p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onConfirm} style={{ flex:1, background:C.red, color:"#fff", border:"none", borderRadius:C.r, padding:"12px", fontSize:14, fontWeight:600, cursor:"pointer" }}>Delete</button>
          <button onClick={onClose} style={{ flex:1, background:"none", border:`1px solid ${sk.border}`, borderRadius:C.r, padding:"12px", fontSize:14, cursor:"pointer", color:sk.t3 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
  a { text-decoration: none; }
  @keyframes slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes waPulse { 0%,100% { box-shadow: 0 4px 14px rgba(37,211,102,.45); } 50% { box-shadow: 0 4px 22px rgba(37,211,102,.7), 0 0 0 7px rgba(37,211,102,.12); } }
  nav::-webkit-scrollbar { display: none; }
  select { cursor: pointer; }
  @media (max-width: 480px) {
    h1 { font-size: 28px !important; }
  }
`;
