import { ImageResponse } from "next/og";

import { BRAND_GRADIENT } from "@/constants/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "School Library · 더힘스쿨 수지점";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_GRADIENT,
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            right: -100,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: "rgba(99,178,142,0.08)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 128,
              height: 128,
              borderRadius: 32,
              background: "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
            }}
          >
            <svg
              width="68"
              height="68"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m16 6 4 14" />
              <path d="M12 6v14" />
              <path d="M8 8v12" />
              <path d="M4 4v16" />
            </svg>
          </div>

          <div
            style={{
              fontSize: 108,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1,
              fontStyle: "italic",
            }}
          >
            School Library
          </div>

          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.75)",
              marginTop: 28,
              letterSpacing: 8,
            }}
          >
            더힘스쿨 · 수지점
          </div>
        </div>
      </div>
    ),
    size,
  );
}
