import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export interface CustomNodeData {
  label: string;
  content: string;
  depth: number;
  isSelected: boolean;
  isDragging: boolean;
  isPossibleTarget: boolean;
  layout: "LR" | "TB";
}

const CustomNode = ({ data, isConnectable }: NodeProps<CustomNodeData>) => {
  const isRoot = data.depth === 0;
  const nodeClass = `px-3 py-2 rounded-md border-2 transition-all duration-200 w-full h-full flex items-center justify-center ${
    isRoot
      ? "bg-green-100 border-green-200"
      : data.isSelected
      ? "bg-green-500 border-green-500 text-white"
      : "bg-white border-gray-300"
  } ${data.isDragging ? "shadow-lg" : ""} ${
    data.isPossibleTarget ? "border-blue-500" : ""
  }`;

  return (
    <div className={nodeClass}>
      <Handle
        type="target"
        position={data.layout === "TB" ? Position.Top : Position.Left}
        isConnectable={isConnectable}
      />
      <div className="text-sm font-medium truncate">{data.label}</div>
      <Handle
        type="source"
        position={data.layout === "TB" ? Position.Bottom : Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(CustomNode);
