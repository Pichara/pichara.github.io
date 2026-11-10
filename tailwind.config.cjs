/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#050b09",
        darkblue: "#0c1812",
        darkerblue: "#07100b",
        darkgreen: "#14532d",
        "forest-light": "#a8e8bb",
        paper: "#eff7ef",
        sand: "#f5efe6",
        clay: "#17231c",
        mist: "#cbd5e1"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(20, 83, 45, 0.3)",
        soft: "0 18px 40px -28px rgba(5, 17, 10, 0.7)"
      }
    }
  },
  plugins: []
};
