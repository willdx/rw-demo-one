import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_NODE_REFERENCES } from "../graphql/queries";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

interface DisconnectNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: (nodeIds: string[]) => void;
  nodeId: string;
  mode?: "read" | "write";
}

const DisconnectNodeModal: React.FC<DisconnectNodeModalProps> = ({
  isOpen,
  onClose,
  onDisconnect,
  nodeId,
  mode = "write",
}) => {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const { data, loading, error } = useQuery(GET_NODE_REFERENCES, {
    variables: {
      nodeId,
      page: 1,
      limit: 10,
    },
    skip: !nodeId,
  });

  const handleToggleNode = (id: string) => {
    setSelectedNodes((prev) =>
      prev.includes(id) ? prev.filter((nodeId) => nodeId !== id) : [...prev, id]
    );
  };

  const handleDisconnect = () => {
    onDisconnect(selectedNodes);
    setSelectedNodes([]);
  };

  const renderReferenceList = () => {
    if (loading) return <div className="loading loading-spinner loading-md"></div>;
    if (error) return <div className="text-error">加载出错: {error.message}</div>;
    if (!data?.getNodeReferences?.references?.length)
      return <div className="text-gray-500">没有引用的节点</div>;

    return data.getNodeReferences.references.map((doc: any) => (
      <div key={doc.id} className="card bg-base-200 shadow-sm mb-2">
        <div className="card-body p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={selectedNodes.includes(doc.id)}
              onChange={() => handleToggleNode(doc.id)}
            />
            <h3 className="card-title text-base">{doc.fileName}</h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{doc.content}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              更新于:{" "}
              {formatDistanceToNow(new Date(doc.updatedAt), {
                locale: zhCN,
                addSuffix: true,
              })}
            </span>
            <Link
              href={`/${mode}/${doc.id}`}
              target="_blank"
              className="btn btn-xs btn-ghost"
            >
              打开
            </Link>
          </div>
        </div>
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">取消引用卡片</h3>
        <div className="py-4">
          <div className="mt-4 max-h-96 overflow-y-auto">{renderReferenceList()}</div>
        </div>
        <div className="modal-action">
          <button
            className="btn btn-error"
            onClick={handleDisconnect}
            disabled={selectedNodes.length === 0}
          >
            取消引用
          </button>
          <button className="btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisconnectNodeModal; 