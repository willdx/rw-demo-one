"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  ControlButton,
  useReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import dagre from "dagre";
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

// 添加缺失的常量定义
const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 20;

// ... 保留现有的接口定义和函数

const WriteMarkdownTree: React.FC<WriteMarkdownTreeProps> = ({
  content,
  onNodeSelect,
  selectedNodeId,
}) => {
  // ... 保留现有的组件逻辑

  return (
    <ReactFlow
      // ... 保留现有的 ReactFlow 属性
    >
      {/* ... 保留现有的 Controls 和 Background 组件 */}
    </ReactFlow>
  );
};

export default WriteMarkdownTree;