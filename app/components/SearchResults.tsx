import React from "react";

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
  onResultClick
}) => {
  if (loading && results.length === 0) return <div className="loading loading-spinner loading-md"></div>;
  if (error) return <div className="text-error">搜索出错: {error.message}</div>;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '未知日期' : date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.id}
          className="p-4 bg-forest-bg border border-forest-border rounded-md cursor-pointer hover:bg-forest-hover"
          onClick={() => onResultClick(result)}
        >
          <h3 className="text-lg font-semibold mb-2">{result.fileName}</h3>
          <p 
            className="text-sm text-forest-text-light"
            dangerouslySetInnerHTML={{ __html: result.matchedContent }}
          />
          <p className="text-xs text-forest-text-light mt-2">
            最后更新: {formatDate(result.updatedAt)}
          </p>
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
