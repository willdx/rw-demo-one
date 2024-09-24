"use client";

import { useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void; // 登录成功回调
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) ? "" : "请输入有效的邮箱地址";
  };

  const validatePassword = (pwd: string) => {
    return pwd.length < 8 ? "密码长度至少为8个字符" : "";
  };

  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setEmailError(error);
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setPasswordError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // 模拟调用后端接口
    const response = await mockLogin(email, password);
    if (response.success) {
      onLoginSuccess(); // 调用登录成功回调
    } else {
      alert("登录失败：" + response.message); // 使用 DaisyUI 的 alert 组件
    }
    onClose();
  };

  const mockLogin = async (email: string, password: string) => {
    // 模拟后端登录逻辑
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => {
        if (email === "test@example.com" && password === "password123") {
          resolve({ success: true, message: "" });
        } else {
          resolve({ success: false, message: "邮箱或密码错误" });
        }
      }, 1000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">登录</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">邮箱</span>
            </label>
            <input
              type="email"
              placeholder="邮箱"
              className="input input-bordered"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(""); // 清除错误提示
              }}
              onBlur={handleEmailBlur} // 失去焦点时验证
              required
            />
            {emailError && <p className="text-red-500">{emailError}</p>}
          </div>
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">密码</span>
            </label>
            <input
              type="password"
              placeholder="密码"
              className="input input-bordered"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(""); // 清除错误提示
              }}
              onBlur={handlePasswordBlur} // 失去焦点时验证
              required
            />
            {passwordError && <p className="text-red-500">{passwordError}</p>}
          </div>
          <div className="modal-action">
            <button type="submit" className="btn btn-primary">
              登录
            </button>
            <button type="button" className="btn" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
