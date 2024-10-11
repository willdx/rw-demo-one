import React from "react";
import Link from "next/link";
import MarkdownRenderer from "./MarkdownRenderer";
import { Document } from "../types/document";

interface DocumentListProps {
  documents: Document[];
  onLoadMore: () => void;
  hasNextPage: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onLoadMore,
  hasNextPage,
}) => {
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
          className="mt-8 bg-accent text-white rounded-md px-4 py-2 hover:bg-accent-focus transition-colors duration-300"
        >
          加载更多
        </button>
      )}
    </div>
  );
};

export default DocumentList;