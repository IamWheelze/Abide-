/**
 * Abide — Express backend
 *
 * Handles direct Zoom registration via Server-to-Server OAuth.
 * Credentials live in .env — never exposed to the browser.
 *
 * Required .env variables:
 *   ZOOM_ACCOUNT_ID      — from Zoom Marketplace → Server-to-Server OAuth app
 *   ZOOM_CLIENT_ID       — same app
 *   ZOOM_CLIENT_SECRET   — same app
 *   PORT                 — optional, defaults to 4000
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ["http://localhost:3000", /\.vercel\.app$/, /\.netlify\.app$/] }));
app.use(express.json());

// Serve the standalone index.html for all non-API routes
app.get("/", (_req, res) => res.sendFile(join(__dirname, "index.html")));

// ── Zoom token cache (tokens are valid ~1 hour) ───────────────────
let _zoomToken   = null;
let _tokenExpiry = 0;

async function getZoomAccessToken() {
  if (_zoomToken && Date.now() < _tokenExpiry - 60_000) return _zoomToken;

  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom credentials not configured in .env");
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom OAuth failed (${res.status}): ${body}`);
  }

  const data  = await res.json();
  _zoomToken  = data.access_token;
  _tokenExpiry = Date.now() + data.expires_in * 1000;
  return _zoomToken;
}

// ── GET /api/zoom-status  — used by the builder to show connection status ──
app.get("/api/zoom-status", (_req, res) => {
  const configured =
    !!(process.env.ZOOM_ACCOUNT_ID &&
       process.env.ZOOM_CLIENT_ID  &&
       process.env.ZOOM_CLIENT_SECRET);
  res.json({ configured });
});

// ── POST /api/register  — main registration endpoint ─────────────
app.post("/api/register", async (req, res) => {
  const { full_name, email, phone, city_country, org_title, intents, consent, zoom_meeting_id } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: "full_name and email are required." });
  }

  // If no meeting ID is configured just acknowledge (demo / builder mode)
  if (!zoom_meeting_id) {
    return res.json({ success: true, demo: true, message: "No meeting ID configured — registration noted." });
  }

  try {
    const token = await getZoomAccessToken();

    // Build the Zoom registrant payload
    // Split first / last name (Zoom requires them separately)
    const nameParts = full_name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(" ") || "-";

    const zoomPayload = {
      first_name: firstName,
      last_name:  lastName,
      email,
      ...(phone        && { phone }),
      ...(city_country && { city: city_country }),
      ...(org_title    && { org: org_title }),
      ...(intents      && { custom_questions: [{ title: "What are you seeking?", value: intents }] }),
      ...(consent !== undefined && { consent: consent === "Yes" }),
    };

    const zoomRes = await fetch(
      `https://api.zoom.us/v2/meetings/${zoom_meeting_id}/registrants`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zoomPayload),
      }
    );

    if (!zoomRes.ok) {
      const errBody = await zoomRes.json().catch(() => ({}));
      console.error("Zoom API error:", errBody);
      // Code 3001 = meeting not found, 300 = already registered (treat as success)
      if (errBody.code === 300) {
        return res.json({ success: true, alreadyRegistered: true });
      }
      return res.status(502).json({ error: errBody.message || "Zoom registration failed." });
    }

    const zoomData = await zoomRes.json();
    // zoomData.join_url — the personalised Zoom link for this registrant
    return res.json({ success: true, join_url: zoomData.join_url, registrant_id: zoomData.registrant_id });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: err.message || "Internal server error." });
  }
});

app.listen(PORT, () => console.log(`Abide backend listening on http://localhost:${PORT}`));
