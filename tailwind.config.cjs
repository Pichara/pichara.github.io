/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0b0f14",
        slate: "#1f2937",
        sand: "#f5efe6",
        clay: "#1b2433",
        moss: "#2f5d50",
        coral: "#f26b5b",
        ocean: "#2a7bdc",
        gold: "#1f6f5c",
        mist: "#cbd5e1"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(17, 24, 39, 0.35)",
        soft: "0 18px 40px -28px rgba(15, 23, 42, 0.45)"
      }
    }
  },
  plugins: []
};
