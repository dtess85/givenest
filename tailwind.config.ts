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
        pampas: "var(--color-pampas)",
        "warm-1": "var(--color-warm-1)",
        "warm-2": "var(--color-warm-2)",
        cloudy: "var(--color-cloudy)",
        coral: "var(--color-coral)",
        black: "var(--color-black)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        white: "var(--color-white)",
      },
      fontFamily: {
        serif: ["var(--font-lora)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
