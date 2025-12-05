/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
 darkMode: "class",
  theme: {
       extend: {
      colors: {
        dark: '#040404',
        gold: '#FFD60A',
        white: '#FFFFFF',
        background: '#181717ff',
        gray: {
          light: '#E5E5E5',
          DEFAULT: '#A1A1A1',
          dark: '#333333',
        },
      },
       fontFamily: {
      PlayfairB: ["PlayfairB"],
      PlayfairR: ["PlayfairR"],
      PlayfairI: ["PlayfairI"],
      PlayfairEB: ["PlayfairEB"],
      PlayfairBI: ["PlayfairBI"],
    },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '30px',
        '2xl': '40px',
        full: '9999px',
      },
      boxShadow: {
        gold: '0 4px 10px rgba(255, 214, 10, 0.4)',
        dark: '0 4px 10px rgba(4, 4, 4, 0.5)',
      },
    },
  },
  plugins: [],
}