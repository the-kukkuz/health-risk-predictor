/** @type {import('tailwindcss').Config} */
// "Clinical Precision" design system tokens derived from docs/design layout.
// Medical blues + cool-slate neutrals + risk palette (green/amber/crimson).
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand / primary medical blue
        primary: "#0037b0",
        "primary-container": "#1d4ed8",
        "on-primary": "#ffffff",
        "on-primary-container": "#cad3ff",
        "primary-fixed": "#dce1ff",
        "primary-fixed-dim": "#b7c4ff",
        "on-primary-fixed": "#001551",
        "on-primary-fixed-variant": "#0039b5",
        inverse: "#283044",
        "inverse-primary": "#b7c4ff",

        // Secondary clinical blue
        secondary: "#006398",
        "secondary-container": "#5bb8fe",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00476e",

        // Tertiary (used for low-risk / reduction)
        tertiary: "#00501f",
        "tertiary-container": "#006b2c",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#71ee8a",
        "tertiary-fixed": "#7ffc97",
        "tertiary-fixed-dim": "#62df7d",
        "on-tertiary-fixed": "#002109",
        "on-tertiary-fixed-variant": "#005320",

        // Error / high-risk crimson
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Neutral "cool slate" surface stack
        surface: "#faf8ff",
        "surface-dim": "#d2d9f4",
        "surface-bright": "#faf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "surface-container-highest": "#dae2fd",
        "surface-variant": "#dae2fd",
        "on-surface": "#131b2e",
        "on-surface-variant": "#434655",
        "inverse-on-surface": "#eef0ff",
        outline: "#747686",
        "outline-variant": "#c4c5d7",
        "surface-tint": "#2151da",

        // Background canvas
        background: "#faf8ff",
        "on-background": "#131b2e",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        "card-hover": "0 4px 12px 0 rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
