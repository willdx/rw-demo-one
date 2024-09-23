"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";
import FlowChart from "../../components/NodeTree";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

const MarkdownTree = dynamic(() => import("../../components/MarkdownTree"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-forest-bg">
      <span className="loading loading-dots loading-lg text-forest-accent"></span>
    </div>
  ),
});

const ReadPage = ({ params }: { params: { id: string } }) => {
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [markdownTreeContent, setMarkdownTreeContent] = useState<string>("");
  const [selectedMarkdownContent, setSelectedMarkdownContent] =
    useState<string>("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"node" | "markdown">("node");

  const togglePanel = useCallback(() => setLeftCollapsed((prev) => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-2/5"}
    border-r border-forest-border relative overflow-hidden
  `;

  const handleNodeTreeSelect = useCallback((content: string) => {
    setSelectedContent(content);
    setMarkdownTreeContent(content);
    // 当选择节点树中的节点时，重置 Markdown 树的选中内容
    setSelectedMarkdownContent("");
  }, []);

  const handleMarkdownTreeSelect = useCallback((content: string) => {
    setSelectedMarkdownContent(content);
  }, []);

  const handleTabClick = useCallback(
    (tab: "node" | "markdown") => {
      setActiveTab(tab);
      if (tab === "markdown" && !selectedMarkdownContent) {
        setSelectedMarkdownContent(selectedContent);
      }
    },
    [selectedContent, selectedMarkdownContent]
  );

  useEffect(() => {
    if (activeTab === "node") {
      setSelectedMarkdownContent("");
    }
  }, [activeTab]);

  const displayContent =
    activeTab === "node" ? selectedContent : selectedMarkdownContent;

  return (
    <div className="h-screen flex relative overflow-hidden bg-forest-bg text-forest-text">
      <div className={`${panelClass(leftCollapsed)} bg-forest-sidebar`}>
        <div
          className={`w-full h-full flex flex-col ${
            leftCollapsed ? "invisible" : "visible"
          }`}
        >
          <div className="flex border-b border-forest-border">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === "node"
                  ? "text-forest-accent border-b-2 border-forest-accent"
                  : "text-forest-text hover:text-forest-accent"
              }`}
              onClick={() => handleTabClick("node")}
            >
              <DocumentChartBarIcon className="w-5 h-5 mr-2 inline-block" />
              节点树
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === "markdown"
                  ? "text-forest-accent border-b-2 border-forest-accent"
                  : "text-forest-text hover:text-forest-accent"
              }`}
              onClick={() => handleTabClick("markdown")}
            >
              <DocumentTextIcon className="w-5 h-5 mr-2 inline-block" />
              内容树
            </button>
          </div>
          <div className="flex-grow overflow-hidden p-2">
            <ReactFlowProvider>
              {activeTab === "node" && (
                <FlowChart
                  onNodeClick={handleNodeTreeSelect}
                  documentId={params.id}
                  selectedContent={selectedContent}
                />
              )}
              {activeTab === "markdown" && markdownTreeContent && (
                <MarkdownTree
                  content={markdownTreeContent}
                  onNodeClick={handleMarkdownTreeSelect}
                  selectedContent={selectedMarkdownContent}
                />
              )}
            </ReactFlowProvider>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-forest-content">
        <div className="flex-grow overflow-auto px-8 py-6">
          {displayContent ? (
            <MarkdownRenderer content={displayContent} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-forest-text opacity-50 italic text-center">
                请点击左侧思维导图的节点以查看内容
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={togglePanel}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-forest-sidebar hover:bg-forest-border rounded-r-md transition-colors duration-200"
      >
        {leftCollapsed ? (
          <ChevronRightIcon className="w-5 h-5 text-forest-text" />
        ) : (
          <ChevronLeftIcon className="w-5 h-5 text-forest-text" />
        )}
      </button>
    </div>
  );
};

export default ReadPage;
