"use client";

import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { getBackendUrl } from "@/lib/backend";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);

type SocketProviderProps = {
  children: ReactNode;
};

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketClient = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? getBackendUrl(), { autoConnect: false });

    const handleConnect = () => {
      startTransition(() => setSocket(socketClient));
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socketClient.on("connect", handleConnect);
    socketClient.on("disconnect", handleDisconnect);
    socketClient.connect();

    return () => {
      socketClient.off("connect", handleConnect);
      socketClient.off("disconnect", handleDisconnect);
      socketClient.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
}