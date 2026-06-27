import React, { createContext, useContext, useState, ReactNode } from "react";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface VehicleOption {
  type: "bike" | "auto";
  label: string;
  fare: number;
  eta: number;
  capacity: number;
}

interface RideContextValue {
  pickup: Location | null;
  drop: Location | null;
  selectedVehicle: VehicleOption | null;
  paymentMethod: "cash" | "wallet" | "online";
  currentRideId: string | null;
  setPickup: (loc: Location | null) => void;
  setDrop: (loc: Location | null) => void;
  setSelectedVehicle: (v: VehicleOption | null) => void;
  setPaymentMethod: (m: "cash" | "wallet" | "online") => void;
  setCurrentRideId: (id: string | null) => void;
  clearRide: () => void;
  getFareEstimate: (type: string, distance: number) => number;
}

// Fare = ₹15/km, minimum ₹20. No booking fee.
// Must stay in lockstep with VehicleSelector.tsx and api-server/src/routes/rides.ts.
export const FARE_PER_KM = 15;
export const MIN_FARE = 20;

const RideContext = createContext<RideContextValue | null>(null);

export function RideProvider({ children }: { children: ReactNode }) {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [drop, setDrop] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet" | "online">("cash");
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);

  function clearRide() {
    setPickup(null);
    setDrop(null);
    setSelectedVehicle(null);
    setCurrentRideId(null);
    setPaymentMethod("cash");
  }

  function getFareEstimate(_type: string, distance: number): number {
    return Math.max(MIN_FARE, Math.round(FARE_PER_KM * distance));
  }

  return (
    <RideContext.Provider
      value={{
        pickup,
        drop,
        selectedVehicle,
        paymentMethod,
        currentRideId,
        setPickup,
        setDrop,
        setSelectedVehicle,
        setPaymentMethod,
        setCurrentRideId,
        clearRide,
        getFareEstimate,
      }}
    >
      {children}
    </RideContext.Provider>
  );
}

export function useRide(): RideContextValue {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error("useRide must be used within RideProvider");
  return ctx;
}
