"use client";

import { useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from "@xyflow/react";
import FlowChart from "../../components/FlowChart";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const MarkdownFlowChart = dynamic(() => import('../../components/MarkdownFlowChart'), {
  ssr: false,
});

const ReadPage = ({ params }: { params: { id: string } }) => {
  const [selectedContent, setSelectedContent] = useState<string>("");
  const id = params?.id as string;
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const toggleLeftPanel = useCallback(() => setLeftCollapsed(prev => !prev), []);
  const toggleRightPanel = useCallback(() => setRightCollapsed(prev => !prev), []);

  return (
    <div className="h-screen flex">
      <div className={`transition-all duration-300 ease-in-out ${leftCollapsed ? 'w-0' : 'w-1/4'} border-r border-gray-200 dark:border-gray-700 relative overflow-hidden`}>
        <div className={`w-full h-full ${leftCollapsed ? 'invisible' : 'visible'}`}>
          <ReactFlowProvider>
            <FlowChart onNodeClick={setSelectedContent} documentId={id} />
          </ReactFlowProvider>
        </div>
      </div>
      <div className="flex-grow overflow-auto relative flex">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20">
          <button 
            onClick={toggleLeftPanel}
            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-r-md p-1 shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {leftCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex-grow px-12">
          {selectedContent ? (
            <div className="py-8 max-w-3xl mx-auto">
              <MarkdownRenderer content={selectedContent} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 italic text-center">
                请点击左侧思维导图的节点以查看内容。
              </p>
            </div>
          )}
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20">
          <button 
            onClick={toggleRightPanel}
            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-l-md p-1 shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {rightCollapsed ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div className={`transition-all duration-300 ease-in-out ${rightCollapsed ? 'w-0' : 'w-1/4'} border-l border-gray-200 dark:border-gray-700 relative overflow-hidden`}>
        <div className={`w-full h-full ${rightCollapsed ? 'invisible' : 'visible'}`}>
          <ReactFlowProvider>
            <MarkdownFlowChart content={selectedContent} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default ReadPage;
