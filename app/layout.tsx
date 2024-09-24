import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import ApolloWrapper from "./components/ApolloWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Read and write",
  description: "基于思维导图和Markdown结合的笔记网站",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="forest">
      <head>
        <link rel="icon" href="/icons/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-forest-bg`}
      >
        <ThemeProvider>
          <ApolloWrapper>{children}</ApolloWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
