"use client"; // 添加这一行

import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";
import { useState } from "react"; // 确保引入useState

export default function Home() {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 3000); // 3秒后自动消失
  };

  return (
    <main className="min-h-screen bg-base-100">
      <Header showAlert={showAlert} />
      {alertMessage && (
        <div className="toast toast-bottom toast-end"> {/* 调整Toast位置为右下角 */}
          <div className="alert alert-success shadow-lg">
            <div>
              <span>{alertMessage}</span>
            </div>
          </div>
        </div>
      )}
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
