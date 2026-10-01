import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Maximize2,
  Info,
  Sliders,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

type GraphMode = 'calculus_curve' | 'statics_plane' | 'dynamics_pulley';

export const InteractiveGrapherView: React.FC = () => {
  const [graphMode, setGraphMode] = useState<GraphMode>('calculus_curve');

  // Calculus Parameters: f(x) = a*x^3 + b*x^2 + c*x + d
  const [paramA, setParamA] = useState<number>(0.2);
  const [paramB, setParamB] = useState<number>(0);
  const [paramC, setParamC] = useState<number>(-1.5);
  const [paramD, setParamD] = useState<number>(0);
  const [tangentX, setTangentX] = useState<number>(1.2);

  // Statics Parameters: Inclined Plane
  const [planeAngle, setPlaneAngle] = useState<number>(30); // degrees
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.5); // mu_s
  const [bodyMass, setBodyMass] = useState<number>(10); // kg

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (graphMode === 'calculus_curve') {
      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const originX = width / 2;
      const originY = height / 2;
      const scale = 40; // 40px per unit

      // Grid lines
      for (let x = 0; x < width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // X and Y Axis
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();

      // Plot f(x) = a*x^3 + b*x^2 + c*x + d
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let first = true;

      for (let px = 0; px <= width; px += 2) {
        const xVal = (px - originX) / scale;
        const yVal = paramA * Math.pow(xVal, 3) + paramB * Math.pow(xVal, 2) + paramC * xVal + paramD;
        const py = originY - yVal * scale;

        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Draw Tangent line at tangentX
      const tX = tangentX;
      const tY = paramA * Math.pow(tX, 3) + paramB * Math.pow(tX, 2) + paramC * tX + paramD;
      const slope = 3 * paramA * Math.pow(tX, 2) + 2 * paramB * tX + paramC;

      const ptX = originX + tX * scale;
      const ptY = originY - tY * scale;

      // Draw Tangent Point
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ptX, ptY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Tangent line extension
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      const x1 = tX - 3;
      const y1 = tY - slope * 3;
      const x2 = tX + 3;
      const y2 = tY + slope * 3;
      ctx.moveTo(originX + x1 * scale, originY - y1 * scale);
      ctx.lineTo(originX + x2 * scale, originY - y2 * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (graphMode === 'statics_plane') {
      // Draw Inclined Plane Free Body Diagram
      const originX = 80;
      const originY = height - 60;
      const rad = (planeAngle * Math.PI) / 180;
      const planeLength = 400;

      // Base line
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + planeLength, originY);
      ctx.stroke();

      // Incline
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      const topX = originX + planeLength * Math.cos(rad);
      const topY = originY - planeLength * Math.sin(rad);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(topX, topY);
      ctx.stroke();

      // Angle Arc
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(originX, originY, 40, -rad, 0);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${planeAngle}°`, originX + 50, originY - 12);

      // Block on incline
      const blockDist = planeLength * 0.55;
      const blockCenterX = originX + blockDist * Math.cos(rad);
      const blockCenterY = originY - blockDist * Math.sin(rad);

      ctx.save();
      ctx.translate(blockCenterX, blockCenterY);
      ctx.rotate(-rad);

      // Draw Block
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.fillRect(-25, -50, 50, 50);
      ctx.strokeRect(-25, -50, 50, 50);

      // Force Normal (R)
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(0, -100);
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.fillText('R (رد الفعل)', 5, -95);

      // Force Friction (Fs)
      ctx.strokeStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(70, -25);
      ctx.stroke();
      ctx.fillStyle = '#f87171';
      ctx.fillText('Fs = μ R', 75, -20);

      // Gravity (W = mg)
      ctx.restore();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(blockCenterX, blockCenterY - 25);
      ctx.lineTo(blockCenterX, blockCenterY + 70);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('W = mg (الوزن)', blockCenterX + 8, blockCenterY + 65);
    }
  }, [graphMode, paramA, paramB, paramC, paramD, tangentX, planeAngle, frictionCoeff, bodyMass]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-cyan-950/70 border border-blue-800/40 p-6 lg:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              الراسم الهندسي والبياني التفاعلي (Interactive Math & Physics Canvas)
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              محاكاة بصرية تفاعلية لمنحنيات التفاضل ومخططات القوى الحرة
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              تحويل المفاهيم المجردة (النقاط الحرجة، المماسات، قوى الاحتكاك، وميل المستويات الخشنة) إلى محاكاة تفاعلية بصرية تساعد في الاستيعاب الهندسي السريع للمسائل الامتحانية.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setGraphMode('calculus_curve')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                graphMode === 'calculus_curve'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              منحنيات التفاضل والمماسات
            </button>
            <button
              onClick={() => setGraphMode('statics_plane')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                graphMode === 'statics_plane'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الاستاتيكا: المستوى المائل والقوى
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Display */}
        <div className="lg:col-span-8 p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {graphMode === 'calculus_curve'
                ? 'رسم الدالة التكعيبية والمماس عند النقطة س'
                : 'مخطط الجسم الحر (Free Body Diagram) على المستوى الخشن'}
            </span>
            <span className="font-mono text-slate-400 text-[11px]">مقياس رسم متناسب</span>
          </div>

          <div className="flex items-center justify-center py-3 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/60 my-2">
            <canvas ref={canvasRef} width={620} height={360} className="w-full h-auto max-w-[620px]" />
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
            {graphMode === 'calculus_curve' ? (
              <div>
                معادلة المماس: <span className="font-mono text-amber-300">ميل المماس = {(3 * paramA * Math.pow(tangentX, 2) + 2 * paramB * tangentX + paramC).toFixed(2)}</span>
              </div>
            ) : (
              <div>
                شديد الانزلاق: <span className="text-emerald-400 font-bold">ظا({planeAngle}°) = {Math.tan((planeAngle * Math.PI) / 180).toFixed(2)}</span> مقابل معامل الاحتكاك μ = {frictionCoeff}
              </div>
            )}
            <span className="text-[11px] text-slate-500">حسابات دقيقة فورية</span>
          </div>
        </div>

        {/* Sliders Controls Side */}
        <div className="lg:col-span-4 p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>لوحة التحكم وتعديل المتغيرات:</span>
          </div>

          {graphMode === 'calculus_curve' ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>معامل الدرجة الثالثة (أ):</span>
                  <span className="font-mono font-bold text-blue-400">{paramA}</span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={paramA}
                  onChange={(e) => setParamA(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>معامل الدرجة الأولى (جـ):</span>
                  <span className="font-mono font-bold text-blue-400">{paramC}</span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={paramC}
                  onChange={(e) => setParamC(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>موضع نقطة المماس (س):</span>
                  <span className="font-mono font-bold text-amber-400">{tangentX}</span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={tangentX}
                  onChange={(e) => setTangentX(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1 leading-relaxed">
                <span className="font-bold text-amber-400">فائدة وزارية: </span>
                عندما يكون ميل المماس = 0، يكون المماس أفقياً وتكون النقطة حرجة (عظمى أو صغرى محلية).
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>زاوية ميل المستوى (هـ):</span>
                  <span className="font-mono font-bold text-cyan-400">{planeAngle}°</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  step="1"
                  value={planeAngle}
                  onChange={(e) => setPlaneAngle(parseInt(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>معامل الاحتكاك السكوني (م_س):</span>
                  <span className="font-mono font-bold text-rose-400">{frictionCoeff}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={frictionCoeff}
                  onChange={(e) => setFrictionCoeff(parseFloat(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1 leading-relaxed">
                <span className="font-bold text-cyan-400">حالة الجسم: </span>
                {Math.tan((planeAngle * Math.PI) / 180) > frictionCoeff
                  ? '⚠️ الجسم ينزلق لأسفل لأن ظا(هـ) > م_س'
                  : '✅ الجسم متزن ومستقر على المستوى لأن ظا(هـ) ≤ م_س'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
