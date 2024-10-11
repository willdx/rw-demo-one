import React from "react";
import Link from "next/link";
import MarkdownRenderer from "./MarkdownRenderer";
import { Document } from "../types/document";
import { ChevronDoubleDownIcon } from '@heroicons/react/24/outline';

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
          className="mt-8 p-2 text-gray-600 hover:text-accent active:text-accent-focus transition-colors duration-300 focus:outline-none"
          disabled={isLoading}
          aria-label="加载更多"
        >
          <ChevronDoubleDownIcon className={`h-6 w-6 transform transition-transform duration-300 ease-in-out ${isLoading ? 'animate-spin' : 'hover:translate-y-1'}`} />
        </button>
      )}
    </div>
  );
};

export default DocumentList;