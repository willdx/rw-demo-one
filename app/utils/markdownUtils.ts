import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import { v4 as uuid } from "uuid";
import { Node as UnistNode } from "unist";

export interface MarkdownNode {
  id: string;
  content: string;
  children: MarkdownNode[];
  depth: number;
  fileName: string;
}

export const parseMarkdown = (content: string): MarkdownNode[] => {
  const processor = unified().use(remarkParse);
  const tree = processor.parse(content);
  const stringifier = unified().use(remarkStringify);

  const docNode: MarkdownNode = {
    id: "doc",
    content,
    children: [],
    depth: 0,
    fileName: "Document",
  };
  const stack: MarkdownNode[] = [docNode];
  console.log("####tree:", tree);

  visit(tree, (node: UnistNode) => {
    if (node.type === "heading") {
      const headingNode = node as UnistNode & { depth: number };
      const headingContent = stringifier.stringify(node).trim();
      const newNode: MarkdownNode = {
        id: `h-${uuid()}`,
        content: headingContent,
        children: [],
        depth: headingNode.depth,
        fileName: headingContent.replace(/^#+\s*/, "").trim(),
      };

      while (
        stack.length > 1 &&
        stack[stack.length - 1].depth >= headingNode.depth
      ) {
        stack.pop();
      }
      stack[stack.length - 1].children.push(newNode);
      stack.push(newNode);
    } else {
      if (stack.length > 1) {
        const currentNode = stack[stack.length - 1];
        const nodeContent = stringifier.stringify(node);
        console.log("###stack.length - 1:", stack.length - 1);
        console.log("####currentNode.content:", currentNode.content);
        console.log("####nodeContent:", nodeContent);
        if (!currentNode.content.includes(nodeContent.trim())) {
          console.log("##拼接...");
          currentNode.content += "\n\n" + nodeContent + "\n";
        }
      }
    }
  });

  return [docNode];
};

export const findNodeById = (
  nodes: MarkdownNode[],
  id: string
): MarkdownNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const foundInChildren = findNodeById(node.children, id);
    if (foundInChildren) {
      return foundInChildren;
    }
  }
  return null;
};

export const replaceNodeContent = (
  fullContent: string,
  parsedNodes: MarkdownNode[],
  nodeId: string,
  newContent: string
): string => {
  console.log("####parsedNodes:", parsedNodes);
  const node = findNodeById(parsedNodes, nodeId);
  console.log("####fullContent:", fullContent);
  console.log("####oldContent:", node?.content);
  console.log("####newContent:", newContent);
  if (!node) {
    console.error(`Node with id ${nodeId} not found`);
    return fullContent;
  }

  // 使用字符串替换，确保只替换一次
  // TODO: 请node?.content是否存在于fullContent中，输出日志
  return fullContent.replace(node?.content, newContent);
};
