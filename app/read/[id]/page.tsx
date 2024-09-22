"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";
import FlowChart from "../../components/FlowChart";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const MarkdownFlowChart = dynamic(() => import("../../components/MarkdownFlowChart"), { ssr: false });

const ReadPage = ({ params }: { params: { id: string } }) => {
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const togglePanel = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => 
    () => setter(prev => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-1/4"}
    border-gray-200 dark:border-gray-700 relative overflow-hidden
  `;

  const buttonClass = "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md p-1 shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 h-16";

  return (
    <div className="h-screen flex relative overflow-hidden">
      <div className={`${panelClass(leftCollapsed)} border-r`}>
        <div className={`w-full h-full ${leftCollapsed ? "invisible" : "visible"}`}>
          <ReactFlowProvider>
            <FlowChart onNodeClick={setSelectedContent} documentId={params.id} />
          </ReactFlowProvider>
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

      <div className={`${panelClass(rightCollapsed)} border-l`}>
        <div className={`w-full h-full ${rightCollapsed ? "invisible" : "visible"}`}>
          <ReactFlowProvider>
            <MarkdownFlowChart content={selectedContent} />
          </ReactFlowProvider>
        </div>
      </div>

      {["left", "right"].map((side) => (
        <div key={side} className={`absolute ${side}-0 top-0 bottom-0 flex items-center`}>
          <button
            onClick={togglePanel(side === "left" ? setLeftCollapsed : setRightCollapsed)}
            className={`${buttonClass} ${side === "left" ? "rounded-r-md" : "rounded-l-md"}`}
          >
            {(side === "left" ? leftCollapsed : rightCollapsed) ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ReadPage;
