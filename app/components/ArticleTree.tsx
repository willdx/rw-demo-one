import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  ControlButton,
  BackgroundVariant,
  useReactFlow,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import CustomNode from "./CustomNode";
import ContextMenu from "./ContextMenu";
import {
  DocumentNode,
  formatGraphData,
  dfsTraversal,
  getLayoutedElements,
  updateEdgeStylesOnNodeClick,
  FormattedDocumentNode,
} from "../utils/treeUtils";
import { useQuery, useMutation, gql } from "@apollo/client";
import { createGetDocumentsQuery } from "../graphql/queries";
import {
  CHANGE_DOCUMENT_PARENT,
  CREATE_SUB_DOCUMENT,
  DELETE_DOCUMENTS_AND_CHILDREN,
  UPDATE_PUBLISH_DOCUMENT_IS_PUBLISHED,
} from "../graphql/mutations";
import { useDocumentContext } from "../contexts/DocumentContext";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "../contexts/ToastContext";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import TreeSkeleton from "./TreeSkeleton";
import { nodeTypes } from "../utils/constant";
import ConfirmDialog from "./ConfirmDialog";
import { ListBulletIcon } from "@heroicons/react/24/outline";

interface DocumentTreeProps {
  mode: "read" | "write";
}

const GENERATE_KNOWLEDGE_GRAPH = gql`
  mutation GenerateKnowledgeGraph($documentId: ID!) {
    generateKnowledgeGraph(documentId: $documentId) {
      success
      message
    }
  }
`;

const ArticleTree: React.FC<DocumentTreeProps> = ({ mode }) => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  const { selectedNode, setSelectedNode } = useDocumentContext();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, getIntersectingNodes } = useReactFlow();
  const [queryDepth, setQueryDepth] = useState(3);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [possibleTargets, setPossibleTargets] = useState<string[]>([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  const [changeDocumentParent] = useMutation(CHANGE_DOCUMENT_PARENT);
  const [createSubDocument] = useMutation(CREATE_SUB_DOCUMENT);
  const [deleteDocumentsAndChildren] = useMutation(
    DELETE_DOCUMENTS_AND_CHILDREN
  );
  const [updateDocumentIsPublished] = useMutation(
    UPDATE_PUBLISH_DOCUMENT_IS_PUBLISHED
  );

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const GET_DOCUMENTS = useMemo(
    () => createGetDocumentsQuery(queryDepth),
    [queryDepth]
  );
  const { loading, error, data, refetch } = useQuery(GET_DOCUMENTS, {
    variables: useMemo(() => {
      const baseWhere = { id: documentId };
      const baseChildrenWhere = {};
      const baseSort = [
        { node: { fileName: "ASC", updatedAt: "ASC" }, edge: { order: "ASC" } },
      ];

      if (mode === "write" && user) {
        return {
          where: { ...baseWhere, creator: { id: user.id } },
          childrenWhere: { node: { creator: { id: user.id } } },
          sort: baseSort,
        };
      } else if (mode === "read") {
        return {
          where: { ...baseWhere, isPublished: true },
          childrenWhere: { node: { isPublished: true } },
          sort: baseSort,
        };
      }

      return {
        where: baseWhere,
        childrenWhere: baseChildrenWhere,
        sort: baseSort,
      };
    }, [documentId, mode, user]),
    skip: !documentId,
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (data?.documents?.length) {
      const { nodes: initialNodes, edges } = formatGraphData(data.documents[0], "LR");
      setNodes(
        initialNodes.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: n.id === selectedNode?.id },
        }))
      );
      setEdges(edges);
      if (isFirstRender.current) {
        setSelectedNode(initialNodes[0] as DocumentNode);
        isFirstRender.current = false;
      }
    }
  }, [data, setNodes, setEdges, setSelectedNode, selectedNode]);

  const [dfsOrder, setDfsOrder] = useState<string[]>([]);
  const [currentDfsIndex, setCurrentDfsIndex] = useState<number>(0);
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const order = dfsTraversal(nodes, edges);
      setDfsOrder(order);
      setCurrentDfsIndex(order.findIndex((id) => id === selectedNode?.id) || 0);
    }
  }, [nodes, edges, selectedNode]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log("handleNodeClick node:", node);
      setSelectedNode(node as DocumentNode);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: n.id === node.id },
        }))
      );
      setEdges((eds) => updateEdgeStylesOnNodeClick(node.id, nodes, eds));
    },
    [setSelectedNode, nodes, setEdges, setNodes]
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
          if (node) {
            setSelectedNode(node as FormattedDocumentNode);
            setEdges((eds) => updateEdgeStylesOnNodeClick(node.id, nodes, eds));
          }
          return newIndex;
        });
      }
    },
    [dfsOrder, nodes, setSelectedNode, setEdges]
  );

  const updateLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodesRef.current,
      edgesRef.current,
      "LR"
    );
    const updatedNodes = layoutedNodes.map((node) => ({
      ...node,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));
    setNodes(updatedNodes);

    const updatedEdges = layoutedEdges.map((edge) => ({
      ...edge,
      type: "smoothstep",
      animated: true,
    }));
    setEdges(updatedEdges);

    setTimeout(() => fitView(), 0);
  }, [setNodes, setEdges, fitView]);

  const handleDepthChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newDepth = parseInt(event.target.value, 10);
      setQueryDepth(newDepth);
    },
    []
  );

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
      console.log(`handleNodeMove 被调用node: ${JSON.stringify(node)}`);
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
        (n) => n.id !== node.id && n.id !== node?.parent?.id
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

  const handleAddNode = useCallback(
    async (parentId: string) => {
      if (!parentId || !user) return;

      try {
        const { data } = await createSubDocument({
          variables: {
            parentId,
            fileName: "Untitled",
            content: "# Untitled\n",
            creatorId: user.id,
          },
        });

        const updatedNode = data.updateDocuments.documents[0];
        await refetch();
        setSelectedNode(updatedNode);
        showToast("节点添加成功", "success");
      } catch (error) {
        console.error("添加节点失败:", error);
        showToast("添加节点失败，请重���", "error");
      }
    },
    [createSubDocument, refetch, setSelectedNode, showToast, user]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      try {
        const response = await deleteDocumentsAndChildren({
          variables: { id: nodeId },
        });
        if (response.data.deleteDocumentsAndChildren) {
          showToast("节点删除成功", "success");
          refetch();
        } else {
          showToast("节点删除失败", "error");
        }
      } catch (error) {
        console.error("删除节点时出错:", error);
        showToast("删除节点失败，请重试", "error");
      }
    },
    [deleteDocumentsAndChildren, refetch, showToast]
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

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

  const handleAddChildNode = useCallback(() => {
    if (contextMenu) {
      handleAddNode(contextMenu.nodeId);
      closeContextMenu();
    }
  }, [contextMenu, handleAddNode, closeContextMenu]);

  const handleAddSiblingNode = useCallback(() => {
    if (contextMenu) {
      const parentNode = nodes.find((node) =>
        edges.some(
          (edge) =>
            edge.target === contextMenu.nodeId && edge.source === node.id
        )
      );
      if (parentNode) {
        handleAddNode(parentNode.id);
      }
      closeContextMenu();
    }
  }, [contextMenu, handleAddNode, nodes, edges, closeContextMenu]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGenerateGraphDialogOpen, setIsGenerateGraphDialogOpen] =
    useState(false);

  const [generateKnowledgeGraph, { loading: generatingGraph }] = useMutation(
    GENERATE_KNOWLEDGE_GRAPH,
    {
      onCompleted: (data) => {
        if (data.generateKnowledgeGraph.success) {
          showToast("知识图谱生成成功", "success");
        } else {
          showToast(
            data.generateKnowledgeGraph.message || "生成知识图谱失败",
            "error"
          );
        }
      },
      onError: (error) => {
        console.error("生成知识图谱时出错:", error);
        showToast("生成知识图谱失败，请稍后重试", "error");
      },
    }
  );

  const handleDeleteNodeFromMenu = useCallback(() => {
    if (contextMenu && selectedNode) {
      setIsDeleteDialogOpen(true);
      closeContextMenu();
    }
  }, [contextMenu, selectedNode, closeContextMenu]);

  const confirmDeleteNode = useCallback(() => {
    if (selectedNode) {
      handleDeleteNode(selectedNode.id);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedNode, handleDeleteNode]);

  const openGenerateGraphDialog = useCallback(() => {
    if (selectedNode) {
      setIsGenerateGraphDialogOpen(true);
    }
  }, [selectedNode]);

  const confirmGenerateGraph = useCallback(() => {
    if (selectedNode) {
      generateKnowledgeGraph({ variables: { documentId: selectedNode.id } });
      setIsGenerateGraphDialogOpen(false);
    }
  }, [selectedNode, generateKnowledgeGraph]);

  const handlePublishToggle = useCallback(
    async (nodeId: string, currentPublishState: boolean) => {
      try {
        await updateDocumentIsPublished({
          variables: {
            id: nodeId,
            isPublished: !currentPublishState,
          },
        });
        showToast("发布状态更新成功", "success");
        refetch();
      } catch (error) {
        console.error("更新发布状态失败:", error);
        showToast("更新发布状态失败，请重试", "error");
      }
    },
    [updateDocumentIsPublished, showToast, refetch]
  );

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeContextMenu, handleKeyDown]);

  useEffect(() => {
    if (data && data.documents && data.documents.length === 0) {
      router.push("/404");
    }
  }, [data, router]);

  if (loading) return <TreeSkeleton />;
  if (error)
    return (
      <div className="alert alert-error">
        <span>错误: {error.message}</span>
      </div>
    );

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView={true}
        onNodeDragStart={mode === "write" ? onNodeDragStart : () => {}}
        onNodeDrag={mode === "write" ? onNodeDrag : () => {}}
        onNodeDragStop={mode === "write" ? onNodeDragStop : () => {}}
        onNodeContextMenu={onNodeContextMenu}
        onClick={closeContextMenu}
      >
        <Controls>
          <ControlButton className="react-flow__controls-depth" title="树深">
            <div className="flex items-center">
              <ListBulletIcon className="w-4 h-4 mr-1" />
              <select
                value={queryDepth}
                onChange={handleDepthChange}
                className="bg-transparent border-none text-xs"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((depth) => (
                  <option key={depth} value={depth}>
                    {depth}
                  </option>
                ))}
              </select>
            </div>
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
          <Link
            href={`/${mode}/${contextMenu.nodeId}`}
            onClick={closeContextMenu}
          >
            从当前节点打开
          </Link>
          {mode === "write" && (
            <>
              <a onClick={handleAddChildNode}>添加子节点</a>
              <a onClick={handleAddSiblingNode}>添加同级节点</a>
              <a onClick={handleDeleteNodeFromMenu}>删除节点</a>
              <a
                onClick={openGenerateGraphDialog}
                className={`${
                  generatingGraph ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-tip={generatingGraph ? "正在生成知识图谱" : "生成知识图谱"}
              >
                生成知识图谱
              </a>
              <a
                onClick={() => {
                  if (selectedNode?.isPublished) {
                    handlePublishToggle(
                      selectedNode?.id,
                      !selectedNode?.isPublished
                    );
                  }
                  closeContextMenu();
                }}
              >
                {selectedNode?.isPublished ? "取消发布" : "发布文档"}
              </a>
            </>
          )}
        </ContextMenu>
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteNode}
        title={`确认删除节点: ${selectedNode?.fileName}`}
        content={`此操作将删除节点 "${selectedNode?.fileName}" 及其所有子节点，且不可撤销。确定要删除吗？`}
        confirmText="删除"
        cancelText="取消"
        confirmButtonClass="btn-error"
      />

      <ConfirmDialog
        isOpen={isGenerateGraphDialogOpen}
        onClose={() => setIsGenerateGraphDialogOpen(false)}
        onConfirm={confirmGenerateGraph}
        title={`确认生成知识图谱: ${selectedNode?.fileName}`}
        content={`确定要为节点 "${selectedNode?.fileName}" 生成知识图谱吗？这个操作可能需要一些时间。`}
        confirmText="生成"
        cancelText="取消"
      />

      {/* 加载指示器 */}
      {generatingGraph && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default ArticleTree;
