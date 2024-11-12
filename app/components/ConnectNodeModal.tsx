import React, { useState, useCallback } from "react";
import { useQuery } from "@apollo/client";
import { SEARCH_REUSABLE_DOCUMENTS } from "../graphql/queries";
import SearchResults from "./SearchResults";
import { debounce } from "lodash";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

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

  const { data, loading, error } = useQuery(SEARCH_REUSABLE_DOCUMENTS, {
    variables: {
      searchTerm: searchQuery,
      page: 1,
      limit: 10,
    },
    skip: !searchQuery,
  });

  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 600),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSetSearchQuery(value);
  };

  const renderSearchResults = () => {
    if (loading)
      return <div className="loading loading-spinner loading-md"></div>;
    if (error)
      return <div className="text-error">搜索出错: {error.message}</div>;
    if (!data?.searchDocuments?.documents?.length)
      return <div className="text-gray-500">无搜索结果</div>;

    return data.searchDocuments.documents.map((doc: any) => (
      <div key={doc.id} className="card bg-base-200 shadow-sm mb-2">
        <div className="card-body p-4">
          <h3 className="card-title text-base">{doc.fileName}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{doc.content}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              更新于:{" "}
              {formatDistanceToNow(new Date(doc.updatedAt), {
                locale: zhCN,
                addSuffix: true,
              })}
            </span>
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
        <h3 className="font-bold text-lg">连接已有节点</h3>
        <div className="py-4">
          <input
            type="text"
            onChange={handleInputChange}
            placeholder="搜索节点..."
            className="input input-bordered w-full"
          />
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
