import Markdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <Markdown
      components={{
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        ),
        h1: ({ children }) => (
          <h1 className="mb-3 mt-4 text-xl font-bold first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-4 text-lg font-semibold first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-border pl-4 italic text-muted-foreground last:mb-0">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
                {children}
              </code>
            );
          }
          return <code className={cn("font-mono text-sm", className)}>{children}</code>;
        },
        pre: ({ children }) => (
          <pre className="mb-3 overflow-x-auto rounded-lg bg-muted p-4 text-sm last:mb-0">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-4 border-border" />,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </Markdown>
  );
}
