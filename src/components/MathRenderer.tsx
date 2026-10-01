import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  latex: string;
  block?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  block = false,
  className = ''
}) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: block,
        throwOnError: false,
        strict: false
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return `<span class="text-amber-400 font-mono text-xs">${latex}</span>`;
    }
  }, [latex, block]);

  return (
    <span
      className={`inline-block math-rendered ${block ? 'my-2 block text-center' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Helper component that renders Arabic text containing inline math formatted with $...$ or $$...$$
 */
export const MixedTextRenderer: React.FC<{ text: string; className?: string }> = ({
  text,
  className = ''
}) => {
  // Split on $$...$$ (block) and $...$ (inline)
  const parts = React.useMemo(() => {
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const tokens = text.split(regex);
    return tokens.map((token, i) => {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const formula = token.slice(2, -2).trim();
        return <MathRenderer key={i} latex={formula} block={true} />;
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const formula = token.slice(1, -1).trim();
        return <MathRenderer key={i} latex={formula} block={false} />;
      } else {
        return <span key={i}>{token}</span>;
      }
    });
  }, [text]);

  return <div className={`leading-relaxed ${className}`}>{parts}</div>;
};
