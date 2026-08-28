"use client";

import { useEffect, useRef } from "react";

type CanvasUpdate = {
  x: number;
  y: number;
  color: string;
};

type MiniAppContainerProps = {
  targetUri: string;
  canvasData?: CanvasUpdate;
  roomId?: string;
};

export default function MiniAppContainer({ targetUri, canvasData, roomId }: MiniAppContainerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const targetOrigin = new URL(targetUri).origin;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== targetOrigin || event.source !== frameRef.current?.contentWindow) {
        return;
      }

      if (event.data?.type === "mini-app-ready") {
        frameRef.current?.contentWindow?.postMessage({ type: "mini-app-context", roomId }, targetOrigin);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [roomId, targetOrigin]);

  useEffect(() => {
    if (!canvasData || !frameRef.current?.contentWindow) {
      return;
    }

    frameRef.current.contentWindow.postMessage({ type: "canvas-update", payload: canvasData }, targetOrigin);
  }, [canvasData, targetOrigin]);

  return (
    <iframe
      ref={frameRef}
      title="Pulse Hub mini-app"
      src={targetUri}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className="h-full min-h-80 w-full border-0"
    />
  );
}