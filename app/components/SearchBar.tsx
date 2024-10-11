import React, { useCallback } from "react";
import debounce from "lodash/debounce";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange }) => {
  // 使用 useCallback 来记忆化 debounced 函数
  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onSearchChange(value);
    }, 800),
    [onSearchChange]
  );

  return (
    <div className="flex justify-center mb-8">
      <input
        type="text"
        placeholder="搜索文档..."
        className="border border-gray-300 rounded-md p-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        defaultValue={searchTerm}
        onChange={(e) => debouncedOnChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;