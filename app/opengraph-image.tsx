import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Real 1200x630 social share image, generated at build time on the
// same paper / studio theme used across the site.
export const alt =
  "Anovic — Marketing, Branding, Media Production & Software Solutions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(
    join(process.cwd(), "public", "logo.png"),
    "base64",
  );
  const logoSrc = `data:image/png;base64,${logo}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff8e8",
          position: "relative",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* Soft brand accent blobs */}
        <div
          style={{
            position: "absolute",
            top: -130,
            right: -90,
            width: 380,
            height: 380,
            borderRadius: 9999,
            background: "rgba(168,85,247,0.20)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 440,
            height: 440,
            borderRadius: 9999,
            background: "rgba(190,242,100,0.45)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 120,
            width: 150,
            height: 150,
            borderRadius: 9999,
            background: "rgba(251,146,60,0.20)",
            display: "flex",
          }}
        />

        {/* Status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 26px",
            borderRadius: 9999,
            border: "2px solid rgba(28,25,23,0.12)",
            background: "rgba(255,255,255,0.72)",
            color: "#57534e",
            fontSize: 26,
            marginBottom: 44,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 9999,
              background: "#bef264",
              marginRight: 14,
              display: "flex",
            }}
          />
          Business &amp; Marketing Solutions
        </div>

        {/* Wordmark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={560}
          height={Math.round((560 * 131) / 789)}
          alt=""
        />

        {/* Headline with marker highlight */}
        <div
          style={{
            display: "flex",
            position: "relative",
            alignItems: "center",
            marginTop: 46,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -6,
              right: -6,
              bottom: 12,
              height: 26,
              background: "rgba(190,242,100,0.85)",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 70,
              fontWeight: 900,
              color: "#1c1917",
              letterSpacing: -1.5,
            }}
          >
            Growth, delivered.
          </div>
        </div>

        {/* Service line */}
        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 29,
            color: "#57534e",
          }}
        >
          Branding · Marketing · Media · PR · Software
        </div>
      </div>
    ),
    { ...size },
  );
}
