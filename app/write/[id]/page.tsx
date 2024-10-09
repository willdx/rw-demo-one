"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DOCUMENT, UPDATE_DOCUMENT } from "../../graphql/queries";
import { PUBLISH_DOCUMENT, UNPUBLISH_DOCUMENT } from "../../graphql/mutations";
import WriteNodeTree from "../../components/WriteNodeTree";
import WriteMarkdownTree, {
  WriteMarkdownTreeRef,
} from "../../components/WriteMarkdownTree";
import VditorEditor from "../../components/VditorEditor";
import { useParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";
import debounce from "lodash/debounce";
import {
  parseMarkdown,
  MarkdownNode,
  replaceNodeContent,
} from "../../utils/markdownUtils";
import Toast from "@/app/components/Toast";

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
  const fullContentRef = useRef("");
  const parsedContentRef = useRef<MarkdownNode[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const writeMarkdownTreeRef = useRef<WriteMarkdownTreeRef>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000); // 3秒后自动消失
  };

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

  const [publishDocument] = useMutation(PUBLISH_DOCUMENT, {
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
  });

  const [unpublishDocument] = useMutation(UNPUBLISH_DOCUMENT, {
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
      fullContentRef.current = docContent;
      setContent(docContent);
      setFileName(extractFileName(docContent));
      setSelectedNodeId(data.documents[0].id);
      setIsPublished(data.documents[0].isPublished); // 更新发布状态
    }
  }, [data]);

  const [isPublished, setIsPublished] = useState(false); // 添加状态管理

  const onNodeSelect = (node: DocumentNode) => {
    console.log(`onNodeSelect 被调用，selectedNode: ${JSON.stringify(node)}`);
    setSelectedNodeId(node.id);
    setContent(node.data.content);
    setFullContent(node.data.content);
    setSelectedChapterId(null); // 重置 selectedChapterId

    // 更新发布状态
    console.log(`node.data.isPublished: ${node.data.isPublished}`);
    setIsPublished(node.data.isPublished); // 直接从节点对象中获取发布状态
  };

  const handleMarkdownNodeSelect = (nodeId: string, nodeContent: string) => {
    setSelectedChapterId(nodeId);
    setContent(nodeContent);
  };

  const debouncedUpdateDocument = useCallback(
    debounce(async (updatedFullContent: string, updatedFileName: string) => {
      if (documentId) {
        try {
          await updateDocument({
            variables: {
              where: { id: documentId },
              update: {
                content: updatedFullContent,
                fileName: updatedFileName,
              },
            },
          });
        } catch (error) {
          console.error("Error updating document:", error);
        }
      }
    }, 2000),
    [documentId, updateDocument]
  );

  const handleContentChange = (
    newContent: string,
    chapterId: string | null
  ) => {
    console.log(
      `handleContentChange 被调用，chapterId: ${chapterId}, 新内容长度: ${newContent.length}`
    );

    let updatedFullContent = fullContentRef.current;
    let updatedFileName = fileName;

    if (chapterId && chapterId !== "root") {
      console.log(`更新章节内容，章节ID: ${chapterId}`);
      console.log("原始全文内容:", updatedFullContent);
      const parsedMarkdown =
        writeMarkdownTreeRef.current?.getParsedMarkdown() || [];
      console.log("####parsedMarkdown:", parsedMarkdown);
      updatedFullContent = replaceNodeContent(
        updatedFullContent,
        parsedMarkdown,
        chapterId,
        newContent
      );
      console.log("更新后的全文内容:", updatedFullContent);
    } else {
      console.log("更新整个文档内容");
      updatedFullContent = newContent;
    }

    setFullContent(updatedFullContent);
    updatedFileName = extractFileName(updatedFullContent);

    console.log(
      `准备更新文档，文件名: ${updatedFileName}, 内容长度: ${updatedFullContent.length}`
    );
    debouncedUpdateDocument(updatedFullContent, updatedFileName);
  };

  const togglePanel = useCallback(() => setLeftCollapsed((prev) => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-2/5"}
    border-r border-forest-border relative overflow-hidden
  `;

  const handlePublish = async () => {
    if (selectedNodeId) {
      console.log(`准备发布文档，节点ID: ${selectedNodeId}`);
      try {
        const response = await publishDocument({
          variables: { id: selectedNodeId },
        });
        console.log("发布成功，响应:", response);
        showToast("文档已成功发布！"); // 使用 showToast 显示消息
        setIsPublished(true); // 更新发布状态
      } catch (error) {
        console.error("发布文档时出错:", error);
        showToast("发布文档失败，请重试。"); // 使用 showToast 显示消息
      }
    } else {
      console.warn("没有选中的节点ID，无法发布文档。");
    }
  };

  const handleUnpublish = async () => {
    if (selectedNodeId) {
      console.log(`准备取消发布文档，节点ID: ${selectedNodeId}`);
      try {
        const response = await unpublishDocument({
          variables: { id: selectedNodeId },
        });
        console.log("取消发布成功，响应:", response);
        showToast("文档已成功取消发布！"); // 使用 showToast 显示消息
        setIsPublished(false); // 更新发布状态
      } catch (error) {
        console.error("取消发布文档时出错:", error);
        showToast("取消发布文档失败，请重试。"); // 使用 showToast 显示消息
      }
    } else {
      console.warn("没有选中的节点ID，无法取消发布文档。");
    }
  };

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
              Article
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
              Chapter
            </button>
          </div>
          <div className="flex-grow overflow-hidden p-2">
            <ReactFlowProvider>
              {activeTab === "node" ? (
                <WriteNodeTree
                  onNodeSelect={onNodeSelect}
                  documentId={documentId}
                  selectedNodeId={selectedNodeId}
                />
              ) : (
                <WriteMarkdownTree
                  ref={writeMarkdownTreeRef}
                  content={fullContent}
                  onNodeSelect={handleMarkdownNodeSelect}
                  selectedNodeId={selectedChapterId}
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
          <VditorEditor
            content={content}
            onChange={handleContentChange}
            selectedChapterId={selectedChapterId}
          />
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

      <div className="absolute right-0 bottom-0 mb-6 mr-8">
        <div
          className="tooltip"
          data-tip={isPublished ? "取消发布" : "发布文档"}
        >
          <div
            className="cursor-pointer"
            onClick={() => {
              if (isPublished) {
                handleUnpublish();
              } else {
                handlePublish();
              }
            }}
          >
            {isPublished ? (
              <ArrowDownCircleIcon className="h-8 w-8 text-secondary" />
            ) : (
              <ArrowUpCircleIcon className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

// 辅助函数：提取文件名（第一个一级标题）
const extractFileName = (content: string): string => {
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.startsWith("# ")) {
      return line.substring(2).trim();
    }
  }
  return "未命名文档";
};
