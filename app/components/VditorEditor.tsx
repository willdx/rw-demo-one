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

const VditorEditor: React.FC = () => {
  const { showToast } = useToast();
  const editorRef = useRef<Vditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"已保存" | "未保存">("已保存");
  const contentModifiedRef = useRef(false);

  const { selectedNode, setSelectedNode } = useDocumentContext();
  const selectedNodeRef = useRef(selectedNode);

  const [updateDocumentContent] = useMutation(UPDATE_DOCUMENT_CONTENT);

  const toolbarActionRef = useRef<boolean>(false);

  const saveContent = useCallback(async () => {
    if (
      editorRef.current &&
      selectedNodeRef.current &&
      contentModifiedRef.current
    ) {
      const content = editorRef.current.getValue();
      let modifiedAritcleContent = content;
      const articleContent = selectedNodeRef.current.content;
      try {
        const selectedChapter = selectedNodeRef.current.selectedChapter;
        if (selectedChapter) {
          const chapterContentFrom = selectedChapter?.data?.content;
          modifiedAritcleContent = articleContent.replace(
            chapterContentFrom.trim(),
            content.trim()
          );
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
          setSelectedNode((prevNode: MarkdownNode | null) => {
            if (prevNode) {
              return {
                ...prevNode,
                selectedChapter: selectedChapter
                  ? {
                      ...selectedChapter,
                      data: {
                        ...selectedChapter.data,
                        content: content,
                      },
                    }
                  : null,
                content: modifiedAritcleContent,
                fileName: extractFileName(modifiedAritcleContent),
              };
            }
            return prevNode;
          });
          setSaveStatus("已保存");
          contentModifiedRef.current = false;
        }
      } catch (error) {
        showToast("保存文档时出错", "error");
        console.error("保存文档时出错:", error);
        setSaveStatus("未保存");
      }
    }
  }, [updateDocumentContent, setSelectedNode, showToast]);

  const debouncedSaveContent = useRef(
    debounce(() => {
      saveContent();
    }, 10000)
  ).current;

  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = new Vditor("vditor", {
        height: "100%",
        mode: "wysiwyg",
        theme: "classic",
        cache: {
          enable: false,
        },
        upload: {
          url: "/api/upload-image",
          fieldName: "image",
          success: (editor: HTMLPreElement, msg: string) => {
            const res = JSON.parse(msg);
            if (res.success && res.data && res.data.link) {
              const imageUrl = res.data.link;
              if (editorRef.current) {
                editorRef.current.insertValue(`![image](${imageUrl})`);
              }
              showToast("图片上传成功", "success");
            } else {
              showToast("图片上传失败", "error");
            }
          },
          error: () => {
            showToast("图片上传失败", "error");
          },
        },
        after: () => {
          console.log("Vditor 编辑器初始化完成");
          setIsEditorReady(true);

          // 添加工具栏操作事件监听器, 用于监听工具栏操作，并区分是否是工具栏操作导致的失焦。
          const toolbarItems = document.querySelectorAll(
            ".vditor-toolbar button, .vditor-toolbar input"
          );
          toolbarItems.forEach((item) => {
            item.addEventListener("mousedown", () => {
              toolbarActionRef.current = true;
            });
          });
        },
        input: () => {
          // 所有的内容修改, 都会触发相同的延迟保存机制
          contentModifiedRef.current = true;
          debouncedSaveContent();
        },
        blur: () => {
          // 当因为点击工具栏操作而触发的失焦，不应该被认为是失焦，而应该认为是正常的用户输入，所以触发相同的延迟保存机制。
          if (toolbarActionRef.current) {
            debouncedSaveContent();
            toolbarActionRef.current = false;
          } else {
            // 如果点击其它位置而导致的失焦，则应该立即保存
            debouncedSaveContent.flush();
          }
        },
      });
    }
  }, [debouncedSaveContent, showToast]);

  useEffect(() => {
    if (isEditorReady && editorRef.current && selectedNode) {
      const content =
        selectedNode.selectedChapter?.data?.content ||
        selectedNode.content ||
        "";
      editorRef.current.setValue(content);
      selectedNodeRef.current = selectedNode;
      setSaveStatus("已保存");
      contentModifiedRef.current = false;
    }
  }, [isEditorReady, selectedNode]);

  useEffect(() => {
    return () => {
      debouncedSaveContent.cancel();
    };
  }, [debouncedSaveContent]);

  // 渲染部分保持不变
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
