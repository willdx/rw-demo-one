"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DocumentNode } from '../utils/treeUtils';

interface DocumentContextType {
  selectedNode: DocumentNode | null;
  setSelectedNode: (node: DocumentNode | null) => void;
  // 可以添加更多共享状态
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedNode, setSelectedNode] = useState<DocumentNode | null>(null);

  return (
    <DocumentContext.Provider value={{ selectedNode, setSelectedNode }}>
      {children}
    </DocumentContext.Provider>
  );
};
