"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from "@xyflow/react";
import FlowChart from "../../components/FlowChart";
import MarkdownRenderer from "../../components/MarkdownRenderer";

const MarkdownFlowChart = dynamic(() => import('../../components/MarkdownFlowChart'), {
  ssr: false,
});

export default function ReadPage() {
  const [selectedContent, setSelectedContent] = useState<string>("");
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="fixed inset-0 flex">
      <div className="w-1/3 bg-gray-100 overflow-auto">
        <ReactFlowProvider>
          <FlowChart onNodeClick={setSelectedContent} documentId={id} />
        </ReactFlowProvider>
      </div>
      <div className="w-1/3 bg-white relative">
        <div className="absolute inset-0 overflow-auto">
          {selectedContent ? (
            <div className="p-8">
              <MarkdownRenderer content={selectedContent} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-gray-500 italic text-center">
                请点击左侧思维导图的节点以查看内容。
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="w-1/3 bg-gray-100 overflow-auto">
        <ReactFlowProvider>
          <MarkdownFlowChart content={selectedContent} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
