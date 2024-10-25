import React, { useEffect, useState } from "react";
import Link from "next/link";
import MarkdownRenderer from "./MarkdownRenderer";
import { Document } from "../types/document";
import { ChevronDoubleDownIcon } from "@heroicons/react/24/outline";

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
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const placeholderHeight = "h-32"; // 固定高度

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setShowSkeleton(true);
      timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 200); // 设置最小加载时间为200毫秒
    } else {
      setShowSkeleton(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className="flex flex-col items-center">
      <div className={`grid grid-cols-1 gap-8 w-full max-w-3xl`}>
        {showSkeleton ? (
          <>
            {/* 使用骨架屏占位符 */}
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className={`animate-pulse border rounded-lg p-4 shadow-md ${placeholderHeight}`}
              >
                <div className="bg-gray-300 h-6 mb-2"></div> {/* 标题占位符 */}
                <div className="bg-gray-300 h-4"></div> {/* 内容占位符 */}
              </div>
            ))}
          </>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4 shadow-md">
              <Link href={`/read/${doc.id}`}>
                <h2 className="text-xl font-bold mb-2">{doc.fileName}</h2>
                <MarkdownRenderer
                  content={doc.content.substring(0, 200) + "..."}
                />
              </Link>
            </div>
          ))
        )}
      </div>
      {hasNextPage && (
        <button
          onClick={onLoadMore}
          className="mt-8 p-2 text-gray-600 hover:text-accent active:text-accent-focus transition-colors duration-300 focus:outline-none"
          disabled={isLoading}
          aria-label="加载更多"
        >
          <ChevronDoubleDownIcon
            className={`h-6 w-6 transform transition-transform duration-300 ease-in-out ${
              isLoading ? "animate-spin" : "hover:translate-y-1"
            }`}
          />
        </button>
      )}
    </div>
  );
};

export default DocumentList;
