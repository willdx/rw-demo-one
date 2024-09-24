'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function UserMenu({ onLogout }: { onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle avatar border-2 border-primary hover:border-secondary transition-colors duration-300">
        <div className="w-10 rounded-full">
          <Image
            src="/logo.png"
            alt="User Avatar"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
      </label>
      <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52 border border-base-300">
        <li>
          <a className="justify-between hover:bg-base-200">
            我的个人资料
            <span className="badge badge-primary badge-sm">New</span>
          </a>
        </li>
        <li><a className="hover:bg-base-200">开始写作</a></li>
        <li><a className="hover:bg-base-200">个人中心</a></li>
        <div className="divider my-0"></div>
        <li><a onClick={onLogout} className="hover:bg-base-200">注销</a></li> {/* 移除强烈的红色样式 */}
      </ul>
    </div>
  );
}