"use client";

import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { debounce } from "lodash";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
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
import {
  CREATE_SUB_DOCUMENT,
  CHANGE_DOCUMENT_PARENT,
  DELETE_DOCUMENTS_AND_CHILDREN,
} from "../graphql/mutations";
import { useToast } from "../contexts/ToastContext";
import { createGetDocumentsQuery } from "../graphql/queries";
import CustomNode from "./CustomNode";

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
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, getIntersectingNodes } = useReactFlow();
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

  const [queryDepth, setQueryDepth] = useState(3);

  const GET_DOCUMENTS = useMemo(
    () => createGetDocumentsQuery(queryDepth),
    [queryDepth]
  );

  const { loading, error, data, refetch } = useQuery(GET_DOCUMENTS, {
    variables: {
      where: { id: documentId },
      sort: [
        {
          node: { fileName: "ASC", updatedAt: "ASC" },
          edge: { order: "ASC" },
        },
      ],
    },
    skip: !token,
  });

  const [createSubDocument] = useMutation(CREATE_SUB_DOCUMENT, {
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

  const [deleteDocumentsAndChildren] = useMutation(
    DELETE_DOCUMENTS_AND_CHILDREN
  );

  const [isDeleting, setIsDeleting] = useState(false);

  const [changeDocumentParent] = useMutation(CHANGE_DOCUMENT_PARENT);

  const handleAddNode = useCallback(
    async (parentId: string) => {
      if (!parentId || !user) return; // 确保有用户信

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

        await refetch();
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
      const order = dfsTraversal(nodes as Node[], edges);
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
        updateEdgeStylesOnNodeClick(newSelectedNodeId, nodes as Node[], eds)
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
    nodeId: string;
  } | null>(null);

  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      event.stopPropagation();
      const pane = document.querySelector(".react-flow__pane");
      if (pane) {
        const rect = pane.getBoundingClientRect();
        setContextMenu({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          nodeId: node.id,
        });
      }
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (contextMenu) {
      setNodeToDelete(contextMenu.nodeId);
      const modal = document.getElementById(
        "delete-confirm-modal"
      ) as HTMLDialogElement;
      if (modal) {
        modal.showModal();
      }
      closeContextMenu();
    }
  }, [contextMenu, closeContextMenu]);

  const confirmDelete = useCallback(async () => {
    if (nodeToDelete) {
      setIsDeleting(true);
      try {
        const response = await deleteDocumentsAndChildren({
          variables: { id: nodeToDelete },
        });
        if (response.data.deleteDocumentsAndChildren) {
          showToast("节点删除成功", "success");
          await refetch();
        } else {
          showToast("节点删除失败", "error");
        }
      } catch (error) {
        console.error("删除节点时出错:", error);
        showToast("删除节点失败，请重试", "error");
      } finally {
        setIsDeleting(false);
        setNodeToDelete(null);
        const modal = document.getElementById(
          "delete-confirm-modal"
        ) as HTMLDialogElement;
        if (modal) {
          modal.close();
        }
      }
    }
  }, [nodeToDelete, deleteDocumentsAndChildren, refetch, showToast]);

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

  const debouncedRefetch = useCallback(
    debounce(() => {
      refetch();
    }, 500),
    [refetch]
  );

  useEffect(() => {
    debouncedRefetch();
  }, [queryDepth, debouncedRefetch]);

  const handleDepthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepth = parseInt(event.target.value, 10);
    setQueryDepth(newDepth);
  };

  // 添加新的状态来跟踪拖动和可能的目标节点
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [possibleTargets, setPossibleTargets] = useState<string[]>([]);

  // 更新 onNodeDragStart 处理函数
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setDraggedNode(node);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isDragging: n.id === node.id },
        }))
      );
    },
    [setNodes]
  );

  // 更新 onNodeDrag 处理函数
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!draggedNode) return;

      const intersectingNodes = getIntersectingNodes(node);
      const possibleTargetIds = intersectingNodes
        .filter((n) => n.id !== node.id && n.id !== node.parentNode)
        .map((n) => n.id);

      setPossibleTargets(possibleTargetIds);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isPossibleTarget: possibleTargetIds.includes(n.id),
          },
        }))
      );
    },
    [draggedNode, getIntersectingNodes, setNodes]
  );

  // 更新 handleNodeMove 函数
  const handleNodeMove = useCallback(
    async (node: Node, newParentId: string) => {
      const oldParentId = node?.parent?.id;
      console.log(`handleNodeMove 被调用，node: ${JSON.stringify(node)}`);
      console.log(`oldParentId: ${oldParentId}, newParentId: ${newParentId}`);

      if (oldParentId === newParentId) {
        console.log("节点未发生移动");
        return;
      }

      try {
        await changeDocumentParent({
          variables: { nodeId: node.id, oldParentId, newParentId },
        });

        showToast("节点位置更新成功", "success");
        refetch();
      } catch (error) {
        console.error("更新节点位置失败:", error);
        showToast("更新节点位置失败，请重试", "error");
      }
    },
    [changeDocumentParent, showToast, refetch]
  );

  // 更新 onNodeDragStop 处理函数
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!draggedNode) return;

      const intersectingNodes = getIntersectingNodes(node);
      const newParentNode = intersectingNodes.find(
        (n) => n.id !== node.id && n.id !== node.parentNode
      );

      if (newParentNode) {
        handleNodeMove(node, newParentNode.id);
      }

      setDraggedNode(null);
      setPossibleTargets([]);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isDragging: false, isPossibleTarget: false },
        }))
      );
    },
    [draggedNode, getIntersectingNodes, handleNodeMove, setNodes]
  );

  // 更新 nodeTypes
  const nodeTypes = { customNode: CustomNode };

  if (loading) return <TreeSkeleton />;
  if (error)
    return (
      <div className="alert alert-error">
        <span>错误: {error.message}</span>
      </div>
    );

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-0 left-0 z-10 m-2">
        <div className="tooltip tooltip-bottom" data-tip="切换深度">
          <select
            value={queryDepth}
            onChange={handleDepthChange}
            className="select select-bordered select-sm w-full max-w-xs"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((depth) => (
              <option key={depth} value={depth}>
                {depth}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onClick={closeContextMenu}
        // nodeTypes={nodeTypes}
        fitView
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
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
          <li>
            <a onClick={handleDeleteNode}>删除节点</a>
          </li>
        </ContextMenu>
      )}
      <dialog
        id="delete-confirm-modal"
        className="modal modal-bottom sm:modal-middle"
      >
        <form method="dialog" className="modal-box">
          <h3 className="font-bold text-lg">确认删除</h3>
          <p className="py-4">确定要删除这个节点及其所有子节点吗？</p>
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => {
                setNodeToDelete(null);
                (
                  document.getElementById(
                    "delete-confirm-modal"
                  ) as HTMLDialogElement
                ).close();
              }}
              disabled={isDeleting}
            >
              取消
            </button>
            <button
              className={`btn btn-primary ${isDeleting ? "loading" : ""}`}
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              确定
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

export default WriteNodeTree;
