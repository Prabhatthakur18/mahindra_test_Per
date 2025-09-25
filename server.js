import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 3000;

// CRITICAL: Pre-load and process template at startup (not during request)
const buildDir = path.join(process.cwd(), "build");
const publicDir = fs.existsSync(buildDir) ? buildDir : path.join(process.cwd(), "public");
const indexPath = path.join(publicDir, "index.html");

// BULLETPROOF: Load template once at startup, not during requests
let SAFE_TEMPLATE = '';
let TEMPLATE_LOADED = false;

function initializeTemplate() {
  if (!fs.existsSync(indexPath)) {
    throw new Error("Template file not found");
  }
  
  // Read template once at startup
  let rawHtml = fs.readFileSync(indexPath, 'utf8');
  
  // Remove all potential XSS vectors
  SAFE_TEMPLATE = rawHtml
    .replace(/<script(?![^>]*nonce=["']\{\{RANDOM_NONCE\}\}["'])[^>]*>.*?<\/script>/gis, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*[^,]*[,]/gi, 'data:,')
    .replace(/vbscript\s*:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/@import[^;]*/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove duplicate security headers
    .replace(/<meta\s+http-equiv=["'][^"']*["'][^>]*>/gi, '');
  
  TEMPLATE_LOADED = true;
}

// Initialize template at startup
initializeTemplate();

// Ultra-strict Helmet configuration
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
    force: true
  },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// Static files with security headers
app.use(express.static(publicDir, { 
  extensions: [],
  index: false,
  maxAge: 0,
  setHeaders: (res, path) => {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
}));

// Secure nonce generation
function generateSecureNonce() {
  return crypto.randomBytes(32).toString("base64url");
}

// HTML encoding function
function htmlEncode(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// URL validation
function validateUrl(url) {
  if (!url || typeof url !== 'string' || url.length > 500) return '';
  
  const ALLOWED_DOMAINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
  const ALLOWED_PATHS = ['/favicon.ico', '/logo192.png', '/logo512.png', '/manifest.json'];
  
  try {
    if (url.startsWith('https://')) {
      const parsedUrl = new URL(url);
      if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) return '';
    } else if (url.startsWith('/')) {
      if (!ALLOWED_PATHS.includes(url)) return '';
    } else {
      return '';
    }
    return htmlEncode(url);
  } catch {
    return '';
  }
}

// CSP reporting endpoint
app.post("/csp-report", express.json({ 
  type: ["application/csp-report"],
  limit: '10kb'
}), (req, res) => {
  // Set all security headers
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  try {
    if (req.body && typeof req.body === 'object') {
      const logFile = path.join(process.cwd(), "csp-violations.log");
      const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(req.body)}\n`;
      fs.appendFile(logFile, logEntry, { mode: 0o600 }, (err) => {
        if (err) console.error("CSP log error:", err.message);
      });
    }
  } catch (error) {
    console.error("CSP processing error:", error.message);
  }
  
  res.status(204).end();
});

// BULLETPROOF: Main route with NO file reading during request
app.get("/:wildcard(.*)", (req, res) => {
  try {
    // Validate template is loaded
    if (!TEMPLATE_LOADED || !SAFE_TEMPLATE) {
      throw new Error("Template not available");
    }
    
    // Generate nonce
    const nonce = generateSecureNonce();
    
    // CRITICAL: Use pre-loaded template, no file reading
    let html = SAFE_TEMPLATE;
    
    // Safe environment variable processing
    const publicUrl = validateUrl(process.env.PUBLIC_URL || '');
    const fontCinzel = validateUrl(process.env.REACT_APP_FONTS_CINZEL || '');
    const fontMain = validateUrl(process.env.REACT_APP_FONTS_MAIN || '');
    const fontExtended = validateUrl(process.env.REACT_APP_FONTS_EXTENDED || '');
    
    // Safe replacements with encoding
    html = html.replace(/%PUBLIC_URL%/g, publicUrl);
    html = html.replace(/%REACT_APP_FONTS_CINZEL%/g, fontCinzel);
    html = html.replace(/%REACT_APP_FONTS_MAIN%/g, fontMain);
    html = html.replace(/%REACT_APP_FONTS_EXTENDED%/g, fontExtended);
    html = html.replace(/\{\{RANDOM_NONCE\}\}/g, htmlEncode(nonce));
    
    // Ultra-strict CSP
    const csp = [
      "default-src 'none'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "worker-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
      "base-uri 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
      `report-uri /csp-report`
    ].join("; ");

    // Complete security headers
    const headers = {
      "Content-Security-Policy": csp,
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
      "Expires": "0"
    };

    // Set all headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send response
    res.status(200).send(html);
    
  } catch (error) {
    console.error("Route error:", error.message);
    
    // Ultra-secure error response
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    res.setHeader("Content-Security-Policy", "default-src 'none'");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    
    res.status(500).send("Server Error");
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  res.status(500).send("Error");
});

// 404 handler
app.use((req, res) => {
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  res.status(404).send("Not Found");
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Bulletproof server running on http://127.0.0.1:${PORT}`);
});
