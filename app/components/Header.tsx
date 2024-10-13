"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import UserMenu from "./UserMenu";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      setIsAuthReady(true);
    }
  }, [isLoading]);

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    showToast("登录成功！", "success");
  };

  const handleRegisterSuccess = () => {
    setIsRegisterModalOpen(false);
    showToast("注册成功！", "success");
  };

  const handleLogout = () => {
    logout();
    showToast("已注销！", "success");
  };

  return (
    <header className="bg-base-100 shadow-[1px]">
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
          <Link href="/share" className="btn btn-ghost">
            知识库
          </Link>
          <div className="divider divider-horizontal" />
          {!isAuthReady ? (
            <div className="w-24 h-10 bg-base-200 animate-pulse rounded"></div>
          ) : user ? (
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
