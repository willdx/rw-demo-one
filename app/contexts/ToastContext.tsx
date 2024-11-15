"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const getToastColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-forest-accent";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-forest-accent";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast toast-bottom toast-end">
          <div
            className={`alert alert-success shadow-lg {toast.message} ${getToastColor(
              toast.type
            )}`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
