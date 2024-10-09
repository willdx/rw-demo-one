"use client"; // 添加这一行

import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";
import { useState } from "react";
import Toast from "./components/Toast"; // 引入 Toast 组件

export default function Home() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000); // 3秒后自动消失
  };

  return (
    <main className="min-h-screen bg-base-100">
      <Header showToast={showToast} />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
