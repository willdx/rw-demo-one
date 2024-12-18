import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import ApolloWrapper from "./components/ApolloWrapper";
import { AuthProvider } from "./contexts/AuthContext";
import dynamic from "next/dynamic";
import { DocumentProvider } from './contexts/DocumentContext';

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

const DynamicToastProvider = dynamic(
  () => import("./contexts/ToastContext").then((mod) => mod.ToastProvider),
  {
    ssr: false,
  }
);

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
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ApolloWrapper>
              <DocumentProvider>
                <DynamicToastProvider>{children}</DynamicToastProvider>
              </DocumentProvider>
            </ApolloWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
