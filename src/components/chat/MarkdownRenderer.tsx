import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

function StreamingCursor() {
  return (
    <span className="inline-flex items-center ml-0.5">
      <span className="inline-block w-2 h-4 bg-accent animate-streaming-cursor rounded-sm" />
    </span>
  );
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 data-design-id="md-h1" className="text-2xl font-bold text-foreground mt-6 mb-4 first:mt-0 border-b border-primary/20 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 data-design-id="md-h2" className="text-xl font-semibold text-foreground mt-5 mb-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 data-design-id="md-h3" className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 data-design-id="md-h4" className="text-base font-semibold text-foreground mt-3 mb-2 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p data-design-id="md-paragraph" className="text-foreground/90 mb-3 last:mb-0 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul data-design-id="md-ul" className="list-disc list-inside space-y-1.5 mb-3 text-foreground/90 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol data-design-id="md-ol" className="list-decimal list-inside space-y-1.5 mb-3 text-foreground/90 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li data-design-id="md-li" className="leading-relaxed">
              {children}
            </li>
          ),
          table: ({ children }) => (
            <div data-design-id="md-table-wrapper" className="overflow-x-auto my-4 rounded-lg border border-primary/20 bg-black/40">
              <table className="w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead data-design-id="md-thead" className="bg-primary/10 border-b border-primary/30">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody data-design-id="md-tbody" className="divide-y divide-white/5">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr data-design-id="md-tr" className="hover:bg-white/5 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th data-design-id="md-th" className="px-4 py-3 text-left font-semibold text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td data-design-id="md-td" className="px-4 py-3 text-foreground/90">
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote data-design-id="md-blockquote" className="border-l-4 border-accent/50 pl-4 my-4 italic text-foreground/70 bg-accent/5 py-2 rounded-r-lg">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr data-design-id="md-hr" className="my-6 border-primary/20" />
          ),
          a: ({ href, children }) => (
            <a
              data-design-id="md-link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong data-design-id="md-strong" className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em data-design-id="md-em" className="italic text-foreground/90">
              {children}
            </em>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;
            
            if (isInline) {
              return (
                <code
                  data-design-id="md-inline-code"
                  className="font-mono text-sm px-1.5 py-0.5 rounded bg-black/60 border border-primary/20 text-primary"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            const codeString = String(children).replace(/\n$/, '');
            return <CodeBlock language={match?.[1] || 'text'} code={codeString} />;
          },
          pre: ({ children }) => {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && <StreamingCursor />}
    </div>
  );
}