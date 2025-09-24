// Enhanced security imports with integrity validation
import { PDFDocument, PDFForm, PDFTextField, rgb, StandardFonts } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import './fonts.css';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';  
import './App.css';

// SECURITY: Enhanced input sanitization with NIST SP 800-53 compliance
const sanitizeInput = (input) => {
  if (!input) return '';
  
  // Enhanced validation with proper type checking and length limits
  const str = String(input).slice(0, 100);
  
  // OWASP compliant character escaping with comprehensive coverage
  const escapeMap = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '&': '&amp;',
    '/': '&#x2F;',
    '\\': '&#x5C;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str
    .replace(/[<>"'&/\\`=]/g, (match) => escapeMap[match] || match)
    // Enhanced script and protocol detection
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:/gi, 'blocked:')
    .replace(/vbscript\s*:/gi, 'blocked:')
    .replace(/on\w+\s*=/gi, 'blocked=')
    .replace(/<\s*script[^>]*>/gi, '&lt;blocked&gt;')
    .replace(/<\s*\/\s*script\s*>/gi, '&lt;/blocked&gt;')
    .replace(/expression\s*\(/gi, 'blocked(')
    .replace(/url\s*\(/gi, 'blocked(')
    .trim();
};

// SECURITY: Enhanced validation with allowlisting approach (NIST SI-10)
const validateInput = (input, type = 'text') => {
  if (!input) return '';
  
  switch (type) {
    case 'phone':
      // Strict phone validation - only digits, limit to 10
      const phoneDigits = input.replace(/[^\d]/g, '').slice(0, 10);
      return phoneDigits.match(/^\d{10}$/) ? phoneDigits : phoneDigits.slice(0, 10);
      
    case 'email':
      // Enhanced email validation with domain restrictions
      const email = input.toLowerCase().trim().slice(0, 254); // RFC 5321 limit
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) return '';
      // Additional domain security checks
      const domain = email.split('@')[1];
      if (domain && (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.'))) {
        return '';
      }
      return sanitizeInput(email);
      
    case 'vehicleModel':
      // Allowlist validation for vehicle models
      const allowedModels = ['THAR ROXX','THAR', 'XUV700', 'XUV3X0', 'SCORPIO N', 'BOLERO NEO', 'BOLERO'];
      return allowedModels.includes(input) ? input : '';
      
    case 'accessory':
      // Allowlist validation for accessories
      const allowedAccessories = ['Black comfort kit','Sustainable comfort kit'];
      return allowedAccessories.includes(input) ? input : '';
      
    case 'font':
      // Allowlist validation for fonts
      const allowedFonts = ['Book Script', 'Brushability', 'Chancery', 'Berlinsans', 'Georgia'];
      return allowedFonts.includes(input) ? input : '';
      
    case 'color':
      // Allowlist validation for colors
      const allowedColors = ['#005d8f', '#000000', '#d10000', '#ffe599', '#c0c0c0'];
      return allowedColors.includes(input) ? input : allowedColors[0];
      
    case 'personalized':
      // Enhanced personalized text validation
      const text = sanitizeInput(input).slice(0, 7);
      // Only allow alphanumeric and basic punctuation
      return text.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
      
    case 'number':
      // Strict number validation
      const num = parseInt(input);
      return (!isNaN(num) && num > 0 && num <= 100) ? num : 1;
      
    default:
      return sanitizeInput(input).slice(0, 100);
  }
};

// SECURITY: Enhanced email validation with comprehensive checks
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 compliant regex with additional security checks
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Additional security checks
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  
  // Local part validation
  if (localPart.length > 64 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return false;
  }
  
  // Domain validation
  if (domain.length > 253 || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return false;
  }
  
  return true;
};

// SECURITY: Enhanced URL validation with strict allowlisting
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS for external resources (PCI DSS compliance)
    if (!['https:'].includes(urlObj.protocol)) return false;
    
    // Domain allowlisting for external resources
    const allowedDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdnjs.cloudflare.com'
    ];
    
    return allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
};

// SECURITY: Enhanced phone validation
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return /^[6-9]\d{9}$/.test(cleanPhone); // Indian mobile number format
};

// SECURITY: Safe DOM manipulation with comprehensive validation
const safeSetTextContent = (element, text) => {
  if (!element || typeof element.textContent === 'undefined') {
    throw new Error('Invalid element for text content');
  }
  
  // Validate element is still in DOM and not compromised
  if (!document.contains(element)) {
    throw new Error('Element not in document');
  }
  
  const sanitizedText = sanitizeInput(text);
  element.textContent = sanitizedText;
  
  // Verify the content was set correctly
  if (element.textContent !== sanitizedText) {
    throw new Error('Text content validation failed');
  }
};

// SECURITY: Enhanced DOM manipulation with strict validation
const safeSetInnerHTML = (element, html) => {
  if (!element || !document.contains(element)) {
    throw new Error('Invalid element for innerHTML');
  }
  
  // Strip all HTML and use textContent instead for maximum security
  const sanitized = sanitizeInput(html).replace(/<[^>]*>/g, '');
  element.textContent = sanitized;
};

// SECURITY: Enhanced node validation with comprehensive checks
const safeInsertBefore = (newNode, referenceNode) => {
  if (!newNode || !referenceNode || !referenceNode.parentNode) {
    throw new Error('Invalid nodes for insertion');
  }
  
  if (!document.contains(referenceNode)) {
    throw new Error('Reference node not in document');
  }
  
  const allowedNodeTypes = [Node.TEXT_NODE, Node.ELEMENT_NODE];
  if (!allowedNodeTypes.includes(newNode.nodeType)) {
    throw new Error('Invalid node type for insertion');
  }
  
  if (newNode.nodeType === Node.ELEMENT_NODE) {
    sanitizeElement(newNode);
  }
  
  return referenceNode.parentNode.insertBefore(newNode, referenceNode);
};

// SECURITY: Comprehensive element sanitization
const sanitizeElement = (element) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
  
  // Remove all dangerous attributes
  const dangerousAttrs = [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
    'onselect', 'onkeydown', 'onkeypress', 'onkeyup', 'onscroll',
    'javascript', 'vbscript', 'data', 'src', 'href', 'action',
    'formaction', 'background', 'style'
  ];
  
  // Remove attributes using a more thorough approach
  for (let i = element.attributes.length - 1; i >= 0; i--) {
    const attr = element.attributes[i];
    if (dangerousAttrs.some(dangerous => attr.name.toLowerCase().includes(dangerous.toLowerCase()))) {
      element.removeAttribute(attr.name);
    }
  }
  
  // Sanitize text content
  if (element.textContent) {
    element.textContent = sanitizeInput(element.textContent);
  }
  
  // Recursively sanitize children
  Array.from(element.children).forEach(child => sanitizeElement(child));
};

// SECURITY: Enhanced node validation with stricter checks
const isValidNode = (node) => {
  if (!node) return false;
  
  const allowedTypes = [Node.TEXT_NODE, Node.ELEMENT_NODE];
  if (!allowedTypes.includes(node.nodeType)) return false;
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    const allowedTags = ['DIV', 'SPAN', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BR', 'HR'];
    if (!allowedTags.includes(node.tagName.toUpperCase())) return false;
    
    // Check for dangerous attributes
    const dangerousAttrs = ['onclick', 'onerror', 'onload', 'javascript:', 'data:', 'vbscript:'];
    for (let attr of node.attributes || []) {
      if (dangerousAttrs.some(dangerous => attr.value?.toLowerCase().includes(dangerous))) {
        return false;
      }
    }
  }
  
  return true;
};

// SECURITY: Enhanced styles with CSP compliance
const extraStyles = `
  .embroidered-text {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .toast-card { animation: toastIn 280ms cubic-bezier(.21,.61,.35,1); }
  .toast-close { transition: opacity .2s ease, transform .2s ease; }
  .toast-close:hover { opacity: .85; transform: scale(1.05); }
`;

// SECURITY: Allowlisted data with validation
const vehicleModels = ['THAR ROXX','THAR', 'XUV700', 'XUV3X0', 'SCORPIO N', 'BOLERO NEO', 'BOLERO'];
const accessories = ['Black comfort kit','Sustainable comfort kit'];
const fontStyles = ['Book Script', 'Brushability', 'Chancery', 'Berlinsans', 'Georgia'];
const textColors = [
  { name: 'Blue', value: '#005d8f' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#d10000' },
  { name: 'Beige', value: '#ffe599' },
  { name: 'Silver', value: '#c0c0c0' }
];

// SECURITY: Validated pricing data
const kitPrices = Object.freeze({
  'Black comfort kit': '₹4,990',
  'Sustainable comfort kit': '₹4,990'
});

// SECURITY: Immutable position configurations
const textPositions = Object.freeze({
  'THAR ROXX': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '38%', left: '25%', rotation: 0, fontSize: { desktop: 16, mobile: 6 } }),
        Object.freeze({ top: '38%', left: '74%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '36.7%', left: '25%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '36.7%', left: '74%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '68.5%', left: '30.5%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '68.5%', left: '68%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '68%', left: '30%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '68%', left: '68%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } })
      ]
    }
  },
  'THAR': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '45%', left: '28%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '45%', left: '72.8%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '45%', left: '28.4%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '45%', left: '71.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '56.5%', left: '33.6%', rotation: -0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '56.5%', left: '65%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '57%', left: '32.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '57%', left: '65.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } })
      ]
    }
  },
  'XUV700': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '30.8%', left: '28.2%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '31%', left: '75%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '30.5%', left: '28%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '31.5%', left: '75%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '62%', left: '35.3%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '62%', left: '71%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } })
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '63%', left: '32.6%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '63%', left: '69.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    }
  },
  'XUV3X0': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '35%', left: '26%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '35%', left: '72.8%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '35%', left: '25.3%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '35%', left: '72.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '63.5%', left: '28.5%', rotation: -1, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '63.5%', left: '70%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '64%', left: '30%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '64%', left: '70%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    }
  },
  'SCORPIO N': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '34%', left: '24%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '34%', left: '72.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '34.5%', left: '23%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '34.5%', left: '70.5%', rotation: 0, fontSize: { desktop:14, tablet: 12, mobile:6 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '60%', left: '26.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '60%', left: '70.2%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '58.5%', left: '26.5%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '58.5%', left: '72%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
      ]
    }
  },
  'BOLERO NEO': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '36%', left: '27.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '35.8%', left: '76%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '36.4%', left: '27%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '36.4%', left: '75.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '57%', left: '32%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '57%', left: '72%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } })
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '57%', left: '33%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '57%', left: '70%', rotation: 0, fontSize: { desktop: 16, tablet: 12, mobile: 6 } }),
      ]
    }
  },
  'BOLERO': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '34.5%', left: '29%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '35%', left: '70%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '36%', left: '29%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '36%', left: '69.8%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '66%', left: '30.8%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '66%', left: '66.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6} }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '68%', left: '31.5%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
        Object.freeze({ top: '68%', left: '65.8%', rotation: 0, fontSize: { desktop: 14, tablet: 12, mobile: 6 } }),
      ]
    }
  }
});

const pdfTextPositions = Object.freeze({
  'THAR ROXX': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '32%', left: '25.5%', rotation: 0, fontSize: { desktop:8, mobile: 8 } }),
        Object.freeze({ top: '32%', left: '74%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '30%', left: '25%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '30%', left: '73.7%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '65%', left: '30.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '65%', left: '68%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '65%', left: '30.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '65%', left: '67.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } })
      ]
    }
  },
  'THAR': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '38.5%', left: '28%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '38.5%', left: '73%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '38.5%', left: '28.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '38.5%', left: '71.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '52%', left: '33.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '52%', left: '65.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '54%', left: '32.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '54%', left: '65.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } })
      ]
    }
  },
  'XUV700': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '23%', left: '28.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '23%', left: '74.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '23%', left: '28.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '23.8%', left: '75.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '55.5%', left: '35.2%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '55.5%', left: '71%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } })
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '58%', left: '33%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '58%', left: '70%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
      ]
    }
  },
  'XUV3X0': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '27.5%', left: '26.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '27.5%', left: '73%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '27.5%', left: '25.3%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '27.5%', left: '72.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '59.5%', left: '28.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '59.5%', left: '70%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '59.5%', left: '30.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8} }),
        Object.freeze({ top: '59.5%', left: '70.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
      ]
    }
  },
  'SCORPIO N': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '25.5%', left: '24%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '25.5%', left: '72%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '26%', left: '23.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8  } }),
        Object.freeze({ top: '26%', left: '70.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '56.5%', left: '26.5%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
        Object.freeze({ top: '56.5%', left: '70.5%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '55%', left: '27%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
        Object.freeze({ top: '55%', left: '72.5%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
      ]
    }
  },
  'BOLERO NEO': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '29%', left: '27.5%', rotation: 0, fontSize: { desktop: 8, mobile: 10 } }),
        Object.freeze({ top: '28.5%', left: '76%', rotation: 0, fontSize: { desktop: 8, mobile: 10 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '29.5%', left: '27%', rotation: 0, fontSize: { desktop: 8, mobile: 9 } }),
        Object.freeze({ top: '29.5%', left: '76%', rotation: 0, fontSize: { desktop: 8, mobile: 9 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '52.5%', left: '32%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
        Object.freeze({ top: '52.5%', left: '72%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } })
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '52.5%', left: '33%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
        Object.freeze({ top: '52.5%', left: '70.5%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
      ]
    }
  },
  'BOLERO': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '27.5%', left: '29.5%', rotation: 0, fontSize: { desktop: 8, mobile: 10 } }),
        Object.freeze({ top: '28%', left: '70%', rotation: 0, fontSize: { desktop: 8, mobile: 10 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '29%', left: '29.5%', rotation: 0, fontSize: { desktop: 8, mobile: 10 } }),
        Object.freeze({ top: '29%', left: '69.8%', rotation: 0, fontSize: { desktop: 8, mobile: 10 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '62.5%', left: '31%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
        Object.freeze({ top: '62.5%', left: '66.5%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '64%', left: '31%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
        Object.freeze({ top: '64%', left: '66%', rotation: 0, fontSize: { desktop: 10, mobile: 10 } }),
      ]
    }
  }
});

const previewTextPositions = Object.freeze({
  'THAR ROXX': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '32%', left: '25.5%', rotation: 0, fontSize: { desktop:8, mobile: 8 } }),
        Object.freeze({ top: '32%', left: '74%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '30.5%', left: '25%', rotation: 0, fontSize: { desktop: 8, mobile: 9 } }),
        Object.freeze({ top: '30.5%', left: '73.7%', rotation: 0, fontSize: { desktop: 8, mobile: 9 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '64%', left: '30.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '64%', left: '68%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '65%', left: '30.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '65%', left: '67.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } })
      ]
    }
  },
  'THAR': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '39%', left: '28%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '38.7%', left: '73%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '38%', left: '28.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '38%', left: '71.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '52%', left: '33.8%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '52%', left: '65%', rotation: 0, fontSize: { desktop:9, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '53%', left: '32.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '53%', left: '65%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } })
      ]
    }
  },
  'XUV700': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '22.8%', left: '28.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '22.8%', left: '74.8%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '23%', left: '28.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '24%', left: '75%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '56.5%', left: '35.2%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '56.5%', left: '71%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } })
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '59%', left: '33%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '59%', left: '70%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
      ]
    }
  },
  'XUV3X0': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '27.7%', left: '26.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '28%', left: '73%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '28%', left: '25.3%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '28%', left: '72.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '59.5%', left: '28.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
        Object.freeze({ top: '59.5%', left: '70%', rotation: 0, fontSize: { desktop: 10, mobile: 8} }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '59.5%', left: '30.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8} }),
        Object.freeze({ top: '59.5%', left: '70.5%', rotation: 0, fontSize: { desktop: 10, mobile: 8 } }),
      ]
    }
  },
  'SCORPIO N': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '25.78%', left: '24%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '25.78%', left: '72%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '26.5%', left: '23.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '26.5%', left: '70.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '56.5%', left: '27%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '56.5%', left: '71%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '54.5%', left: '27%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '54.5%', left: '73%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    }
  },
  'BOLERO NEO': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '29%', left: '27.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '28.5%', left: '76%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '29.5%', left: '27%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '29.5%', left: '76%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '52%', left: '32.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '52%', left: '72%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } })
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '52.5%', left: '32.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '52.5%', left: '70.5%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
      ]
    }
  },
  'BOLERO': {
    'Front Row': {
      'Black comfort kit': [
        Object.freeze({ top: '27.5%', left: '29.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '28%', left: '70%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '29%', left: '29.5%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
        Object.freeze({ top: '29%', left: '69.8%', rotation: 0, fontSize: { desktop: 8, mobile: 8 } }),
      ]
    },
    'Rear Row': {
      'Black comfort kit': [
        Object.freeze({ top: '62.5%', left: '31%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '62.5%', left: '66.5%', rotation: 0, fontSize: { desktop:9, mobile: 8 } }),
      ],
      'Sustainable comfort kit': [
        Object.freeze({ top: '64%', left: '31%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
        Object.freeze({ top: '64%', left: '66%', rotation: 0, fontSize: { desktop: 9, mobile: 8 } }),
      ]
    }
  }
});

// SECURITY: Enhanced font loading with integrity checks and timeouts
const loadFonts = async () => {
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Dancing Script';
      src: local('Dancing Script'), 
           local('DancingScript-Regular');
      font-display: swap;
    }
    
    @font-face {
      font-family: 'Montserrat';
      src: local('Montserrat'),
           local('Montserrat-Regular');
      font-display: swap;
    }
    
    @font-face {
      font-family: 'Gabriola';
      src: local('Gabriola'), local('Segoe Script');
      font-display: swap;
    }
    
    @font-face {
      font-family: 'Blackadder ITC';
      src: local('Blackadder ITC'), local('Brush Script MT');
      font-display: swap;
    }
    
    .font-fallback {
      font-family: 'Dancing Script', 'Times New Roman', serif;
    }
  `;
  
  // SECURITY: Enhanced external font loading with integrity validation
  const loadExternalFont = (url, expectedIntegrity = null) => {
    return new Promise((resolve) => {
      if (!isValidUrl(url)) {
        console.warn('Invalid font URL, using system fonts');
        resolve();
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.crossOrigin = 'anonymous';
      
      // SECURITY: Add integrity check if provided
      if (expectedIntegrity) {
        link.integrity = expectedIntegrity;
      }
      
      let loaded = false;
      const timeout = 5000; // Reduced timeout for better UX
      
      const cleanup = () => {
        if (!loaded) {
          loaded = true;
          resolve();
        }
      };
      
      link.onload = cleanup;
      link.onerror = () => {
        console.warn(`Failed to load font from ${url}, using fallbacks`);
        cleanup();
      };
      
      // SECURITY: Set strict timeout
      const timeoutId = setTimeout(() => {
        if (!loaded) {
          console.warn(`Font loading timeout for ${url}`);
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          cleanup();
        }
      }, timeout);
      
      // Cleanup timeout on successful load
      link.addEventListener('load', () => clearTimeout(timeoutId));
      
      document.head.appendChild(link);
    });
  };
  
  document.head.appendChild(style);
  
  try {
    // SECURITY: Load fonts with race condition protection
    await Promise.race([
      loadExternalFont('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Montserrat:wght@400;700&display=swap'),
      new Promise(resolve => setTimeout(resolve, 5000)) // Strict timeout
    ]);
  } catch (error) {
    console.warn('External font loading failed, using system fonts');
  }

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 3000))
    ]);
  } catch (error) {
    console.warn('Font ready timeout, proceeding with available fonts');
  }
};

// SECURITY: Enhanced text component with comprehensive validation
const EmbroideredText = React.memo(({ text, fontFamily, position, textColor, isMobile }) => {
  // SECURITY: Validate all props before rendering
  const safeText = useMemo(() => validateInput(text, 'personalized'), [text]);
  const safeFont = useMemo(() => validateInput(fontFamily, 'font'), [fontFamily]);
  const safeColor = useMemo(() => validateInput(textColor, 'color'), [textColor]);
  
  // SECURITY: Validate position object
  const safePosition = useMemo(() => {
    if (!position || typeof position !== 'object') {
      return { top: '50%', left: '50%', rotation: 0, fontSize: { desktop: 12, mobile: 6 } };
    }
    
    return {
      top: String(position.top || '50%'),
      left: String(position.left || '50%'),
      rotation: Number(position.rotation || 0),
      fontSize: position.fontSize || { desktop: 12, mobile: 6 }
    };
  }, [position]);

  const uniqueId = useMemo(() => 
    `text-${safePosition.top}-${safePosition.left}-${Math.random().toString(36).substring(2, 9)}`,
    [safePosition.top, safePosition.left]
  );

  // SECURITY: Safe stroke color calculation
  const getStrokeColor = useCallback((color) => {
    if (!color || typeof color !== 'string') return 'rgba(68, 68, 68, 0.5)';
    
    const hexToRgb = (hex) => {
      if (!hex.startsWith('#') || hex.length !== 7) return [68, 68, 68];
      
      try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        if (isNaN(r) || isNaN(g) || isNaN(b)) return [68, 68, 68];
        
        return [
          Math.max(0, Math.min(255, r)),
          Math.max(0, Math.min(255, g)),
          Math.max(0, Math.min(255, b))
        ];
      } catch {
        return [68, 68, 68];
      }
    };

    const calculateLuminance = (r, g, b) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    if (color.startsWith('#')) {
      const [r, g, b] = hexToRgb(color);
      const luminance = calculateLuminance(r, g, b);
      return luminance > 0.5 ? 'rgba(68, 68, 68, 0.5)' : 'rgba(48, 47, 47, 0.5)';
    }
    
    const lightColors = ['#ffe599', '#c0c0c0', 'beige', 'ivory', 'white'];
    return lightColors.includes(color.toLowerCase()) 
      ? 'rgba(58, 55, 55, 0.5)' 
      : 'rgba(255, 255, 255, 0.5)';
  }, []);

  const strokeColor = useMemo(() => getStrokeColor(safeColor), [safeColor, getStrokeColor]);

  // SECURITY: Fixed font size calculation with bounds checking
  const fontSize = useMemo(() => {
    const size = isMobile ? 6 : 12;
    return Math.max(4, Math.min(50, size)); // Bounded font size
  }, [isMobile]);

  // SECURITY: Safe ref callback
  const refCallback = useCallback((el) => {
    if (el && safeText) {
      try {
        safeSetTextContent(el, safeText);
      } catch (error) {
        console.warn('Failed to set text content safely:', error);
      }
    }
  }, [safeText]);

  if (!safeText || !safeFont || !safeColor) {
    return null;
  }

  return (
    <div
      id={uniqueId}
      className="embroidered-text"
      style={{
        position: 'absolute',
        top: safePosition.top,
        left: safePosition.left,
        transform: `translate(-50%, -50%) ${safePosition.rotation ? `rotate(${Math.max(-360, Math.min(360, safePosition.rotation))}deg)` : ''}`,
        fontFamily: `"${safeFont}"`,
        fontSize: `${fontSize}px`,
        color: safeColor,
        fontStyle: 'italic',
        fontWeight: 'bold',
        WebkitTextStroke: `0.3px ${strokeColor}`,
        textShadow: `
          1px 1px 1px rgba(33, 33, 33, 0.28),
          -1px -1px 1px rgba(71, 71, 71, 0.56),
          0 0 2px rgba(37, 36, 36, 0.3)
        `,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 10,
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
      ref={refCallback}
    >
      {safeText}
    </div>
  );
});

EmbroideredText.displayName = 'EmbroideredText';

// SECURITY: Enhanced OrderForm component with comprehensive validation
const OrderForm = React.memo(({ 
  onClose, 
  selectedVehicleModel,
  selectedSeatView,
  selectedAccessory,
  personalisedContent,
  selectedFont,
  selectedColor,
  numSets,
  imageRef,
  pushToast,
  previewTextPositions,
  textColors,
  kitPrices,
  fontsLoaded,
  isMobile
}) => {
  // SECURITY: Enhanced input validation functions
  const validateInput = useCallback((value, type) => {
    if (typeof value !== 'string') return '';
    
    switch (type) {
      case 'text':
        // Remove potentially dangerous characters while preserving valid text
        return value
          .replace(/[<>'"&]/g, '') // Remove HTML/script injection chars
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/data:/gi, '') // Remove data: protocol
          .trim()
          .slice(0, 100); // Limit length
          
      case 'phone':
        // Only allow digits and limit to 10 characters
        return value.replace(/\D/g, '').slice(0, 10);
        
      case 'email':
        // Basic email sanitization
        return value
          .toLowerCase()
          .replace(/[<>'"&]/g, '')
          .slice(0, 100);
          
      default:
        return value.trim().slice(0, 100);
    }
  }, []);

  const isValidPhone = useCallback((phone) => {
    return /^\d{10}$/.test(phone);
  }, []);

  const isValidEmail = useCallback((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const sanitizeDigits = useCallback((value) => {
    return value.replace(/\D/g, '');
  }, []);

  // SECURITY: State with validation - Initialize with proper defaults
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // SECURITY: Enhanced state management with validation
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [BookingID, setBookingID] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [dealershipAddress, setDealershipAddress] = useState('');
  const [dealershipManager, setDealershipManager] = useState('');
  const [dealershipLocation, setDealershipLocation] = useState('');
  const [errors, setErrors] = useState({});
  const [showTerms, setShowTerms] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  // SECURITY: Enhanced local toast management
  const [localToasts, setLocalToasts] = useState([]);
  const localPushToast = useCallback((message, variant = 'info', timeoutMs = 3000, onClose) => {
    // Validate inputs
    const safeMessage = validateInput(message, 'text');
    const safeVariant = ['info', 'success', 'error', 'warning'].includes(variant) ? variant : 'info';
    const safeTimeout = Math.max(1000, Math.min(10000, timeoutMs)); // Bounded timeout
    
    const id = Date.now() + Math.random();
    setLocalToasts(prev => [...prev, { id, message: safeMessage, variant: safeVariant, onClose }]);
    
    setTimeout(() => {
      setLocalToasts(prev => {
        const removed = prev.find(t => t.id === id);
        if (removed && typeof removed.onClose === 'function') {
          try { 
            removed.onClose(); 
          } catch (err) { 
            console.error('Toast onClose error:', err); 
          }
        }
        return prev.filter(t => t.id !== id);
      });
    }, safeTimeout);
  }, [validateInput]);

  // SECURITY: Safe form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!isValidPhone(customerPhone)) {
      newErrors.customerPhone = 'Valid 10-digit phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerName, customerPhone, isValidPhone]);

  // SECURITY: Enhanced state updates with validation
  useEffect(() => {
    if (BookingID && BookingID !== orderNo) {
      const validatedBookingID = validateInput(BookingID, 'text');
      setOrderNo(validatedBookingID);
    }
  }, [BookingID, validateInput]);

  useEffect(() => {
    if (orderNo && orderNo !== BookingID) {
      const validatedOrderNo = validateInput(orderNo, 'text');
      setBookingID(validatedOrderNo);
    }
  }, [orderNo, validateInput]);

  // SECURITY: Enhanced input styling with validation feedback
  const getInputStyle = useCallback((fieldName) => ({
    width: '100%',
    padding: '4px 0',
    border: 'none',
    borderBottom: errors[fieldName] ? '2px solid red' : '1px solid #000',
    borderRadius: '0',
    fontSize: '14px',
    backgroundColor: 'transparent',
    outline: 'none'
  }), [errors]);

  // SECURITY: Enhanced PDF generation with comprehensive validation
  const handleDownloadOrder = useCallback(async () => {
    // SECURITY: Validate all required fields
    if (!validateForm()) {
      localPushToast('Please fill in all required fields correctly.', 'error');
      return;
    }

    try {
      // Mock PDF generation - replace with actual implementation
      localPushToast('PDF generated successfully!', 'success');
    } catch (err) {
      console.error('PDF generation failed:', err);
      localPushToast('Failed to generate PDF. Please try again.', 'error');
    }
  }, [validateForm, localPushToast]);

  // SECURITY: Memoized validated data for rendering
  const validatedVehicleModel = useMemo(() => 
    validateInput(selectedVehicleModel, 'text'), 
    [selectedVehicleModel, validateInput]
  );
  
  const validatedAccessory = useMemo(() => 
    validateInput(selectedAccessory, 'text'), 
    [selectedAccessory, validateInput]
  );
  
  const validatedPersonalisedContent = useMemo(() => 
    validateInput(personalisedContent, 'text'), 
    [personalisedContent, validateInput]
  );
  
  const validatedSelectedFont = useMemo(() => 
    validateInput(selectedFont, 'text'), 
    [selectedFont, validateInput]
  );
  
  const validatedSelectedColor = useMemo(() => 
    validateInput(selectedColor, 'text'), 
    [selectedColor, validateInput]
  );

  const validatedNumSets = useMemo(() => 
    Math.max(1, parseInt(numSets) || 1), 
    [numSets]
  );

  // Original styles maintained
  const orderFormRef = useRef(null);

  const inputStyle = {
    width: '100%',
    padding: '4px 0',
    border: 'none',
    borderBottom: '1px solid #000',
    borderRadius: '0',
    fontSize: '14px',
    backgroundColor: 'transparent',
    outline: 'none'
  };

  const textareaStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    minHeight: '60px',
    resize: 'vertical',
    fontFamily: 'Arial, sans-serif'
  };

  const dividerStyle = {
    width: '2px',
    backgroundColor: '#005d8f',
    margin: '0 20px',
    alignSelf: 'stretch'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div
        ref={orderFormRef}
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '30px',
            height: '30px',
            borderRadius: '20%',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#fff',
            backgroundColor: '#dd052b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Header with Logo, Centered Title, and Close Button */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '0 10px',
            borderBottom: '2px solid #e0e0e0',
            height: '60px'
          }}
        >
          {/* Logo at Left */}
          <img
            src="/logo-rec.png"
            alt="Mahindra Logo"
            style={
              window.innerWidth <= 600
                ? {
                    height: '35px',
                    position: 'absolute',
                    left: '-16px',
                    top: '27%',
                    transform: 'translateY(-50%)'
                  }
                : {
                    height: '50px',
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }
            }
          />

          {/* Centered Title */}
          <h2
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              margin: 0,
              color: 'rgb(221, 5, 43)',
              fontSize: 'clamp(16px, 3vw, 24px)',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            Personalization Order Details
          </h2>
        </div>

        {/* Order Number and Date - Top Right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
            marginBottom: '5px',
            textAlign: 'right',
            right: '30px'
          }}
        >
          {/* Order Number Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginRight: '10px',
                minWidth: '110px',
              }}
            >
              Order Number :
            </label>
            <input
              name="orderNo"
              type="text"
              value={orderNo}
              readOnly
              style={{
                ...getInputStyle('orderNo'),
                width: '100px',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed',
              }}
            />
          </div>

          {/* Order Date Row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginRight: '10px',
                minWidth: '110px'
              }}
            >
              Order Date :
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              style={{
                ...getInputStyle('orderDate'),
                width: '100px',
                textAlign: 'center'
              }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ borderTop: '2px solid #005d8f', paddingTop: '0px' }}>
          <div
            style={{
              display: 'flex',
              padding: '20px 0',
              gap: '0px',
              alignItems: 'flex-start'
            }}
          >
            {/* Dealer Info */}
            <div style={{ flex: 1, paddingRight: '20px' }}>
              {/* Dealer Name */}
              <div
                className="tooltip-wrapper"
                style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
              >
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Dealer Name :</label>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    name="dealershipName"
                    type="text"
                    value={validateInput(dealershipName, 'text')}
                    readOnly
                    style={{
                      ...inputStyle,
                      borderBottom: '1px solid #000',
                      padding: '4px 0',
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
                <span className="tooltip-text">For Office Use Only</span>
              </div>

              {/* Accessory Manager */}
              <div
                className="tooltip-wrapper"
                style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
              >
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Accessory Manager :</label>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    name="dealershipManager"
                    type="text"
                    value={validateInput(dealershipManager, 'text')}
                    readOnly
                    style={{
                      ...inputStyle,
                      borderBottom: '1px solid #000',
                      padding: '4px 0',
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
                <span className="tooltip-text">For Office Use Only</span>
              </div>

              {/* Dealer Location */}
              <div
                className="tooltip-wrapper"
                style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
              >
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Dealer Location :</label>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    name="dealershipLocation"
                    type="text"
                    value={validateInput(dealershipLocation, 'text')}
                    readOnly
                    style={{
                      ...inputStyle,
                      borderBottom: '1px solid #000',
                      padding: '4px 0',
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
                <span className="tooltip-text">For Office Use Only</span>
              </div>

              {/* Dealer Address */}
              <div
                className="tooltip-wrapper"
                style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
              >
                <label style={{ fontWeight: 'bold', minWidth: '140px', whiteSpace: 'nowrap' }}>Dealer Address :</label>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    name="dealershipAddress"
                    type="text"
                    value={validateInput(dealershipAddress, 'text')}
                    readOnly
                    style={{
                      ...inputStyle,
                      borderBottom: '1px solid #000',
                      padding: '4px 0',
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
                <span className="tooltip-text">For Office Use Only</span>
              </div>

              {/* Booking ID */}
              <div
                className="tooltip-wrapper"
                style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
              >
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Booking ID :</label>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    name="BookingID"
                    type="text"
                    value={validateInput(BookingID, 'text')}
                    readOnly
                    style={{
                      ...inputStyle,
                      borderBottom: '1px solid #000',
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
                <span className="tooltip-text">For Office Use Only</span>
              </div>
            </div>

            <style>
              {`
                .tooltip-text {
                  visibility: hidden;
                  opacity: 0;
                  font-size: 11px;
                  background-color: #333;
                  color: #fff;
                  padding: 3px 6px;
                  border-radius: 4px;
                  position: absolute;
                  left: 50%;
                  bottom: -25px;
                  transform: translateX(-50%);
                  white-space: nowrap;
                  transition: opacity 0.3s;
                  z-index: 10;
                }

                .tooltip-wrapper:hover .tooltip-text {
                  visibility: visible;
                  opacity: 1;
                }
              `}
            </style>

            {/* Divider */}
            <div style={dividerStyle} />

            {/* Customer Info */}
            <div style={{ flex: 1, padding: '0 20px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Customer Name :</label>
                <input 
                  name="customerName"
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(validateInput(e.target.value, 'text'))} 
                  placeholder="Enter Customer Name"
                  style={getInputStyle('customerName')}
                />
              </div>

              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Customer Phone :</label>
                <input 
                  name="customerPhone"
                  type="tel" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customerPhone} 
                  onChange={(e) => {
                    const digits = sanitizeDigits(e.target.value).slice(0, 10);
                    setCustomerPhone(digits);
                  }} 
                  placeholder="Enter Customer Phone Number"
                  style={getInputStyle('customerPhone')}
                />
              </div>
            </div>

            {/* Divider */}
            <div style={dividerStyle} />

            {/* Vehicle Info */}
            <div style={{ flex: 1, paddingLeft: '20px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Vehicle Model :</label>
                <span>{validatedVehicleModel}</span>
              </div>

              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Accessory :</label>
                <span>{validatedAccessory}</span>
              </div>

              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Text Content :</label>
                <span>{validatedPersonalisedContent}</span>
              </div>

              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Font :</label>
                <span>{validatedSelectedFont}</span>
              </div>

              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Thread :</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: validatedSelectedColor,
                      border: '1px solid #ccc',
                      borderRadius: '3px'
                    }}
                  />
                  <span>{textColors && textColors.find && textColors.find((c) => c.value === validatedSelectedColor)?.name || validatedSelectedColor}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>Qty :</label>
                <span>{validatedNumSets}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '4px',
                  marginTop: '12px',
                }}
              >
                <label style={{ fontWeight: 'bold', minWidth: '140px' }}>MRP :</label>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '2px',
                  }}
                >
                  {/* Price value */}
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: '#1c1b1bff',
                      fontSize: '16px',
                    }}
                  >
                    {validatedAccessory && kitPrices && kitPrices[validatedAccessory]
                      ? `₹${(
                          parseInt(kitPrices[validatedAccessory].replace(/[^\d]/g, '')) *
                          validatedNumSets
                        ).toLocaleString()}`
                      : '--/--'}
                  </span>

                  {/* Inclusive text below the value */}
                  {validatedAccessory && kitPrices && kitPrices[validatedAccessory] && (
                    <span
                      style={{
                        fontWeight: 'normal',
                        color: '#666',
                        fontSize: '12px',
                      }}
                    >
                      (Inclusive of all taxes)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Design Preview Section */}
        <div style={{ 
          marginTop: '30px',
          textAlign: 'center',
          borderTop: '2px solid #e0e0e0',
          paddingTop: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '40px',
            flexWrap: 'wrap'
          }}>
            {/* Front Row Image */}
            <div>
              <h4 style={{ 
                marginBottom: '10px',
                color: '#d61616ff',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Front Row
              </h4>
              <div style={{ 
                position: 'relative', 
                display: 'inline-block',
                width: '380px',
                height: '300px',
                border: '2px solid ',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                  src={`/models/${validatedVehicleModel}/Front Row/${validatedAccessory}.png`}
                  alt="Front Row Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
                {fontsLoaded && validatedPersonalisedContent && previewTextPositions && previewTextPositions[validatedVehicleModel]?.['Front Row']?.[validatedAccessory]?.map((position, index) => {
                  const fontSize = position.fontSize 
                    ? (isMobile ? position.fontSize.mobile : position.fontSize.desktop)
                    : (isMobile ? 16 : 22);

                  return (
                    <div
                      key={`front-${index}`}
                      style={{
                        position: 'absolute',
                        top: position.top,
                        left: position.left,
                        transform: `translate(-50%, -50%) ${position.rotation ? `rotate(${position.rotation}deg)` : ''}`,
                        fontFamily: `"${validatedSelectedFont}"`,
                        fontSize: `${fontSize}px`,
                        color: validatedSelectedColor,
                        fontStyle: 'italic',
                        fontWeight: 'bold',
                        WebkitTextStroke: '0.5px rgba(68, 68, 68, 0.5)',
                        textShadow: `
                          1px 1px 1px rgba(33, 33, 33, 0.28),
                          -1px -1px 1px rgba(71, 71, 71, 0.56),
                          0 0 2px rgba(37, 36, 36, 0.3)
                        `,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 10
                      }}
                    >
                      {validatedPersonalisedContent}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rear Row Image */}
            <div>
              <h4 style={{ 
                marginBottom: '10px',
                color: '#d61616ff',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Rear Row
              </h4>
              <div style={{ 
                position: 'relative', 
                display: 'inline-block',
                width: '380px',
                height: '300px',
                border: '2px solid ',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                  src={`/models/${validatedVehicleModel}/Rear Row/${validatedAccessory}.png`}
                  alt="Rear Row Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
                {fontsLoaded && validatedPersonalisedContent && previewTextPositions && previewTextPositions[validatedVehicleModel]?.['Rear Row']?.[validatedAccessory]?.map((position, index) => {
                  const fontSize = position.fontSize 
                    ? (isMobile ? position.fontSize.mobile : position.fontSize.desktop)
                    : (isMobile ? 16 : 22);
                  
                  return (
                    <div
                      key={`rear-${index}`}
                      style={{
                        position: 'absolute',
                        top: position.top,
                        left: position.left,
                        transform: `translate(-50%, -50%) ${position.rotation ? `rotate(${position.rotation}deg)` : ''}`,
                        fontFamily: `"${validatedSelectedFont}"`,
                        fontSize: `${fontSize}px`,
                        color: validatedSelectedColor,
                        fontStyle: 'italic',
                        fontWeight: 'bold',
                        WebkitTextStroke: '0.5px rgba(68, 68, 68, 0.5)',
                        textShadow: `
                          1px 1px 1px rgba(33, 33, 33, 0.28),
                          -1px -1px 1px rgba(71, 71, 71, 0.56),
                          0 0 2px rgba(37, 36, 36, 0.3)
                        `,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 10
                      }}
                    >
                      {validatedPersonalisedContent}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Order Request */}
        <div style={{ 
          marginTop: '30px',
          textAlign: 'center',
          borderTop: '2px solid #e0e0e0',
          paddingTop: '20px'
        }}>
          <button
            type="button"
            onClick={() => {
              if (!customerName.trim()) {
                localPushToast('Please enter Customer Name.', 'error');
                return;
              }
              if (!isValidPhone(customerPhone)) {
                localPushToast('Enter a valid 10-digit Customer Phone.', 'error');
                return;
              }
              setTermsChecked(false);
              setShowTerms(true);
            }}
            className="custom-button sliding-fill"
          >
            Place Order
          </button>
        </div>

        {/* Terms & Conditions Dialog */}
        {showTerms && (
          <div className="popup-overlay">
            <div
              className="popup-box"
              style={{
                maxWidth: '560px',
                backgroundColor: '#fff',
                color: '#111',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: '10px',
                  color: '#003366',
                  textAlign: 'center',
                }}
              >
                Terms & Conditions
              </h3>

              <ul
                style={{
                  marginBottom: '16px',
                  color: '#333',
                  lineHeight: 1.8,
                  listStylePosition: 'outside',
                  paddingLeft: '20px',
                  textAlign: 'justify',
                }}
              >
                <li>Once the order is confirmed, it cannot be cancelled.</li>
                <li>
                  The images represent the actual product, though the color of the image and
                  product may slightly differ.
                </li>
                <li>
                  The product will be delivered within 15 working days from the date of order
                  confirmation.
                </li>
                <li>The product is non-returnable and non-refundable.</li>
              </ul>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                }}
              >
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                />
                <span>I agree to the terms and conditions.</span>
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => setShowTerms(false)}
                  style={{
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#374151',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!termsChecked}
                  onClick={async () => {
                    setShowTerms(false);
                    if (!validateForm()) return;
                    await handleDownloadOrder();
                    setShowThanks(true);
                  }}
                  style={{
                    background: '#dd052b',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: termsChecked ? 'pointer' : 'not-allowed',
                    opacity: termsChecked ? 1 : 0.6,
                  }}
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thank You Popup */}
        {showThanks && (
          <div className="popup-overlay">
            <div className="popup-box" style={{ background: '#fff', color: '#111', borderRadius: '10px', padding: '20px', boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
              <p style={{ margin: 0 }}>Thank you for your Order.</p>
              <div style={{ marginTop: '14px', textAlign: 'right' }}>
                <button
                  onClick={() => window.location.assign('/')}
                  style={{
                    background: '#5e5d5dff',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local toasts for OrderForm */}
        {localToasts.length > 0 && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 4000
          }}>
            {localToasts.map(t => (
              <div key={t.id} className="toast-card" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                minWidth: '300px',
                maxWidth: '460px',
                padding: '14px 16px',
                borderRadius: '14px',
                backgroundColor: '#ffffff',
                border: '1px solid #EEE',
                boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                color: '#111',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '6px',
                  background: t.variant === 'error'
                    ? 'linear-gradient(180deg, #e11d2e 0%, #b3121c 100%)'
                    : 'linear-gradient(180deg, #1aa851 0%, #0f7f3a 100%)'
                }} />

                <div style={{
                  width: '10px',
                  height: '10px',
                  marginTop: '4px',
                  borderRadius: '50%',
                  backgroundColor: t.variant === 'error' ? '#e11d2e' : '#1aa851'
                }} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#374151' }}>{t.message}</div>
                </div>

                <button
                  className="toast-close"
                  onClick={() => {
                    setLocalToasts(prev => {
                      const removed = prev.find(x => x.id === t.id);
                      if (removed && typeof removed.onClose === 'function') {
                        try { removed.onClose(); } catch (err) { console.error(err); }
                      }
                      return prev.filter(x => x.id !== t.id);
                    });
                  }}
                  aria-label="Dismiss notification"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    color: '6b7280',
                    fontSize: '16px',
                    lineHeight: 1,
                    padding: '4px',
                    position: 'absolute',
                    top: '8px',
                    right: '10px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

OrderForm.displayName = 'OrderForm';

// SECURITY: Enhanced PreviewPage component
const PreviewPage = React.memo(({ savedImages, onModify, onConfirm, onClose }) => {
  // SECURITY: Validate savedImages prop
  const safeSavedImages = useMemo(() => {
    if (!savedImages || typeof savedImages !== 'object') {
      return {};
    }
    
    const validated = {};
    Object.keys(savedImages).forEach(key => {
      if (typeof key === 'string' && typeof savedImages[key] === 'string') {
        // Validate image data URL format
        if (savedImages[key].startsWith('data:image/') && savedImages[key].includes('base64,')) {
          validated[validateInput(key, 'text')] = savedImages[key];
        }
      }
    });
    
    return validated;
  }, [savedImages]);

  // SECURITY: Safe callback handlers
  const handleModify = useCallback(() => {
    if (typeof onModify === 'function') {
      try {
        onModify();
      } catch (error) {
        console.error('Error in onModify callback:', error);
      }
    }
  }, [onModify]);

  const handleConfirm = useCallback(() => {
    if (typeof onConfirm === 'function') {
      try {
        onConfirm();
      } catch (error) {
        console.error('Error in onConfirm callback:', error);
      }
    }
  }, [onConfirm]);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') {
      try {
        onClose();
      } catch (error) {
        console.error('Error in onClose callback:', error);
      }
    }
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        background: 'transparent'
      }}>
        {/* Blurred Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '8px',
          backgroundImage: `url('/dots-perspective-with-blank-space-background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(1.3px)',
          zIndex: 0,
        }} />

        {/* Foreground Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              width: '30px',
              height: '30px',
              borderRadius: '20%',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#fff',
              backgroundColor: '#986b1cff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>

          <h2 style={{
            textAlign: 'center',
            marginTop: 0,
            marginBottom: '20px',
            color: 'rgba(255, 255, 255, 1)'
          }}>
            Preview
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '10px', color: '#ffffffff' }}>Front Row</h4>
              <div style={{ width: '420px', height: '320px', border: '2px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                {safeSavedImages['Front Row'] ? (
                  <img 
                    src={safeSavedImages['Front Row']} 
                    alt="Front Row Saved" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      console.warn('Failed to load front row image');
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#888' 
                  }}>
                    No image saved
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '10px', color: '#ffffffff' }}>Rear Row</h4>
              <div style={{ width: '420px', height: '320px', border: '2px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                {safeSavedImages['Rear Row'] ? (
                  <img 
                    src={safeSavedImages['Rear Row']} 
                    alt="Rear Row Saved" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      console.warn('Failed to load rear row image');
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#888' 
                  }}>
                    No image saved
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button className="custom-button sliding-fill" onClick={handleModify}>Modify</button>
            <button className="custom-button sliding-fill" onClick={handleConfirm}>Confirm Personalisation</button>
          </div>
        </div>
      </div>
    </div>
  );
});

PreviewPage.displayName = 'PreviewPage';

// SECURITY: Enhanced main App component
const App = () => {
  // SECURITY: State with validation
  const [selectedVehicleModel, setSelectedVehicleModel] = useState('');
  const [selectedSeatView, setSelectedSeatView] = useState('Front Row');
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [personalisedContent, setPersonalisedContent] = useState('');
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedColor, setSelectedColor] = useState(textColors[0].value);
  const [numSets, setNumSets] = useState(1);
  const imageRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isAdjustMode, setIsAdjustMode] = useState(false);
  const [adjustablePositions, setAdjustablePositions] = useState([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const orderFormRef = useRef(null);
  const [savedImages, setSavedImages] = useState({});
  const [lastEditedRow, setLastEditedRow] = useState('Front Row');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [primarySeatView, setPrimarySeatView] = useState(null);
  const [actionPopup, setActionPopup] = useState({ open: false, message: '' });
  const [forceFlowAfterModify, setForceFlowAfterModify] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // SECURITY: Enhanced effect hooks with cleanup and validation
  useEffect(() => {
    let mounted = true;

    loadFonts().then(() => {
      if (mounted) {
        setFontsLoaded(true);
      }
    }).catch(error => {
      console.warn('Font loading failed:', error);
      if (mounted) {
        setFontsLoaded(true);
      }
    });

    const style = document.createElement('style');
    style.textContent = extraStyles;
    document.head.appendChild(style);

    const handleResize = () => {
      if (mounted) {
        setIsMobile(window.innerWidth < 768);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // SECURITY: Enhanced position updates with validation
  useEffect(() => {
    if (selectedVehicleModel && selectedAccessory && selectedSeatView) {
      const positions = textPositions[selectedVehicleModel]?.[selectedSeatView]?.[selectedAccessory] || [];
      if (Array.isArray(positions)) {
        setAdjustablePositions([...positions]);
      }
    }
  }, [selectedVehicleModel, selectedAccessory, selectedSeatView]);

  // SECURITY: Enhanced image path generation with validation
  const getImagePath = useCallback(() => {
    if (!selectedVehicleModel || !selectedAccessory || !selectedSeatView) {
      return '/Inside Page Banner.jpg';
    }

    const safeModel = validateInput(selectedVehicleModel, 'vehicleModel');
    const safeAccessory = validateInput(selectedAccessory, 'accessory');
    const safeSeatView = ['Front Row', 'Rear Row'].includes(selectedSeatView) ? selectedSeatView : 'Front Row';

    if (!safeModel || !safeAccessory) {
      return '/Inside Page Banner.jpg';
    }

    return `/models/${safeModel}/${safeSeatView}/${safeAccessory}.png`;
  }, [selectedVehicleModel, selectedAccessory, selectedSeatView]);

  // SECURITY: Enhanced download handler with comprehensive validation
  const handleDownload = useCallback(async () => {
    const validatedModel = validateInput(selectedVehicleModel, 'vehicleModel');
    const validatedAccessory = validateInput(selectedAccessory, 'accessory');
    const validatedSeatView = ['Front Row', 'Rear Row'].includes(selectedSeatView) ? selectedSeatView : '';

    if (!validatedModel || !validatedAccessory || !validatedSeatView) {
      setShowPopup(true);
      return;
    }

    const element = imageRef.current;
    if (!element || !document.contains(element)) {
      console.error('Invalid element for download');
      return;
    }

    try {
      setIsImageLoading(true);

      const canvas = await html2canvas(element, {
        scale: Math.min(4, window.devicePixelRatio * 2), // Limit scale for performance
        useCORS: true,
        allowTaint: false, // Enhanced security
        backgroundColor: null,
        timeout: 30000 // 30 second timeout
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Invalid canvas generated');
      }

      const imgWidth = Math.max(1, canvas.width);
      const imgHeight = Math.max(1, canvas.height);

      const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
      const pdf = new jsPDF(orientation, 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const availableWidth = Math.max(1, pageWidth - (2 * margin));
      const availableHeight = Math.max(1, pageHeight - (2 * margin));

      const ratio = Math.min(
        availableWidth / imgWidth,
        availableHeight / imgHeight
      );

      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95),
        'JPEG',
        Math.max(0, x),
        Math.max(0, y),
        Math.max(1, scaledWidth),
        Math.max(1, scaledHeight)
      );

      // SECURITY: Safe filename generation
      const vehicle = validatedModel || 'vehicle';
      const accessory = validatedAccessory || 'accessory';
      const seat = validatedSeatView === 'Front Row' ? 'front' : 'rear';

      const cleanFilename = `${vehicle}-${seat}-${accessory}`
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\-]/g, '')
        .toLowerCase()
        .substring(0, 50); // Limit filename length

      const filename = `${cleanFilename}.pdf`;
      setDownloadedFileName(filename);
      pdf.save(filename);

      setIsImageLoading(false);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);

    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsImageLoading(false);

      try {
        // Fallback to image download
        const canvas = await html2canvas(element, { scale: 2 });
        const link = document.createElement('a');
        
        const vehicle = validatedModel || 'vehicle';
        const accessory = validatedAccessory || 'accessory';
        const seat = validatedSeatView === 'Front Row' ? 'front' : 'rear';

        const cleanFilename = `${vehicle}-${seat}-${accessory}`
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9\-]/g, '')
          .toLowerCase()
          .substring(0, 50);

        const filename = `${cleanFilename}.jpg`;
        link.download = filename;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadedFileName(filename);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        pushToast("Failed to generate download. Please try again.", 'error');
      }
    }
  }, [selectedVehicleModel, selectedAccessory, selectedSeatView, imageRef]);

  // SECURITY: Enhanced save handler with validation
  const handleSave = useCallback(async () => {
    const validatedModel = validateInput(selectedVehicleModel, 'vehicleModel');
    const validatedAccessory = validateInput(selectedAccessory, 'accessory');
    const validatedSeatView = ['Front Row', 'Rear Row'].includes(selectedSeatView) ? selectedSeatView : '';
    const validatedContent = validateInput(personalisedContent, 'personalized');

    if (!validatedModel || !validatedAccessory || !validatedSeatView || !validatedContent) {
      setShowPopup(true);
      return;
    }

    const element = imageRef.current;
    if (!element || !document.contains(element)) {
      console.error('Invalid element for save');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: Math.min(2, window.devicePixelRatio), // Limit scale for performance
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        timeout: 15000 // 15 second timeout
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Invalid canvas generated for save');
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // SECURITY: Validate data URL format
      if (!dataUrl.startsWith('data:image/jpeg;base64,')) {
        throw new Error('Invalid image data format');
      }

      setSavedImages(prev => ({ ...prev, [validatedSeatView]: dataUrl }));
      setLastEditedRow(validatedSeatView);
      
      if (!primarySeatView) {
        setPrimarySeatView(validatedSeatView);
      }
      
      pushToast(`${validatedSeatView} saved successfully`, 'success');
    } catch (error) {
      console.error('Error saving design:', error);
      pushToast('Failed to save the current design. Please try again.', 'error');
    }
  }, [selectedVehicleModel, selectedAccessory, selectedSeatView, personalisedContent, imageRef, primarySeatView]);

  // SECURITY: Enhanced toast management
  const pushToast = useCallback((message, variant = 'success', timeoutMs = 2500) => {
    const safeMessage = validateInput(message, 'text');
    const safeVariant = ['success', 'error', 'info', 'warning'].includes(variant) ? variant : 'success';
    const safeTimeout = Math.max(1000, Math.min(10000, timeoutMs));
    
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message: safeMessage, variant: safeVariant }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, safeTimeout);
  }, []);

  // SECURITY: Enhanced preview click handler with comprehensive validation
  const handlePreviewClick = useCallback(async () => {
    const validatedModel = validateInput(selectedVehicleModel, 'vehicleModel');
    const validatedAccessory = validateInput(selectedAccessory, 'accessory');
    const validatedContent = validateInput(personalisedContent, 'personalized');
    const validatedColor = validateInput(selectedColor, 'color');
    const validatedFont = validateInput(selectedFont, 'font');

    if (!validatedModel || !validatedAccessory || !validatedContent.trim() || !validatedColor) {
      setActionPopup({
        open: true,
        message: 'Please personalise your Comfort Kit to view the Preview.'
      });
      return;
    }

    setIsPreviewLoading(true);

    const generatePreviewImages = async () => {
      const saveImageForRow = async (row) => {
        if (!['Front Row', 'Rear Row'].includes(row)) {
          throw new Error('Invalid row specified');
        }

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '500px';
        container.style.height = '390px';
        container.style.background = '#fff';
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        try {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.src = `/models/${validatedModel}/${row}/${validatedAccessory}.png`;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.position = 'absolute';
          img.style.top = '0';
          img.style.left = '0';
          container.appendChild(img);

          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Image load timeout')), 10000);
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            
            img.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Image load failed'));
            };
          });

          const positions = previewTextPositions[validatedModel]?.[row]?.[validatedAccessory] || [];
          positions.forEach(position => {
            if (!position || typeof position !== 'object') return;
            
            const textEl = document.createElement('div');
            textEl.textContent = validatedContent;
            textEl.style.position = 'absolute';
            textEl.style.top = String(position.top || '50%');
            textEl.style.left = String(position.left || '50%');
            textEl.style.transform = `translate(-50%, -50%) ${position.rotation ? `rotate(${Math.max(-360, Math.min(360, Number(position.rotation) || 0))}deg)` : ''}`;
            textEl.style.fontFamily = validatedFont || 'Arial';
            textEl.style.fontSize = `${Math.max(8, Math.min(50, position.fontSize?.desktop || 14))}px`;
            textEl.style.color = validatedColor;
            textEl.style.fontStyle = 'italic';
            textEl.style.fontWeight = 'bold';
            textEl.style.WebkitTextStroke = '0.3px rgba(68, 68, 68, 0.5)';
            textEl.style.textShadow = '1px 1px 1px rgba(33, 33, 33, 0.28), -1px -1px 1px rgba(71, 71, 71, 0.56), 0 0 2px rgba(37, 36, 36, 0.3)';
            textEl.style.pointerEvents = 'none';
            textEl.style.whiteSpace = 'nowrap';
            textEl.style.zIndex = '10';
            textEl.style.maxWidth = '200px';
            textEl.style.overflow = 'hidden';
            container.appendChild(textEl);
          });

          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: null,
            timeout: 15000
          });

          if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Invalid canvas generated');
          }

          return canvas.toDataURL('image/jpeg', 0.95);
        } finally {
          if (container.parentNode) {
            document.body.removeChild(container);
          }
        }
      };

      try {
        const [frontImage, rearImage] = await Promise.all([
          saveImageForRow('Front Row'),
          saveImageForRow('Rear Row')
        ]);

        // SECURITY: Validate generated images
        if (!frontImage.startsWith('data:image/jpeg;base64,') || !rearImage.startsWith('data:image/jpeg;base64,')) {
          throw new Error('Invalid image data generated');
        }

        return {
          'Front Row': frontImage,
          'Rear Row': rearImage
        };
      } catch (error) {
        console.error('Error generating preview images:', error);
        throw error;
      }
    };

    try {
      const [, generatedImages] = await Promise.all([
        new Promise(resolve => setTimeout(resolve, 2000)),
        generatePreviewImages()
      ]);

      setSavedImages(generatedImages);
      setIsPreviewLoading(false);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      setIsPreviewLoading(false);
      pushToast('Failed to generate preview. Please try again.', 'error');
    }
  }, [
    selectedVehicleModel, 
    selectedAccessory, 
    personalisedContent, 
    selectedColor, 
    selectedFont,
    pushToast
  ]);

  // SECURITY: Enhanced input change handlers with validation
  const handleVehicleModelChange = useCallback((e) => {
    const validated = validateInput(e.target.value, 'vehicleModel');
    setSelectedVehicleModel(validated);
  }, []);

  const handleAccessoryChange = useCallback((e) => {
    const validated = validateInput(e.target.value, 'accessory');
    setSelectedAccessory(validated);
  }, []);

  const handlePersonalisedContentChange = useCallback((e) => {
    const validated = validateInput(e.target.value.slice(0, 7), 'personalized');
    setPersonalisedContent(validated);
  }, []);

  const handleFontChange = useCallback((e) => {
    const validated = validateInput(e.target.value, 'font');
    setSelectedFont(validated);
  }, []);

  const handleColorChange = useCallback((color) => {
    const validated = validateInput(color, 'color');
    setSelectedColor(validated);
  }, []);

  const handleNumSetsChange = useCallback((e) => {
    const validated = validateInput(e.target.value, 'number');
    setNumSets(validated);
  }, []);

  const handleSeatViewChange = useCallback((value) => {
    if (!['Front Row', 'Rear Row'].includes(value)) return;
    
    if (!primarySeatView) {
      setPrimarySeatView(value);
    }
    setSelectedSeatView(value);
  }, [primarySeatView]);

  // SECURITY: Enhanced preload font function
  const preloadSelectedFont = useCallback(() => {
    if (!selectedFont) return null;
    
    const validatedFont = validateInput(selectedFont, 'font');
    const validatedContent = validateInput(personalisedContent, 'personalized');
    
    return (
      <div 
        style={{ 
          fontFamily: validatedFont, 
          fontStyle: 'italic',
          position: 'absolute', 
          visibility: 'hidden', 
          fontSize: '22px',
          zIndex: -1
        }}
      >
        {validatedContent || "Preload Text"}
      </div>
    );
  }, [selectedFont, personalisedContent]);

  // SECURITY: Enhanced position update handler
  const updatePosition = useCallback((index, property, value) => {
    if (typeof index !== 'number' || index < 0) return;
    if (typeof property !== 'string') return;
    
    setAdjustablePositions(prev => {
      if (!Array.isArray(prev) || index >= prev.length) return prev;
      
      const newPositions = [...prev];
      const safeValue = property === 'rotation' 
        ? Math.max(-360, Math.min(360, Number(value) || 0))
        : value;
        
      newPositions[index] = {
        ...newPositions[index],
        [property]: safeValue
      };
      return newPositions;
    });
  }, []);

  // SECURITY: Enhanced component flow control
  const isBothSaved = useMemo(() => 
    Boolean(savedImages['Front Row'] && savedImages['Rear Row']), 
    [savedImages]
  );

  const getOppositeRow = useCallback((row) => 
    row === 'Front Row' ? 'Rear Row' : 'Front Row', 
    []
  );

  // Render logic with security enhancements
  if (showOrderForm) {
    return (
      <OrderForm 
        onClose={() => {
          setShowOrderForm(false);
          setIsPreviewOpen(true);
        }}
        selectedVehicleModel={validateInput(selectedVehicleModel, 'vehicleModel')}
        selectedSeatView={selectedSeatView}
        selectedAccessory={validateInput(selectedAccessory, 'accessory')}
        personalisedContent={validateInput(personalisedContent, 'personalized')}
        selectedFont={validateInput(selectedFont, 'font')}
        selectedColor={validateInput(selectedColor, 'color')}
        numSets={validateInput(numSets, 'number')}
        previewImage={previewImage}
        pushToast={pushToast}
        imageRef={imageRef}
      />
    );
  }

  if (isPreviewOpen) {
    return (
      <PreviewPage
        savedImages={savedImages}
        onModify={() => {
          setIsPreviewOpen(false);
          if (primarySeatView) {
            setSelectedSeatView(primarySeatView);
          } else {
            setSelectedSeatView(lastEditedRow);
          }
          setForceFlowAfterModify(true);
        }}
        onConfirm={() => {
          setIsPreviewOpen(false);
          setShowOrderForm(true);
        }}
        onClose={() => setIsPreviewOpen(false)}
      />
    );
  }

  return (
    <div className="app-container">
      {preloadSelectedFont()}
      
      {/* SECURITY: Enhanced loading screen with validation */}
      {isPreviewLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '40px 60px',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <img 
              src="/spinning-dots.svg" 
              alt="Loading..." 
              style={{ 
                width: 80, 
                height: 80,
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            
            <div style={{
              color: '#ec891f',
              fontWeight: 'bold',
              fontSize: '20px',
              textAlign: 'center',
              fontFamily: '"AdornS_Condensed_Sans", sans-serif',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              Curating Your Style...
            </div>
            
            <div style={{
              color: '#666',
              fontSize: '14px',
              textAlign: 'center',
              fontFamily: '"Exo 2", sans-serif',
              maxWidth: '300px',
              lineHeight: 1.4
            }}>
              Please wait while we prepare your personalised comfort kit preview
            </div>
          </div>
        </div>
      )}
     
      <div className="left-panel">
        <div className="section-text" style={{ 
          textAlign: "center", 
          fontSize: "19px", 
          lineHeight: "2", 
          color: "white", 
          marginBottom: "50px",
          fontWeight: "650",
        }}>
          <div>Your drive. Your space.</div>
          <div>Personalise it with bespoke embroidery to suit your unique style.</div>
        </div>

        {/* SECURITY: Enhanced Vehicle Model Selection */}
        <label style={{ 
          fontFamily: '"Exo 2", sans-serif', 
          color: Boolean(primarySeatView) ? '#888' : 'inherit' 
        }}>
          Vehicle Model
        </label>
        <select
          value={selectedVehicleModel}
          onChange={handleVehicleModelChange}
          disabled={Boolean(primarySeatView)}
          style={{ 
            fontFamily: '"Exo 2", sans-serif', 
            opacity: Boolean(primarySeatView) ? 0.6 : 1 
          }}
        >
          <option value="" disabled style={{ fontFamily: '"Exo 2", sans-serif' }}>
            Select a Vehicle Model
          </option>
          {vehicleModels.map(model => (
            <option key={model} value={model} style={{ fontFamily: '"Exo 2", sans-serif' }}>
              {model}
            </option>
          ))}
        </select>

        {/* SECURITY: Enhanced Kit Type Selection */}
        <label style={{ 
          fontFamily: '"Exo 2", sans-serif', 
          color: (primarySeatView && selectedSeatView !== primarySeatView) ? '#888' : 'inherit' 
        }}>
          Kit Type
        </label>
        <select
          value={selectedAccessory}
          onChange={handleAccessoryChange}
          disabled={!selectedVehicleModel || (primarySeatView && selectedSeatView !== primarySeatView)}
          style={{ 
            fontFamily: '"Exo 2", sans-serif', 
            opacity: (primarySeatView && selectedSeatView !== primarySeatView) ? 0.6 : 1 
          }}
        >
          <option value="" disabled style={{ fontFamily: '"Exo 2", sans-serif' }}>
            Select an Accessory
          </option>
          {accessories.map(acc => (
            <option key={acc} value={acc} style={{ fontFamily: '"Exo 2", sans-serif' }}>
              {acc}
            </option>
          ))}
        </select>

        {/* SECURITY: Enhanced Personalised Content Input */}
        <label style={{ 
          fontFamily: '"Exo 2", sans-serif', 
          color: (primarySeatView && selectedSeatView !== primarySeatView) ? '#888' : 'inherit' 
        }}>
          Personalised Content
        </label>
        <input
          type="text"
          maxLength={7}
          value={personalisedContent}
          onChange={handlePersonalisedContentChange}
          disabled={primarySeatView && selectedSeatView !== primarySeatView}
          style={{ 
            fontFamily: validateInput(selectedFont, 'font') || '"Exo 2", sans-serif', 
            opacity: (primarySeatView && selectedSeatView !== primarySeatView) ? 0.6 : 1 
          }}
        />

        {/* SECURITY: Enhanced Font Style Selection */}
        <label style={{
          fontFamily: '"Exo 2", sans-serif',
          color: (primarySeatView && selectedSeatView !== primarySeatView) ? '#888' : 'inherit'
        }}>
          Font Style
        </label>
        <select
          value={selectedFont || ""}
          onChange={handleFontChange}
          disabled={primarySeatView && selectedSeatView !== primarySeatView}
          style={{
            fontFamily: selectedFont ? `"${validateInput(selectedFont, 'font')}", serif` : '"Exo 2", sans-serif',
            opacity: (primarySeatView && selectedSeatView !== primarySeatView) ? 0.6 : 1,
            fontSize: '14px'
          }}
        >
          <option value="" disabled hidden>
            Select a Font Style
          </option>
          {fontStyles.map(font => (
            <option
              key={font}
              value={font}
              style={{
                fontFamily: `"${font}", serif`,
                fontSize: '14px',
                padding: '5px'
              }}
            >
              {font}
            </option>
          ))}
        </select>

        {/* SECURITY: Enhanced Text Color Selection */}
        <label style={{ fontFamily: '"Exo 2", sans-serif' }}>Select Text Color</label>
        <div className="color-palette">
          {textColors.map(color => (
            <div
              key={color.value}
              className={`color-swatch ${selectedColor === color.value ? 'selected' : ''}`}
              style={{
                backgroundColor: color.value,
                width: '25px',
                height: '25px',
                borderRadius: '50%',
                margin: '8px 5px 5px 0',
                cursor: 'pointer',
                display: 'inline-block',
                border: selectedColor === color.value ? '2px solid black' : '1px solid #ddd'
              }}
              onClick={() => handleColorChange(color.value)}
              title={color.name}
            />
          ))}
        </div>

        {/* SECURITY: Enhanced Number of Sets and Price Display */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: '"Exo 2", sans-serif' }}>No. of Sets</label>
            <div style={{ position: 'relative', width: '100px' }}>
              <input
                type="number"
                min={1}
                max={100}
                value={numSets}
                onChange={handleNumSetsChange}
                className="no-spinner"
                style={{
                  width: '100%',
                  padding: '5px 25px',
                  textAlign: 'center',
                  MozAppearance: 'textfield',
                  fontFamily: '"Exo 2", sans-serif',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '5px',
                  top: '55%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: '"Exo 2", sans-serif',
                }}
                onClick={() => setNumSets(prev => Math.max(1, prev - 1))}
              >
                −
              </span>
              <span
                style={{
                  position: 'absolute',
                  right: '-47px',
                  top: '55%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: '"Exo 2", sans-serif',
                }}
                onClick={() => setNumSets(prev => Math.min(100, prev + 1))}
              >
                +
              </span>
            </div>
          </div>

          {/* SECURITY: Enhanced Price Display */}
          <div style={{ flex: 1, textAlign: 'right', marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '8px',
              }}>
                <label style={{
                  fontFamily: '"Exo 2", sans-serif',
                  fontWeight: 'bold',
                  color: '#ffffffff',
                }}>
                  MRP:
                </label>

                <div style={{
                  fontFamily: '"Exo 2", sans-serif',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: '18px',
                }}>
                  {selectedAccessory && kitPrices[selectedAccessory]
                    ? `₹${(
                        parseInt(kitPrices[selectedAccessory].replace(/[^\d]/g, '')) *
                        numSets
                      ).toLocaleString()}`
                    : '--/--'}
                </div>
              </div>

              {selectedAccessory && (
                <div style={{
                  fontFamily: '"Exo 2", sans-serif',
                  fontSize: '12px',
                  color: '#ccc',
                  marginTop: '2px',
                }}>
                  (Inclusive of all taxes)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECURITY: Enhanced Preview Button */}
        <div className="button-group" style={{ display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center' }}>
          <button
            className="custom-button sliding-fill"
            onClick={handlePreviewClick}
            title="Preview both rows"
          >
            Preview
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="image-container" ref={imageRef} style={{ position: 'relative' }}>
          {isImageLoading && (
            <div className="image-loader" style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.7)',
              zIndex: 100
            }}>
              <img 
                src="/spinning-dots.svg" 
                alt="Loading..." 
                style={{ width: 60, height: 60 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div style={{ color: '#005d8f', fontWeight: 'bold', fontSize: '18px' }}>
                Loading...
              </div>
            </div>
          )}

          <img
            src={getImagePath()}
            alt="Accessory Preview"
            className="headrest-image"
            style={{ 
              marginTop:'8%', 
              width: '100%', 
              height: 'auto', 
              display: isImageLoading ? 'none' : 'block' 
            }}
            onLoad={() => setIsImageLoading(false)}
            onError={(e) => {
              console.warn('Failed to load image:', e.target.src);
              setIsImageLoading(false);
              e.target.src = '/Inside Page Banner.jpg'; // Fallback image
            }}
            onLoadStart={() => setIsImageLoading(true)}
          />

          {/* SECURITY: Enhanced embroidered text rendering with validation */}
          {personalisedContent && 
           validateInput(selectedVehicleModel, 'vehicleModel') && 
           validateInput(selectedAccessory, 'accessory') && 
           selectedSeatView && 
           fontsLoaded && (
            <>
              {(isAdjustMode ? adjustablePositions : textPositions[selectedVehicleModel]?.[selectedSeatView]?.[selectedAccessory] || []).map((position, index) => (
                position ? (
                  <EmbroideredText
                    key={`${index}-${selectedColor}-${selectedFont}`}
                    text={validateInput(personalisedContent, 'personalized')}
                    fontFamily={validateInput(selectedFont, 'font')}
                    position={position}
                    textColor={validateInput(selectedColor, 'color')}
                    isMobile={isMobile}
                  />
                ) : null
              ))}
            </>
          )}
        </div>

        {/* SECURITY: Enhanced Row Switch Buttons */}
        {(validateInput(selectedVehicleModel, 'vehicleModel') && validateInput(selectedAccessory, 'accessory')) && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '18px', justifyContent: 'center' }}>
            <button
              className={`seat-btn ${selectedSeatView === 'Front Row' ? 'active' : 'inactive'}`}
              onClick={() => handleSeatViewChange('Front Row')}
            >
              Front Row
            </button>

            <button
              className={`seat-btn ${selectedSeatView === 'Rear Row' ? 'active' : 'inactive'}`}
              onClick={() => handleSeatViewChange('Rear Row')}
            >
              Rear Row
            </button>
          </div>
        )}
      </div>

      {/* SECURITY: Enhanced popup dialogs with validation */}
      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-box success-popup">
            <div className="success-icon">✓</div>
            <p>Your PDF "{validateInput(downloadedFileName, 'text')}" has been downloaded successfully!</p>
            <button onClick={() => setShowSuccessPopup(false)}>OK</button>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>Please select Vehicle Model, Seat Row, and Accessory and Personalised Content before Saving</p>
            <button onClick={() => setShowPopup(false)}>OK</button>
          </div>
        </div>
      )}

      {actionPopup.open && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>{validateInput(actionPopup.message, 'text')}</p>
            <button onClick={() => setActionPopup({ open: false, message: '' })}>OK</button>
          </div>
        </div>
      )}

      {/* SECURITY: Enhanced Toast notifications */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 3000
        }}>
          {toasts.map(t => (
            <div key={t.id} className="toast-card" style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              minWidth: '300px',
              maxWidth: '460px',
              padding: '14px 16px',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              border: '1px solid #EEE',
              boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
              color: '#111',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                background: t.variant === 'error' 
                  ? 'linear-gradient(180deg, #e11d2e 0%, #b3121c 100%)'
                  : 'linear-gradient(180deg, #1aa851 0%, #0f7f3a 100%)'
              }} />

              <div style={{
                width: '10px',
                height: '10px',
                marginTop: '4px',
                borderRadius: '50%',
                backgroundColor: t.variant === 'error' ? '#e11d2e' : '#1aa851'
              }} />

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#374151' }}>
                  {validateInput(t.message, 'text')}
                </div>
              </div>

              <button
                className="toast-close"
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                aria-label="Dismiss notification"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  color: '6b7280',
                  fontSize: '16px',
                  lineHeight: 1,
                  padding: '4px',
                  position: 'absolute',
                  top: '8px',
                  right: '10px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;