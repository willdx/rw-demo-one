"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { debounce } from "lodash";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ControlButton,
  useReactFlow,
  Node,
  Edge,
  Connection,
  addEdge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import dagre from "dagre";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "../contexts/AuthContext";
import TreeSkeleton from "./TreeSkeleton";

// 常量定义
const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 20;

const GET_DOCUMENTS = gql`
  query Documents(
    $where: DocumentWhere
    $sort: [DocumentChildrenConnectionSort!]
  ) {
    documents(where: $where) {
      id
      fileName
      content
      childrenConnection(sort: $sort) {
        edges {
          node {
            id
            fileName
            content
            childrenConnection(sort: $sort) {
              edges {
                node {
                  id
                  fileName
                  content
                  childrenConnection(sort: $sort) {
                    edges {
                      node {
                        id
                        fileName
                        content
                      }
                      properties {
                        order
                      }
                    }
                  }
                }
                properties {
                  order
                }
              }
            }
          }
          properties {
            order
          }
        }
      }
    }
  }
`;

// 格式化图形数据
const formatGraphData = (
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
      id: nodeId,
      type: "customNode",
      data: {
        label: node.fileName,
        content: node.content,
        depth,
        isSelected: false,
        layout,
      },
      position: { x: depth * (NODE_WIDTH + HORIZONTAL_GAP), y: yOffset },
      style: { width: NODE_WIDTH },
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

interface WriteNodeTreeProps {
  onNodeSelect: (nodeId: string, content: string) => void;
  documentId: string;
  selectedNodeId: string | null;
}

// 自定义节点组件
const CustomNode: React.FC<{
  data: {
    label: string;
    depth: number;
    isSelected: boolean;
    layout: "LR" | "TB";
  };
}> = ({ data }) => (
  <>
    <div
      className={`px-3 py-2 rounded-md shadow-sm transition-all duration-200 ${
        data.depth === 0
          ? "bg-forest-accent border-2 border-forest-accent"
          : data.isSelected
          ? "bg-forest-accent/10 border-2 border-forest-accent"
          : "bg-white border-2 border-forest-border"
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
      position={data.layout === "LR" ? Position.Left : Position.Top}
      className="w-3 h-3 bg-forest-accent"
    />
    <Handle
      type="source"
      position={data.layout === "LR" ? Position.Right : Position.Bottom}
      className="w-3 h-3 bg-forest-accent"
    />
  </>
);

// 更新边样式
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

// 获取布局元素
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

const WriteNodeTree: React.FC<WriteNodeTreeProps> = ({
  onNodeSelect,
  documentId,
  selectedNodeId,
}) => {
  const { token } = useAuth();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">("auto");

  // 使用 useRef 来存储最新的 nodes 和 edges
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const { loading, error, data } = useQuery(GET_DOCUMENTS, {
    variables: {
      where: { id: documentId },
      sort: [{ edge: { order: "ASC" }, node: { updatedAt: "DESC" } }],
    },
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
    skip: !token,
  });

  useEffect(() => {
    if (token) {
      setIsAuthChecked(true);
    }
  }, [token]);

  useEffect(() => {
    if (data?.documents?.length) {
      const formattedData = formatGraphData(data.documents[0], "LR");
      setNodes(formattedData.nodes);
      setEdges(formattedData.edges);
    }
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id, node.data.content as string);
      const updatedEdges = updateEdgeStylesOnNodeClick(node.id, nodesRef.current, edgesRef.current);
      setEdges(updatedEdges);
    },
    [onNodeSelect, setEdges]
  );

  const updateLayout = useCallback(
    (direction: "LR" | "TB") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodesRef.current, edgesRef.current, direction);
      const updatedNodes = layoutedNodes.map((node) => ({
        ...node,
        data: { ...node.data, layout: direction },
        sourcePosition: direction === "LR" ? Position.Right : Position.Bottom,
        targetPosition: direction === "LR" ? Position.Left : Position.Top,
      }));
      setNodes(updatedNodes);

      const updatedEdges = layoutedEdges.map((edge) => ({
        ...edge,
        type: 'smoothstep',
        animated: true,
      }));
      setEdges(updatedEdges);

      setTimeout(() => fitView(), 0);
    },
    [setNodes, setEdges, fitView]
  );

  const onToggleLayout = useCallback(
    debounce(() => {
      setLayout((prevLayout) => {
        const newLayout =
          prevLayout === "horizontal" ? "vertical" : "horizontal";
        updateLayout(newLayout === "horizontal" ? "LR" : "TB");
        return newLayout;
      });
    }, 300),
    [updateLayout]
  );

  if (loading) return <TreeSkeleton />;
  if (error)
    return (
      <div className="alert alert-error">
        <span>错误: {error.message}</span>
      </div>
    );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      className="w-full h-full"
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
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#e0e0e0" />
    </ReactFlow>
  );
};

export default WriteNodeTree;
