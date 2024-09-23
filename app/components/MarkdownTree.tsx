"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import dagre from "dagre";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;

interface MarkdownNode {
  id: string;
  content: string;
  fullContent: string; // 新增：存储完整的内容
  children: MarkdownNode[];
}

interface MarkdownTreeProps {
  content: string;
  onNodeClick: (content: string) => void;
}

const CustomNode: React.FC<{ data: { label: string; isSelected: boolean } }> = ({ data }) => (
  <>
    <div className={`px-3 py-2 bg-white border-2 rounded-md shadow-sm transition-all duration-200 ${
      data.isSelected ? 'border-forest-accent bg-forest-accent/10' : 'border-forest-border'
    }`}>
      <span className="text-sm font-medium text-forest-text">{data.label}</span>
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

const parseMarkdown = (content: string): MarkdownNode[] => {
  const lines = content.split('\n');
  const root: MarkdownNode[] = [];
  const stack: MarkdownNode[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#')) {
      const level = trimmedLine.split(' ')[0].length;
      const newNode: MarkdownNode = { 
        id: `node-${index}`, 
        content: trimmedLine.substring(level).trim(),
        fullContent: trimmedLine + '\n', // 初始化为当前行
        children: [] 
      };
      
      while (stack.length >= level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        root.push(newNode);
      } else {
        stack[stack.length - 1].children.push(newNode);
      }
      stack.push(newNode);
    } else if (stack.length > 0) {
      // 将非标题行添加到当前节点的 fullContent
      stack[stack.length - 1].fullContent += line + '\n';
    }
  });

  // 处理完所有行后，为每个节点设置完整内容
  const setFullContent = (node: MarkdownNode) => {
    node.children.forEach(setFullContent);
  };
  root.forEach(setFullContent);

  return root;
};

const formatMarkdownData = (
  markdownNodes: MarkdownNode[]
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  const processNode = (node: MarkdownNode, depth: number = 0) => {
    const nodeId = node.id;
    nodes.push({
      id: nodeId,
      type: "customNode",
      data: {
        label: node.content,
        content: node.fullContent, // 使用完整内容
        isSelected: false,
      },
      position: { x: depth * (NODE_WIDTH + 50), y: yOffset },
    });

    yOffset += NODE_HEIGHT + 20;

    node.children.forEach((childNode) => {
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
  };

  markdownNodes.forEach((node) => processNode(node));

  return { nodes, edges };
};

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

const MarkdownTree: React.FC<MarkdownTreeProps> = ({ content, onNodeClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const { fitView } = useReactFlow();
  const [layout, setLayout] = useState<"LR" | "TB">("LR");

  const formattedData = useMemo(() => {
    const parsedNodes = parseMarkdown(content);
    return formatMarkdownData(parsedNodes);
  }, [content]);

  useEffect(() => {
    const layoutedElements = getLayoutedElements(formattedData.nodes, formattedData.edges, layout);
    setNodes(layoutedElements.nodes);
    setEdges(layoutedElements.edges);
  }, [formattedData, layout, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length > 0) {
      fitView({ padding: 0.2, duration: 200 });
    }
  }, [nodes, fitView]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSelected: n.id === node.id,
        },
      }))
    );
    onNodeClick(node.data.content as string);
  }, [setNodes, onNodeClick]);

  const onToggleLayout = useCallback(() => {
    setLayout((prevLayout) => (prevLayout === "LR" ? "TB" : "LR"));
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      className="w-full h-full bg-forest-bg"
      nodeTypes={{ customNode: CustomNode }}
    >
      <Controls>
        <ControlButton onClick={onToggleLayout} title="切换布局">
          <ViewColumnsIcon className={`w-4 h-4 ${layout === "TB" ? "transform rotate-90" : ""}`} />
        </ControlButton>
      </Controls>
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#e0e0e0" />
    </ReactFlow>
  );
};

export default MarkdownTree;
