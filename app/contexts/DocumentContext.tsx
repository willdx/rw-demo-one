"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FormattedDocumentNode } from "../utils/treeUtils";

interface DocumentContextType {
  selectedNode: FormattedDocumentNode | null;
  setSelectedNode: (node: FormattedDocumentNode | null) => void;
  //   selectedChapter: FormattedDocumentNode | null;
  //   setSelectedChapter: (node: FormattedDocumentNode | null) => void;
  // 可以添加更多共享状态
}

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error(
      "useDocumentContext must be used within a DocumentProvider"
    );
  }
  return context;
};

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedNode, setSelectedNode] =
    useState<FormattedDocumentNode | null>(null);
  //   const [selectedChapter, setSelectedChapter] =
  // useState<FormattedDocumentNode | null>(null);

  return (
    <DocumentContext.Provider
      value={{
        selectedNode,
        setSelectedNode,
        // selectedChapter,
        // setSelectedChapter,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};
