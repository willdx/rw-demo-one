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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, gql } from "@apollo/client";
import dagre from "dagre";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import TreeSkeleton from './TreeSkeleton';

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
  selectedContent: string;
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
          style: { stroke: '#42b983', strokeWidth: 3 },
          animated: true,
        });
        processNode(childNode, depth + 1);
      });
    }
  };

  processNode(document);

  return { nodes, edges };
};

// 更新自定义节点组件
const CustomNode: React.FC<{ data: { label: string; depth: number; isSelected: boolean } }> = ({
  data,
}) => (
  <>
    <div className={`px-3 py-2 rounded-md shadow-sm transition-all duration-200 ${
      data.depth === 0
        ? 'bg-forest-accent border-2 border-forest-accent'
        : data.isSelected
        ? 'bg-forest-accent/10 border-2 border-forest-accent'
        : 'bg-white border-2 border-forest-border'
    }`}>
      <span className={`text-sm font-medium ${
        data.depth === 0
          ? 'text-white font-bold'
          : 'text-forest-text'
      }`}>{data.label}</span>
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

const dfsTraversal = (nodes: Node[], edges: Edge[]): string[] => {
  const visited = new Set<string>();
  const result: string[] = [];

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    result.push(nodeId);

    edges
      .filter(edge => edge.source === nodeId)
      .forEach(edge => dfs(edge.target));
  };

  if (nodes.length > 0) {
    dfs(nodes[0].id);
  }

  return result;
};

const FlowChart: React.FC<FlowChartProps> = ({
  onNodeClick,
  documentId,
  selectedContent,
}) => {
  const { loading, error, data } = useQuery(GET_DOCUMENTS, {
    variables: {
      where: { id: documentId },
      sort: [{ edge: { order: "ASC" }, node: { updatedAt: "DESC" } }],
    },
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">("auto");
  const { fitView } = useReactFlow();

  const formattedData = useMemo(() => {
    if (data?.documents?.[0]) {
      return formatGraphData(data.documents[0]);
    }
    return { nodes: [], edges: [] };
  }, [data]);

  const updateEdgeStylesOnNodeClick = (selectedNodeId: string, nodes: Node[], edges: Edge[]) => {
    const selectedNode = nodes.find(node => node.id === selectedNodeId);
    if (!selectedNode) return edges;

    const selectedNodeIds = new Set<string>();
    const traverse = (nodeId: string) => {
      selectedNodeIds.add(nodeId);
      edges
        .filter(edge => edge.source === nodeId)
        .forEach(edge => traverse(edge.target));
    };

    // Traverse from root to selected node
    const traverseToRoot = (nodeId: string) => {
      selectedNodeIds.add(nodeId);
      edges
        .filter(edge => edge.target === nodeId)
        .forEach(edge => traverseToRoot(edge.source));
    };

    traverseToRoot(selectedNodeId);
    traverse(selectedNodeId);

    return edges.map(edge => ({
      ...edge,
      style: selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target) ? { stroke: '#42b983', strokeWidth: 3 } : { stroke: '#888', strokeWidth: 2 },
      animated: selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
    }));
  };

  const [dfsOrder, setDfsOrder] = useState<string[]>([]);
  const [currentDfsIndex, setCurrentDfsIndex] = useState<number>(0);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const order = dfsTraversal(nodes, edges);
      setDfsOrder(order);
      setCurrentDfsIndex(order.findIndex(id => nodes.find(node => node.id === id)?.data.content === selectedContent));
    }
  }, [nodes, edges, selectedContent]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      setCurrentDfsIndex(prevIndex => {
        const newIndex = Math.max(prevIndex - 1, 0);
        onNodeClick(nodes.find(node => node.id === dfsOrder[newIndex])?.data.content || "");
        return newIndex;
      });
    } else if (event.key === "ArrowRight") {
      setCurrentDfsIndex(prevIndex => {
        const newIndex = Math.min(prevIndex + 1, dfsOrder.length - 1);
        onNodeClick(nodes.find(node => node.id === dfsOrder[newIndex])?.data.content || "");
        return newIndex;
      });
    }
  }, [dfsOrder, nodes, onNodeClick]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowSkeleton(true), 300);
    } else {
      setShowSkeleton(false);
      const updatedNodes = formattedData.nodes.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: node.data.content === selectedContent || (index === 0 && !selectedContent)
        }
      }));
      const updatedEdges = updateEdgeStylesOnNodeClick(
        updatedNodes.find(node => node.data.isSelected)?.id || updatedNodes[0].id,
        updatedNodes,
        formattedData.edges
      );
      setNodes(updatedNodes);
      setEdges(updatedEdges);

      // 如果没有选中的内容，默认选中根节点
      if (!selectedContent && updatedNodes.length > 0) {
        onNodeClick(updatedNodes[0].data.content);
      }
    }
    return () => clearTimeout(timer);
  }, [loading, formattedData, setNodes, setEdges, selectedContent, onNodeClick]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick(node.data.content);
      const updatedEdges = updateEdgeStylesOnNodeClick(node.id, nodes, edges);
      setEdges(updatedEdges);
    },
    [onNodeClick, nodes, edges, setEdges]
  );

  const onToggleLayout = useCallback(() => {
    setLayout((prevLayout) => {
      const newLayout = prevLayout === "auto" ? "horizontal" : prevLayout === "horizontal" ? "vertical" : "auto";
      
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
          isSelected: node.data.content === selectedContent || (index === 0 && !selectedContent)
        }
      }));

      const updatedEdges = updateEdgeStylesOnNodeClick(
        updatedNodes.find(node => node.data.isSelected)?.id || updatedNodes[0].id,
        updatedNodes,
        layoutedElements.edges
      );

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      window.requestAnimationFrame(() => fitView({ padding: 0.2 }));

      return newLayout;
    });
  }, [nodes, edges, formattedData, setNodes, setEdges, fitView, selectedContent]);

  if (showSkeleton) return <TreeSkeleton />;
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
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      className="w-full h-full"
      nodeTypes={{ customNode: CustomNode }}
      edgeTypes={{}}
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
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#e0e0e0" />
    </ReactFlow>
  );
};

export default FlowChart;
