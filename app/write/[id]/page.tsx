"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DOCUMENT, UPDATE_DOCUMENT } from "../../graphql/queries";
import WriteNodeTree from "../../components/WriteNodeTree";
import WriteMarkdownTree from "../../components/WriteMarkdownTree";
import VditorEditor from "../../components/VditorEditor";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function WritePage() {
  const params = useParams();
  const documentId = params.id as string;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"node" | "markdown">("node");
  const { token } = useAuth();

  const [fullContent, setFullContent] = useState("");
  const [selectedMarkdownNodeId, setSelectedMarkdownNodeId] = useState<
    string | null
  >(null);

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
      const docContent = data.documents[0].content;
      setFullContent(docContent);
      setContent(docContent);
      setFileName(data.documents[0].fileName);
      setSelectedNodeId(data.documents[0].id);
    }
  }, [data]);

  const handleNodeSelect = (nodeId: string, nodeContent: string) => {
    setSelectedNodeId(nodeId);
    setContent(nodeContent);
    if (activeTab === "node") {
      setFullContent(nodeContent);
    }
    setSelectedMarkdownNodeId(null);
  };

  const handleMarkdownNodeSelect = (nodeId: string, nodeContent: string) => {
    console.log("Markdown node selected:", nodeId, nodeContent); // 添加日志
    setSelectedMarkdownNodeId(nodeId);
    setContent(nodeContent);
  };

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
    if (activeTab === "node" || selectedMarkdownNodeId === "root") {
      setFullContent(newContent);
    } else if (selectedMarkdownNodeId) {
      // 更新子节点内容
      const updatedFullContent = updateNodeContent(
        fullContent,
        selectedMarkdownNodeId,
        newContent
      );
      setFullContent(updatedFullContent);
    }
    if (selectedNodeId) {
      try {
        await updateDocument({
          variables: {
            where: { id: selectedNodeId },
            update: {
              content: activeTab === "node" ? newContent : fullContent,
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
    ${collapsed ? "w-0" : "w-2/5"}
    border-r border-forest-border relative overflow-hidden
  `;

  // if (!token) {
  //   return <div>请先登录</div>;
  // }

  // if (loading) return <div>加载中...</div>;
  // if (error) return <div>错误: {error.message}</div>;

  return (
    <div className="h-screen flex relative overflow-hidden bg-forest-bg text-forest-text">
      <div className={`${panelClass(leftCollapsed)} bg-forest-sidebar`}>
        <div
          className={`w-full h-full flex flex-col ${
            leftCollapsed ? "invisible" : "visible"
          }`}
        >
          <div className="flex border-b border-forest-border h-14">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === "node"
                  ? "text-forest-accent border-b-2 border-forest-accent"
                  : "text-forest-text hover:text-forest-accent"
              }`}
              onClick={() => setActiveTab("node")}
            >
              <BookOpenIcon className="w-5 h-5 mr-2 inline-block" />
              Book
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
              Article
            </button>
          </div>
          <div className="flex-grow overflow-hidden p-2">
            <ReactFlowProvider>
              {activeTab === "node" ? (
                <WriteNodeTree
                  onNodeSelect={handleNodeSelect}
                  documentId={documentId}
                  selectedNodeId={selectedNodeId}
                />
              ) : (
                <WriteMarkdownTree
                  content={fullContent}
                  onNodeSelect={handleMarkdownNodeSelect}
                  selectedNodeId={selectedMarkdownNodeId}
                />
              )}
            </ReactFlowProvider>
          </div>
        </div>
      </div>
      <div
        className={`flex-1 flex flex-col overflow-hidden bg-forest-content h-full w-full`}
      >
        <div className={`${leftCollapsed ? "w-full" : "w-3/5"} h-full w-full`}>
          <VditorEditor content={content} onChange={handleContentChange} />
        </div>
      </div>

      <button
        onClick={togglePanel}
        className="absolute left-0 top-0 mt-2 ml-2 p-2 bg-forest-sidebar hover:bg-forest-border rounded-md transition-colors duration-200"
      >
        {leftCollapsed ? (
          <ChevronRightIcon className="w-5 h-5 text-forest-text" />
        ) : (
          <ChevronLeftIcon className="w-5 h-5 text-forest-text" />
        )}
      </button>
    </div>
  );
}

// 辅助函数：更新节点内容
function updateNodeContent(
  fullContent: string,
  nodeId: string,
  newContent: string
): string {
  const lines = fullContent.split("\n");
  let inTargetNode = false;
  let targetDepth = 0;
  const updatedLines = lines.map((line, index) => {
    if (line.startsWith("#")) {
      const depth = line.split(" ")[0].length;
      if (inTargetNode && depth <= targetDepth) {
        inTargetNode = false;
      }
      if (line.includes(`{#${nodeId}}`)) {
        inTargetNode = true;
        targetDepth = depth;
        return line;
      }
    }
    if (inTargetNode) {
      return index === lines.findIndex((l) => l.includes(`{#${nodeId}}`)) + 1
        ? newContent
        : "";
    }
    return line;
  });
  return updatedLines.filter(Boolean).join("\n");
}

// 辅助函数：解析 Markdown 到 AST
const parseMarkdownToAST = (content: string): MarkdownNode[] => {
  const tree = unified().use(remarkParse).parse(content);
  const root: MarkdownNode = { id: "root", content: "", children: [] };
  const stack: MarkdownNode[] = [root];

  let currentNode = root;
  let currentContent = "";

  visit(tree, (node: any) => {
    if (node.type === "heading") {
      const level = node.depth;
      const headingContent = node.children
        .map((child: any) => child.value)
        .join("");

      if (currentNode !== root) {
        currentNode.content = currentContent.trim();
        currentContent = "";
      }

      const newNode: MarkdownNode = {
        id: `node-${Math.random().toString(36).substr(2, 9)}`,
        content: headingContent,
        children: [],
      };

      while (stack.length > level) {
        stack.pop();
      }

      if (stack.length === level) {
        stack[stack.length - 1].children.push(newNode);
        stack.push(newNode);
      }

      currentNode = newNode;
    } else {
      if (node.type === "text") {
        currentContent += node.value;
      } else if (node.type === "paragraph") {
        currentContent +=
          node.children.map((child: any) => child.value).join("") + "\n\n";
      } else if (node.type === "code") {
        currentContent += `\`\`\`${node.lang}\n${node.value}\n\`\`\`\n\n`;
      }
    }
  });

  if (currentNode !== root) {
    currentNode.content = currentContent.trim();
  }

  return root.children;
};
