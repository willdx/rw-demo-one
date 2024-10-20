"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HomeIcon,
  BookOpenIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  UserIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, login } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { rootId } = useAuth();
  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: { collapsed: newCollapsedState },
      })
    );
  };

  const navItems = [
    { href: "/", icon: HomeIcon, label: "首页" },
    { href: `/share`, icon: BookOpenIcon, label: "阅读" },
    // 写作和智能问答功能都需要在登录的情况下才能打开 所以这里做一个判断如果当前user为假那么后两条写作和智能问答的数据就不要写入 navItems中
    ...(user
      ? [
          { href: `/write/${rootId}`, icon: PencilIcon, label: "写作" },
          {
            href: "/ai-chat",
            icon: ChatBubbleLeftRightIcon,
            label: "智能问答",
          },
        ]
      : []),
  ];

  const handleLogout = () => {
    logout();
  };

  const handleLoginSuccess = (token: string, user: any) => {
    login(token, user);
    setIsLoginModalOpen(false);
  };

  const handleRegisterSuccess = (token: string, user: any) => {
    login(token, user);
    setIsRegisterModalOpen(false);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-forest-sidebar text-forest-text transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        } flex flex-col justify-between border-r border-forest-border-dark`}
      >
        <div>
          <div className="p-4 flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
              {!collapsed && <span className="text-xl font-bold">读写</span>}
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-forest-hover"
            >
              {collapsed ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          <nav>
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-4 hover:bg-forest-hover ${
                      collapsed ? "justify-center" : ""
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    {!collapsed && <span className="ml-4">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="p-4">
          {user ? (
            <div className="flex flex-col items-center justify-center">
              <div
                className={`flex items-center w-full h-full p-4 hover:bg-forest-hover ${
                  collapsed ? "flex-col" : "justify-center"
                }`}
                onClick={handleLogout}
              >
                <UserMinusIcon className="w-6 h-6" />
                {!collapsed && (
                  <div className="flex items-center space-x-2">
                    <span className="ml-4">注销</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div
                className={`flex items-center w-full h-full p-4 hover:bg-forest-hover ${
                  collapsed ? "flex-col" : "justify-center"
                }`}
                onClick={() => setIsLoginModalOpen(true)}
              >
                <UserCircleIcon className="w-6 h-6" />
                {!collapsed && (
                  <div className="flex items-center space-x-2">
                    <span className="ml-4">登录</span>
                  </div>
                )}
              </div>

              <div
                className={`flex items-center w-full h-full p-4 hover:bg-forest-hover ${
                  collapsed ? "flex-col" : "justify-center"
                }`}
                onClick={() => setIsRegisterModalOpen(true)}
              >
                <UserIcon className="w-6 h-6" />
                {!collapsed && (
                  <div className="flex items-center space-x-2">
                    <span className="ml-4">注册</span>
                  </div>
                )}
              </div>
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
    </>
  );
};

export default Sidebar;
