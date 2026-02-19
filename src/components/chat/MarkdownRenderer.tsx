import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';
import { Callout, CalloutType } from './Callout';
import { Collapsible } from './Collapsible';
import 'katex/dist/katex.min.css';

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

function parseCallouts(content: string): string {
  const calloutRegex = /^>\s*\[!(NOTE|TIP|WARNING|DANGER|INFO|SUCCESS|QUESTION|QUOTE)\](\s+(.+))?$/gim;
  return content.replace(calloutRegex, (match, type, _, title) => {
    const calloutType = type.toLowerCase();
    const calloutTitle = title?.trim() || '';
    return `:::${calloutType}${calloutTitle ? ` ${calloutTitle}` : ''}\n`;
  });
}

function parseCollapsible(content: string): string {
  const detailsRegex = /<details>\s*<summary>(.+?)<\/summary>([\s\S]*?)<\/details>/gi;
  return content.replace(detailsRegex, (_, summary, body) => {
    return `:::details ${summary.trim()}\n${body.trim()}\n:::/details`;
  });
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  const processedContent = useMemo(() => {
    let result = content;
    result = parseCallouts(result);
    result = parseCollapsible(result);
    return result;
  }, [content]);

  const parts = useMemo(() => {
    const segments: Array<{ type: 'markdown' | 'mermaid' | 'callout' | 'collapsible'; content: string; meta?: string }> = [];
    
    const lines = processedContent.split('\n');
    let currentSegment: string[] = [];
    let inMermaid = false;
    let inCallout = false;
    let inCollapsible = false;
    let calloutType = '';
    let calloutTitle = '';
    let collapsibleTitle = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('```mermaid')) {
        if (currentSegment.length > 0) {
          segments.push({ type: 'markdown', content: currentSegment.join('\n') });
          currentSegment = [];
        }
        inMermaid = true;
        continue;
      }
      
      if (inMermaid && line.trim() === '```') {
        segments.push({ type: 'mermaid', content: currentSegment.join('\n') });
        currentSegment = [];
        inMermaid = false;
        continue;
      }
      
      const calloutMatch = line.match(/^:::(\w+)(?:\s+(.+))?$/);
      if (calloutMatch && !inCallout && !inCollapsible) {
        if (calloutMatch[1] === 'details') {
          if (currentSegment.length > 0) {
            segments.push({ type: 'markdown', content: currentSegment.join('\n') });
            currentSegment = [];
          }
          inCollapsible = true;
          collapsibleTitle = calloutMatch[2] || 'Details';
          continue;
        } else {
          if (currentSegment.length > 0) {
            segments.push({ type: 'markdown', content: currentSegment.join('\n') });
            currentSegment = [];
          }
          inCallout = true;
          calloutType = calloutMatch[1];
          calloutTitle = calloutMatch[2] || '';
          continue;
        }
      }
      
      if (inCollapsible && line.trim() === ':::/details') {
        segments.push({ 
          type: 'collapsible', 
          content: currentSegment.join('\n'),
          meta: collapsibleTitle 
        });
        currentSegment = [];
        inCollapsible = false;
        continue;
      }
      
      if (inCallout) {
        if (line.startsWith('>')) {
          currentSegment.push(line.replace(/^>\s?/, ''));
        } else if (line.trim() === '' && currentSegment.length > 0) {
          segments.push({ 
            type: 'callout', 
            content: currentSegment.join('\n'),
            meta: `${calloutType}|${calloutTitle}` 
          });
          currentSegment = [];
          inCallout = false;
        } else if (!line.startsWith('>') && line.trim() !== '') {
          segments.push({ 
            type: 'callout', 
            content: currentSegment.join('\n'),
            meta: `${calloutType}|${calloutTitle}` 
          });
          currentSegment = [line];
          inCallout = false;
        } else {
          currentSegment.push(line);
        }
        continue;
      }
      
      currentSegment.push(line);
    }
    
    if (currentSegment.length > 0) {
      if (inMermaid) {
        segments.push({ type: 'mermaid', content: currentSegment.join('\n') });
      } else if (inCallout) {
        segments.push({ 
          type: 'callout', 
          content: currentSegment.join('\n'),
          meta: `${calloutType}|${calloutTitle}` 
        });
      } else if (inCollapsible) {
        segments.push({ 
          type: 'collapsible', 
          content: currentSegment.join('\n'),
          meta: collapsibleTitle 
        });
      } else {
        segments.push({ type: 'markdown', content: currentSegment.join('\n') });
      }
    }
    
    return segments;
  }, [processedContent]);

  return (
    <div className="markdown-content">
      {parts.map((part, index) => {
        if (part.type === 'mermaid') {
          return <MermaidDiagram key={index} chart={part.content} />;
        }
        
        if (part.type === 'callout' && part.meta) {
          const [type, title] = part.meta.split('|');
          return (
            <Callout key={index} type={type as CalloutType} title={title || undefined}>
              <MarkdownRenderer content={part.content} />
            </Callout>
          );
        }
        
        if (part.type === 'collapsible') {
          return (
            <Collapsible key={index} title={part.meta || 'Details'}>
              <MarkdownRenderer content={part.content} />
            </Collapsible>
          );
        }
        
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[
              rehypeKatex,
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            ]}
            components={{
              h1: ({ children, id }) => (
                <h1 data-design-id="md-h1" id={id} className="group text-2xl font-bold text-foreground mt-6 mb-4 first:mt-0 border-b border-primary/20 pb-2 scroll-mt-4">
                  {children}
                  {id && (
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-primary/50 hover:text-primary transition-opacity">
                      #
                    </a>
                  )}
                </h1>
              ),
              h2: ({ children, id }) => (
                <h2 data-design-id="md-h2" id={id} className="group text-xl font-semibold text-foreground mt-5 mb-3 first:mt-0 scroll-mt-4">
                  {children}
                  {id && (
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-primary/50 hover:text-primary transition-opacity">
                      #
                    </a>
                  )}
                </h2>
              ),
              h3: ({ children, id }) => (
                <h3 data-design-id="md-h3" id={id} className="group text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0 scroll-mt-4">
                  {children}
                  {id && (
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-primary/50 hover:text-primary transition-opacity">
                      #
                    </a>
                  )}
                </h3>
              ),
              h4: ({ children, id }) => (
                <h4 data-design-id="md-h4" id={id} className="group text-base font-semibold text-foreground mt-3 mb-2 first:mt-0 scroll-mt-4">
                  {children}
                  {id && (
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-primary/50 hover:text-primary transition-opacity">
                      #
                    </a>
                  )}
                </h4>
              ),
              h5: ({ children, id }) => (
                <h5 data-design-id="md-h5" id={id} className="group text-sm font-semibold text-foreground mt-3 mb-2 first:mt-0 scroll-mt-4">
                  {children}
                  {id && (
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-primary/50 hover:text-primary transition-opacity">
                      #
                    </a>
                  )}
                </h5>
              ),
              h6: ({ children, id }) => (
                <h6 data-design-id="md-h6" id={id} className="group text-sm font-medium text-foreground/80 mt-3 mb-2 first:mt-0 scroll-mt-4">
                  {children}
                  {id && (
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-primary/50 hover:text-primary transition-opacity">
                      #
                    </a>
                  )}
                </h6>
              ),
              p: ({ children }) => (
                <p data-design-id="md-paragraph" className="text-foreground/90 mb-3 last:mb-0 leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul data-design-id="md-ul" className="list-disc list-outside space-y-1.5 mb-3 text-foreground/90 ml-5">
                  {children}
                </ul>
              ),
              ol: ({ children, start }) => (
                <ol data-design-id="md-ol" start={start} className="list-decimal list-outside space-y-1.5 mb-3 text-foreground/90 ml-5">
                  {children}
                </ol>
              ),
              li: ({ children, className }) => {
                const isTaskItem = className?.includes('task-list-item');
                return (
                  <li data-design-id="md-li" className={`leading-relaxed ${isTaskItem ? 'list-none -ml-5 flex items-start gap-2' : ''}`}>
                    {children}
                  </li>
                );
              },
              input: ({ checked, type }) => {
                if (type === 'checkbox') {
                  return (
                    <input
                      data-design-id="md-checkbox"
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="mt-1 w-4 h-4 rounded border-primary/40 bg-black/40 text-primary focus:ring-primary/30 cursor-default"
                    />
                  );
                }
                return null;
              },
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
              th: ({ children, style }) => (
                <th data-design-id="md-th" style={style} className="px-4 py-3 text-left font-semibold text-primary">
                  {children}
                </th>
              ),
              td: ({ children, style }) => (
                <td data-design-id="md-td" style={style} className="px-4 py-3 text-foreground/90">
                  {children}
                </td>
              ),
              blockquote: ({ children }) => (
                <blockquote data-design-id="md-blockquote" className="border-l-4 border-accent/50 pl-4 my-4 italic text-foreground/70 bg-accent/5 py-2 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr data-design-id="md-hr" className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              ),
              a: ({ href, children }) => (
                <a
                  data-design-id="md-link"
                  href={href}
                  target={href?.startsWith('#') ? undefined : '_blank'}
                  rel={href?.startsWith('#') ? undefined : 'noopener noreferrer'}
                  className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  {children}
                  {href && !href.startsWith('#') && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
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
              del: ({ children }) => (
                <del data-design-id="md-del" className="text-muted-foreground line-through decoration-red-500/50">
                  {children}
                </del>
              ),
              mark: ({ children }) => (
                <mark data-design-id="md-mark" className="bg-yellow-500/30 text-foreground px-1 rounded">
                  {children}
                </mark>
              ),
              sub: ({ children }) => (
                <sub data-design-id="md-sub" className="text-xs text-foreground/80">
                  {children}
                </sub>
              ),
              sup: ({ children }) => (
                <sup data-design-id="md-sup" className="text-xs text-foreground/80">
                  {children}
                </sup>
              ),
              abbr: ({ children, title }) => (
                <abbr 
                  data-design-id="md-abbr"
                  title={title} 
                  className="underline decoration-dotted decoration-primary/50 cursor-help"
                >
                  {children}
                </abbr>
              ),
              kbd: ({ children }) => (
                <kbd data-design-id="md-kbd" className="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-black/60 border border-primary/30 rounded shadow-sm text-foreground">
                  {children}
                </kbd>
              ),
              img: ({ src, alt, title }) => (
                <figure data-design-id="md-figure" className="my-4">
                  <img
                    data-design-id="md-img"
                    src={src}
                    alt={alt || ''}
                    title={title}
                    className="rounded-lg max-w-full h-auto border border-primary/20 shadow-lg"
                    loading="lazy"
                  />
                  {(alt || title) && (
                    <figcaption data-design-id="md-figcaption" className="mt-2 text-center text-sm text-muted-foreground italic">
                      {title || alt}
                    </figcaption>
                  )}
                </figure>
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
                const language = match?.[1] || 'text';
                
                if (language === 'mermaid') {
                  return <MermaidDiagram chart={codeString} />;
                }
                
                return <CodeBlock language={language} code={codeString} />;
              },
              pre: ({ children }) => {
                return <>{children}</>;
              },
            }}
          >
            {part.content}
          </ReactMarkdown>
        );
      })}
      {isStreaming && <StreamingCursor />}
    </div>
  );
}