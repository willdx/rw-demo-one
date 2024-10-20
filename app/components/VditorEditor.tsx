"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import { useDocumentContext } from "@/app/contexts/DocumentContext";
import { useMutation } from "@apollo/client";
import { UPDATE_DOCUMENT_CONTENT } from "../graphql/queries";
import { extractFileName } from "../utils/markdownUtils";
import { useToast } from "../contexts/ToastContext";

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
      try {
        const selectedChapter = selectedNodeRef.current.selectedChapter;
        if (selectedChapter) {
          console.log("更新章节内容:", selectedChapter?.data?.content);
          const articleContent = selectedNodeRef.current.content;
          const chapterContentFrom = selectedChapter?.data?.content;
          const chapterContentTo = content;
          modifiedAritcleContent = articleContent.replace(
            chapterContentFrom,
            chapterContentTo
          );
        }
        await updateDocumentContent({
          variables: {
            where: { id: selectedNodeRef.current.id },
            update: {
              content: modifiedAritcleContent,
              fileName: extractFileName(modifiedAritcleContent),
            },
          },
        });
        setSelectedNode((prevNode: any) => {
          if (prevNode) {
            return {
              ...prevNode,
              content: modifiedAritcleContent,
              fileName: extractFileName(modifiedAritcleContent),
            };
          }
          return prevNode;
        });
        console.log("内容已保存");
        setSaveStatus("已保存");
        contentModifiedRef.current = false;
      } catch (error) {
        showToast("保存文档时出错", "error");
        console.error("保存文档时出错:", error);
        setSaveStatus("未保存");
      }
    }
  }, [updateDocumentContent, setSelectedNode]);

  const { scheduleNextSave, triggerImmediateSave } =
    useSlideWindowSave(saveContent);

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
            triggerImmediateSave();
          }
        },
      });
    }
  }, [scheduleNextSave, triggerImmediateSave]);

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
      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow">
        {saveStatus}
      </div>
    </div>
  );
};

export default VditorEditor;
