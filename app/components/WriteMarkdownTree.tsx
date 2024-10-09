"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
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
import { parseMarkdown, MarkdownNode } from "../utils/markdownUtils";

export interface WriteMarkdownTreeRef {
  getParsedMarkdown: () => MarkdownNode[];
}

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

interface WriteMarkdownTreeProps {
  content: string;
  onNodeSelect: (nodeId: string, nodeContent: string) => void;
  selectedNodeId: string | null;
}

const CustomNode: React.FC<{
  data: {
    label: string;
    isSelected: boolean;
    depth: number;
    layout: "LR" | "TB";
  };
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

const WriteMarkdownTree = forwardRef<
  WriteMarkdownTreeRef,
  WriteMarkdownTreeProps
>(({ content, onNodeSelect, selectedNodeId }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">(
    "auto"
  );

  // 使用 useRef 来存储解析后的 Markdown 结构
  const parsedMarkdownRef = useRef<MarkdownNode[]>([]);

  // 使用 useEffect 来解析 Markdown，并将结果存储在 ref 中
  useEffect(() => {
    const parsedMarkdown = parseMarkdown(content);
    parsedMarkdownRef.current = parsedMarkdown;
    console.log("Parsed Markdown:", parsedMarkdown);
    // 触发重新渲染
    updateNodesAndEdges("LR");
  }, [content]);

  const getLayoutedElements = useCallback((direction: "LR" | "TB") => {
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

    parsedMarkdownRef.current.forEach((node) => addNodesAndEdges(node));

    nodes.forEach((node) => graph.setNode(node.id, { width: 200, height: 40 }));
    edges.forEach((edge) => graph.setEdge(edge.source, edge.target));

    dagre.layout(graph);

    nodes.forEach((node) => {
      const nodeWithPosition = graph.node(node.id);
      node.position = { x: nodeWithPosition.x, y: nodeWithPosition.y };
    });

    return { nodes, edges };
  }, []);

  const updateNodesAndEdges = useCallback(
    (direction: "LR" | "TB") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(direction);
      const updatedNodes = layoutedNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: node.id === selectedNodeId,
          layout: direction,
        },
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
    [getLayoutedElements, selectedNodeId, setNodes, setEdges, fitView]
  );

  useEffect(() => {
    updateNodesAndEdges("LR");
  }, [updateNodesAndEdges]);

  const onToggleLayout = useCallback(() => {
    setLayout((prevLayout) => {
      const newLayout = prevLayout === "horizontal" ? "vertical" : "horizontal";
      const direction = newLayout === "horizontal" ? "LR" : "TB";
      updateNodesAndEdges(direction);
      return newLayout;
    });
  }, [updateNodesAndEdges]);

  const [dfsOrder, setDfsOrder] = useState<string[]>([]);
  const [currentDfsIndex, setCurrentDfsIndex] = useState<number>(0);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const order = dfsTraversal(nodes, edges);
      setDfsOrder(order);
      setCurrentDfsIndex(order.findIndex((id) => id === selectedNodeId) || 0);
    }
  }, [nodes, edges, selectedNodeId]);

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
    [onNodeSelect, nodes, edges, setEdges, dfsOrder]
  );

  // 使用 useImperativeHandle 暴露 getParsedMarkdown 方法
  useImperativeHandle(ref, () => ({
    getParsedMarkdown: () => parsedMarkdownRef.current,
  }));

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
});

export default WriteMarkdownTree;
