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
  const [after, setAfter] = useState<string | null>(null); // 用于存储 endCursor
  const [limit] = useState(1); // 设置每页显示的文档数量为1
  const [hasNextPage, setHasNextPage] = useState(true); // 用于判断是否有下一页

  // 获取已发布文档
  const {
    data: publishedData,
    loading: loadingPublished,
    error: errorPublished,
  } = useQuery(GET_PUBLISHED_DOCUMENTS, {
    variables: { first: limit, after },
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
    variables: { searchTerm, first: limit, after },
    skip: !searchTerm || !token,
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
  });

  useEffect(() => {
    if (publishedData) {
      console.log("Published data received:", publishedData);
      const newDocuments = publishedData.documentsConnection.edges.map(
        (edge) => edge.node
      );
      if (
        newDocuments.length > 0 &&
        !documents.some((doc) =>
          newDocuments.some((newDoc) => newDoc.id === doc.id)
        )
      ) {
        setDocuments((prev) => [...prev, ...newDocuments]); // 追加方式更新文档列表
      }
      setLoading(false);
    }
  }, [publishedData]);

  useEffect(() => {
    if (searchData) {
      console.log("Search data received:", searchData);
      const newDocuments = searchData.documentsConnection.edges.map(
        (edge) => edge.node
      );
      if (
        newDocuments.length > 0 &&
        !documents.some((doc) =>
          newDocuments.some((newDoc) => newDoc.id === doc.id)
        )
      ) {
        setDocuments((prev) => [...prev, ...newDocuments]); // 追加方式更新文档列表
      }
      setLoading(false);
    }
  }, [searchData]);

  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 500),
    []
  );

  const handleLoadMore = () => {
    if (hasNextPage) {
      console.log("Loading more documents...");
      setHasNextPage(publishedData.documentsConnection.pageInfo.hasNextPage);
      setAfter(publishedData.documentsConnection.pageInfo.endCursor);
    } else {
      console.log("No more pages to load.");
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header showToast={showToast} />
      <div className="container mx-auto p-4 flex-grow">
        <div className="flex flex-col items-center mb-4 h-48 justify-center">
          <input
            type="text"
            placeholder="搜索文档..."
            className="border border-gray-300 rounded-md p-2 mb-4 w-1/3"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="container w-full h-full flex justify-center items-center">
          {loading ? (
            <div>
              <span className="loading loading-ring text-accent w-18 h-18"></span>
              <span className="loading loading-ring text-accent w-18 h-18"></span>
              <span className="loading loading-ring text-accent w-18 h-18"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 min-h-36">
              {documents.map((doc) => (
                <Link
                  key={`${doc.id}-${doc.fileName}`}
                  href={`/read/${doc.id}`}
                >
                  <div className="border p-4 rounded-lg hover:shadow-lg transition-shadow w-full h-full">
                    <h2 className="font-semibold text-lg">{doc.fileName}</h2>
                    <p>
                      {doc.content.length > 500
                        ? `${doc.content.substring(0, 500)}...`
                        : doc.content}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* 加载更多按钮 */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleLoadMore}
            className={`bg-blue-500 text-white rounded-md p-2 ${
              !hasNextPage ? "bg-gray-400 cursor-not-allowed" : ""
            }`}
            disabled={!hasNextPage} // 根据是否有下一页禁用按钮
          >
            {hasNextPage ? "加载更多" : "没有更多数据"}
          </button>
        </div>
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default SharePage;
