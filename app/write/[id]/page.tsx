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
import debounce from "lodash/debounce";
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

interface MarkdownNode {
  id: string;
  content: string;
  children: MarkdownNode[];
  depth: number;
}

export default function WritePage() {
  const params = useParams();
  const documentId = params?.id as string;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"node" | "markdown">("node");
  const { token } = useAuth();

  const [fullContent, setFullContent] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedMarkdownNodeId, setSelectedMarkdownNodeId] = useState<string | null>(null);

  const { data } = useQuery(GET_DOCUMENT, {
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
      setFileName(extractFileName(docContent));
      setSelectedNodeId(data.documents[0].id);
    }
  }, [data]);

  const handleNodeSelect = (nodeId: string, nodeContent: string) => {
    setSelectedNodeId(nodeId);
    setContent(nodeContent);
    setFullContent(nodeContent);
    setSelectedChapterId(null); // 重置 selectedChapterId
    setSelectedMarkdownNodeId(null);
  };

  const handleMarkdownNodeSelect = (nodeId: string, nodeContent: string) => {
    setSelectedChapterId(nodeId);
    setContent(nodeContent);
    setSelectedMarkdownNodeId(nodeId);
  };

  const debouncedUpdateDocument = useCallback(
    debounce(async (updatedFullContent: string, updatedFileName: string) => {
      if (documentId) {
        try {
          await updateDocument({
            variables: {
              where: { id: documentId },
              update: { content: updatedFullContent, fileName: updatedFileName },
            },
          });
        } catch (error) {
          console.error("Error updating document:", error);
        }
      }
    }, 2000),
    [documentId, updateDocument]
  );

  const handleContentChange = (newContent: string) => {
    let updatedFullContent = fullContent;
    let updatedFileName = fileName;

    if (selectedChapterId && selectedChapterId !== "root") {
      // 更新章节内容
      const updatedNodes = updateNodeInTree(
        parseMarkdownToAST(fullContent),
        selectedChapterId,
        newContent
      );
      updatedFullContent = rebuildMarkdownContent(updatedNodes);
      setContent(newContent); // 更新当前编辑的内容
    } else {
      // 更新整个文档内容
      updatedFullContent = newContent;
      setContent(newContent);
    }

    setFullContent(updatedFullContent);
    updatedFileName = extractFileName(updatedFullContent);
    setFileName(updatedFileName);

    debouncedUpdateDocument(updatedFullContent, updatedFileName);
  };

  const togglePanel = useCallback(() => setLeftCollapsed((prev) => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-2/5"}
    border-r border-forest-border relative overflow-hidden
  `;

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

// 辅助函数：提取文件名（第一个一级标题）
const extractFileName = (content: string): string => {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return '未命名文档';
};

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

// 添加一个函数来将 Markdown 子树还原为完整文本
const rebuildMarkdownContent = (nodes: MarkdownNode[]): string => {
  return nodes
    .map((node) => {
      const childrenContent = rebuildMarkdownContent(node.children);
      return `${"#".repeat(node.depth)} ${node.content}\n\n${childrenContent}`;
    })
    .join("\n");
};

// 辅助函数：在树中更新指定节点的内容
const updateNodeInTree = (
  nodes: MarkdownNode[],
  nodeId: string,
  newContent: string
): MarkdownNode[] => {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, content: newContent };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updateNodeInTree(node.children, nodeId, newContent),
      };
    }
    return node;
  });
};