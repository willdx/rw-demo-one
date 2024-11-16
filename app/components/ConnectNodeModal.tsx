import React, { useState, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { SEARCH_REUSABLE_DOCUMENTS } from "../graphql/queries";
import { debounce } from "lodash";
import Link from "next/link";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

// 提取语法帮助内容为常量
const SEARCH_SYNTAX_EXAMPLES = [
  { label: "单个词", example: "python" },
  { label: "多个词", example: "python AND 性能" },
  { label: "任意词", example: "python OR java" },
  { label: "精确短语", example: '"python 教程"' },
  { label: "排除词", example: "python NOT javascript" },
];

// 提取语法帮助组件
const SearchSyntaxHelp: React.FC = () => (
  <div className="mt-2 p-3 bg-base-200 rounded-lg text-sm">
    <p className="font-medium mb-2">搜索语法示例：</p>
    <ul className="space-y-1 text-sm text-gray-600">
      {SEARCH_SYNTAX_EXAMPLES.map(({ label, example }) => (
        <li key={label}>
          • {label}：{example}
        </li>
      ))}
    </ul>
  </div>
);

interface ConnectNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (nodeId: string) => void;
  mode?: "read" | "write";
}

const ConnectNodeModal: React.FC<ConnectNodeModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  mode = "write",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);
  const [hasError, setHasError] = useState(false);

  const {
    data,
    loading,
    error: queryError,
  } = useQuery(SEARCH_REUSABLE_DOCUMENTS, {
    variables: {
      searchTerm: searchQuery,
      page: 1,
      limit: 10,
    },
    skip: !searchQuery,
    onError: (error) => {
      console.error("搜索出错:", error);
      setHasError(true);
    },
  });

  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      setHasError(false);
    }, 600),
    []
  );

  const renderSearchResults = () => {
    if (loading)
      return <div className="loading loading-spinner loading-md"></div>;
    if (queryError) return <div className="text-error">请检查搜索语法</div>;
    if (!data?.searchReusableDocuments?.documents?.length)
      return <div className="text-gray-500">无搜索结果</div>;

    return data.searchReusableDocuments.documents.map((doc: any) => (
      <div key={doc.id} className="card bg-base-200 shadow-sm mb-2">
        <div className="card-body p-4">
          <h3 className="card-title text-base">{doc.fileName}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{doc.content}</p>
          <div className="flex justify-between items-center mt-2">
            <div className="card-actions justify-end">
              <Link
                href={`/${mode}/${doc.id}`}
                target="_blank"
                className="btn btn-xs btn-ghost"
              >
                打开
              </Link>
              <button
                className="btn btn-xs btn-primary"
                onClick={() => onConnect(doc.id)}
              >
                连接
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="relative">
          <input
            type="text"
            onChange={(e) => debouncedSetSearchQuery(e.target.value)}
            placeholder="搜索可重用的卡片..."
            className="input input-bordered w-full"
          />
          <button
            className="btn btn-circle btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowSyntaxHelp(!showSyntaxHelp)}
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
          </button>
        </div>

        {/* 显示语法帮助 */}
        {(showSyntaxHelp || hasError) && <SearchSyntaxHelp />}

        <div className="py-4">
          <div className="mt-4 max-h-96 overflow-y-auto">
            {renderSearchResults()}
          </div>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectNodeModal;
