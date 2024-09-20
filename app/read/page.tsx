"use client";

import { useState } from "react";
import FlowChart from "./FlowChart";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function ReadPage() {
  const [selectedContent, setSelectedContent] = useState<string>("");

  const handleNodeClick = (content: string) => {
    setSelectedContent(content);
  };

  return (
    <div className="grid grid-cols-1 h-screen w-full md:grid-cols-2">
      <div className="bg-blue-200 overflow-auto">
        <div className="h-full w-full">
          <FlowChart onNodeClick={handleNodeClick} />
        </div>
      </div>
      <div className="bg-green-200 overflow-auto">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">内容预览</h2>
          {selectedContent ? (
            <MarkdownRenderer content={selectedContent} />
          ) : (
            <p>请点击左侧思维导图的节点以查看内容。</p>
          )}
        </div>
      </div>
    </div>
  );
}
