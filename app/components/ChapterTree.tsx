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
import { useDocumentContext } from "../contexts/DocumentContext";
import {
  dfsTraversal,
  FormattedDocumentNode,
  updateEdgeStylesOnNodeClick,
} from "../utils/treeUtils";
import CustomNode from "./CustomNode";
import {
  HORIZONTAL_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  VERTICAL_GAP,
} from "../utils/constant";

const ChapterTree: React.FC = () => {
  const { selectedNode, setSelectedNode } = useDocumentContext();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [layout, setLayout] = React.useState<"LR" | "TB">("LR");

  // 使用 useRef 来存储解析后的 Markdown 结构
  const parsedMarkdownRef = useRef<MarkdownNode[]>([]);

  // 使用 useEffect 来解析 Markdown，并将结果存储在 ref 中
  useEffect(() => {
    const parsedMarkdown = parseMarkdown(selectedNode?.content || "");
    parsedMarkdownRef.current = parsedMarkdown;
    console.log("Parsed Markdown:", parsedMarkdown);
    // 渲染章节树
    updateNodesAndEdges("LR");
  }, [selectedNode]);

  const getLayoutedElements = useCallback((layout: "LR" | "TB") => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const graph = new dagre.graphlib.Graph();
    let yOffset = 0;

    graph.setGraph({ rankdir: layout });
    graph.setDefaultEdgeLabel(() => ({}));

    const addNodesAndEdges = (node: MarkdownNode, depth: number = 0) => {
      nodes.push({
        id: node.id,
        data: { label: node.fileName, content: node.content, depth },
        type: "customNode",
        position: { x: depth * (NODE_WIDTH + HORIZONTAL_GAP), y: yOffset },
        style: { width: NODE_WIDTH, height: NODE_HEIGHT },
      });

      yOffset += NODE_HEIGHT + VERTICAL_GAP;

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

    nodes.forEach((node) =>
      graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    );
    edges.forEach((edge) => graph.setEdge(edge.source, edge.target));

    dagre.layout(graph);

    nodes.forEach((node) => {
      const nodeWithPosition = graph.node(node.id);
      node.position = { x: nodeWithPosition.x, y: nodeWithPosition.y };
    });

    return { nodes, edges };
  }, []);

  const updateNodesAndEdges = useCallback(
    (layout: "LR" | "TB") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(layout);
      const updatedNodes = layoutedNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: node.id === selectedNode?.id,
          layout: layout,
        },
      }));
      setNodes(updatedNodes);

      const updatedEdges = updateEdgeStylesOnNodeClick(
        selectedNode?.selectedChapter?.id || updatedNodes[0].id,
        updatedNodes,
        layoutedEdges
      );
      setEdges(updatedEdges);

      setTimeout(() => fitView({ padding: 0.2 }), 0);
    },
    [getLayoutedElements, selectedNode, setNodes, setEdges, fitView]
  );

  const onToggleLayout = useCallback(() => {
    // setLayout(layout)
    updateNodesAndEdges(layout === "TB" ? "LR" : "TB");
  }, [updateNodesAndEdges]);

  const [dfsOrder, setDfsOrder] = useState<string[]>([]);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const order = dfsTraversal(nodes, edges);
      setDfsOrder(order);
    }
  }, [nodes, edges]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const currentIndex = selectedNode?.selectedChapter?.id
          ? dfsOrder.findIndex((id) => id === selectedNode?.selectedChapter?.id)
          : 0;

        const newIndex =
          event.key === "ArrowLeft"
            ? Math.max(currentIndex - 1, 0)
            : Math.min(currentIndex + 1, dfsOrder.length - 1);

        const nodeId = dfsOrder[newIndex];
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          setSelectedNode({
            ...selectedNode,
            selectedChapter: node,
          });
          setEdges((eds) => updateEdgeStylesOnNodeClick(node.id, nodes, eds));
        }
      }
    },
    [dfsOrder, nodes, selectedNode, setSelectedNode, setEdges]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: MarkdownNode) => {
      console.log("节点被点击:", node);
      if (node && selectedNode) {
        setSelectedNode({
          ...selectedNode,
          selectedChapter: node,
        });
        setEdges((eds) => updateEdgeStylesOnNodeClick(node.id, nodes, eds));
      }
    },
    [selectedNode, setSelectedNode, dfsOrder]
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
              layout === "TB" ? "transform rotate-90" : ""
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

export default ChapterTree;
