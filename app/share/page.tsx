"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { GET_PUBLISHED_DOCUMENTS, SEARCH_DOCUMENTS } from "../graphql/queries";
import Link from "next/link";
import Header from "../components/Header";
import Toast from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import debounce from "lodash/debounce";

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
        authorization: token ? `Bearer ${token}` : "",
      },
    },
    skip: !token,
  });

  // 搜索文档
  const {
    data: searchData,
    loading: loadingSearch,
    error: errorSearch,
  } = useQuery(SEARCH_DOCUMENTS, {
    variables: { searchTerm },
    skip: !searchTerm || !token,
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
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

  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 500),
    []
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header showToast={showToast} />
      <div className="container mx-auto p-4 flex-grow">
        <div className="flex flex-col items-center mb-4 h-48 justify-center ">
          <input
            type="text"
            placeholder="搜索文档..."
            className="input input-bordered w-1/3 mb-4"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 min-h-[300px]">
          {" "}
          {/* 设置最小高度 */}
          {loading ? (
            <p>加载中...</p>
          ) : (
            <>
              {loadingPublished && <p>加载中...</p>}
              {errorPublished && <p>发生错误: {errorPublished.message}</p>}
              {documents.map((doc) => (
                <Link key={doc.id} href={`/read/${doc.id}`}>
                  <div className="border p-4 rounded-lg hover:shadow-lg transition-shadow w-full h-full">
                    {" "}
                    {/* 设置宽度为100% */}
                    <h2 className="font-semibold text-lg">{doc.fileName}</h2>
                    <p>
                      {doc.content.length > 500
                        ? `${doc.content.substring(0, 500)}...`
                        : doc.content}
                    </p>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default SharePage;
