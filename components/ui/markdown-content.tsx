"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type MarkdownContentProps = {
  content: string;
  className?: string;
  /** User bubble uses inverted colors */
  variant?: "default" | "inverted";
};

export function MarkdownContent({
  content,
  className = "",
  variant = "default",
}: MarkdownContentProps) {
  if (!content.trim()) return null;

  return (
    <div
      className={`markdown-body ${variant === "inverted" ? "markdown-inverted" : ""} ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
