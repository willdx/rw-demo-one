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
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "../contexts/AuthContext";
import TreeSkeleton from "./TreeSkeleton";
import ContextMenu from "./ContextMenu";
import Link from "next/link";
import { CREATE_SUB_DOCUMENT } from "../graphql/mutations";
import { useToast } from "../contexts/ToastContext";
import { GET_DOCUMENTS } from "../graphql/queries";

// 常量定义
const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 20;

interface DocumentNode {
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
        isPublished: node.isPublished,
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
  console.log("Nodes:", JSON.stringify(nodes, null, 2));
  return { nodes, edges };
};

// 更新类型定义
type CustomNode = Node<{
  label: string;
  content: string;
  isPublished: boolean;
  depth: number;
  isSelected: boolean;
  layout: "LR" | "TB";
}>;

interface WriteNodeTreeProps {
  onNodeSelect: (node: DocumentNode) => void;
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

// 更新边样
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

// 添加深度优先遍历函数
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

const WriteNodeTree: React.FC<WriteNodeTreeProps> = ({
  onNodeSelect,
  documentId,
  selectedNodeId,
}) => {
  const { token, user } = useAuth(); // 获取用户信息
  const { showToast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const { fitView } = useReactFlow();
  const [layout, setLayout] = useState<"auto" | "horizontal" | "vertical">(
    "auto"
  );

  // 使用 useRef 来存储最新的 nodes 和 edges
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const { loading, error, data, refetch } = useQuery(GET_DOCUMENTS, {
    variables: {
      where: { id: documentId },
      sort: [{ edge: { order: "ASC" }, node: { updatedAt: "ASC" } }],
    },
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
    skip: !token,
  });

  const [createSubDocument] = useMutation(CREATE_SUB_DOCUMENT, {
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
    update: (cache, { data: { updateDocuments } }) => {
      const newDocument = updateDocuments.documents[0];
      cache.modify({
        id: cache.identify({ __typename: "Document", id: documentId }),
        fields: {
          childrenConnection(existingConnection = { edges: [] }) {
            const newEdge = {
              __typename: "DocumentEdge",
              node: newDocument,
              properties: { order: 1000 },
            };
            return {
              ...existingConnection,
              edges: [...existingConnection.edges, newEdge],
            };
          },
        },
      });
    },
  });

  const handleAddNode = useCallback(
    async (parentId: string) => {
      if (!parentId || !user) return; // 确保有用户信息

      try {
        const { data } = await createSubDocument({
          variables: {
            parentId,
            fileName: "Untitled",
            content: "# Untitled\n",
            creatorId: user.id, // 提供创建者 ID
          },
        });

        const updatedNode = data.updateDocuments.documents[0];

        // 重新获取文档数据
        await refetch();
        console.log(`### updatedNode: ${JSON.stringify(updatedNode)}`);
        onNodeSelect(updatedNode);
        showToast("节点添加成功", "success");
      } catch (error) {
        console.error("添加节点失败:", error);
        showToast("添加节点失败，请重试", "error");
      }
    },
    [createSubDocument, refetch, onNodeSelect, showToast, user]
  );

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

  // 添加新的状态
  const [dfsOrder, setDfsOrder] = useState<string[]>([]);
  const [currentDfsIndex, setCurrentDfsIndex] = useState<number>(0);

  // 在useEffect中计算深度优先遍历顺序
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const order = dfsTraversal(nodes, edges);
      setDfsOrder(order);
      setCurrentDfsIndex(order.findIndex((id) => id === selectedNodeId) || 0);
    }
  }, [nodes, edges, selectedNodeId]);

  const updateNodesAndEdges = useCallback(
    (newSelectedNodeId: string) => {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: { ...node.data, isSelected: node.id === newSelectedNodeId },
        }))
      );
      setEdges((eds) =>
        updateEdgeStylesOnNodeClick(newSelectedNodeId, nodes, eds)
      );
    },
    [nodes, setNodes, setEdges]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        console.log("event.key:", event.key);
        setCurrentDfsIndex((prevIndex) => {
          console.log("prevIndex:", prevIndex);
          const newIndex =
            event.key === "ArrowLeft"
              ? Math.max(prevIndex - 1, 0)
              : Math.min(prevIndex + 1, dfsOrder.length - 1);
          console.log("newIndex:", newIndex);
          console.log("dfsOrder:", dfsOrder);
          const nodeId = dfsOrder[newIndex];
          const node = nodes.find((n) => n.id === nodeId);
          // 这里的formatGraphData之后的node类型和Graphql请求返回的DocumentNode类型不一样
          if (node) {
            onNodeSelect(node);
            updateNodesAndEdges(node.id);
          }
          return newIndex;
        });
      }
    },
    [dfsOrder, nodes, onNodeSelect, updateNodesAndEdges]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect(node);
      updateNodesAndEdges(node.id);
      setCurrentDfsIndex(dfsOrder.findIndex((id) => id === node.id));
    },
    [onNodeSelect, updateNodesAndEdges, dfsOrder]
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
        type: "smoothstep",
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

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string | null;
  } | null>(null);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const nodeId = selectedNodeId;
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId });
    },
    [selectedNodeId]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [closeContextMenu]);

  const handleAddChildNode = useCallback(() => {
    if (selectedNodeId) {
      handleAddNode(selectedNodeId);
    }
  }, [selectedNodeId, handleAddNode]);

  const handleAddSiblingNode = useCallback(() => {
    if (selectedNodeId && selectedNodeId !== documentId) {
      const parentNode = nodes.find((node) =>
        edges.some(
          (edge) => edge.target === selectedNodeId && edge.source === node.id
        )
      );
      if (parentNode) {
        handleAddNode(parentNode.id);
      }
    }
  }, [selectedNodeId, documentId, nodes, edges, handleAddNode]);

  if (loading) return <TreeSkeleton />;
  if (error)
    return (
      <div className="alert alert-error">
        <span>错误: {error.message}</span>
      </div>
    );

  return (
    <div onContextMenu={handleContextMenu} className="relative w-full h-full">
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
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="#e0e0e0"
        />
      </ReactFlow>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        >
          <li>
            <Link
              href={`/write/${contextMenu.nodeId}`}
              onClick={closeContextMenu}
            >
              <span>从当前节点打开</span>
            </Link>
          </li>
          <li>
            <a
              onClick={() => {
                handleAddChildNode();
                closeContextMenu();
              }}
            >
              添加子节点
            </a>
          </li>
          <li className={selectedNodeId === documentId ? "disabled" : ""}>
            <a
              onClick={() => {
                if (selectedNodeId !== documentId) {
                  handleAddSiblingNode();
                }
                closeContextMenu();
              }}
            >
              添加同级节点
            </a>
          </li>
        </ContextMenu>
      )}
    </div>
  );
};

export default WriteNodeTree;
