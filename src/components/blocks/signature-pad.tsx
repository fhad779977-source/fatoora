"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Minimal pointer-based signature canvas returning a transparent PNG data URL. */
export function SignaturePad({
  onSave,
  labels,
  ink = "#0B1220",
}: {
  onSave: (dataUrl: string) => void;
  labels: { clear: string; save: string; hint: string };
  ink?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = ink;
  }, [ink]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, p: e.pressure || 0.5 };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-dashed border-input bg-white">
        <canvas
          ref={canvasRef}
          className="block h-44 w-full touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            last.current = point(e);
          }}
          onPointerMove={(e) => {
            if (!drawing.current || !last.current) return;
            const ctx = e.currentTarget.getContext("2d")!;
            const p = point(e);
            ctx.lineWidth = 1.6 + p.p * 2;
            ctx.beginPath();
            ctx.moveTo(last.current.x, last.current.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            last.current = p;
            if (empty) setEmpty(false);
          }}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
          }}
          onPointerLeave={() => {
            drawing.current = false;
            last.current = null;
          }}
        />
        {empty ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">{labels.hint}</div> : null}
        <div className="pointer-events-none absolute inset-x-8 bottom-10 border-b border-slate-200" />
      </div>
      <div className="flex justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser />
          {labels.clear}
        </Button>
        <Button type="button" variant="copper" size="sm" disabled={empty} onClick={() => canvasRef.current && onSave(canvasRef.current.toDataURL("image/png"))}>
          {labels.save}
        </Button>
      </div>
    </div>
  );
}
