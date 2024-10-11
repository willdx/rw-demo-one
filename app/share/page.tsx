"use client";

import React from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import DocumentList from "../components/DocumentList";
import { useAuth } from "../contexts/AuthContext";
import { useDocuments } from "../hooks/useDocuments";
import Footer from "../components/Footer";

const SharePage: React.FC = () => {
  const { token } = useAuth();
  const {
    documents,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasNextPage,
    isLoading,
  } = useDocuments(token);

  const showToast = (message: string) => {
    // 实现显示 toast 的逻辑
    console.log(message);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header showToast={showToast} />
      <main className="flex-grow">
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8"></h1>
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <DocumentList
            documents={documents}
            onLoadMore={loadMore}
            hasNextPage={hasNextPage}
            isLoading={isLoading}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharePage;
