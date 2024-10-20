import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          bg: "#f8f9fa",
          sidebar: "#f1f3f5",
          content: "#ffffff",
          text: "#333333",
          link: "#0366d6",
          accent: "#28a745",
          border: "#e1e4e8",
          "code-bg": "#f6f8fa",
          code: "#24292e",
          'border-dark': '#d1d5db',
        },
        'forest-bg': '#f0f4f8',
        'forest-sidebar': '#ffffff',
        'forest-border': '#e2e8f0',
        'forest-text': '#2d3748',
        'forest-hover': '#edf2f7',
        'forest-active': '#e2e8f0',
        'forest-accent': '#48bb78',
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        forest: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      typography: (theme) => ({
        forest: {
          css: {
            "--tw-prose-body": theme("colors.forest.text"),
            "--tw-prose-headings": theme("colors.forest.text"),
            "--tw-prose-lead": theme("colors.forest.text"),
            "--tw-prose-links": theme("colors.forest.link"),
            "--tw-prose-bold": theme("colors.forest.text"),
            "--tw-prose-counters": theme("colors.forest.text"),
            "--tw-prose-bullets": theme("colors.forest.accent"),
            "--tw-prose-hr": theme("colors.forest.border"),
            "--tw-prose-quotes": theme("colors.forest.text"),
            "--tw-prose-quote-borders": theme("colors.forest.accent"),
            "--tw-prose-captions": theme("colors.forest.text"),
            "--tw-prose-code": theme("colors.forest.code"),
            "--tw-prose-pre-code": theme("colors.forest.code"),
            "--tw-prose-pre-bg": theme("colors.forest.code-bg"),
            "--tw-prose-th-borders": theme("colors.forest.border"),
            "--tw-prose-td-borders": theme("colors.forest.border"),

            "font-family": theme("fontFamily.forest").join(", "),
            "font-size": "16px",
            "line-height": "1.6",

            "h1, h2, h3, h4, h5, h6": {
              "font-weight": "600",
              "margin-top": "24px",
              "margin-bottom": "16px",
              "line-height": "1.25",
            },
            h1: {
              "font-size": "2em",
              "padding-bottom": "0.3em",
              "border-bottom": `1px solid ${theme("colors.forest.border")}`,
            },
            h2: {
              "font-size": "1.5em",
              "padding-bottom": "0.3em",
              "border-bottom": `1px solid ${theme("colors.forest.border")}`,
            },
            h3: { "font-size": "1.25em" },
            h4: { "font-size": "1em" },
            h5: { "font-size": "0.875em" },
            h6: { "font-size": "0.85em" },

            a: {
              color: theme("colors.forest.link"),
              "text-decoration": "none",
              "&:hover": {
                "text-decoration": "underline",
              },
            },

            pre: {
              "background-color": theme("colors.forest.code-bg"),
              "border-radius": "6px",
              padding: "16px",
              "overflow-x": "auto",
            },

            code: {
              "background-color": theme("colors.forest.code-bg"),
              "border-radius": "3px",
              padding: "0.2em 0.4em",
              "font-size": "85%",
            },

            blockquote: {
              "border-left": `4px solid ${theme("colors.forest.accent")}`,
              "padding-left": "1em",
              color: theme("colors.forest.text"),
              "font-style": "italic",
            },

            "ul, ol": {
              "padding-left": "2em",
            },

            table: {
              "border-collapse": "collapse",
              width: "100%",
              "margin-top": "1em",
              "margin-bottom": "1em",
            },
            thead: {
              "background-color": theme("colors.forest.bg"),
            },
            "th, td": {
              border: `1px solid ${theme("colors.forest.border")}`,
              padding: "6px 13px",
            },
            th: {
              "font-weight": "600",
            },
          },
        },
        DEFAULT: {
          css: {
            h1: {
              "border-bottom": "none", // 去掉一级标题下的线
            },
            h2: {
              "border-bottom": "none", // 去掉二级标题下的线
            },
            // 其他标题样式保持不变
          },
        },
      }),
      width: {
        '16': '4rem',
        '64': '16rem',
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        forest: {
          primary: "#42b983",
          secondary: "#2c3e50",
          accent: "#42b983",
          neutral: "#333333",
          "base-100": "#f3f2ee",
          "base-200": "#ebeae6",
          "base-300": "#e0e0e0",
          info: "#3498db",
          success: "#42b983",
          warning: "#f1c40f",
          error: "#e74c3c",
        },
      },
    ],
  },
};

export default config;
