'use client';

import { useState, useEffect } from 'react';

export default function CaptchaInput() {
  const [captcha, setCaptcha] = useState('');
  const [isCounting, setIsCounting] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const handleSendCaptcha = () => {
    // 这里可以调用后端接口发送验证码
    console.log('发送验证码到用户邮箱');
    setIsCounting(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsCounting(false);
            return 60; // 重置倒计时
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCounting]);

  return (
    <div className="flex items-center mt-4">
      <input
        type="text"
        placeholder="输入验证码"
        className="input input-bordered flex-1"
        value={captcha}
        onChange={(e) => setCaptcha(e.target.value)}
        required
      />
      <button
        className={`btn ${isCounting ? 'btn-disabled' : 'btn-primary'} ml-2`}
        onClick={handleSendCaptcha}
        disabled={isCounting}
      >
        {isCounting ? `${countdown}秒后重发` : '发送验证码'}
      </button>
    </div>
  );
}