"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import { useDocumentContext } from "@/app/contexts/DocumentContext";
import { useMutation } from "@apollo/client";
import { UPDATE_DOCUMENT_CONTENT } from "../graphql/queries";
import { extractFileName } from "../utils/markdownUtils";
import { useToast } from "../contexts/ToastContext";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import debounce from "lodash/debounce";

// 自定义 hook 用于滑动窗口保存机制
function useSlideWindowSave(saveFunction: () => void, delay: number = 10000) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleNextSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      saveFunction();
      timerRef.current = null;
    }, delay);
  }, [saveFunction, delay]);

  const triggerImmediateSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    saveFunction();
  }, [saveFunction]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { scheduleNextSave, triggerImmediateSave };
}

const VditorEditor: React.FC = () => {
  const { showToast } = useToast();
  const editorRef = useRef<Vditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"已保存" | "未保存">("已保存");
  const contentModifiedRef = useRef(false);

  const { selectedNode, setSelectedNode } = useDocumentContext();
  const selectedNodeRef = useRef(selectedNode);

  const [updateDocumentContent] = useMutation(UPDATE_DOCUMENT_CONTENT);

  const saveContent = useCallback(async () => {
    if (
      editorRef.current &&
      selectedNodeRef.current &&
      contentModifiedRef.current
    ) {
      const content = editorRef.current.getValue();
      let modifiedAritcleContent = editorRef.current.getValue();
      const articleContent = selectedNodeRef.current.content;
      try {
        const selectedChapter = selectedNodeRef.current.selectedChapter; // 获取selectedNode的selectedChapter的Ref
        if (selectedChapter) {
          const chapterContentFrom = selectedChapter?.data?.content;
          const chapterContentTo = content;
          console.log("此时选中节点的章节内容(from):", chapterContentFrom);
          console.log("此时vditor内容:", chapterContentTo);
          modifiedAritcleContent = articleContent.replace(
            chapterContentFrom.trim(),
            chapterContentTo.trim()
          );
          console.log("修改后的文章内容:", modifiedAritcleContent);
        }
        if (articleContent !== modifiedAritcleContent) {
          await updateDocumentContent({
            variables: {
              where: { id: selectedNodeRef.current.id },
              update: {
                content: modifiedAritcleContent,
                fileName: extractFileName(modifiedAritcleContent),
              },
            },
          });
          // 如果这里selectedChapter的数据没更新, 后续的selectedChapter.data.content还是旧数据, 导致vditor的内容更改之后就变化
          setSelectedNode((prevNode: any) => {
            if (prevNode) {
              return {
                ...prevNode,
                selectedChapter: {
                  ...selectedNodeRef.current.selectedChapter,
                  data: {
                    ...selectedNodeRef.current.selectedChapter?.data,
                    content: content,
                  },
                },
                content: modifiedAritcleContent,
                fileName: extractFileName(modifiedAritcleContent),
              };
            }
            return prevNode;
          });
          setSaveStatus("已保存");
          contentModifiedRef.current = false;
        } else {
          console.log("未修改文档内容");
        }
      } catch (error) {
        showToast("保存文档时出错", "error");
        console.error("保存文档时出错:", error);
        setSaveStatus("未保存");
      }
    }
  }, [updateDocumentContent, setSelectedNode]);

  const { scheduleNextSave, triggerImmediateSave } =
    useSlideWindowSave(saveContent);

  const debouncedSaveContent = useCallback(
    debounce(() => {
      saveContent();
    }, 200),
    [saveContent]
  );

  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = new Vditor("vditor", {
        height: "100%",
        mode: "wysiwyg",
        theme: "classic",
        cache: {
          enable: false,
        },
        after: () => {
          console.log("Vditor 编辑器初始化完成");
          setIsEditorReady(true);
        },
        input: () => {
          contentModifiedRef.current = true;
          scheduleNextSave();
          setSaveStatus("未保存");
        },
        blur: () => {
          if (contentModifiedRef.current) {
            debouncedSaveContent();
          }
        },
      });
    }
  }, [debouncedSaveContent, scheduleNextSave, triggerImmediateSave]);

  useEffect(() => {
    if (isEditorReady && editorRef.current && selectedNode) {
      const content =
        selectedNode.selectedChapter?.data?.content ||
        selectedNode.content ||
        "";
      console.log(`编辑器旧数据长度（未手动更新前）: ${content.length}`);
      editorRef.current.setValue(content);
      selectedNodeRef.current = selectedNode;
      setSaveStatus("已保存");
      contentModifiedRef.current = false;
    }
  }, [isEditorReady, selectedNode]);

  return (
    <div className="relative h-full w-full">
      <div id="vditor" className="h-full w-full" />
      <div className="absolute bottom-4 right-4 flex flex-col items-end space-y-2">
        <div className="flex items-center px-3 py-1 rounded-full bg-green-100 text-green-600">
          {saveStatus === "已保存" ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          <span
            className={`ml-2 text-sm font-medium 
                ${
                  saveStatus === "已保存" ? "text-green-600" : "text-yellow-600"
                } 
                `}
          >
            {saveStatus}
          </span>
        </div>
        {selectedNode && (
          <div className="flex items-center px-3 py-1 rounded-full bg-green-100 text-green-600">
            {selectedNode.isPublished ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <span
              className={`ml-2 text-sm font-medium 
                ${
                  selectedNode.isPublished
                    ? "text-green-600"
                    : "text-yellow-600"
                } 
                `}
            >
              {selectedNode.isPublished ? "已发布" : "未发布"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VditorEditor;
