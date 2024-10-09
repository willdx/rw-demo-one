import React from "react";

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="toast toast-bottom toast-end">
      <div className="alert alert-success shadow-lg">
        <div>
          <span>{message}</span>
        </div>
        <button className="btn btn-sm btn-circle" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;