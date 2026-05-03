import type { Config } from "tailwindcss";

// Tailwind v4: theme is configured via @theme in globals.css.
// This file is kept only for content path configuration.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
