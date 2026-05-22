import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#17231f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 356, height: 356, borderRadius: 112, background: "#fffaf0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 40px 100px rgba(0,0,0,.28)" }}>
          <svg width="260" height="260" viewBox="0 0 40 40">
            <path d="M9 22.7 18.8 7.4c.5-.8 1.7-.8 2.2 0l10 15.3c.5.8-.1 1.8-1.1 1.8H10.1c-1 0-1.6-1-1.1-1.8Z" fill="#087d7f" />
            <path d="M13.4 22.2 20 11.8l6.8 10.4H13.4Z" fill="#fffaf0" opacity=".92" />
            <path d="M7.5 27.7h25" stroke="#17231f" strokeWidth="3" strokeLinecap="round" />
            <path d="M14.2 31.5h11.6" stroke="#d9a441" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    ),
    size
  );
}
