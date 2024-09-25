"use client";

import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";
interface UserMenuProps {
  onLogout: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const { user } = useAuth();

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
      <ul
        tabIndex={0}
        className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52 border border-base-300"
      >
        <li>
          <a className="justify-between">
            {user?.username}
            <span className="badge">New</span>
          </a>
        </li>
        <li>
          <a>设置</a>
        </li>
        <li>
          <a onClick={onLogout}>登出</a>
        </li>
      </ul>
    </div>
  );
}
