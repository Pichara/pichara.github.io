/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0a0f1a",
        darkblue: "#0d1b2a",
        darkerblue: "#08101a",
        darkorange: "#d46127",
        sand: "#f5efe6",
        clay: "#1b2433",
        mist: "#cbd5e1"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(212, 97, 39, 0.3)",
        soft: "0 18px 40px -28px rgba(13, 27, 42, 0.5)"
      }
    }
  },
  plugins: []
};
