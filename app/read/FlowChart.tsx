"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, gql } from "@apollo/client";
import dagre from "dagre";

/* 更新的 GraphQL 查询, 目前仅支持从一个节点出发获取包含自己在内的6层节点
如果需要获取更多层级，请修改query
一般的markdown编辑器也就支持6层目录, 所以, 6层已经足够了
*/
const GET_DOCUMENTS = gql`
  query Documents(
    $where: DocumentWhere
    $sort: [DocumentChildrenConnectionSort!]
  ) {
    documents(where: $where) {
      id
      fileName
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

const nodeWidth = 150;
const nodeHeight = 50;

// 使用 dagre 来计算布局
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR" }); // LR 是从左到右的布局, TB 是从上到下的布局

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

// 递归格式化数据的函数
const formatGraphData = (document: any) => {
  if (!document) return { nodes: [], edges: [] };

  const nodes: Node[] = [
    {
      id: document.id,
      data: { label: document.fileName },
      position: { x: 0, y: 0 },
      style: { width: nodeWidth, height: nodeHeight },
    },
  ];

  const edges: Edge[] = [];

  document.childrenConnection.edges.forEach((edge: any) => {
    const node = edge.node;
    nodes.push({
      id: node.id,
      data: { label: node.fileName },
      position: { x: 0, y: 0 },
      style: { width: nodeWidth, height: nodeHeight },
    });
    edges.push({
      id: `e${document.id}-${node.id}`,
      source: document.id,
      target: node.id,
    });

    // 递归处理子节点
    if (node.childrenConnection && node.childrenConnection.edges) {
      const childData = formatGraphDataFromChildren(node);
      nodes.push(...childData.nodes);
      edges.push(...childData.edges);
    }
  });

  return getLayoutedElements(nodes, edges);
};

// 处理子节点的递归函数
const formatGraphDataFromChildren = (node: any) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  node.childrenConnection.edges.forEach((childEdge: any) => {
    const childNode = childEdge.node;
    nodes.push({
      id: childNode.id,
      data: { label: childNode.fileName },
      position: { x: 0, y: 0 },
      style: { width: nodeWidth, height: nodeHeight },
    });
    edges.push({
      id: `e${node.id}-${childNode.id}`,
      source: node.id,
      target: childNode.id,
    });

    // 递归处理子节点
    if (childNode.childrenConnection && childNode.childrenConnection.edges) {
      const childData = formatGraphDataFromChildren(childNode);
      nodes.push(...childData.nodes);
      edges.push(...childData.edges);
    }
  });

  return { nodes, edges };
};

export default function FlowChart() {
  const { loading, error, data } = useQuery(GET_DOCUMENTS, {
    variables: {
      where: {
        id: "c0477945-c54b-4c65-8980-be8dd144d277",
      },
      sort: [
        {
          edge: {
            order: "ASC",
          },
          node: {
            updatedAt: "DESC",
          },
        },
      ],
    },
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const formattedData = useMemo(() => {
    if (data && data.documents && data.documents.length > 0) {
      return formatGraphData(data.documents[0]);
    }
    return { nodes: [], edges: [] };
  }, [data]);

  useEffect(() => {
    if (formattedData) {
      setNodes(formattedData.nodes);
      setEdges(formattedData.edges);
    }
  }, [formattedData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error:{error.message}</p>;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      className="w-full h-full"
    >
      <Controls />
      <MiniMap />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
}
