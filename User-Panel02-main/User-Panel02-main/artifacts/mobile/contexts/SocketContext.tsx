import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { Platform } from "react-native";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinRide: (rideId: string) => void;
  joinDriverRoom: (driverId: string) => void;
  emitLocation: (lat: number, lng: number, heading?: number) => void;
  acceptRide: (rideId: string, driverId: string) => void;
  rejectRide: (rideId: string) => void;
  arrivedPickup: (rideId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Expose a stable ref so consumers can use socket directly
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        forceUpdate((n) => n + 1);
      }
      return;
    }

    const domain = process.env["EXPO_PUBLIC_DOMAIN"];
    const baseUrl =
      Platform.OS === "web" ? window.location.origin : `https://${domain}`;

    const socket = io(baseUrl, {
      auth: { token },
      // On web (proxied by Replit), websocket upgrades may be blocked — start
      // with polling and let Socket.IO upgrade to websocket automatically.
      transports: Platform.OS === "web" ? ["polling", "websocket"] : ["websocket"],
      path: "/api/socket.io",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      forceUpdate((n) => n + 1);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    socket.on("connect_error", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;
    forceUpdate((n) => n + 1);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  function joinRide(rideId: string) {
    socketRef.current?.emit("ride:join", { rideId });
  }

  function joinDriverRoom(driverId: string) {
    socketRef.current?.emit("driver:join", { driverId });
  }

  function emitLocation(lat: number, lng: number, heading?: number) {
    socketRef.current?.emit("driver:location", { lat, lng, heading });
  }

  function acceptRide(rideId: string, driverId: string) {
    socketRef.current?.emit("ride:accept", { rideId, driverId });
  }

  function rejectRide(rideId: string) {
    // Server-side: driver simply doesn't accept — no explicit reject event needed
    // But notify locally for UI purposes
    socketRef.current?.emit("ride:reject", { rideId });
  }

  function arrivedPickup(rideId: string) {
    socketRef.current?.emit("ride:arrived", { rideId });
  }

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinRide,
        joinDriverRoom,
        emitLocation,
        acceptRide,
        rejectRide,
        arrivedPickup,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
