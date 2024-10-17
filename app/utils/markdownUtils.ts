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
    id: "Article",
    content,
    children: [],
    depth: 0,
    fileName: "Article",
  };
  const stack: MarkdownNode[] = [docNode];
  // console.log("####tree:", tree);
  let nodeIdCounter = 0;

  visit(tree, (node: UnistNode) => {
    if (node.type === "heading") {
      const headingNode = node as UnistNode & { depth: number };
      const headingContent = stringifier.stringify(node).trim();
      const newNode: MarkdownNode = {
        id: `Chapter-${nodeIdCounter++}`, // 使用递增的序列号
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
        // console.log("###stack.length - 1:", stack.length - 1);
        // console.log("####currentNode.content:", currentNode.content);
        // console.log("####nodeContent:", nodeContent);
        if (!currentNode.content.includes(nodeContent.trim())) {
          // console.log("#拼接...");
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
  const node = findNodeById(parsedNodes, nodeId);
  console.log("####fullContent:", fullContent);
  console.log("####oldContent:", node?.content);
  console.log("####newContent:", newContent);
  if (!node) {
    console.error(`Node with id ${nodeId} not found`);
    return fullContent;
  }

  // 使用字符串替换，确保只替换一次
  return fullContent.replace(node?.content, newContent);
};

// 辅助函数：提取文件名（第一个一级标题）
export const extractFileName = (content: string): string => {
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.startsWith("# ")) {
      return line.substring(2).trim();
    }
  }
  return "未命名文档";
};

export const highlightSearchResult = (content: string, query: string) => {
  const regex = new RegExp(`(${query})`, "gi");
  const words = content.split(" ");
  const matchIndex = words.findIndex((word) => regex.test(word));

  if (matchIndex === -1) return content.slice(0, 200) + "...";

  const start = Math.max(0, matchIndex - 5);
  const end = Math.min(words.length, matchIndex + 15);
  let excerpt = words.slice(start, end).join(" ");

  if (start > 0) excerpt = "..." + excerpt;
  if (end < words.length) excerpt += "...";

  return excerpt.replace(regex, "<mark>$1</mark>");
};
