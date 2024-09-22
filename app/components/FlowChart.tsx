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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, gql } from "@apollo/client";
import dagre from "dagre";
import FlowChartSkeleton from "./FlowChartSkeleton";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

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
          properties {
            order
          }
        }
      }
    }
  }
`;

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

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

  const nodes: Node[] = [
    {
      id: document.id,
      data: { label: document.fileName, content: document.content },
      position: { x: 0, y: 0 },
      style: { width: NODE_WIDTH, height: NODE_HEIGHT },
    },
  ];

  const edges: Edge[] = [];

  const processChildren = (parentNode: DocumentNode, parentId: string) => {
    if (parentNode.childrenConnection) {
      parentNode.childrenConnection.edges.forEach((edge) => {
        const childNode = edge.node;
        nodes.push({
          id: childNode.id,
          data: { label: childNode.fileName, content: childNode.content },
          position: { x: 0, y: 0 },
          style: { width: NODE_WIDTH, height: NODE_HEIGHT },
        });
        edges.push({
          id: `e${parentId}-${childNode.id}`,
          source: parentId,
          target: childNode.id,
        });
        processChildren(childNode, childNode.id);
      });
    }
  };

  processChildren(document, document.id);

  return getLayoutedElements(nodes, edges);
};

const FlowChart: React.FC<FlowChartProps> = ({ onNodeClick, documentId }) => {
  const { loading, error, data } = useQuery(GET_DOCUMENTS, {
    variables: {
      where: { id: documentId },
      sort: [{ edge: { order: "ASC" }, node: { updatedAt: "DESC" } }],
    },
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const { fitView } = useReactFlow();
  const [isHorizontal, setIsHorizontal] = useState(true);

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
    (params: Edge | Connection) =>
      setEdges((eds) => addEdge(params, eds as Edge[])),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick((node.data.content as string) || "");
    },
    [onNodeClick]
  );

  const onLayout = useCallback(() => {
    const direction = isHorizontal ? "TB" : "LR";
    setIsHorizontal(!isHorizontal);
    const layoutedElements = getLayoutedElements(nodes, edges, direction);
    setNodes(layoutedElements.nodes);
    setEdges(layoutedElements.edges);
    window.requestAnimationFrame(() => fitView());
  }, [nodes, edges, setNodes, setEdges, fitView, isHorizontal]);

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
    >
      <Controls>
        <ControlButton
          onClick={onLayout}
          title={isHorizontal ? "切换为垂直布局" : "切换为水平布局"}
        >
          <ArrowsRightLeftIcon className={`w-4 h-4 transform ${isHorizontal ? 'rotate-90' : ''}`} />
        </ControlButton>
      </Controls>
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
};

export default FlowChart;
