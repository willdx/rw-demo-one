"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_PUBLISHED_DOCUMENTS, SEARCH_DOCUMENTS } from "../graphql/queries";
import Link from "next/link";
import Header from "../components/Header";
import Toast from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";

const SharePage = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取已发布文档
  const {
    data: publishedData,
    loading: loadingPublished,
    error: errorPublished,
  } = useQuery(GET_PUBLISHED_DOCUMENTS, {
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "", // 添加认证头
      },
    },
    skip: !token, // 如果没有 token 则跳过查询
  });

  // 搜索文档
  const {
    data: searchData,
    loading: loadingSearch,
    error: errorSearch,
  } = useQuery(SEARCH_DOCUMENTS, {
    variables: { searchTerm },
    skip: !searchTerm || !token, // 如果没有搜索词或 token 则跳过查询
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "", // 添加认证头
      },
    },
  });

  useEffect(() => {
    if (publishedData) {
      setDocuments(publishedData.documents);
      setLoading(false); // 数据加载完成
    }
  }, [publishedData]);

  useEffect(() => {
    if (searchData) {
      setDocuments(searchData.documents);
      setLoading(false); // 数据加载完成
    }
  }, [searchData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header showToast={showToast} />
      <div className="p-4">
        <input
          type="text"
          placeholder="搜索文档..."
          className="input input-bordered w-full mb-4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {loading ? ( // 显示加载状态
          <p>加载中...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingPublished && <p>加载中...</p>}
            {errorPublished && <p>发生错误: {errorPublished.message}</p>}
            {documents.map((doc) => (
              <Link key={doc.id} href={`/read/${doc.id}`}>
                <div className="border p-4 rounded-lg hover:shadow-lg transition-shadow">
                  <h2 className="font-semibold text-lg">{doc.fileName}</h2>
                  <p>
                    {doc.content.length > 100
                      ? `${doc.content.substring(0, 100)}...`
                      : doc.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default SharePage;
