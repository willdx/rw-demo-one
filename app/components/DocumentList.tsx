import React from "react";
import Link from "next/link";
import MarkdownRenderer from "./MarkdownRenderer";
import { Document } from "../types/document";

interface DocumentListProps {
  documents: Document[];
  onLoadMore: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onLoadMore,
  hasNextPage,
  isLoading,
}) => {
  if (isLoading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-1 gap-8 w-full max-w-3xl">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 shadow-md">
            <Link href={`/read/${doc.id}`}>
              <h2 className="text-xl font-bold mb-2">{doc.fileName}</h2>
              <MarkdownRenderer content={doc.content.substring(0, 200) + "..."} />
            </Link>
          </div>
        ))}
      </div>
      {hasNextPage && (
        <button
          onClick={onLoadMore}
          className="mt-8 p-2 rounded-full bg-accent text-white hover:bg-accent-focus transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          disabled={isLoading}
          aria-label="加载更多"
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg 
              className="h-6 w-6 animate-bounce" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default DocumentList;