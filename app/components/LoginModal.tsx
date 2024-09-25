"use client";

import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useAuth } from '../contexts/AuthContext';

const SIGN_IN_MUTATION = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      user {
        id
        username
        email
      }
    }
  }
`;

interface User {
  id: string;
  username: string;
  email: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: User) => void;
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

  const [signIn, { loading, error }] = useMutation(SIGN_IN_MUTATION);

  const { login } = useAuth();

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

    try {
      const { data } = await signIn({ variables: { email, password } });
      login(data.signIn.token, data.signIn.user);
      onLoginSuccess(data.signIn.token, data.signIn.user);
      onClose();
    } catch (err) {
      console.error("登录失败:", err);
      alert("登录失败: " + (err instanceof Error ? err.message : "未知错误"));
    }
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
                setEmailError("");
              }}
              onBlur={handleEmailBlur}
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
                setPasswordError("");
              }}
              onBlur={handlePasswordBlur}
              required
            />
            {passwordError && <p className="text-red-500">{passwordError}</p>}
          </div>
          {error && <p className="text-red-500 mt-2">{error.message}</p>}
          <div className="modal-action">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "登录中..." : "登录"}
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
