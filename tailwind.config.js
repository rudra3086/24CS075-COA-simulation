/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        cpu: "#ff9b3d",
        gpu: "#576172",
        sm: "#3c7bff",
        thread: "#58ffa0",
        scheduler: "#ff4d5f"
      },
      boxShadow: {
        neon: "0 0 18px rgba(88, 255, 160, 0.35)",
        panel: "0 12px 30px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};
