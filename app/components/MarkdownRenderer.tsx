import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="h-full p-4 overflow-auto grid place-items-center"> {/* 使用 Grid 布局 */}
      <div className="prose prose-forest dark:prose-invert max-w-3xl bg-forest-content p-8 rounded-lg shadow-sm border border-forest-border w-full"> {/* 内层容器用于控制宽度和样式 */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1({ node, ...props }) {
              return (
                <h1 className="text-center border-b-0 mb-4" {...props}>
                  {props.children}
                </h1>
              );
            },
            h2({ node, ...props }) {
              return (
                <h2 className="border-b-0 mb-4" {...props}>
                  {props.children}
                </h2>
              );
            },
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneLight}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-md"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={`${className} bg-forest-code-bg text-forest-code rounded px-1`} {...props}>
                  {children}
                </code>
              );
            },
            table({ node, ...props }) {
              return <table className="border-collapse w-full" {...props} />;
            },
            th({ node, ...props }) {
              return <th className="border border-forest-border p-2 bg-forest-bg font-semibold" {...props} />;
            },
            td({ node, ...props }) {
              return <td className="border border-forest-border p-2" {...props} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
