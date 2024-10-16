"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import debounce from "lodash/debounce";
import { useDocumentContext } from "@/app/contexts/DocumentContext";
import { useMutation } from "@apollo/client";
import { UPDATE_DOCUMENT_CONTENT } from "../graphql/queries";
import { extractFileName } from "../utils/markdownUtils";

const VditorEditor: React.FC<{}> = () => {
  const { selectedNode, setSelectedNode } = useDocumentContext();
  const editorRef = useRef<Vditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const selectedNodeRef = useRef(selectedNode); // 否则input中获取的selectedNode一直为null

  const [updateDocumentContent] = useMutation(UPDATE_DOCUMENT_CONTENT);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  const debouncedUpdateDocumentContent = useCallback(
    debounce(async (value) => {
      const currentNode = selectedNodeRef.current;
      console.log(
        `VditorEditor debouncedUpdateDocumentContent selectedNode:`,
        currentNode
      );
      if (currentNode?.id) {
        try {
          await updateDocumentContent({
            variables: {
              where: { id: currentNode.id },
              update: {
                content: value,
                fileName: extractFileName(value),
              },
            },
          });
        } catch (error) {
          console.error("Error updating document:", error);
        }
      }
    }, 200),
    [updateDocumentContent, setSelectedNode]
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
          console.log(`编辑器内容变更，当前内容长度: ${value.length}`);
          console.log("VditorEditor selectedNode:", selectedNodeRef.current);
          debouncedUpdateDocumentContent(value);
        },
      });
    }
  }, [debouncedUpdateDocumentContent]);

  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      const content = selectedNode?.content || "";
      console.log(`设置编辑器内容，长度: ${content.length}`);
      editorRef.current.setValue(content);
    }
  }, [selectedNode, isEditorReady]);

  return <div id="vditor" className="h-full w-full" />;
};

export default VditorEditor;
