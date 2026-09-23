// src/components/constants.js
import React from "react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PaletteIcon from "@mui/icons-material/Palette";
import BoltIcon from "@mui/icons-material/Bolt";
import BugReportIcon from "@mui/icons-material/BugReport";
import RefreshIcon from "@mui/icons-material/Refresh";
import MemoryIcon from "@mui/icons-material/Memory";

export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";


export const AI_MODELS = [
  {
    value: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    description: "Fast Groq model for advanced code generation",
    color: "#f59e0b",
    icon: <SmartToyIcon />,
  },
  {
    value: "qwen-2.5-coder-32b",
    label: "Qwen 2.5 Coder",
    description: "Specialized for code generation",
    color: "#10b981",
    icon: <MemoryIcon />,
  },
  {
    value: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B",
    description: "Ultra fast for quick tasks",
    color: "#3b82f6",
    icon: <BoltIcon />,
  },
];

export const MODIFICATION_TYPES = [
  { value: "create", label: "✨ Create New", icon: <AutoAwesomeIcon />, color: "#10b981" },
  { value: "modify", label: "🎨 Modify", icon: <PaletteIcon />, color: "#3b82f6" },
  { value: "enhance", label: "⚡ Add Feature", icon: <BoltIcon />, color: "#06b6d4" },
  { value: "debug", label: "🐛 Fix Bug", icon: <BugReportIcon />, color: "#f59e0b" },
  { value: "refactor", label: "🌀 Refactor", icon: <RefreshIcon />, color: "#8b5cf6" },
];

export const THEMES = [
  { name: "Dark", value: "dark", primary: "#667eea", secondary: "#764ba2" },
  { name: "Ocean", value: "ocean", primary: "#06b6d4", secondary: "#3b82f6" },
  { name: "Forest", value: "forest", primary: "#10b981", secondary: "#047857" },
  { name: "Sunset", value: "sunset", primary: "#f59e0b", secondary: "#ef4444" },
  { name: "Royal", value: "royal", primary: "#8b5cf6", secondary: "#6366f1" },
];

export const createVercelProjectName = (value) => {
  if (!value || typeof value !== "string") return "generated-site";
  let name = value.toLowerCase().trim();
  const removeWords = [
    "please", "create", "build", "make", "generate", "develop",
    "design", "website", "web", "site", "application", "app",
    "page", "landing", "a", "an", "the", "for", "me",
  ];
  removeWords.forEach((word) => {
    name = name.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
  });
  name = name
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return name || "generated-site";
};

export const preparePreviewHtml = (html) => {
  if (!html || typeof html !== "string") return "";
  let doc = html.trim();
  doc = doc.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
  doc = doc.replace(/<link\b[^>]*href=["'](?:\.\/)?(?:style|styles)\.css["'][^>]*>\s*/gi, "");
  doc = doc.replace(/<script\b[^>]*src=["'](?:\.\/)?(?:script|app)\.js["'][^>]*>\s*<\/script>\s*/gi, "");
  doc = doc.replace(/<base\b[^>]*>/gi, "");
  doc = doc.replace(/<(?:iframe|object|embed)\b[^>]*(?:localhost|127\.0\.0\.1|localhost:3000)[^>]*>[\s\S]*?<\/(?:iframe|object|embed)>/gi, "");
  doc = doc.replace(/href\s*=\s*["']#["']/gi, 'href="#home"');
  doc = doc.replace(/<a(\s+[^>]*href=["']https?:\/\/[^"']+["'][^>]*)>/gi, (match, attrs) => {
    let next = attrs;
    if (!/\btarget\s*=/i.test(next)) next += ' target="_blank"';
    if (!/\brel\s*=/i.test(next)) next += ' rel="noopener noreferrer"';
    return `<a${next}>`;
  });

  const safeRuntime = `
<script>
(function () {
  "use strict";
  function setupGeneratedPreview() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      if (link.dataset.previewBound === "1") return;
      link.dataset.previewBound = "1";
      link.addEventListener("click", function (event) {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        let target = null;
        try { target = document.querySelector(href); } catch (e) { target = null; }
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
    document.querySelectorAll("[data-scroll-to]").forEach(function (button) {
      if (button.dataset.previewBound === "1") return;
      button.dataset.previewBound = "1";
      button.addEventListener("click", function (event) {
        const id = button.getAttribute("data-scroll-to");
        const target = id ? document.getElementById(id) : null;
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
    document.querySelectorAll('[data-nav-toggle], .nav-toggle, .menu-toggle, .hamburger').forEach(function (toggle) {
      if (toggle.dataset.previewBound === "1") return;
      toggle.dataset.previewBound = "1";
      toggle.addEventListener("click", function () {
        const selector = toggle.getAttribute("data-target") || toggle.getAttribute("aria-controls");
        let menu = null;
        if (selector) {
          menu = document.querySelector(selector) || document.getElementById(selector.replace(/^#/, ""));
        }
        if (!menu) menu = document.querySelector(".nav, .navbar-menu, .nav-menu, .mobile-menu");
        if (menu) menu.classList.toggle("active");
      });
    });
    document.querySelectorAll(".nav a, .navbar a, .nav-menu a, .mobile-menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        const menu = document.querySelector(".nav, .navbar-menu, .nav-menu, .mobile-menu");
        if (menu) menu.classList.remove("active");
      });
    });
    document.querySelectorAll("form").forEach(function (form) {
      if (form.dataset.previewBound === "1") return;
      form.dataset.previewBound = "1";
      form.addEventListener("submit", function (event) {
        const action = (form.getAttribute("action") || "").trim();
        if (action && /^https?:\\/\\//i.test(action)) return;
        event.preventDefault();
        let status = form.querySelector(".form-status, [data-form-status], .success-message");
        if (!status) {
          status = document.createElement("p");
          status.className = "form-status";
          status.style.marginTop = "12px";
          form.appendChild(status);
        }
        status.textContent = "✓ Submitted successfully (preview mode).";
      });
    });
    document.querySelectorAll("#year, [data-current-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupGeneratedPreview);
  } else {
    setupGeneratedPreview();
  }
})();
</script>`;

  if (/<\/body>/i.test(doc)) doc = doc.replace(/<\/body>/i, safeRuntime + "</body>");
  else doc += safeRuntime;

  if (!/<html[\s>]/i.test(doc)) {
    doc = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head><body>${doc}</body></html>`;
  }
  return doc;
};