/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          dimmed: "var(--text)",
          primary: "var(--text-h)",
          bg: "var(--bg)",
          border: "var(--border)",
          accent: "var(--accent)",
          layers: "var(--layers)",
          play: "rgb(55, 194, 20)",
          dashed: "rgb(255, 200, 1)"
        },
      },
      fontFamily: {
        Tajawal: 
        ["Tajawal-Regular", "sans-serif"],
        "Tajawal-Black": ["Tajawal-Black", "sans-serif"],
        "Tajawal-Bold": ["Tajawal-Bold", "sans-serif"],
        "Tajawal-ExtraBold": ["Tajawal-ExtraBold", "sans-serif"],
        "Tajawal-ExtraLight": ["Tajawal-ExtraLight", "sans-serif"],
        "Tajawal-Light": ["Tajawal-Light", "sans-serif"],
        "Tajawal-Medium": ["Tajawal-Medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};