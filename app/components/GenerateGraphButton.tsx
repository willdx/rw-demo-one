import React from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface GenerateGraphButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isCompleted: boolean;
}

const GenerateGraphButton: React.FC<GenerateGraphButtonProps> = ({
  onClick,
  isDisabled,
  isCompleted,
}) => {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`btn btn-primary ${
          isDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Generate Graph
        <QuestionMarkCircleIcon className="w-5 h-5 ml-2" />
      </button>
      {isDisabled && isCompleted && (
        <div className="tooltip tooltip-top" data-tip="已生成知识图谱">
          <span className="absolute inset-0"></span>
        </div>
      )}
    </div>
  );
};

export default GenerateGraphButton;
