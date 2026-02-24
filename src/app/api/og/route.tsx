import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Ragib Hassan Shoumik";
  const description =
    searchParams.get("description") ??
    "Frontend Engineer | React & Next.js Specialist";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0b",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1a1a2e 1px, transparent 0)",
          backgroundSize: "50px 50px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            maxWidth: "900px",
            textAlign: "center",
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              fontSize: "28px",
              color: "#6366f1",
              marginBottom: "24px",
              fontWeight: 700,
              display: "flex",
            }}
          >
            rhshoumik.dev
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#e2e8f0",
              lineHeight: 1.1,
              marginBottom: "16px",
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {description}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f43f5e)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
