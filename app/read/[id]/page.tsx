"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";
import DocumentTree from "../../components/ArticleTree";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  BookOpenIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { useDocumentContext } from "@/app/contexts/DocumentContext";
import ArticleTree from "../../components/ArticleTree";
import ChapterTree from "@/app/components/ChapterTree";

const ReadPage = ({ params }: { params: { id: string } }) => {
  const { selectedNode, setSelectedNode } = useDocumentContext();
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [markdownTreeContent, setMarkdownTreeContent] = useState<string>("");
  const [selectedMarkdownContent, setSelectedMarkdownContent] =
    useState<string>("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"article" | "chapter">("article");
  const [bgColor, setBgColor] = useState("#CEECCF"); // 设置默认背景颜色
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const togglePanel = useCallback(() => setLeftCollapsed((prev) => !prev), []);

  const panelClass = (collapsed: boolean) => `
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0" : "w-2/5"}
    border-r border-forest-border relative overflow-hidden
  `;

  const handleNodeTreeSelect = useCallback((content: string) => {
    setSelectedContent(content);
    setMarkdownTreeContent(content);
    // 当选择节点树中的节点时，重置 Markdown 树的选中内容
    setSelectedMarkdownContent("");
  }, []);

  const handleMarkdownTreeSelect = useCallback((content: string) => {
    setSelectedMarkdownContent(content);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleTabClick = useCallback(
    (tab: "article" | "chapter") => {
      setActiveTab(tab);
      if (tab === "chapter" && !selectedMarkdownContent) {
        setSelectedMarkdownContent(selectedContent);
      }
    },
    [selectedContent, selectedMarkdownContent]
  );

  useEffect(() => {
    if (activeTab === "article") {
      setSelectedMarkdownContent("");
    }
  }, [activeTab]);

  const displayContent =
    activeTab === "article"
      ? selectedNode?.content || ""
      : selectedMarkdownContent;

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
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
                activeTab === "article"
                  ? "text-forest-accent border-b-2 border-forest-accent"
                  : "text-forest-text hover:text-forest-accent"
              }`}
              onClick={() => handleTabClick("article")}
            >
              <BookOpenIcon className="w-5 h-5 mr-2 inline-block" />
              Aritcle
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === "chapter"
                  ? "text-forest-accent border-b-2 border-forest-accent"
                  : "text-forest-text hover:text-forest-accent"
              }`}
              onClick={() => handleTabClick("chapter")}
            >
              <DocumentTextIcon className="w-5 h-5 mr-2 inline-block" />
              Chapter
            </button>
          </div>
          <div className="flex-grow overflow-hidden p-2">
            <ReactFlowProvider>
              {activeTab === "article" && <ArticleTree mode="read" />}
              {activeTab === "chapter" && <ChapterTree />}
            </ReactFlowProvider>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-forest-content">
        <div className="absolute top-2 right-2 z-10">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <SwatchIcon className="w-5 h-5" />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              {[
                "#F7F7F7",
                "#CEECCF",
                "#EFE6CA",
                "#292A2F",
                "#EDF9F9",
                "#102952",
              ].map((color) => (
                <li key={color}>
                  <a onClick={() => handleBgColorChange(color)}>
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    ></div>
                    {color}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="flex-grow overflow-auto p-4 rounded-md shadow-md transition-colors duration-200"
          style={{ backgroundColor: bgColor }}
        >
          {selectedNode ? (
            <MarkdownRenderer />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-forest-text opacity-50 italic text-center">
                请点击左侧思维导图的节点以查看每个节点的内容
              </p>
            </div>
          )}
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
};

export default ReadPage;
