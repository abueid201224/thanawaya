import React from 'react';
import { MathRenderer } from './MathRenderer';

interface MathLatexToolbarProps {
  onInsertLatex: (latex: string) => void;
  className?: string;
}

export const MathLatexToolbar: React.FC<MathLatexToolbarProps> = ({
  onInsertLatex,
  className = ''
}) => {
  const symbolCategories = [
    {
      category: 'تفاضل وتكامل',
      items: [
        { label: '\\frac{dy}{dx}', latex: '\\frac{dy}{dx}', preview: '\\frac{dy}{dx}' },
        { label: '\\frac{d^2y}{dx^2}', latex: '\\frac{d^2y}{dx^2}', preview: '\\frac{d^2y}{dx^2}' },
        { label: '\\int f(x) dx', latex: '\\int f(x) \\, dx', preview: '\\int' },
        { label: '\\int_a^b', latex: '\\int_{a}^{b} f(x) \\, dx', preview: '\\int_a^b' },
        { label: '\\lim_{x \\to 0}', latex: '\\lim_{x \\to 0}', preview: '\\lim' },
        { label: 'e^x', latex: 'e^{x}', preview: 'e^x' },
        { label: '\\ln(x)', latex: '\\ln(x)', preview: '\\ln' }
      ]
    },
    {
      category: 'مثلثات وزوايا',
      items: [
        { label: '\\sin(\\theta)', latex: '\\sin(\\theta)', preview: '\\sin\\theta' },
        { label: '\\cos(\\theta)', latex: '\\cos(\\theta)', preview: '\\cos\\theta' },
        { label: '\\tan(\\theta)', latex: '\\tan(\\theta)', preview: '\\tan\\theta' },
        { label: '\\sec^2(x)', latex: '\\sec^2(x)', preview: '\\sec^2' },
        { label: '\\theta', latex: '\\theta', preview: '\\theta' },
        { label: '\\pi', latex: '\\pi', preview: '\\pi' },
        { label: '\\omega', latex: '\\omega', preview: '\\omega' }
      ]
    },
    {
      category: 'جبر ومتجهات',
      items: [
        { label: '\\vec{A} \\cdot \\vec{B}', latex: '\\vec{A} \\cdot \\vec{B}', preview: '\\vec{A}\\cdot\\vec{B}' },
        { label: '\\vec{A} \\times \\vec{B}', latex: '\\vec{A} \\times \\vec{B}', preview: '\\vec{A}\\times\\vec{B}' },
        { label: '\\binom{n}{r}', latex: '\\binom{n}{r}', preview: '\\binom{n}{r}' },
        { label: '\\sqrt{x}', latex: '\\sqrt{x}', preview: '\\sqrt{x}' },
        { label: 'x^2', latex: 'x^{2}', preview: 'x^2' },
        { label: '\\pm', latex: '\\pm', preview: '\\pm' },
        { label: '\\infty', latex: '\\infty', preview: '\\infty' },
        { label: '\\Sigma', latex: '\\sum_{i=1}^{n}', preview: '\\sum' }
      ]
    }
  ];

  const [activeCategoryIndex, setActiveCategoryIndex] = React.useState(0);

  return (
    <div className={`p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2 ${className}`}>
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 overflow-x-auto">
        <span className="text-[11px] text-slate-400 font-semibold shrink-0 ml-1">لوحة الرموز:</span>
        {symbolCategories.map((cat, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveCategoryIndex(idx)}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] transition-all whitespace-nowrap cursor-pointer ${
              activeCategoryIndex === idx
                ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* Symbol Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {symbolCategories[activeCategoryIndex].items.map((item, sIdx) => (
          <button
            key={sIdx}
            type="button"
            onClick={() => onInsertLatex(`$${item.latex}$`)}
            title={`إدراج ${item.label}`}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-blue-500/50 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <MathRenderer latex={item.preview} className="text-xs" />
          </button>
        ))}
      </div>
    </div>
  );
};
