"use client";

import { useState } from "react";
import FlowChart from "./FlowChart";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function ReadPage() {
  const [selectedContent, setSelectedContent] = useState<string>("");

  return (
    <div className="grid grid-cols-1 h-screen w-full md:grid-cols-2">
      <div className="bg-gray-100 overflow-auto">
        <FlowChart onNodeClick={setSelectedContent} />
      </div>
      <div className="bg-white overflow-auto p-8">
        {selectedContent ? (
          <MarkdownRenderer content={selectedContent} />
        ) : (
          <p className="text-gray-500 italic">请点击左侧思维导图的节点以查看内容。</p>
        )}
      </div>
    </div>
  );
}
