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
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import dagre from "dagre";
import { debounce } from "lodash";
import CustomNode from "./CustomNode";
import ContextMenu from "./ContextMenu";
import {
  DocumentNode,
  formatGraphData,
  dfsTraversal,
} from "../utils/treeUtils";
import { useQuery, useMutation } from "@apollo/client";
import { createGetDocumentsQuery } from "../graphql/queries";
import {
  CHANGE_DOCUMENT_PARENT,
  CREATE_SUB_DOCUMENT,
  DELETE_DOCUMENTS_AND_CHILDREN,
} from "../graphql/mutations";
import { useDocumentContext } from "../contexts/DocumentContext";
import { useParams } from "next/navigation";
import { useToast } from "../contexts/ToastContext";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { getLayoutedElements } from "../utils/treeUtils";
import TreeSkeleton from "./TreeSkeleton";

interface DocumentTreeProps {
  mode: "read" | "write";
}

const DocumentTree: React.FC<DocumentTreeProps> = ({ mode }) => {
  const params = useParams();
  const documentId = params?.id as string;
  const { selectedNode, setSelectedNode } = useDocumentContext();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, getIntersectingNodes } = useReactFlow();
  const [layout, setLayout] = useState<"LR" | "TB">("LR");
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
    variables: {
      where: { id: documentId },
      sort: [
        { node: { fileName: "ASC", updatedAt: "ASC" }, edge: { order: "ASC" } },
      ],
    },
    skip: !documentId,
  });

  useEffect(() => {
    if (data?.documents?.length) {
      const formattedData = formatGraphData(data.documents[0], layout);
      setNodes(formattedData.nodes);
      setEdges(formattedData.edges);
    }
  }, [data, layout, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node as DocumentNode);
    },
    [setSelectedNode]
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

  // 默认请求深度
  const handleDepthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepth = parseInt(event.target.value, 10);
    setQueryDepth(newDepth);
  };

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
        showToast("添加节点失败，请重试", "error");
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

  const handleDeleteNodeFromMenu = useCallback(() => {
    if (contextMenu) {
      handleDeleteNode(contextMenu.nodeId);
      closeContextMenu();
    }
  }, [contextMenu, handleDeleteNode, closeContextMenu]);

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [closeContextMenu]);

  // 设定节点的样式
  const nodeTypes = { customNode: CustomNode };

  if (loading) return <TreeSkeleton />;
  if (error)
    return (
      <div className="alert alert-error">
        <span>错误: {error.message}</span>
      </div>
    );

  return (
    <div className="h-full relative">
      <div className="absolute top-0 left-0 z-10 m-2">
        <select
          value={queryDepth}
          onChange={handleDepthChange}
          className="select select-bordered select-sm w-full max-w-xs"
        >
          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((depth) => (
            <option key={depth} value={depth}>
              深度: {depth}
            </option>
          ))}
        </select>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onClick={closeContextMenu}
      >
        <Controls>
          <ControlButton onClick={onToggleLayout} title="切换布局">
            <ViewColumnsIcon
              className={`w-4 h-4 ${
                layout === "TB" ? "transform rotate-90" : ""
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
              href={`/${mode}/${contextMenu.nodeId}`}
              onClick={closeContextMenu}
            >
              <span>从当前节点打开</span>
            </Link>
          </li>
          {mode === "write" && (
            <>
              <li>
                <a onClick={handleAddChildNode}>添加子节点</a>
              </li>
              <li>
                <a onClick={handleAddSiblingNode}>添加同级节点</a>
              </li>
              <li>
                <a onClick={handleDeleteNodeFromMenu}>删除节点</a>
              </li>
            </>
          )}
        </ContextMenu>
      )}
    </div>
  );
};

export default DocumentTree;
