"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  HomeIcon,
  BookOpenIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, rootId } = useAuth();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast("已注销！", "success");
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className={`fixed left-0 top-0 h-full bg-base-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} border-r border-base-300`}>
      <button 
        className="absolute -right-3 top-4 bg-base-200 p-1 rounded-full"
        onClick={toggleSidebar}
      >
        {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
      </button>

      <div className="p-4">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          {!isCollapsed && <span className="text-xl font-bold">读写</span>}
        </Link>
      </div>

      <ul className="menu p-4 w-full">
        <li>
          <Link href="/" className="flex items-center space-x-2 py-2">
            <HomeIcon className="w-6 h-6" />
            {!isCollapsed && <span>主页</span>}
          </Link>
        </li>
        <li>
          <Link href="/share" className="flex items-center space-x-2 py-2">
            <BookOpenIcon className="w-6 h-6" />
            {!isCollapsed && <span>知识库</span>}
          </Link>
        </li>
        <li>
          <Link href={rootId ? `/write/${rootId}` : '#'} className={`flex items-center space-x-2 py-2 ${!rootId && 'pointer-events-none opacity-50'}`}>
            <PencilIcon className="w-6 h-6" />
            {!isCollapsed && <span>写作</span>}
          </Link>
        </li>
        <li>
          <Link href="/ai-chat" className="flex items-center space-x-2 py-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {!isCollapsed && <span>智能问答</span>}
          </Link>
        </li>
      </ul>

      <div className="absolute bottom-0 left-0 w-full p-4">
        {user ? (
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
            {!isCollapsed && (
              <button onClick={handleLogout} className="flex items-center space-x-2 text-error">
                <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                <span>注销</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="#" onClick={() => {/* 打开登录框 */}} className="btn btn-sm btn-outline w-full">
              <UserCircleIcon className="w-5 h-5 mr-2" />
              {!isCollapsed && "登录"}
            </Link>
            <Link href="#" onClick={() => {/* 打开注册框 */}} className="btn btn-sm btn-primary w-full">
              <UserCircleIcon className="w-5 h-5 mr-2" />
              {!isCollapsed && "注册"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
