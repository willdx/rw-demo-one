import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { useDocumentContext } from "../contexts/DocumentContext";
import { useToast } from "../contexts/ToastContext";

const GENERATE_KNOWLEDGE_GRAPH = gql`
  mutation GenerateKnowledgeGraph($documentId: ID!) {
    generateKnowledgeGraph(documentId: $documentId) {
      success
      message
    }
  }
`;

const GenerateGraphButton: React.FC = () => {
  const { selectedNode } = useDocumentContext();
  const { showToast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [generateKnowledgeGraph, { loading }] = useMutation(
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

  const handleClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    setIsDialogOpen(false);
    if (selectedNode?.id) {
      generateKnowledgeGraph({ variables: { documentId: selectedNode.id } });
    }
  };

  const isDisabled = selectedNode?.status === "Completed" || loading;

  return (
    <>
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={isDisabled}
          className={`btn btn-primary ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Generate Graph
          <QuestionMarkCircleIcon className="w-5 h-5 ml-2" />
        </button>
        {isDisabled && selectedNode?.status === "Completed" && (
          <div className="tooltip tooltip-top" data-tip="已生成知识图谱">
            <span className="absolute inset-0"></span>
          </div>
        )}
      </div>

      {isDialogOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">确认生成知识图谱</h3>
            <p className="py-4">
              确定要生成知识图谱吗？这个操作可能需要一些时间。
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setIsDialogOpen(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </>
  );
};

export default GenerateGraphButton;
