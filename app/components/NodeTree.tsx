"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  useReactFlow,
  ControlButton,
  Handle,
  Position,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, gql } from "@apollo/client";
import dagre from "dagre";
import FlowChartSkeleton from "./TreeSkeleton";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";

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
          properties {
            order
          }
        }
      }
    }
  }
`;

const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 20;

interface DocumentNode {
  id: string;
  fileName: string;
  content: string;
  childrenConnection?: {
    edges: Array<{
      node: DocumentNode;
      properties: {
        order: number;
      };
    }>;
  };
}

interface FlowChartProps {
  onNodeClick: (content: string) => void;
  documentId: string;
}

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
      type: "directoryNode",
      data: {
        label: node.fileName,
        content: node.content,
        depth: depth,
      },
      position: { x: depth * (NODE_WIDTH + HORIZONTAL_GAP), y: yOffset },
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
        });
        processNode(childNode, depth + 1);
      });
    }
  };

  processNode(document);

  return { nodes, edges };
};

// 自定义目录节点组件
const DirectoryNode: React.FC<{ data: { label: string; depth: number } }> = ({
  data,
}) => (
  <div className="px-3 py-2 rounded-md shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full h-full">
    <div className="flex items-center h-full">
      <span className="text-xs font-medium truncate">{data.label}</span>
    </div>
    <Handle
      type="target"
      position={Position.Left}
      className="w-2 h-2 -left-1"
    />
    <Handle
      type="source"
      position={Position.Right}
      className="w-2 h-2 -right-1"
    />
  </div>
);

const FlowChart: React.FC<FlowChartProps> = ({ onNodeClick, documentId }) => {
  const { loading, error, data } = useQuery(GET_DOCUMENTS, {
    variables: {
      where: { id: documentId },
      sort: [{ edge: { order: "ASC" }, node: { updatedAt: "DESC" } }],
    },
  });

  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">(
    "auto"
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const { fitView } = useReactFlow();

  const formattedData = useMemo(() => {
    if (data?.documents?.[0]) {
      return formatGraphData(data.documents[0]);
    }
    return { nodes: [], edges: [] };
  }, [data]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowSkeleton(true), 300);
    } else {
      setShowSkeleton(false);
      setNodes(formattedData.nodes);
      setEdges(formattedData.edges);
      if (formattedData.nodes.length > 0) {
        onNodeClick(formattedData.nodes[0].data.content || "");
      }
    }
    return () => clearTimeout(timer);
  }, [loading, formattedData, setNodes, setEdges, onNodeClick]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick((node.data.content as string) || "");
    },
    [onNodeClick]
  );

  const onToggleLayout = useCallback(() => {
    const newLayout =
      layout === "auto"
        ? "horizontal"
        : layout === "horizontal"
        ? "vertical"
        : "auto";
    setLayout(newLayout);

    let layoutedElements;
    if (newLayout === "auto") {
      layoutedElements = formatGraphData(data.documents[0]);
    } else {
      const direction = newLayout === "horizontal" ? "LR" : "TB";
      layoutedElements = getLayoutedElements(nodes, edges, direction);
    }

    setNodes(layoutedElements.nodes);
    setEdges(layoutedElements.edges);
    window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
  }, [layout, data, nodes, edges, setNodes, setEdges, fitView]);

  // 在数据加载完成后应用布局
  useEffect(() => {
    if (!loading && data?.documents?.[0]) {
      let layoutedElements;
      if (layout === "auto") {
        layoutedElements = formatGraphData(data.documents[0]);
      } else {
        const direction = layout === "horizontal" ? "LR" : "TB";
        const initialLayout = formatGraphData(data.documents[0]);
        layoutedElements = getLayoutedElements(
          initialLayout.nodes,
          initialLayout.edges,
          direction
        );
      }
      setNodes(layoutedElements.nodes);
      setEdges(layoutedElements.edges);
      window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
    }
  }, [loading, data, layout, setNodes, setEdges, fitView]);

  if (showSkeleton) return <FlowChartSkeleton />;
  if (error) return <p>错误：{error.message}</p>;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      fitView
      proOptions={{ hideAttribution: true }}
      className="w-full h-full"
      nodeTypes={{ directoryNode: DirectoryNode }}
    >
      <Controls>
        <ControlButton
          onClick={onToggleLayout}
          title={
            layout === "auto"
              ? "切换为水平布局"
              : layout === "horizontal"
              ? "切换为垂直布局"
              : "切换为自动布局"
          }
        >
          <ViewColumnsIcon
            className={`w-4 h-4 ${
              layout === "vertical" ? "transform rotate-90" : ""
            }`}
          />
        </ControlButton>
      </Controls>
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
};

export default FlowChart;
