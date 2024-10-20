"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { SEARCH_DOCUMENTS } from "../../graphql/queries";
import { UPDATE_PUBLISH_DOCUMENT_IS_PUBLISHED } from "../../graphql/mutations";
import ChapterTree from "../../components/ChapterTree";
import VditorEditor from "../../components/VditorEditor";
import { ReactFlowProvider } from "@xyflow/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import debounce from "lodash/debounce";
import { highlightSearchResult } from "../../utils/markdownUtils";
import SearchResults, { SearchResult } from "../../components/SearchResults";
import { useInView } from "react-intersection-observer";
import { useToast } from "../../contexts/ToastContext";
import { useDocumentContext } from "@/app/contexts/DocumentContext";
import ArticleTree from "../../components/ArticleTree";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function WritePage({ params }: { params: { id: string } }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { selectedNode, setSelectedNode } = useDocumentContext();

  // 搜索功能状态
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"node" | "markdown">("node");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const searchVariables = useMemo(
    () => ({
      searchTerm: searchQuery,
      first: 10,
      creatorId: user ? user.id : null,
    }),
    [searchQuery]
  );
  console.log("#searchVariables:", searchVariables);

  const {
    data: searchData,
    loading: searchLoading,
    error: searchError,
    fetchMore,
  } = useQuery(SEARCH_DOCUMENTS, {
    variables: searchVariables,
    skip: !searchQuery,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
  });

  const handleLoadMore = useCallback(() => {
    if (searchData?.documentsConnection?.pageInfo?.endCursor) {
      fetchMore({
        variables: {
          ...searchVariables,
          after: searchData.documentsConnection.pageInfo.endCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            documentsConnection: {
              ...fetchMoreResult.documentsConnection,
              edges: [
                ...prev.documentsConnection.edges,
                ...fetchMoreResult.documentsConnection.edges,
              ],
            },
          };
        },
      });
    }
  }, [searchData, fetchMore, searchVariables]);

  useEffect(() => {
    if (searchData && searchData.documentsConnection) {
      const processedResults = searchData.documentsConnection.edges.map(
        ({ node }: { node: any }) => ({
          ...node,
          matchedContent: highlightSearchResult(node.content, searchQuery),
          updatedAt: node.updatedAt,
        })
      );
      setSearchResults((prevResults) => {
        if (
          searchData.documentsConnection.pageInfo.startCursor ===
          searchData.documentsConnection.pageInfo.endCursor
        ) {
          return processedResults;
        }
        return [...prevResults, ...processedResults];
      });
      setHasMoreResults(searchData.documentsConnection.pageInfo.hasNextPage);
    }
  }, [searchData, searchQuery]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearchResults([]);
  }, []);

  const handleSearchResultClick = useCallback(
    (result: SearchResult) => {
      setSelectedNode(result);
    },
    [setSelectedNode]
  );

  const [updateDocumentIsPublished] = useMutation(
    UPDATE_PUBLISH_DOCUMENT_IS_PUBLISHED
  );

  const togglePanel = useCallback(() => setLeftCollapsed((prev) => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-2/5"}
    border-r border-forest-border relative overflow-hidden
  `;

  const updateDocumentIsPublishedWrapper = async () => {
    try {
      await updateDocumentIsPublished({
        variables: {
          id: selectedNode?.id,
          isPublished: selectedNode?.isPublished ? false : true,
        },
      });
      showToast("操作成功", "success");
    } catch (error) {
      console.error("操作失败:", error);
      showToast("操作失败，请重试。", "error");
    }
  };

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (inView && hasMoreResults && !searchLoading) {
      handleLoadMore();
    }
  }, [inView, hasMoreResults, searchLoading, handleLoadMore]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-row bg-forest-bg text-forest-text">
        <Sidebar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8 bg-forest-sidebar rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">需要登录</h2>
            <p className="mb-6">请登录后使用写作功能。</p>
            <a href="/login" className="btn btn-primary">
              前往登录
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: leftCollapsed ? "4rem" : "16rem" }}
      >
        <div className="flex-1 flex overflow-hidden">
          <div className={`${panelClass(leftCollapsed)} bg-forest-sidebar z-10`}>
            <div
              className={`w-full h-full flex flex-col ${
                leftCollapsed ? "invisible" : "visible"
              }`}
            >
              <div className="flex border-b border-forest-border h-14">
                {isSearchMode ? (
                  <form
                    onSubmit={handleSearch}
                    className="w-full flex items-center px-4"
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索文档..."
                      className="w-full px-3 py-2 bg-forest-bg text-forest-text border border-forest-border rounded focus:outline-none focus:ring-2 focus:ring-forest-accent"
                    />
                    <button
                      onClick={() => setIsSearchMode(false)}
                      className="ml-2 p-1 bg-forest-bg text-forest-text border border-forest-border rounded"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === "node"
                          ? "text-forest-accent border-b-2 border-forest-accent"
                          : "text-forest-text hover:text-forest-accent"
                      }`}
                      onClick={() => setActiveTab("node")}
                    >
                      <BookOpenIcon className="w-5 h-5 mr-2 inline-block" />
                      Article
                    </button>
                    <button
                      className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === "markdown"
                          ? "text-forest-accent border-b-2 border-forest-accent"
                          : "text-forest-text hover:text-forest-accent"
                      }`}
                      onClick={() => setActiveTab("markdown")}
                    >
                      <DocumentTextIcon className="w-5 h-5 mr-2 inline-block" />
                      Chapter
                    </button>
                    <button
                      className="ml-auto p-2 text-forest-text hover:text-forest-accent"
                      onClick={() => setIsSearchMode(true)}
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex-grow overflow-hidden p-2">
                {isSearchMode ? (
                  <div className="h-full overflow-y-auto">
                    <SearchResults
                      results={searchResults}
                      loading={searchLoading}
                      error={searchError as Error | null}
                      onResultClick={handleSearchResultClick}
                    />
                    {hasMoreResults && <div ref={ref} style={{ height: 1 }} />}
                  </div>
                ) : (
                  <ReactFlowProvider>
                    {activeTab === "node" ? (
                      <ArticleTree mode="write" />
                    ) : (
                      <ChapterTree />
                    )}
                  </ReactFlowProvider>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden bg-base-100 relative">
            <div className="flex-1 overflow-hidden">
              <VditorEditor />
            </div>
          </div>

          {/* 切换面板按钮 */}
          <button
            onClick={togglePanel}
            className="absolute left-0 top-1/2 -translate-y-1/2 mt-2 ml-2 p-2 bg-base-200 hover:bg-base-300 rounded-md transition-colors duration-200 z-30"
          >
            {leftCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>

          <div className="absolute right-4 bottom-4 z-20">
            <div
              className="tooltip"
              data-tip={selectedNode?.isPublished ? "取消发布" : "发布文档"}
            >
              <div
                className="cursor-pointer"
                onClick={() => {
                  updateDocumentIsPublishedWrapper();
                }}
              >
                {selectedNode?.isPublished ? (
                  <ArrowDownCircleIcon className="h-8 w-8 text-secondary" />
                ) : (
                  <ArrowUpCircleIcon className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
