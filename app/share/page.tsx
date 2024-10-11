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
  const { documents, searchTerm, setSearchTerm, loadMore, hasNextPage } =
    useDocuments(token);

  const showToast = (message: string) => {
    // 实现显示 toast 的逻辑
    console.log(message);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header showToast={showToast} />
      <main className="container mx-auto p-4 flex-grow">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <DocumentList
          documents={documents}
          onLoadMore={loadMore}
          hasNextPage={hasNextPage}
        />
      </main>
      <Footer />
    </div>
  );
};

export default SharePage;
