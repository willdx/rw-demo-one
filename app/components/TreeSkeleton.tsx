import React from "react";

const TreeSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full bg-forest-bg">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-forest-accent rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-forest-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-forest-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default TreeSkeleton;
