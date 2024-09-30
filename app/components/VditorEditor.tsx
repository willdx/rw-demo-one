"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import debounce from "lodash/debounce";

interface VditorEditorProps {
  content: string;
  onChange: (value: string, chapterId: string | null) => void;
  selectedChapterId: string | null;
}

const VditorEditor: React.FC<VditorEditorProps> = ({
  content,
  onChange,
  selectedChapterId,
}) => {
  const editorRef = useRef<Vditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const currentChapterIdRef = useRef<string | null>(null);

  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      console.log(
        `编辑器内容变更，延迟300ms后触发回调，章节ID: ${currentChapterIdRef.current}`
      );
      onChange(value, currentChapterIdRef.current);
    }, 300),
    [onChange]
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
          debouncedOnChange(value);
        },
      });
    }
  }, [debouncedOnChange]);

  useEffect(() => {
    currentChapterIdRef.current = selectedChapterId;
    console.log(`selectedChapterId 更新: ${selectedChapterId}`);
  }, [selectedChapterId]);

  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      console.log(`设置编辑器内容，长度: ${content.length}`);
      editorRef.current.setValue(content);
    }
  }, [content, isEditorReady]);

  return <div id="vditor" className="h-full w-full" />;
};

export default VditorEditor;
