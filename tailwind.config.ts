import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a5f",
          light: "#2d5a8a",
          dark: "#152942",
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#b8d0ff",
          300: "#85aeff",
          400: "#4d88ff",
          500: "#1e3a5f",
          600: "#193254",
          700: "#142a48",
          800: "#0f213c",
          900: "#0a1830",
        },
        accent: {
          orange: "#e85d04",
          pink: "#ff6b6b",
          gold: "#f0b429",
        },
        dark: {
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-pattern": "url('/hero-pattern.svg')",
        "gradient-primary": "linear-gradient(135deg, #1e3a5f 0%, #2d5a8a 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
