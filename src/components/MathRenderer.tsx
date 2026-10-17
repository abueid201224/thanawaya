import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check, AlertCircle } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  // Attempt strict rendering first to catch syntax errors
  const renderResult = React.useMemo<{ html: string | null; error: boolean }>(() => {
    try {
      const rendered = katex.renderToString(latex, {
        displayMode: block,
        throwOnError: true,
        strict: false
      });
      return { html: rendered, error: false };
    } catch {
      // Fallback attempt with non-throwing mode
      try {
        const softRendered = katex.renderToString(latex, {
          displayMode: block,
          throwOnError: false,
          strict: false
        });
        // If KaTeX wrapped in error class, treat as error fallback
        if (softRendered.includes('katex-error')) {
          return { html: null, error: true };
        }
        return { html: softRendered, error: false };
      } catch {
        return { html: null, error: true };
      }
    }
  }, [latex, block]);

  const handleCopyLatex = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Graceful Fallback if KaTeX rendering fails: Show text formula + Copy LaTeX button
  if (renderResult.error || !renderResult.html) {
    return (
      <span
        className={`inline-flex items-center gap-2 p-1.5 px-2.5 rounded-lg bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs font-mono my-1 ${
          block ? 'w-full justify-between' : 'inline-flex'
        } ${className}`}
        dir="ltr"
        title="تعذر تصيير المعادلة برمجياً - يتم عرض النص القياسي مع إمكانية النسخ"
      >
        <span className="truncate max-w-xs sm:max-w-md select-all text-left">
          {latex}
        </span>
        <button
          onClick={handleCopyLatex}
          type="button"
          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/30 text-[10px] font-sans font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
          title="نسخ كود LaTeX إلى الحافظة"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>نسخ LaTeX</span>
            </>
          )}
        </button>
      </span>
    );
  }

  return (
    <span
      className={`inline-block math-rendered ${block ? 'my-2 block text-center' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderResult.html }}
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

export default MathRenderer;
