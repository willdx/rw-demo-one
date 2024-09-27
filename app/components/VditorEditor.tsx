"use client";

import React, { useEffect, useRef, useState } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";

interface VditorEditorProps {
  content: string;
  onChange: (value: string) => void;
}

const VditorEditor: React.FC<VditorEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<Vditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

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
          setIsEditorReady(true);
        },
        input: (value) => {
          onChange(value);
        },
      });
    }
  }, [onChange]);

  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      editorRef.current.setValue(content);
    }
  }, [content, isEditorReady]);

  return <div id="vditor" className="h-full w-full" />; // 确保宽度和高度都为100%
};

export default VditorEditor;
