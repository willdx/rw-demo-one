"use client";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";
import { ToastProvider } from "./contexts/ToastContext";

export default function Home() {
  return (
    <ToastProvider>
      <main className="min-h-screen bg-base-100">
        <Header />
        <Hero />
        <Features />
        <Footer />
      </main>
    </ToastProvider>
  );
}
