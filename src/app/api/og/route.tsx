import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const title = searchParams.get("title") ?? "Ragib Hassan Shoumik";
  const description =
    searchParams.get("description") ??
    "Frontend Engineer | React & Next.js Specialist";

  const photoUrl = `${origin}/images/about-photo.jpeg`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0b",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1a1a2e 1px, transparent 0)",
          backgroundSize: "50px 50px",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
          gap: "60px",
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

        {/* Profile photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          width={220}
          height={220}
          alt="Ragib Hassan Shoumik"
          style={{
            borderRadius: "50%",
            border: "4px solid #6366f1",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            flex: 1,
          }}
        >
          {/* Website */}
          <div
            style={{
              fontSize: "22px",
              color: "#6366f1",
              marginBottom: "16px",
              fontWeight: 700,
              display: "flex",
            }}
          >
            rhshoumik.dev
          </div>

          {/* Name / Title */}
          <div
            style={{
              fontSize: "52px",
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
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {description}
          </div>
        </div>

        {/* Bottom gradient bar */}
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
