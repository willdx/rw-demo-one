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
  const nodeClass = `px-3 py-2 rounded-md border-2 transition-all duration-200 w-full h-full flex items-center justify-center 
    ${
      data.isSelected
        ? "bg-green-500 border-green-500 text-white"
        : "bg-white border-gray-300"
    }
    ${
      data.isDragging
        ? "shadow-xl scale-105 bg-green-50 border-green-400 border-2"
        : ""
    } 
    ${
      data.isPossibleTarget
        ? "border-green-300 border-dashed border-2 bg-green-50"
        : ""
    }
    ${
      !data.isDragging && !data.isPossibleTarget && !data.isSelected
        ? "hover:border-green-200 hover:bg-green-50"
        : ""
    }
  `;

  return (
    <div className={nodeClass}>
      <Handle
        type="target"
        position={data.layout === "TB" ? Position.Top : Position.Left}
        isConnectable={isConnectable}
        className={`w-3 h-3 ${data.isPossibleTarget ? "bg-green-400" : ""}`}
      />
      <div className="w-full max-h-full overflow-hidden">
        <div 
          className={`text-base font-medium line-clamp-4 text-center
            ${data.isDragging ? "text-green-700" : ""} 
            ${data.isPossibleTarget ? "text-green-600" : ""}
          `}
        >
          {data.label}
        </div>
      </div>
      <Handle
        type="source"
        position={data.layout === "TB" ? Position.Bottom : Position.Right}
        isConnectable={isConnectable}
        className={`w-3 h-3 ${data.isDragging ? "bg-green-400" : ""}`}
      />
    </div>
  );
};

export default memo(CustomNode);
