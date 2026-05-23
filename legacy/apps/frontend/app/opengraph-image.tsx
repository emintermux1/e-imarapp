import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#f6f1e6", display: "flex", padding: 56, color: "#17231f" }}>
        <div style={{ flex: 1, border: "1px solid #d7d0bc", borderRadius: 48, background: "linear-gradient(135deg,#fffaf0,#d8e0d2)", padding: 58, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 30px 90px rgba(37,48,42,.14)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 78, height: 78, borderRadius: 24, background: "#17231f", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="58" height="58" viewBox="0 0 48 48">
                <path d="M9.8 31.2 22.3 9.9c.8-1.3 2.6-1.3 3.4 0l12.5 21.3c.8 1.3-.2 2.9-1.7 2.9H11.5c-1.5 0-2.4-1.6-1.7-2.9Z" fill="#087d7f" />
                <path d="M15.3 30.2 24 15.2l8.8 15H15.3Z" fill="#fffaf0" opacity=".92" />
                <path d="M11 35.8h26" stroke="#fffaf0" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M17.5 40.1h13" stroke="#d9a441" strokeWidth="3.4" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -3 }}>e<span style={{ color: "#087d7f" }}>imar</span></div>
              <div style={{ fontSize: 13, letterSpacing: 5, fontWeight: 800, color: "#65726b", textTransform: "uppercase" }}>imar haritası</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 78, fontWeight: 900, letterSpacing: -6, lineHeight: .92, maxWidth: 820 }}>Resmi güven, modern harita, kolay kullanım.</div>
            <div style={{ marginTop: 24, fontSize: 26, lineHeight: 1.35, color: "#65726b", maxWidth: 760 }}>Parsel, plan, 3D ve rapor akışları için premium e-imar deneyimi.</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
