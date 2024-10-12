import React from "react";

interface SearchResult {
  id: string;
  fileName: string;
  content: string;
  matchedContent: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: any;
  onResultClick: (result: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, error, onResultClick }) => {
  if (loading) return <div>搜索中...</div>;
  if (error) return <div>搜索出错: {error.message}</div>;

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
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
