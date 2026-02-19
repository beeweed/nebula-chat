import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#f97316',
    primaryTextColor: '#fff',
    primaryBorderColor: '#ea580c',
    lineColor: '#22d3ee',
    secondaryColor: '#1a1a1a',
    tertiaryColor: '#0a0a0a',
    background: '#0a0a0a',
    mainBkg: '#1a1a1a',
    nodeBorder: '#f97316',
    clusterBkg: '#1a1a1a',
    clusterBorder: '#f97316',
    titleColor: '#f97316',
    edgeLabelBackground: '#1a1a1a',
    actorTextColor: '#fff',
    actorBorder: '#22d3ee',
    actorBkg: '#1a1a1a',
    signalColor: '#22d3ee',
    signalTextColor: '#fff',
    labelBoxBkgColor: '#1a1a1a',
    labelBoxBorderColor: '#f97316',
    labelTextColor: '#fff',
    loopTextColor: '#22d3ee',
    noteBorderColor: '#f97316',
    noteBkgColor: '#1a1a1a',
    noteTextColor: '#fff',
    activationBorderColor: '#f97316',
    activationBkgColor: '#1a1a1a',
    sequenceNumberColor: '#000',
    sectionBkgColor: '#1a1a1a',
    altSectionBkgColor: '#0d0d0d',
    sectionBkgColor2: '#1a1a1a',
    taskBorderColor: '#f97316',
    taskBkgColor: '#1a1a1a',
    taskTextColor: '#fff',
    taskTextLightColor: '#fff',
    taskTextOutsideColor: '#fff',
    gridColor: '#333',
    doneTaskBkgColor: '#f97316',
    doneTaskBorderColor: '#ea580c',
    critBorderColor: '#dc2626',
    critBkgColor: '#7f1d1d',
    todayLineColor: '#22d3ee',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: true,
    useMaxWidth: true,
  },
});

let mermaidIdCounter = 0;

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const idRef = useRef(`mermaid-${++mermaidIdCounter}-${Date.now()}`);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart.trim()) {
        setError('Empty diagram');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        const { svg } = await mermaid.render(idRef.current, chart.trim());
        setSvg(svg);
      } catch (err: unknown) {
        console.error('Mermaid rendering error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  if (isLoading) {
    return (
      <div data-design-id="mermaid-loading" className="my-4 p-6 rounded-lg bg-black/40 border border-primary/20 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm">Rendering diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-design-id="mermaid-error" className="my-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-destructive">Diagram Error</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Show code</summary>
              <pre className="mt-2 p-2 text-xs bg-black/40 rounded overflow-x-auto">{chart}</pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      data-design-id="mermaid-diagram"
      ref={containerRef}
      className="my-4 p-4 rounded-lg bg-black/40 border border-primary/20 overflow-x-auto mermaid-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default MermaidDiagram;