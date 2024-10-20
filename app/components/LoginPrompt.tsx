import React from "react";

interface LoginPromptProps {
  title: string;
  message: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ title, message }) => {
  return (
    <div className="flex-grow flex items-center justify-center ml-60 mb-60">
      <div className="text-center p-8 bg-forest-sidebar rounded-lg shadow-lg w-1/3 h-40">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
      </div>
    </div>
  );
};

export default LoginPrompt;
