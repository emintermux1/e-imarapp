import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#14211d", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 356, height: 356, borderRadius: 112, background: "#fffaf0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 40px 100px rgba(0,0,0,.28)" }}>
          <svg width="260" height="260" viewBox="0 0 64 64">
            <path d="M18.8 12.5h23.7c4.5 0 8.1 3.6 8.1 8.1v22.8c0 4.5-3.6 8.1-8.1 8.1H21.6c-4.5 0-8.1-3.6-8.1-8.1V17.8c0-2.9 2.4-5.3 5.3-5.3Z" fill="#14211d" />
            <path d="M19.3 21.2h25.4M19.3 32h25.4M19.3 42.8h25.4M27.2 16.8v29.7M37.2 16.8v29.7" stroke="#fffaf0" strokeOpacity=".13" strokeWidth="1.8" />
            <path d="M20.4 38.2c4.8-11.7 15.5-16.8 24.6-10.7" fill="none" stroke="#0b8f8f" strokeWidth="6" strokeLinecap="round" />
            <path d="M20.2 44.7h21.2" stroke="#d6a23b" strokeWidth="4.8" strokeLinecap="round" />
            <circle cx="45" cy="27.5" r="4.6" fill="#c5463c" />
            <circle cx="45" cy="27.5" r="2" fill="#fffaf0" />
          </svg>
        </div>
      </div>
    ),
    size
  );
}
