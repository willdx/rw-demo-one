"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import UserMenu from "./UserMenu";

export default function Header({ showAlert }: { showAlert: (message: string) => void }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    showAlert('登录成功！');
  };

  const handleRegisterSuccess = () => {
    setIsLoggedIn(true);
    setIsRegisterModalOpen(false);
    showAlert('注册成功！');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    showAlert('已注销！');
  };

  return (
    <header className="bg-base-100 shadow-lg">
      <div className="navbar container mx-auto">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost normal-case text-xl">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="mr-2"
            />
            读写
          </Link>
        </div>
        <div className="navbar-end">
          <Link href="/library" className="btn btn-ghost">
            知识库
          </Link>
          <div className="divider divider-horizontal" />
          {isLoggedIn ? (
            <UserMenu onLogout={handleLogout} />
          ) : (
            <div className="flex items-center space-x-4">
              <button
                className="btn btn-ghost"
                onClick={() => setIsLoginModalOpen(true)}
              >
                登录
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setIsRegisterModalOpen(true)}
              >
                注册
              </button>
            </div>
          )}
        </div>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </header>
  );
}
