'use client';

import { useState } from 'react';
import { gql, useMutation } from "@apollo/client";

const SIGN_UP_MUTATION = gql`
  mutation SignUp($email: String!, $password: String!, $username: String!) {
    signUp(email: $email, password: $password, username: $username) {
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

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (token: string, user: User) => void;
}

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [signUp, { loading: signingUp, error: signUpError }] = useMutation(SIGN_UP_MUTATION);

  const validatePassword = (pwd: string) => {
    const lengthValid = pwd.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);

    if (!lengthValid) {
      return '密码长度至少为8个字符';
    }
    if (!hasLetter) {
      return '密码必须包含至少一个字母';
    }
    if (!hasNumber) {
      return '密码必须包含至少一个数字';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) ? '' : '请输入有效的邮箱地址';
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setPasswordError(error);
  };

  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setEmailError(error);
  };

  const handleConfirmPasswordBlur = () => {
    if (password !== confirmPassword) {
      setConfirmPasswordError('密码和确认密码不匹配');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordValidationError = validatePassword(password);
    const emailValidationError = validateEmail(email);
    const confirmPasswordValidationError = password !== confirmPassword ? '密码和确认密码不匹配' : '';

    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    if (confirmPasswordValidationError) {
      setConfirmPasswordError(confirmPasswordValidationError);
      return;
    }

    try {
      const { data } = await signUp({ 
        variables: { email, password, username } 
      });
      onRegisterSuccess(data.signUp.token, data.signUp.user);
      onClose();
    } catch (err) {
      console.error('注册失败:', err);
      alert('注册失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">注册</h3>
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
                setEmailError('');
              }}
              onBlur={handleEmailBlur}
              required
            />
            {emailError && <p className="text-red-500">{emailError}</p>}
          </div>
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">用户名</span>
            </label>
            <input
              type="text"
              placeholder="用户名"
              className="input input-bordered"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
                setPasswordError('');
              }}
              onBlur={handlePasswordBlur}
              required
            />
            {passwordError && <p className="text-red-500">{passwordError}</p>}
          </div>
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">确认密码</span>
            </label>
            <input
              type="password"
              placeholder="确认密码"
              className="input input-bordered"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError('');
              }}
              onBlur={handleConfirmPasswordBlur}
              required
            />
            {confirmPasswordError && <p className="text-red-500">{confirmPasswordError}</p>}
          </div>
          {signUpError && <p className="text-red-500 mt-2">{signUpError.message}</p>}
          <div className="modal-action">
            <button type="submit" className="btn btn-primary" disabled={signingUp}>
              {signingUp ? '注册中...' : '注册'}
            </button>
            <button type="button" className="btn" onClick={onClose}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}