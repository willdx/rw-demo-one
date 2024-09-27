"use client";

import React, { useCallback, useEffect, useMemo } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import dagre from "dagre";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import { Node as UnistNode } from "unist";

interface MarkdownNode {
  id: string;
  content: string;
  children: MarkdownNode[];
  depth: number;
  fileName: string;
}

interface WriteMarkdownTreeProps {
  content: string;
  onNodeSelect: (nodeId: string, nodeContent: string) => void;
  selectedNodeId: string | null;
}

const CustomNode: React.FC<{
  data: { label: string; isSelected: boolean; depth: number };
}> = ({ data }) => (
  <div
    className={`px-3 py-2 rounded-md shadow-sm transition-all duration-200 ${
      data.depth === 0
        ? "bg-forest-accent border-2 border-forest-accent text-white font-bold"
        : data.isSelected
        ? "bg-forest-accent/10 border-2 border-forest-accent"
        : "bg-white border-2 border-forest-border"
    }`}
  >
    <span className="text-sm font-medium">{data.label}</span>
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 -left-1.5 bg-forest-accent"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 -right-1.5 bg-forest-accent"
    />
  </div>
);

const parseMarkdown = (content: string): MarkdownNode[] => {
  const processor = unified().use(remarkParse);
  const tree = processor.parse(content);
  const stringifier = unified().use(remarkStringify);

  const docNode: MarkdownNode = {
    id: "doc",
    content,
    children: [],
    depth: 0,
    fileName: "Document",
  };
  const stack: MarkdownNode[] = [docNode];

  visit(tree, (node: UnistNode) => {
    if (node.type === "heading") {
      const headingNode = node as UnistNode & { depth: number };
      const newNode: MarkdownNode = {
        id: `heading-${(node as any).position.start.line}`,
        content: stringifier.stringify(node).trim(),
        children: [],
        depth: headingNode.depth,
        fileName: stringifier
          .stringify(node)
          .replace(/^#+\s*/, "")
          .trim(),
      };

      // 处理栈
      while (
        stack.length > 1 &&
        stack[stack.length - 1].depth >= headingNode.depth
      ) {
        stack.pop();
      }
      stack[stack.length - 1].children.push(newNode);
      stack.push(newNode);
    } else {
      // 只在当前节点下添加内容
      if (stack.length > 1) {
        const currentNode = stack[stack.length - 1];
        const nodeContent = stringifier.stringify(node).trim();
        if (!currentNode.content.includes(nodeContent)) {
          currentNode.content += "\n" + nodeContent + "\n"; // 添加换行符
        }
      }
    }
  });

  return [docNode];
};

const getLayoutedElements = (
  markdownNodes: MarkdownNode[],
  direction: "LR" | "TB" = "LR"
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const graph = new dagre.graphlib.Graph();

  graph.setGraph({ rankdir: direction });
  graph.setDefaultEdgeLabel(() => ({}));

  const addNodesAndEdges = (node: MarkdownNode, depth: number = 0) => {
    nodes.push({
      id: node.id,
      data: { label: node.fileName, content: node.content, depth },
      position: { x: 0, y: 0 },
      type: "customNode",
    });

    node.children.forEach((child) => {
      addNodesAndEdges(child, depth + 1);
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
      });
    });
  };

  markdownNodes.forEach((node) => addNodesAndEdges(node));

  nodes.forEach((node) => graph.setNode(node.id, { width: 200, height: 40 }));
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));

  dagre.layout(graph);

  nodes.forEach((node) => {
    const nodeWithPosition = graph.node(node.id);
    node.position = { x: nodeWithPosition.x, y: nodeWithPosition.y };
  });

  return { nodes, edges };
};

const WriteMarkdownTree: React.FC<WriteMarkdownTreeProps> = ({
  content,
  onNodeSelect,
  selectedNodeId,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  const markdownNodes = useMemo(() => parseMarkdown(content), [content]);

  const updateNodesAndEdges = useCallback(
    (direction: "LR" | "TB") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(markdownNodes, direction);
      setNodes(
        layoutedNodes.map((node) => ({
          ...node,
          data: { ...node.data, isSelected: node.id === selectedNodeId },
        }))
      );
      setEdges(
        layoutedEdges.map((edge) => ({
          ...edge,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#42b983", strokeWidth: 2 },
        }))
      );
      setTimeout(() => fitView({ padding: 0.2 }), 0);
    },
    [markdownNodes, selectedNodeId, setNodes, setEdges, fitView]
  );

  useEffect(() => {
    updateNodesAndEdges("LR");
  }, [updateNodesAndEdges]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data) {
        onNodeSelect(node.id, node.data.content || "");
      }
    },
    [onNodeSelect]
  );

  const onToggleLayout = useCallback(() => {
    updateNodesAndEdges(nodes[0]?.position.x === 0 ? "TB" : "LR");
  }, [nodes, updateNodesAndEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      className="w-full h-full bg-forest-bg"
      nodeTypes={{ customNode: CustomNode }}
    >
      <Controls>
        <ControlButton onClick={onToggleLayout} title="切换布局">
          <ViewColumnsIcon
            className={`w-4 h-4 ${
              nodes[0]?.position.x === 0 ? "" : "transform rotate-90"
            }`}
          />
        </ControlButton>
      </Controls>
      <Background
        variant={BackgroundVariant.Dots}
        gap={12}
        size={1}
        color="#e0e0e0"
      />
    </ReactFlow>
  );
};

export default WriteMarkdownTree;
