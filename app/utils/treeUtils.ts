import { Node, Edge } from "@xyflow/react";
import dagre from "dagre";
import { MarkdownNode } from "./markdownUtils";
import {
  HORIZONTAL_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  VERTICAL_GAP,
} from "./constant";

export interface DocumentNode {
  id: string;
  fileName: string;
  content: string;
  isPublished: boolean;
  childrenConnection?: {
    edges: Array<{
      node: DocumentNode;
    }>;
  };
}

export interface FormattedDocumentNode {
  id: string;
  fileName: string;
  content: string;
  isPublished: boolean;
  selectedChapter: MarkdownNode;
}

// 格式化图形数据
export const formatGraphData = (
  document: DocumentNode,
  layout: "LR" | "TB"
): { nodes: Node[]; edges: Edge[] } => {
  if (!document) return { nodes: [], edges: [] };

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  const processNode = (node: DocumentNode, depth: number = 0) => {
    const nodeId = node.id;
    nodes.push({
      ...node,
      ...{
        type: "customNode",
        data: {
          label: node.fileName,
          content: node.content,
          depth,
          isSelected: false,
          isDragging: false,
          isPossibleTarget: false,
          layout,
        },
        position: { x: depth * (NODE_WIDTH + HORIZONTAL_GAP), y: yOffset },
        style: { width: NODE_WIDTH },
      },
    });

    yOffset += NODE_HEIGHT + VERTICAL_GAP;

    node.childrenConnection?.edges.forEach((edge) => {
      const childNode = edge.node;
      edges.push({
        id: `e${nodeId}-${childNode.id}`,
        source: nodeId,
        target: childNode.id,
        type: "smoothstep",
        style: { stroke: "#42b983", strokeWidth: 3 },
        animated: true,
      });
      processNode(childNode, depth + 1);
    });
  };

  processNode(document);
  return { nodes, edges };
};

// 更新边样
export const updateEdgeStylesOnNodeClick = (
  selectedNodeId: string,
  nodes: Node[],
  edges: Edge[]
): Edge[] => {
  console.log("selectedNodeId:", selectedNodeId);
  console.log("nodes:", nodes);
  console.log("edges:", edges);
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

// 获取布局元素
export const getLayoutedElements = (
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

// 添加深度优先遍历函数
export const dfsTraversal = (nodes: Node[], edges: Edge[]): string[] => {
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
