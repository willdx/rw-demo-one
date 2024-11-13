import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_NODE_PARENTS } from "../graphql/queries";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

interface SelectParentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (parentIds: string[]) => void;
  nodeId: string;
  mode?: "read" | "write";
  newParentId: string;
}

const SelectParentsModal: React.FC<SelectParentsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nodeId,
  mode = "write",
  newParentId,
}) => {
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const { data, loading, error } = useQuery(GET_NODE_PARENTS, {
    variables: {
      nodeId,
      page: 1,
      limit: 10,
    },
    skip: !nodeId,
  });

  const handleToggleParent = (id: string) => {
    setSelectedParents((prev) =>
      prev.includes(id) ? prev.filter((parentId) => parentId !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedParents);
  };

  const renderParentsList = () => {
    if (loading) return <div className="loading loading-spinner loading-md"></div>;
    if (error) return <div className="text-error">加载出错: {error.message}</div>;
    if (!data?.getNodeParents?.parents?.length)
      return <div className="text-gray-500">没有父节点</div>;

    return data.getNodeParents.parents.map((doc: any) => (
      <div key={doc.id} className="card bg-base-200 shadow-sm mb-2">
        <div className="card-body p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={selectedParents.includes(doc.id)}
              onChange={() => handleToggleParent(doc.id)}
              disabled={doc.id === newParentId}
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
        <h3 className="font-bold text-lg">选择要断开的父节点</h3>
        <p className="py-2 text-sm text-gray-500">
          请选择要断开的父节点关系。新的父节点关系将被自动建立。
        </p>
        <div className="py-4">
          <div className="mt-4 max-h-96 overflow-y-auto">{renderParentsList()}</div>
        </div>
        <div className="modal-action">
          <button className="btn btn-error" onClick={handleConfirm}>
            确认断开
          </button>
          <button className="btn" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectParentsModal; 