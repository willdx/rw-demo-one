"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { GET_PUBLISHED_DOCUMENTS, SEARCH_DOCUMENTS } from "../graphql/queries";
import Link from "next/link";
import Header from "../components/Header";
import Toast from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import debounce from "lodash/debounce";
import MarkdownRenderer from "../components/MarkdownRenderer";

const SharePage = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState([]);
  const [after, setAfter] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const limit = 1;

  const { loading, data, fetchMore } = useQuery(GET_PUBLISHED_DOCUMENTS, {
    variables: { first: limit, after: null },
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
    skip: !token,
    notifyOnNetworkStatusChange: true,
  });

  const { data: searchData, loading: searchLoading } = useQuery(
    SEARCH_DOCUMENTS,
    {
      variables: { searchTerm, first: limit, after: null },
      skip: !searchTerm || !token,
      context: {
        headers: {
          authorization: token ? `Bearer ${token}` : "",
        },
      },
    }
  );

  useEffect(() => {
    if (data?.documentsConnection) {
      setDocuments(data.documentsConnection.edges.map((edge) => edge.node));
      setHasNextPage(data.documentsConnection.pageInfo.hasNextPage);
      setAfter(data.documentsConnection.pageInfo.endCursor);
    }
  }, [data]);

  useEffect(() => {
    if (searchData?.documentsConnection) {
      setDocuments(
        searchData.documentsConnection.edges.map((edge) => edge.node)
      );
      setHasNextPage(searchData.documentsConnection.pageInfo.hasNextPage);
      setAfter(searchData.documentsConnection.pageInfo.endCursor);
    }
  }, [searchData]);

  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 500),
    []
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      fetchMore({
        variables: {
          after,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            documentsConnection: {
              ...fetchMoreResult.documentsConnection,
              edges: [
                ...prev.documentsConnection.edges,
                ...fetchMoreResult.documentsConnection.edges,
              ],
            },
          };
        },
      });
    }
  }, [fetchMore, after, hasNextPage]);

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
            className="border border-gray-300 rounded-md p-2 mb-4 w-1/3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="container w-full h-full flex justify-center items-center">
          {loading || searchLoading ? (
            <div>
              <span className="loading loading-ring text-accent w-18 h-18"></span>
              <span className="loading loading-ring text-accent w-18 h-18"></span>
              <span className="loading loading-ring text-accent w-18 h-18"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 w-full h-full gap-8">
              {documents.map((doc) => (
                <div key={`${doc.id}-${doc.fileName}`}>
                  <Link href={`/read/${doc.id}`}>
                    <MarkdownRenderer content={doc.content} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        {hasNextPage && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleLoadMore}
              className="bg-accent text-white rounded-md p-2 hover:bg-accent-focus transition-colors duration-300"
              disabled={loading || searchLoading}
            >
              {loading || searchLoading ? "加载中..." : "加载更多"}
            </button>
          </div>
        )}
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default SharePage;
