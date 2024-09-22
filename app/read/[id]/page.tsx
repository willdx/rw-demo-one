"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";
import FlowChart from "../../components/NodeTree";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, DocumentChartBarIcon } from "@heroicons/react/24/outline";

const MarkdownFlowChart = dynamic(() => import("../../components/MarkdownTree"), { ssr: false });

const ReadPage = ({ params }: { params: { id: string } }) => {
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"node" | "markdown">("node");

  const togglePanel = useCallback(() => setLeftCollapsed(prev => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-1/3"}
    border-gray-200 dark:border-gray-700 relative overflow-hidden
  `;

  const buttonClass = "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400";

  const tabButtonClass = (isActive: boolean) => `
    ${isActive ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}
    flex items-center justify-center px-6 py-3 text-sm font-medium transition-all duration-200 ease-in-out flex-1
  `;

  return (
    <div className="h-screen flex relative overflow-hidden">
      <div className={`${panelClass(leftCollapsed)} border-r`}>
        <div className={`w-full h-full flex flex-col ${leftCollapsed ? "invisible" : "visible"}`}>
          <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("node")}
              className={tabButtonClass(activeTab === "node")}
            >
              <DocumentChartBarIcon className="w-5 h-5 mr-2" />
              节点树
            </button>
            <button
              onClick={() => setActiveTab("markdown")}
              className={tabButtonClass(activeTab === "markdown")}
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Markdown树
            </button>
          </div>
          <div className="flex-grow overflow-hidden">
            {activeTab === "node" && (
              <ReactFlowProvider>
                <FlowChart onNodeClick={setSelectedContent} documentId={params.id} />
              </ReactFlowProvider>
            )}
            {activeTab === "markdown" && (
              <ReactFlowProvider>
                <MarkdownFlowChart content={selectedContent} />
              </ReactFlowProvider>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow overflow-auto px-12">
          {selectedContent ? (
            <div className="py-8 max-w-3xl mx-auto">
              <MarkdownRenderer content={selectedContent} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 italic text-center">请点击左侧思维导图的节点以查看内容。</p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute left-0 top-0 bottom-0 flex items-center">
        <button
          onClick={togglePanel}
          className={`${buttonClass} rounded-r-md h-16`}
        >
          {leftCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ReadPage;




