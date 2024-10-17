"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import debounce from "lodash/debounce";
import { useDocumentContext } from "@/app/contexts/DocumentContext";
import { useMutation } from "@apollo/client";
import { UPDATE_DOCUMENT_CONTENT } from "../graphql/queries";
import { extractFileName } from "../utils/markdownUtils";

const VditorEditor: React.FC = () => {
  const editorRef = useRef<Vditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const { selectedNode, setSelectedNode } = useDocumentContext();
  const selectedNodeRef = useRef(selectedNode);

  const [updateDocumentContent] = useMutation(UPDATE_DOCUMENT_CONTENT);

  const debouncedUpdateDocumentContent = useCallback(
    debounce(async (content, nodeId) => {
      if (nodeId) {
        try {
          await updateDocumentContent({
            variables: {
              where: { id: nodeId },
              update: {
                content: content,
                fileName: extractFileName(content),
              },
            },
          });
        } catch (error) {
          console.error("更新文档时出错:", error);
        }
      }
    }, 3000), // 编辑器内容变更后，3秒后更新数据库
    [updateDocumentContent]
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
        input: (value) => {
          console.log(`编辑器内容变更后数据长度: ${value.length}`);
          console.log(`selectedNodeRef: ${selectedNodeRef.current?.id}`);
          debouncedUpdateDocumentContent(value, selectedNodeRef.current?.id);
          setSelectedNode(selectedNodeRef.current);
        },
      });
    }
  }, [debouncedUpdateDocumentContent, selectedNode]);

  useEffect(() => {
    if (isEditorReady && editorRef.current && selectedNode) {
      const content =
        selectedNode.selectedChapter?.data?.content ||
        selectedNode.content ||
        "";
      console.log(`编辑器旧数据长度（未手动更新前）: ${content.length}`);
      editorRef.current.setValue(content);
      selectedNodeRef.current = selectedNode;
    }
  }, [isEditorReady, selectedNode]);

  return <div id="vditor" className="h-full w-full" />;
};

export default VditorEditor;
