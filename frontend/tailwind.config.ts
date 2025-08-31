import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6750A4", // Deep purple
          50: "#F2EFF7",       // Light lavender
          100: "#E8E2F4",
          200: "#D1C4E9",
          300: "#B39DDB",
          400: "#9575CD",
          500: "#6750A4",
          600: "#5A4693",
          700: "#4D3C82",
          800: "#3F3171",
          900: "#322660",
        },
        accent: {
          DEFAULT: "#50A482", // Teal
          50: "#E8F5F1",
          100: "#D1EBE3",
          200: "#A3D7C7",
          300: "#75C3AB",
          400: "#62B396",
          500: "#50A482",
          600: "#459371",
          700: "#3A8260",
          800: "#2F714F",
          900: "#24603E",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      fontFamily: {
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'inter': ['var(--font-inter)', 'sans-serif'],
        'headline': ['var(--font-space-grotesk)', 'sans-serif'],
        'body': ['var(--font-inter)', 'sans-serif'],
        'code': ['Source Code Pro', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;