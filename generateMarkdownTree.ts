import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { v4 as uuidv4 } from 'uuid';

// 定义树形节点的类型
interface TreeNode {
  id: string;
  type: 'heading';
  depth: number;
  fileName: string;
  content: string;
  children: TreeNode[];
}

// Markdown 转树形结构的函数
export const markdownToTree = (markdownText: string): TreeNode[] => {
  const processor = unified().use(remarkParse);
  const ast = processor.parse(markdownText); // 解析Markdown为AST
  const tree: TreeNode[] = [];
  const stack: Array<{ children: TreeNode[]; depth: number }> = [{ children: tree, depth: 0 }];

  let currentContent = '';

  visit(ast, (node) => {
    if (node.type === 'heading') {
      // 把之前收集到的内容保存到上一个节点
      if (stack.length > 1 && currentContent.trim() !== '') {
        stack[stack.length - 1].children[stack[stack.length - 1].children.length - 1].content += currentContent;
        currentContent = '';
      }

      // 找到当前节点应该插入的位置，并更新栈
      while (stack[stack.length - 1].depth >= node.depth) {
        stack.pop();
      }

      const fileName = node.children && node.children[0] && 'value' in node.children[0] ? node.children[0].value : '';
      const newNode: TreeNode = {
        id: uuidv4(),
        type: 'heading',
        depth: node.depth as number,
        fileName,
        content: `# ${fileName}\n`, // 初始内容为标题
        children: []
      };
      stack[stack.length - 1].children.push(newNode);
      stack.push({ children: newNode.children, depth: node.depth });
    } else if (node.type !== 'root') {
      currentContent += `${node.toString()}\n`; // 使用 toString 方法获取节点内容
    }
  });

  // 把最后的内容也添加到栈的末尾节点
  if (stack.length > 1 && currentContent.trim() !== '') {
    stack[stack.length - 1].children[stack[stack.length - 1].children.length - 1].content += currentContent;
  }

  return tree;
};



const markdownText = `
# H1
h1

## H2
h2

### H3
h3 content

# Another H1
content here
`;

// 调用转换函数并打印结果
const tree = markdownToTree(markdownText);
console.log(JSON.stringify(tree, null, 2));