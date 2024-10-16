import React from "react";
import Link from "next/link";

export interface SearchResult {
  id: string;
  fileName: string;
  content: string;
  matchedContent: string;
  updatedAt: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: Error | null;
  onResultClick: (result: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  error,
  onResultClick,
}) => {
  if (loading && results.length === 0)
    return <div className="loading loading-spinner loading-md"></div>;
  if (error) return <div className="text-error">搜索出错: {error.message}</div>;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "未知日期" : date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.id}
          className="p-4 bg-forest-bg border border-forest-border rounded-md hover:bg-forest-hover cursor-pointer"
          onClick={() => onResultClick(result)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold mb-2">{result.fileName}</h3>
              <p
                className="text-sm text-forest-text-light"
                dangerouslySetInnerHTML={{ __html: result.matchedContent }}
              />
              <p className="text-xs text-forest-text-light mt-2">
                最后更新: {formatDate(result.updatedAt)}
              </p>
            </div>
            <Link href={`/write/${result.id}`} passHref>
              <button
                className="btn btn-sm btn-outline"
                onClick={(e) => e.stopPropagation()} // 防止触发卡片的点击事件
              >
                打开
              </button>
            </Link>
          </div>
        </div>
      ))}
      {loading && (
        <div className="text-center">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
