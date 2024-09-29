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
  data: { label: string; isSelected: boolean; depth: number; layout: "LR" | "TB" };
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
      position={data.layout === "LR" ? Position.Left : Position.Top}
      className={`w-3 h-3 bg-forest-accent ${
        data.layout === "LR" ? "-left-1.5" : "-top-1.5"
      }`}
    />
    <Handle
      type="source"
      position={data.layout === "LR" ? Position.Right : Position.Bottom}
      className={`w-3 h-3 bg-forest-accent ${
        data.layout === "LR" ? "-right-1.5" : "-bottom-1.5"
      }`}
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
        type: "smoothstep",
        style: { stroke: "#42b983", strokeWidth: 3 },
        animated: true,
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

const updateEdgeStylesOnNodeClick = (
  selectedNodeId: string,
  nodes: Node[],
  edges: Edge[]
): Edge[] => {
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  if (!selectedNode) return edges;

  const selectedNodeIds = new Set<string>();
  const traverse = (nodeId: string) => {
    selectedNodeIds.add(nodeId);
    edges
      .filter((edge) => edge.source === nodeId)
      .forEach((edge) => traverse(edge.target));
  };

  const traverseToRoot = (nodeId: string) => {
    selectedNodeIds.add(nodeId);
    edges
      .filter((edge) => edge.target === nodeId)
      .forEach((edge) => traverseToRoot(edge.source));
  };

  traverseToRoot(selectedNodeId);
  traverse(selectedNodeId);

  return edges.map((edge) => ({
    ...edge,
    style:
      selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
        ? { stroke: "#42b983", strokeWidth: 3 }
        : { stroke: "#888", strokeWidth: 2 },
    animated:
      selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
  }));
};

// 添加深度优先遍历函数
const dfsTraversal = (nodes: Node[], edges: Edge[]): string[] => {
  const visited = new Set<string>();
  const result: string[] = [];

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    result.push(nodeId);

    edges
      .filter((edge) => edge.source === nodeId)
      .forEach((edge) => dfs(edge.target));
  };

  if (nodes.length > 0) {
    dfs(nodes[0].id);
  }

  return result;
};

const WriteMarkdownTree: React.FC<WriteMarkdownTreeProps> = ({
  content,
  onNodeSelect,
  selectedNodeId,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const { fitView } = useReactFlow();
  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">(
    "auto"
  );

  const markdownNodes = useMemo(() => parseMarkdown(content), [content]);

  const updateNodesAndEdges = useCallback(
    (direction: "LR" | "TB") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(markdownNodes, direction);
      const updatedNodes = layoutedNodes.map((node) => ({
        ...node,
        data: { ...node.data, isSelected: node.id === selectedNodeId, layout: direction },
      }));
      setNodes(updatedNodes);

      const updatedEdges = updateEdgeStylesOnNodeClick(
        selectedNodeId || updatedNodes[0].id,
        updatedNodes,
        layoutedEdges
      );
      setEdges(updatedEdges);

      setTimeout(() => fitView({ padding: 0.2 }), 0);
    },
    [markdownNodes, selectedNodeId, setNodes, setEdges, fitView]
  );

  useEffect(() => {
    updateNodesAndEdges("LR"); // 确保初始布局为 LR
  }, [updateNodesAndEdges]);

  const onToggleLayout = useCallback(() => {
    setLayout((prevLayout) => {
      const newLayout = prevLayout === "horizontal" ? "vertical" : "horizontal";
      const direction = newLayout === "horizontal" ? "LR" : "TB";
      updateNodesAndEdges(direction);
      return newLayout;
    });
  }, [updateNodesAndEdges]);

  // 添加新的状态
  const [dfsOrder, setDfsOrder] = useState<string[]>([]);
  const [currentDfsIndex, setCurrentDfsIndex] = useState<number>(0);

  // 在useEffect中计算深度优先遍历顺序
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const order = dfsTraversal(nodes, edges);
      setDfsOrder(order);
      setCurrentDfsIndex(
        order.findIndex((id) => id === selectedNodeId) || 0
      );
    }
  }, [nodes, edges, selectedNodeId]);

  // 添加键盘事件处理函数
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setCurrentDfsIndex((prevIndex) => {
          const newIndex = Math.max(prevIndex - 1, 0);
          const nodeId = dfsOrder[newIndex];
          const node = nodes.find((n) => n.id === nodeId);
          if (node) {
            onNodeSelect(node.id, node.data.content as string);
          }
          return newIndex;
        });
      } else if (event.key === "ArrowRight") {
        setCurrentDfsIndex((prevIndex) => {
          const newIndex = Math.min(prevIndex + 1, dfsOrder.length - 1);
          const nodeId = dfsOrder[newIndex];
          const node = nodes.find((n) => n.id === nodeId);
          if (node) {
            onNodeSelect(node.id, node.data.content as string);
          }
          return newIndex;
        });
      }
    },
    [dfsOrder, nodes, onNodeSelect]
  );

  // 添加和移除键盘事件监听器
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data) {
        onNodeSelect(node.id, node.data.content || "");
        const updatedEdges = updateEdgeStylesOnNodeClick(node.id, nodes, edges);
        setEdges(updatedEdges);
        setCurrentDfsIndex(dfsOrder.findIndex((id) => id === node.id));
      }
    },
    [onNodeSelect, nodes, edges, setEdges, updateEdgeStylesOnNodeClick, dfsOrder]
  );

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
              layout === "vertical" ? "transform rotate-90" : ""
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
