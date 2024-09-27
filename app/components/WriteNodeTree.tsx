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
  Connection,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import dagre from "dagre";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "../contexts/AuthContext";
import TreeSkeleton from "./TreeSkeleton";

// 添加缺失的常量定义
const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 20;

// ... 保留 NodeTree.tsx 中的其他常量和接口定义

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

// ... 保留 NodeTree.tsx 中的其他辅助函数

// 添加 formatGraphData 函数
const formatGraphData = (
  document: DocumentNode
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
        depth: depth,
        isSelected: false,
      },
      position: { x: depth * (NODE_WIDTH + HORIZONTAL_GAP), y: yOffset },
      style: {
        width: NODE_WIDTH,
      },
    });

    yOffset += NODE_HEIGHT + VERTICAL_GAP;

    if (node.childrenConnection) {
      node.childrenConnection.edges.forEach((edge) => {
        const childNode = edge.node;
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
    }
  };

  processNode(document);

  return { nodes, edges };
};

interface WriteNodeTreeProps {
  onNodeSelect: (nodeId: string, content: string) => void;
  documentId: string;
  selectedNodeId: string | null;
}

// 添加 CustomNode 组件
const CustomNode: React.FC<{
  data: { label: string; depth: number; isSelected: boolean };
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

// 添加 updateEdgeStylesOnNodeClick 函数
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
    if (data && data.documents && data.documents.length > 0) {
      const formattedData = formatGraphData(data.documents[0]);
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
      const updatedEdges = updateEdgeStylesOnNodeClick(node.id, nodes, edges);
      setEdges(updatedEdges);
    },
    [onNodeSelect, nodes, edges, setEdges]
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
        <ControlButton onClick={() => fitView()} title="适应视图">
          <ViewColumnsIcon className="w-4 h-4" />
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

export default WriteNodeTree;
