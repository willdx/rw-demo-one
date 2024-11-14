import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 检查菜单是否超出视窗
    if (menuRef.current) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const parentRect = menu.parentElement?.getBoundingClientRect() || { 
        left: 0, 
        top: 0, 
        right: window.innerWidth, 
        bottom: window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // 计算可用空间
      const availableBottom = parentRect.height - y;
      const availableTop = y;
      const availableRight = parentRect.width - x;
      const availableLeft = x;
      
      let topPosition = y;
      let leftPosition = x;
      
      // 垂直方向调整
      if (menuRect.height > availableBottom) {
        // 如果底部空间不足，尝试向上显示
        if (availableTop > availableBottom) {
          // 如果上方空间更大，向上显示
          topPosition = Math.max(0, y - menuRect.height);
        } else {
          // 如果下方空间更大，固定在底部
          topPosition = Math.max(0, parentRect.height - menuRect.height);
        }
      }
      
      // 水平方向调整
      if (menuRect.width > availableRight) {
        // 如果右侧空间不足，尝试向左显示
        if (availableLeft > availableRight) {
          // 如果左侧空间更大，向左显示
          leftPosition = Math.max(0, x - menuRect.width);
        } else {
          // 如果右侧空间更大，固定在右侧
          leftPosition = Math.max(0, parentRect.width - menuRect.width);
        }
      }

      // 应用位置
      menu.style.top = `${topPosition}px`;
      menu.style.left = `${leftPosition}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50"
      style={{ left: x, top: y }}
    >
      <ul className="menu bg-base-200 rounded-box w-56 shadow-lg max-h-[60vh] overflow-y-auto">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childProps = {
              ...child.props,
              className: `menu-item hover:bg-base-300 ${child.props.className || ''}`.trim()
            };
            return (
              <li 
                className="tooltip" 
                data-tip={child.props['data-tip']}
              >
                {React.cloneElement(child, childProps)}
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
