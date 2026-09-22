/** @type {import('tailwindcss').Config} */

// Colors are CSS variables (space-separated RGB triplets) declared in
// src/index.css, so light and dark themes are one attribute swap on <html>
// instead of a `dark:` prefix on every element. The `<alpha-value>` slot keeps
// Tailwind's opacity modifiers (bg-accent/15) working.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: token("base"),
          soft: token("base-soft"),
        },
        surface: {
          DEFAULT: token("surface"),
          hover: token("surface-hover"),
          raised: token("surface-raised"),
        },
        border: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
        },
        ink: {
          DEFAULT: token("ink"),
          secondary: token("ink-secondary"),
          tertiary: token("ink-tertiary"),
        },
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          soft: token("accent-soft"),
          text: token("accent-text"),
          fg: token("accent-fg"),
        },
        gold: {
          DEFAULT: token("gold"),
          hover: token("gold-hover"),
          soft: token("gold-soft"),
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
      },
      borderRadius: {
        xl2: "0.875rem",
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "sheet-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "toast-in": "toast-in 160ms ease-out",
        "fade-in": "fade-in 140ms ease-out",
        "sheet-in": "sheet-in 160ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
