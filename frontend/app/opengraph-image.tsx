import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0f1714", display: "flex", padding: 54, color: "#14211d" }}>
        <div style={{ flex: 1, borderRadius: 50, background: "linear-gradient(135deg,#fffaf0,#d8e0d2)", padding: 60, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 42px 120px rgba(0,0,0,.32)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 78, height: 78, borderRadius: 24, background: "#14211d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="58" height="58" viewBox="0 0 64 64">
                <path d="M18.8 12.5h23.7c4.5 0 8.1 3.6 8.1 8.1v22.8c0 4.5-3.6 8.1-8.1 8.1H21.6c-4.5 0-8.1-3.6-8.1-8.1V17.8c0-2.9 2.4-5.3 5.3-5.3Z" fill="#fffaf0" />
                <path d="M19.3 21.2h25.4M19.3 32h25.4M19.3 42.8h25.4M27.2 16.8v29.7M37.2 16.8v29.7" stroke="#14211d" strokeOpacity=".13" strokeWidth="1.8" />
                <path d="M20.4 38.2c4.8-11.7 15.5-16.8 24.6-10.7" fill="none" stroke="#0b8f8f" strokeWidth="6" strokeLinecap="round" />
                <path d="M20.2 44.7h21.2" stroke="#d6a23b" strokeWidth="4.8" strokeLinecap="round" />
                <circle cx="45" cy="27.5" r="4.6" fill="#c5463c" />
                <circle cx="45" cy="27.5" r="2" fill="#fffaf0" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -3 }}>e<span style={{ color: "#0b8f8f" }}>imar</span></div>
              <div style={{ fontSize: 13, letterSpacing: 5, fontWeight: 800, color: "#65726b", textTransform: "uppercase" }}>parsel atlası</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: -7, lineHeight: .86, maxWidth: 820 }}>İmar için sakin otorite.</div>
            <div style={{ marginTop: 26, fontSize: 28, lineHeight: 1.35, color: "#59675f", maxWidth: 760 }}>Resmi güven, modern harita ve kolay parsel akışı.</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
