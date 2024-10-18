import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, children }) => {
  return (
    <div
      className="absolute z-50"
      style={{ left: x, top: y }}
    >
      <ul className="menu bg-base-200 rounded-box w-56 shadow-lg">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return (
              <li className="tooltip" data-tip={child.props['data-tip']}>
                {React.cloneElement(child, { className: 'menu-item' })}
              </li>
            );
          }
          return child;
        })}
      </ul>
    </div>
  );
};

export default ContextMenu;
