"use client";

import React, { useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Node,
  Edge,
  Background,
  Controls,
  ControlButton,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline"; // 更改为正确的图标
import dagre from "dagre";
import FlowChartSkeleton from "./FlowChartSkeleton";

const ReactFlow = dynamic(
  () => import("@xyflow/react").then((mod) => mod.ReactFlow),
  {
    ssr: false,
    loading: () => <FlowChartSkeleton />,
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

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

const parseMarkdown = (markdown: string): ASTNode => {
  const ast = unified().use(remarkParse).parse(markdown);
  return ast as unknown as ASTNode;
};

const astToReactFlowData = (ast: ASTNode): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let id = 0;
  const parentStack: { id: number; depth: number }[] = [];

  visit(ast, "heading", (node: ASTNode) => {
    const currentId = id++;
    const depth = node.depth || 0;
    const label =
      (node.children && node.children[0] && node.children[0].value) || "";

    nodes.push({
      id: currentId.toString(),
      data: { label },
      position: { x: 0, y: 0 }, // 初始位置设为 0,0，后面会用 dagre 重新布局
    });

    while (
      parentStack.length > 0 &&
      parentStack[parentStack.length - 1].depth >= depth
    ) {
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

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
      };
    }),
    edges,
  };
};

const MarkdownFlowChart: React.FC<MarkdownFlowChartProps> = ({ content }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { fitView } = useReactFlow();
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const ast = parseMarkdown(content);
    const { nodes: initialNodes, edges: initialEdges } = astToReactFlowData(ast);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      isHorizontal ? "LR" : "TB"
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setShowSkeleton(false);

    const timer = setTimeout(() => fitView({ padding: 0.2, includeHiddenNodes: false }), 100);
    return () => clearTimeout(timer);
  }, [content, isHorizontal, fitView]);

  const toggleLayout = useCallback(() => setIsHorizontal(prev => !prev), []);

  if (showSkeleton) return <FlowChartSkeleton />;

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls>
          <ControlButton onClick={toggleLayout} title={isHorizontal ? "切换为垂直布局" : "切换为水平布局"}>
            <ArrowsRightLeftIcon className={`w-4 h-4 transform ${isHorizontal ? "rotate-90" : ""}`} />
          </ControlButton>
        </Controls>
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default MarkdownFlowChart;
