import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 3000;

// ULTRA-STRICT: Only allow specific file paths
const buildDir = path.join(process.cwd(), "build");
const publicDir = fs.existsSync(buildDir) ? buildDir : path.join(process.cwd(), "public");
const indexPath = path.join(publicDir, "index.html");

// ULTRA-STRICT: Validate paths to prevent directory traversal
function isValidPath(filePath) {
  const resolvedPath = path.resolve(filePath);
  const allowedDir = path.resolve(publicDir);
  return resolvedPath.startsWith(allowedDir);
}

if (!isValidPath(indexPath)) {
  throw new Error("Invalid index.html path detected");
}

// ULTRA-STRICT: Whitelist of exactly what's allowed
const SECURITY_CONFIG = {
  ALLOWED_FONT_DOMAINS: new Set([
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ]),
  ALLOWED_PUBLIC_PATHS: new Set([
    '/favicon.ico',
    '/logo192.png', 
    '/logo512.png',
    '/manifest.json',
    '/static/'
  ]),
  MAX_HTML_SIZE: 50000, // 50KB limit
  NONCE_LENGTH: 32,
  CACHE_MAX_SIZE: 5
};

// ULTRA-STRICT: Helmet with maximum security
app.use(helmet({
  contentSecurityPolicy: false, // Manual control
  hsts: {
    maxAge: 63072000, // 2 years
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

// ULTRA-STRICT: Static files with comprehensive headers
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

// ULTRA-STRICT: Cryptographically secure nonce
function generateSecureNonce() {
  return crypto.randomBytes(SECURITY_CONFIG.NONCE_LENGTH).toString("base64url");
}

// ULTRA-STRICT: Multiple validation layers
function validateAndSanitizeString(input, maxLength = 200) {
  if (typeof input !== 'string') return '';
  if (input.length > maxLength) return '';
  
  // Remove all potentially dangerous characters
  return input
    .replace(/[<>'"&\\]/g, '') // Remove dangerous chars entirely
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/@import/gi, '')
    .trim();
}

// ULTRA-STRICT: URL validation with multiple checks
function validateUrl(url) {
  if (!url || typeof url !== 'string' || url.length > 500) return '';
  
  try {
    // Must be https only for external URLs
    if (url.startsWith('http://')) return '';
    
    if (url.startsWith('https://')) {
      const parsedUrl = new URL(url);
      
      // Only allow whitelisted domains
      if (!SECURITY_CONFIG.ALLOWED_FONT_DOMAINS.has(parsedUrl.hostname)) {
        return '';
      }
      
      // No suspicious paths
      if (parsedUrl.pathname.includes('..') || 
          parsedUrl.pathname.includes('%') ||
          parsedUrl.search.includes('<') ||
          parsedUrl.search.includes('>')) {
        return '';
      }
    } else if (url.startsWith('/')) {
      // Local URLs - validate path
      const validPath = SECURITY_CONFIG.ALLOWED_PUBLIC_PATHS.has(url) ||
                       Array.from(SECURITY_CONFIG.ALLOWED_PUBLIC_PATHS)
                            .some(allowed => url.startsWith(allowed));
      if (!validPath) return '';
    } else {
      return ''; // Reject relative URLs
    }
    
    return validateAndSanitizeString(url, 500);
  } catch (error) {
    return '';
  }
}

// ULTRA-STRICT: Environment variable processing with validation
function processEnvironmentVars(html, nonce) {
  // Validate nonce format
  if (!nonce || !/^[A-Za-z0-9_-]{40,50}$/.test(nonce)) {
    throw new Error('Invalid nonce format');
  }
  
  let processedHtml = html;
  
  // PUBLIC_URL - ultra strict validation
  const publicUrl = process.env.PUBLIC_URL || '';
  const safePublicUrl = validateUrl(publicUrl);
  processedHtml = processedHtml.replace(/%PUBLIC_URL%/g, safePublicUrl);
  
  // Font URLs - validate each one strictly
  const fontVars = {
    CINZEL: process.env.REACT_APP_FONTS_CINZEL || '',
    MAIN: process.env.REACT_APP_FONTS_MAIN || '',
    EXTENDED: process.env.REACT_APP_FONTS_EXTENDED || ''
  };
  
  Object.keys(fontVars).forEach(key => {
    const validatedUrl = validateUrl(fontVars[key]);
    const placeholder = new RegExp(`%REACT_APP_FONTS_${key}%`, 'g');
    processedHtml = processedHtml.replace(placeholder, validatedUrl);
  });
  
  // Replace nonce - final validation
  processedHtml = processedHtml.replace(/\{\{RANDOM_NONCE\}\}/g, nonce);
  
  return processedHtml;
}

// ULTRA-STRICT: Remove ALL meta security headers to prevent conflicts
function removeAllSecurityHeaders(html) {
  return html
    .replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+http-equiv=["']Strict-Transport-Security["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+http-equiv=["']X-Content-Type-Options["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+http-equiv=["']Referrer-Policy["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+http-equiv=["']Cross-Origin-Opener-Policy["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+http-equiv=["']Cross-Origin-Embedder-Policy["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+http-equiv=["']X-Frame-Options["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+http-equiv=["']X-XSS-Protection["'][^>]*>\s*/gi, '');
}

// ULTRA-STRICT: Comprehensive HTML sanitization
function ultraSanitizeHtml(html) {
  if (typeof html !== 'string') throw new Error('Invalid HTML input');
  if (html.length > SECURITY_CONFIG.MAX_HTML_SIZE) throw new Error('HTML too large');
  
  return html
    // Remove all script tags except nonce-protected ones
    .replace(/<script(?![^>]*nonce=["']\{\{RANDOM_NONCE\}\}["'])[^>]*>.*?<\/script>/gis, '')
    // Remove dangerous attributes globally
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*javascript\s*:/gi, '')
    .replace(/\s*data\s*:\s*[^,]*[,]/gi, 'data:,')
    .replace(/\s*vbscript\s*:/gi, '')
    // Remove dangerous CSS
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/@import[^;]*/gi, '')
    // Remove HTML comments that could contain code
    .replace(/<!--[\s\S]*?-->/g, '');
}

// CSP reporting with ultra-strict validation
app.post("/csp-report", express.json({ 
  type: ["application/csp-report", "application/reports+json"],
  limit: '10kb',
  strict: true
}), (req, res) => {
  // Set headers immediately
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  
  try {
    if (req.body && typeof req.body === 'object') {
      const logFile = path.join(process.cwd(), "csp-violations.log");
      const timestamp = new Date().toISOString();
      const safeLog = JSON.stringify({
        timestamp,
        report: req.body,
        userAgent: validateAndSanitizeString(req.get('User-Agent') || '', 200),
        ip: validateAndSanitizeString(req.ip || '', 45)
      });
      
      fs.appendFile(logFile, safeLog + '\n', { mode: 0o600 }, (err) => {
        if (err) console.error("CSP log error:", err.message);
      });
    }
  } catch (error) {
    console.error("CSP processing error:", error.message);
  }
  
  res.status(204).end();
});

// ULTRA-STRICT: Template cache with validation
const templateCache = new Map();
const MAX_CACHE_SIZE = SECURITY_CONFIG.CACHE_MAX_SIZE;

function getUltraSecureTemplate(nonce) {
  // Validate file exists and is readable
  if (!fs.existsSync(indexPath)) {
    throw new Error("Template not found");
  }
  
  const stats = fs.statSync(indexPath);
  if (stats.size > SECURITY_CONFIG.MAX_HTML_SIZE) {
    throw new Error("Template too large");
  }
  
  const cacheKey = `${indexPath}-${stats.mtime.getTime()}-${stats.size}`;
  
  let rawHtml;
  if (templateCache.has(cacheKey)) {
    rawHtml = templateCache.get(cacheKey);
  } else {
    // Manage cache size
    if (templateCache.size >= MAX_CACHE_SIZE) {
      templateCache.clear();
    }
    
    rawHtml = fs.readFileSync(indexPath, { encoding: 'utf8', flag: 'r' });
    templateCache.set(cacheKey, rawHtml);
  }
  
  // Multi-layer processing
  let processedHtml = removeAllSecurityHeaders(rawHtml);
  processedHtml = ultraSanitizeHtml(processedHtml);
  processedHtml = processEnvironmentVars(processedHtml, nonce);
  
  return processedHtml;
}

// ULTRA-STRICT: Main route with comprehensive security
app.get("/:wildcard(.*)", (req, res) => {
  try {
    // Input validation
    const wildcard = req.params.wildcard;
    if (wildcard && (wildcard.includes('..') || wildcard.length > 100)) {
      throw new Error('Invalid path');
    }
    
    const nonce = generateSecureNonce();
    const html = getUltraSecureTemplate(nonce);
    
    // Ultra-strict CSP - no 'unsafe-inline' anywhere
    const csp = [
      "default-src 'none'",
      "script-src 'self' 'strict-dynamic' 'wasm-unsafe-eval'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "manifest-src 'self'",
      "media-src 'none'",
      "object-src 'none'",
      "frame-src 'none'",
      "worker-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
      "base-uri 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
      "require-trusted-types-for 'script'",
      `report-uri /csp-report`
    ].join("; ");

    // Ultra-comprehensive headers
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
      "Permissions-Policy": "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "Vary": "Accept-Encoding",
      "X-Permitted-Cross-Domain-Policies": "none",
      "Clear-Site-Data": '"cache", "cookies", "storage"'
    };

    // Set all headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(200).send(html);
    
  } catch (error) {
    console.error("Route error:", error.message);
    
    // Ultra-secure error response
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");
    
    res.status(500).send("Server Error");
  }
});

// ULTRA-STRICT: Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  
  res.status(500).send("Error");
});

// ULTRA-STRICT: 404 handler
app.use((req, res) => {
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(404).send("Not Found");
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Ultra-secure server running on http://127.0.0.1:${PORT}`);
});
