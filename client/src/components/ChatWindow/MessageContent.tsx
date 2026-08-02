import { memo, type ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import type { Message } from "../../store/chatSlice";
import { getClipboardCode } from "./codeText";

function CopyableCodeBlock({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = getClipboardCode(children);
  const language = className?.replace("hljs language-", "").replace("language-", "") ?? "code";

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{language}</span>
        <button onClick={() => void handleCopy()} type="button">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

const MessageContent = memo(function MessageContent({ message }: { message: Message }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          code({ children, className }) {
            return className ? (
              <CopyableCodeBlock className={className}>{children}</CopyableCodeBlock>
            ) : (
              <code>{children}</code>
            );
          }
        }}
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
});

export default MessageContent;
