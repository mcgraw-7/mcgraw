import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neonGreen: 'rgba(57, 255, 20, 1)',
      },
      borderColor: {
        neonGreen: 'rgba(57, 255, 20, 0.3)',
      },
      textColor: {
        neonGreen: 'rgba(57, 255, 20, 1)',
      },
      fontFamily: {
        galaga: ['emulogic', 'sans-serif'],
      },
      boxShadow: {
        neonGreen: '0 0 5px rgba(57, 255, 20, 0.3), 0 0 10px rgba(57, 255, 20, 0.3), 0 0 20px rgba(57, 255, 20, 0.3), 0 0 30px rgba(57, 255, 20, 0.3)',
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.5)',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;

