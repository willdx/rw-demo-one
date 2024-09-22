"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Node, Edge, Background, Controls, ControlButton, BackgroundVariant, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

const ReactFlow = dynamic(
  () => import('@xyflow/react').then((mod) => mod.ReactFlow),
  {
    ssr: false,
    loading: () => <p>加载中...</p>
  }
);

interface MarkdownFlowChartProps {
  content: string;
}

interface ASTNode {
  type: string;
  depth?: number;
  children?: ASTNode[];
  value?: string;
}

const parseMarkdown = (markdown: string): ASTNode => {
  const ast = unified().use(remarkParse).parse(markdown);
  return ast as unknown as ASTNode;
};

const astToReactFlowData = (ast: ASTNode): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let id = 0;
  const parentStack: { id: number, depth: number }[] = [];

  visit(ast, 'heading', (node: ASTNode) => {
    const currentId = id++;
    const depth = node.depth || 0;
    const label = (node.children && node.children[0] && node.children[0].value) || '';

    nodes.push({
      id: currentId.toString(),
      data: { label },
      position: { x: depth * 200, y: currentId * 100 },
    });

    while (parentStack.length > 0 && parentStack[parentStack.length - 1].depth >= depth) {
      parentStack.pop();
    }

    if (parentStack.length > 0) {
      const parentId = parentStack[parentStack.length - 1].id;
      edges.push({
        id: `e${parentId}-${currentId}`,
        source: parentId.toString(),
        target: currentId.toString(),
      });
    }

    parentStack.push({ id: currentId, depth });
  });

  return { nodes, edges };
};

const MarkdownFlowChart: React.FC<MarkdownFlowChartProps> = ({ content }) => {
  const { nodes, edges } = useMemo(() => {
    const ast = parseMarkdown(content);
    return astToReactFlowData(ast);
  }, [content]);

  const { fitView } = useReactFlow();
  const [isHorizontal, setIsHorizontal] = useState(true);

  useEffect(() => {
    // 使用 setTimeout 来确保在下一个渲染周期执行 fitView
    const timer = setTimeout(() => {
      if (nodes.length > 0) {
        fitView({ padding: 0.2, includeHiddenNodes: false });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [nodes, fitView]);

  const onLayout = useCallback(() => {
    setIsHorizontal(!isHorizontal);
    setTimeout(() => fitView({ padding: 0.2, includeHiddenNodes: false }), 10);
  }, [isHorizontal, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
      proOptions={{ hideAttribution: true }}
    >
      <Controls>
        <ControlButton onClick={onLayout} title={isHorizontal ? "切换为垂直布局" : "切换为水平布局"}>
          {isHorizontal ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
        </ControlButton>
      </Controls>
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
};

export default MarkdownFlowChart;