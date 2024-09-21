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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... 其他色阶
          900: '#0c4a6e',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          // ... 其他色阶
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.800'),
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'pre code': {
              backgroundColor: 'transparent',
              fontWeight: 'normal',
            },
            // 添加更多自定义样式...
            table: {
              borderCollapse: 'collapse',
              width: '100%',
            },
            'thead, tbody': {
              borderBottom: `2px solid ${theme('colors.gray.200')}`,
            },
            'th, td': {
              padding: theme('spacing.2'),
              borderRight: `1px solid ${theme('colors.gray.200')}`,
            },
            'th:last-child, td:last-child': {
              borderRight: 'none',
            },
            // 添加数学公式样式
            '.math': {
              overflow: 'auto',
            },
            '.math-display': {
              display: 'block',
              marginTop: theme('spacing.4'),
              marginBottom: theme('spacing.4'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
