/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#F6FAF3",
        surface: "#FFFFFF",
        ink: "#22332A",
        muted: "#6B7C71",
        primary: { DEFAULT: "#4FA06A", soft: "#E1F2E6" },
        accent: { DEFAULT: "#F3A04B", soft: "#FDEBD2" },
        risk: { low: "#4FA06A", mid: "#E3B02F", high: "#DE5A4E" },
      },
      borderRadius: {
        card: "24px",
        control: "16px",
      },
    },
  },
  plugins: [],
};
