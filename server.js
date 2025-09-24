// server.js
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 3000;

// Choose folder: prefer production build if present, else serve public
const buildDir = path.join(process.cwd(), "build");
const publicDir = fs.existsSync(buildDir) ? buildDir : path.join(process.cwd(), "public");
const indexPath = path.join(publicDir, "index.html");

// Helmet baseline headers (disable CSP for dynamic per-request CSP)
app.use(helmet({
  contentSecurityPolicy: false
}));

// Serve static files
app.use(express.static(publicDir, { extensions: ["html", "htm"] }));

// Helper: generate nonce
function generateNonce() {
  return crypto.randomBytes(16).toString("base64");
}

// CSP violation reporting endpoint
app.post("/csp-report", express.json({ type: ["application/csp-report"] }), (req, res) => {
  const logFile = path.join(process.cwd(), "csp-violations.log");
  const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(req.body)}\n`;
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error("Failed to log CSP violation:", err);
  });
  console.warn("CSP Violation:", JSON.stringify(req.body, null, 2));
  res.status(204).send(); // No content
});

// ✅ Wildcard route compatible with path-to-regexp / router
app.get("/:wildcard(.*)", (req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res.status(500).send("index.html not found on server");
  }

  const nonce = generateNonce();
  let html = fs.readFileSync(indexPath, "utf8");

  // Replace {{RANDOM_NONCE}} placeholders in index.html
  html = html.replace(/\{\{RANDOM_NONCE\}\}/g, nonce);

  // Strong CSP including nonce and reporting endpoint
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
    "report-uri /csp-report"
  ].join("; ");

  // Set headers
  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (serving ${publicDir})`);
});
