import React from 'react';

export type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'info' | 'success' | 'question' | 'quote';

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutConfig: Record<CalloutType, { icon: React.ReactNode; className: string; defaultTitle: string }> = {
  note: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    className: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    defaultTitle: 'Note',
  },
  tip: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    defaultTitle: 'Tip',
  },
  warning: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    defaultTitle: 'Warning',
  },
  danger: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    className: 'border-red-500/40 bg-red-500/10 text-red-400',
    defaultTitle: 'Danger',
  },
  info: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    defaultTitle: 'Info',
  },
  success: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    className: 'border-green-500/40 bg-green-500/10 text-green-400',
    defaultTitle: 'Success',
  },
  question: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    className: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    defaultTitle: 'Question',
  },
  quote: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    className: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
    defaultTitle: 'Quote',
  },
};

export function Callout({ type, title, children }: CalloutProps) {
  const config = calloutConfig[type] || calloutConfig.note;
  const displayTitle = title || config.defaultTitle;

  return (
    <div data-design-id={`callout-${type}`} className={`my-4 rounded-lg border-l-4 p-4 ${config.className}`}>
      <div data-design-id={`callout-${type}-header`} className="flex items-center gap-2 font-semibold mb-2">
        <span data-design-id={`callout-${type}-icon`} className="flex-shrink-0">{config.icon}</span>
        <span data-design-id={`callout-${type}-title`}>{displayTitle}</span>
      </div>
      <div data-design-id={`callout-${type}-content`} className="text-foreground/80 text-sm leading-relaxed pl-7">
        {children}
      </div>
    </div>
  );
}

export default Callout;