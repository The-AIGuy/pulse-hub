"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/context/SocketContext";

type CanvasUpdate = {
  x: number;
  y: number;
  color: string;
};

type SharedCanvasProps = {
  roomId: string;
};

const brushColor = "#a3e635";

export default function SharedCanvas({ roomId }: SharedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const { socket } = useSocket();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = bounds.width * pixelRatio;
      canvas.height = bounds.height * pixelRatio;
      canvas.getContext("2d")?.scale(pixelRatio, pixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleCanvasUpdate = (update: CanvasUpdate) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      context.fillStyle = update.color;
      context.beginPath();
      context.arc(update.x * canvas.clientWidth, update.y * canvas.clientHeight, 4, 0, Math.PI * 2);
      context.fill();
    };

    socket.on("canvas_update", handleCanvasUpdate);
    return () => {
      socket.off("canvas_update", handleCanvasUpdate);
    };
  }, [socket]);

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !drawingRef.current) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    context.fillStyle = brushColor;
    context.beginPath();
    context.arc(x * bounds.width, y * bounds.height, 4, 0, Math.PI * 2);
    context.fill();
    socket?.emit("canvas_update", roomId, { x, y, color: brushColor });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-900">Shared canvas</p>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live utility</span>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={() => { drawingRef.current = true; }}
        onPointerUp={() => { drawingRef.current = false; }}
        onPointerLeave={() => { drawingRef.current = false; }}
        onPointerMove={draw}
        className="h-44 w-full touch-none rounded-lg bg-slate-950"
        aria-label="Shared drawing canvas"
      />
    </div>
  );
}