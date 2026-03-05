export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        100: "25rem",
        105: "26.25rem",
        140: "35rem",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
