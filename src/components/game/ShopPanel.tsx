export function ShopPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 16px", textAlign: "center", gap: 12 }}>
      <div style={{ fontSize: 48 }}>🛒</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Shop</h2>
      <p style={{ color: "#a1a1aa", fontSize: 14, maxWidth: 260, margin: 0 }}>
        Upgrades & packs coming soon.
      </p>
    </div>
  );
}
