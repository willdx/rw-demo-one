"use client";

import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

interface UserMenuProps {
  onLogout: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const { user, rootId } = useAuth();

  return (
    <div className="dropdown dropdown-end">
      <label
        tabIndex={0}
        className="btn btn-ghost btn-circle avatar border-2 border-primary hover:border-secondary transition-colors duration-300"
      >
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
      <ul
        tabIndex={0}
        className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52 border border-base-300"
      >
        <li className="menu-title">
          <span>{user?.username}</span>
        </li>
        <li>
          {rootId ? (
            <Link href={`/write/${rootId}`}>写作</Link>
          ) : (
            <span className="text-gray-400">写作</span>
          )}
        </li>
        <li>
          <Link href="/ai-chat">智能问答</Link>
        </li>
        <li>
          <a onClick={onLogout}>登出</a>
        </li>
      </ul>
    </div>
  );
}
