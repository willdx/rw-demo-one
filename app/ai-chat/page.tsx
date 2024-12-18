"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { AI_CHAT } from "../graphql/mutations";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Header from "../components/Header";
import LoginPrompt from "../components/LoginPrompt";

interface Message {
  type: "user" | "ai";
  content: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "ai",
      content: "Welcome to the 读写AI. You can ask questions related to documents which have been completely processed."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [aiChat, { loading }] = useMutation(AI_CHAT);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = { type: "user", content: inputMessage };
    setMessages([...messages, newMessage]);
    setInputMessage("");

    try {
      const { data } = await aiChat({ variables: { message: inputMessage } });
      const aiResponse: Message = {
        type: "ai",
        content: data.aiChat.data.message,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("AI聊天错误:", error);
      showToast("发送消息失败，请重试", "error");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-forest-bg text-forest-text">
        <Header />
        <LoginPrompt title="需要登录" message="请登录后使用AI功能。" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">AI 聊天</h1>
        <div className="flex-grow overflow-y-auto mb-4 bg-base-200 rounded-lg p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat ${
                message.type === "user" ? "chat-end" : "chat-start"
              }`}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                  {message.type === "user" ? (
                    <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center">
                      You
                    </div>
                  ) : (
                    <div className="bg-secondary text-white rounded-full w-10 h-10 flex items-center justify-center">
                      AI
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`chat-bubble ${
                  message.type === "user"
                    ? "chat-bubble-primary"
                    : "chat-bubble-secondary"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                  <div className="bg-secondary text-white rounded-full w-10 h-10 flex items-center justify-center">
                    AI
                  </div>
                </div>
              </div>
              <div className="chat-bubble chat-bubble-secondary">
                <span className="loading loading-dots loading-sm"></span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="input input-bordered flex-grow mr-2"
            placeholder="输入您的消息..."
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
