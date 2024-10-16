import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface CustomNodeData {
  label: string;
  content?: string;
  depth: number;
  isSelected: boolean;
  isDragging?: boolean;
  isPossibleTarget?: boolean;
  layout: "LR" | "TB";
  isPublished?: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({
  data,
  isConnectable,
}) => (
  <div
    className={`
      px-4 py-3 rounded-lg shadow-md transition-all duration-200 ease-in-out
      ${
        data.depth === 0
          ? "bg-primary text-primary-content font-semibold"
          : "bg-base-100 text-base-content"
      }
      ${
        data.isSelected
          ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-105"
          : "hover:shadow-lg hover:-translate-y-0.5"
      }
      ${data.isDragging ? "shadow-xl scale-105 z-50" : ""}
      ${data.isPossibleTarget ? "ring-2 ring-secondary ring-opacity-50" : ""}
      border border-base-300
      hover:bg-base-200
      cursor-pointer
      transform perspective-1000
    `}
    style={{
      transform: data.isDragging ? "translateZ(20px)" : "translateZ(0)",
      transition: "transform 0.3s ease-in-out",
    }}
  >
    <span className="text-sm font-medium block truncate">{data.label}</span>
    {data.isPublished !== undefined && (
      <span
        className={`text-xs ${
          data.isPublished ? "text-green-500" : "text-red-500"
        }`}
      >
        {data.isPublished ? "已发布" : "未发布"}
      </span>
    )}
    <Handle
      type="source"
      position={data.layout === "LR" ? Position.Right : Position.Bottom}
      isConnectable={isConnectable}
      className="w-3 h-3 bg-secondary/70 hover:bg-secondary"
    />
    <Handle
      type="target"
      position={data.layout === "LR" ? Position.Left : Position.Top}
      isConnectable={isConnectable}
      className="w-3 h-3 bg-secondary/70 hover:bg-secondary"
    />
  </div>
);

export default CustomNode;
