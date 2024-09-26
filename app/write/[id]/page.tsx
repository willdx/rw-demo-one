"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DOCUMENT, UPDATE_DOCUMENT } from "../../graphql/queries";
import WriteNodeTree from "../../components/WriteNodeTree";
import WriteMarkdownTree from "../../components/WriteMarkdownTree";
import VditorEditor from "../../components/VditorEditor";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { useAuth } from "../../contexts/AuthContext"; // 添加这行

export default function WritePage() {
  const params = useParams();
  const documentId = params.id as string;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"node" | "markdown">("node");
  const { token } = useAuth(); // 添加这行

  const { data, loading, error } = useQuery(GET_DOCUMENT, {
    variables: { id: documentId },
    skip: !documentId || !token,
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
  });

  const [updateDocument] = useMutation(UPDATE_DOCUMENT, {
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
  });

  useEffect(() => {
    if (data && data.documents && data.documents.length > 0) {
      setContent(data.documents[0].content);
      setFileName(data.documents[0].fileName);
      setSelectedNodeId(data.documents[0].id);
    }
  }, [data]);

  const handleNodeSelect = (nodeId: string, nodeContent: string) => {
    setSelectedNodeId(nodeId);
    setContent(nodeContent);
  };

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    if (selectedNodeId) {
      try {
        await updateDocument({
          variables: {
            where: { id: selectedNodeId },
            update: {
              content: newContent,
            },
          },
        });
      } catch (error) {
        console.error("更新内容时出错:", error);
      }
    }
  };

  const togglePanel = useCallback(() => setLeftCollapsed((prev) => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-1/3"}
    border-r border-forest-border relative overflow-hidden
  `;

  if (!token) {
    return <div>请先登录</div>;
  }

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div className="flex h-screen">
      <div className={panelClass(leftCollapsed)}>
        <button
          onClick={togglePanel}
          className="absolute top-2 right-2 z-10 bg-forest-bg text-forest-text p-1 rounded"
        >
          {leftCollapsed ? "展开" : "折叠"}
        </button>
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => setActiveTab("node")}
            className={`px-3 py-1 rounded ${
              activeTab === "node"
                ? "bg-forest-accent text-white"
                : "bg-forest-bg text-forest-text"
            }`}
          >
            NodeTree
          </button>
          <button
            onClick={() => setActiveTab("markdown")}
            className={`px-3 py-1 rounded ${
              activeTab === "markdown"
                ? "bg-forest-accent text-white"
                : "bg-forest-bg text-forest-text"
            }`}
          >
            MarkdownTree
          </button>
        </div>
        {!leftCollapsed && (
          <ReactFlowProvider>
            {activeTab === "node" ? (
              <WriteNodeTree
                onNodeSelect={handleNodeSelect}
                documentId={documentId}
                selectedNodeId={selectedNodeId}
              />
            ) : (
              <WriteMarkdownTree
                content={content}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNodeId}
              />
            )}
          </ReactFlowProvider>
        )}
      </div>
      <div className={`${leftCollapsed ? "w-full" : "w-2/3"} p-4`}>
        <VditorEditor content={content} onChange={handleContentChange} />
      </div>
    </div>
  );
}