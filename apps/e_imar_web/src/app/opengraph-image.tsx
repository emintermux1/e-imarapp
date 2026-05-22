import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "E-İmar Türkiye Parsel Sorgu";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          color: "#f6faf2",
          backgroundColor: "#06140e",
          backgroundImage: "linear-gradient(135deg, #06140e 0%, #0f2d22 54%, #102a4c 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              border: "3px solid rgba(246,250,242,0.86)",
              borderRadius: 18,
              display: "flex",
              flexWrap: "wrap",
              padding: 10,
              gap: 8
            }}
          >
            <div style={{ width: 25, height: 25, borderRadius: 4, background: "#c8102e" }} />
            <div style={{ width: 25, height: 25, borderRadius: 4, background: "#3b6ea5" }} />
            <div style={{ width: 25, height: 25, borderRadius: 4, background: "#2e7d32" }} />
            <div style={{ width: 25, height: 25, borderRadius: 4, background: "#d99222" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: -3 }}>E-İmar</div>
            <div style={{ fontSize: 22, letterSpacing: 8, textTransform: "uppercase", opacity: 0.68 }}>Parsel · Plan · GIS</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 910 }}>
          <div style={{ fontSize: 72, lineHeight: 0.94, fontWeight: 900, letterSpacing: -4 }}>
            Türkiye için map-first parsel ve imar çalışma alanı
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.25, color: "rgba(246,250,242,0.74)" }}>
            Canlı kaynak readiness, belediye/TKGM akışları, plan notu ve GIS katmanları tek arayüzde.
          </div>
        </div>
      </div>
    ),
    size
  );
}
