import React, { useCallback } from "react";
import debounce from "lodash/debounce";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onSearchChange(value);
    }, 800),
    [onSearchChange]
  );

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 px-4">
      <div className="relative">
        <input
          type="text"
          placeholder="搜索文档..."
          className="w-full py-4 px-6 text-lg border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-300 ease-in-out"
          defaultValue={searchTerm}
          onChange={(e) => debouncedOnChange(e.target.value)}
        />
        <svg
          className="absolute right-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
