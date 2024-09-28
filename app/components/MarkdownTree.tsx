"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { visit } from "unist-util-visit";
import remarkStringify from "remark-stringify";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 20;

interface MarkdownNode {
  id: string;
  content: string;
  children: MarkdownNode[];
}

interface MarkdownTreeProps {
  content: string;
  onNodeClick: (content: string) => void;
  selectedContent: string;
  onNodeSelect: (nodeId: string) => void;
  updateTrigger: number;
}

const CustomNode: React.FC<{
  data: { label: string; isSelected: boolean; depth: number };
}> = ({ data }) => (
  <>
    <div
      className={`px-3 py-2 rounded-md shadow-sm transition-all duration-200 ${
        data.depth === 0
          ? "bg-forest-accent border-2 border-forest-accent"
          : data.isSelected
          ? "border-forest-accent bg-forest-accent/10"
          : "border-forest-border bg-white"
      }`}
    >
      <span
        className={`text-sm font-medium ${
          data.depth === 0 ? "text-white font-bold" : "text-forest-text"
        }`}
      >
        {data.label}
      </span>
    </div>
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
  </>
);

const parseMarkdownToAST = (content: string): MarkdownNode[] => {
  const processor = unified().use(remarkParse);
  const tree = processor.parse(content);
  const stringifier = unified().use(remarkStringify);

  const root: MarkdownNode = { id: "root", content: "", children: [] };
  const stack: MarkdownNode[] = [root];

  let currentNode = root;

  visit(tree, (node: any) => {
    if (node.type === "heading") {
      const level = node.depth;
      const headingContent = stringifier.stringify(node).trim();

      const newNode: MarkdownNode = {
        id: `node-${Math.random().toString(36).substr(2, 9)}`,
        content: headingContent,
        children: [],
      };

      while (stack.length > level) {
        stack.pop();
      }

      if (stack.length === level) {
        stack[stack.length - 1].children.push(newNode);
        stack.push(newNode);
      }

      currentNode = newNode;
    } else {
      // 只在当前节点下添加内容,避免重复
      if (stack.length > 1) {
        const nodeContent = stringifier.stringify(node).trim();
        if (!currentNode.content.includes(nodeContent)) {
          currentNode.content += "\n" + nodeContent + "\n";
        }
      }
    }
  });

  return root.children;
};

const formatMarkdownData = (
  markdownNodes: MarkdownNode[]
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  const processNode = (node: MarkdownNode, depth: number = 0) => {
    const nodeId = node.id;
    const nodeLabel = node.content.split("\n")[0]; // 只取第一行作为标签
    nodes.push({
      id: nodeId,
      type: "customNode",
      data: {
        label: nodeLabel.replace(/^#+\s*/, ""),
        content: node.content,
        isSelected: false,
        depth,
      },
      position: { x: depth * (NODE_WIDTH + HORIZONTAL_GAP), y: yOffset },
    });

    yOffset += NODE_HEIGHT + VERTICAL_GAP;

    node.children.forEach((childNode) => {
      const childId = childNode.id;
      edges.push({
        id: `e${nodeId}-${childId}`,
        source: nodeId,
        target: childId,
        type: "smoothstep",
        style: { stroke: "#42b983", strokeWidth: 3 },
        animated: true,
      });
      processNode(childNode, depth + 1);
    });
  };

  markdownNodes.forEach((node) => processNode(node));

  return { nodes, edges };
};

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR"
): { nodes: Node[]; edges: Edge[] } => {
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

const MarkdownTree: React.FC<MarkdownTreeProps> = ({
  content,
  onNodeClick,
  selectedContent,
  onNodeSelect,
  updateTrigger,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const { fitView } = useReactFlow();
  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">(
    "auto"
  );

  const formattedData = useMemo(() => {
    const parsedNodes = parseMarkdownToAST(content);
    return formatMarkdownData(parsedNodes);
  }, [content]);

  const updateEdgeStylesOnNodeClick = (
    selectedNodeId: string,
    nodes: Node[],
    edges: Edge[]
  ) => {
    const selectedNode = nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode) return edges;

    const selectedNodeIds = new Set<string>();
    const traverse = (nodeId: string) => {
      selectedNodeIds.add(nodeId);
      edges
        .filter((edge) => edge.source === nodeId)
        .forEach((edge) => traverse(edge.target));
    };

    // Traverse from root to selected node
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

  const [dfsOrder, setDfsOrder] = useState<string[]>([]);
  const [currentDfsIndex, setCurrentDfsIndex] = useState<number>(0);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const order = dfsTraversal(nodes, edges);
      setDfsOrder(order);
      setCurrentDfsIndex(
        order.findIndex(
          (id) =>
            nodes.find((node) => node.id === id)?.data.content ===
            selectedContent
        )
      );
    }
  }, [nodes, edges, selectedContent]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setCurrentDfsIndex((prevIndex) => {
          const newIndex = Math.max(prevIndex - 1, 0);
          onNodeClick(
            nodes.find((node) => node.id === dfsOrder[newIndex])?.data
              .content || ""
          );
          return newIndex;
        });
      } else if (event.key === "ArrowRight") {
        setCurrentDfsIndex((prevIndex) => {
          const newIndex = Math.min(prevIndex + 1, dfsOrder.length - 1);
          onNodeClick(
            nodes.find((node) => node.id === dfsOrder[newIndex])?.data
              .content || ""
          );
          return newIndex;
        });
      }
    },
    [dfsOrder, nodes, onNodeClick]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    let layoutedElements;
    if (layout === "auto") {
      layoutedElements = formattedData;
    } else {
      const direction = layout === "horizontal" ? "LR" : "TB";
      layoutedElements = getLayoutedElements(
        formattedData.nodes,
        formattedData.edges,
        direction
      );
    }

    const updatedNodes = layoutedElements.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: node.data.content === selectedContent,
      },
    }));
    const updatedEdges = updateEdgeStylesOnNodeClick(
      updatedNodes.find((node) => node.data.isSelected)?.id ||
        updatedNodes[0].id,
      updatedNodes,
      layoutedElements.edges
    );
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    fitView({ padding: 0.2, duration: 200 });
  }, [formattedData, layout, setNodes, setEdges, selectedContent, fitView]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick(node.data.content as string);
      onNodeSelect(node.id);
      const updatedEdges = updateEdgeStylesOnNodeClick(node.id, nodes, edges);
      setEdges(updatedEdges);
    },
    [onNodeClick, onNodeSelect, nodes, edges, setEdges]
  );

  const onToggleLayout = useCallback(() => {
    setLayout((prevLayout) => {
      const newLayout =
        prevLayout === "auto"
          ? "horizontal"
          : prevLayout === "horizontal"
          ? "vertical"
          : "auto";

      let layoutedElements;
      if (newLayout === "auto") {
        layoutedElements = formattedData;
      } else {
        const direction = newLayout === "horizontal" ? "LR" : "TB";
        layoutedElements = getLayoutedElements(nodes, edges, direction);
      }

      const updatedNodes = layoutedElements.nodes.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          isSelected:
            node.data.content === selectedContent ||
            (index === 0 && !selectedContent),
        },
      }));

      const updatedEdges = updateEdgeStylesOnNodeClick(
        updatedNodes.find((node) => node.data.isSelected)?.id ||
          updatedNodes[0].id,
        updatedNodes,
        layoutedElements.edges
      );

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      window.requestAnimationFrame(() => fitView({ padding: 0.2 }));

      return newLayout;
    });
  }, [
    nodes,
    edges,
    formattedData,
    setNodes,
    setEdges,
    fitView,
    selectedContent,
  ]);

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

export default MarkdownTree;
