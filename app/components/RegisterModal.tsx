'use client';

import { useState } from 'react';
import CaptchaInput from './CaptchaInput';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void; // 注册成功回调
}

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
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

    // 处理注册逻辑
    console.log('Register submitted', { email, password, confirmPassword, captcha });
    onRegisterSuccess(); // 调用注册成功回调
    onClose();
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
                setEmailError(''); // 清除错误提示
              }}
              onBlur={handleEmailBlur} // 失去焦点时验证
              required
            />
            {emailError && <p className="text-red-500">{emailError}</p>}
          </div>
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">验证码</span> {/* 添加验证码的label */}
            </label>
            <CaptchaInput /> {/* 添加验证码组件 */}
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
                setPasswordError(''); // 清除错误提示
              }}
              onBlur={handlePasswordBlur} // 失去焦点时验证
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
                setConfirmPasswordError(''); // 清除错误提示
              }}
              onBlur={handleConfirmPasswordBlur} // 失去焦点时验证
              required
            />
            {confirmPasswordError && <p className="text-red-500">{confirmPasswordError}</p>}
          </div>
          <div className="modal-action">
            <button type="submit" className="btn btn-primary">注册</button>
            <button type="button" className="btn" onClick={onClose}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}