import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

// Fare = ₹15/km, minimum ₹20. Must stay in lockstep with:
//   contexts/RideContext.tsx  (getFareEstimate)
//   artifacts/api-server/src/routes/rides.ts  (server-side validation)
const FARE_PER_KM = 15;
const MIN_FARE = 20;

const VEHICLES = [
  { type: "bike" as const, label: "Bike", icon: "motorbike", capacity: 1, eta: 3 },
  { type: "auto" as const, label: "Auto", icon: "rickshaw", capacity: 3, eta: 5 },
];

interface VehicleSelectorProps {
  selected: string | null;
  onSelect: (type: string, fare: number, eta: number) => void;
  distance: number;
}

export function VehicleSelector({ selected, onSelect, distance }: VehicleSelectorProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {VEHICLES.map((v) => {
        const fare = Math.max(MIN_FARE, Math.round(FARE_PER_KM * distance));
        const isSelected = selected === v.type;

        return (
          <TouchableOpacity
            key={v.type}
            onPress={() => onSelect(v.type, fare, v.eta)}
            activeOpacity={0.8}
            style={[
              styles.card,
              {
                backgroundColor: isSelected ? colors.primary + "22" : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={v.icon as never}
              size={32}
              color={isSelected ? colors.primary : colors.mutedForeground}
            />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]}>{v.label}</Text>
              <Text style={[styles.capacity, { color: colors.mutedForeground }]}>
                {v.capacity} {v.capacity === 1 ? "seat" : "seats"} • {v.eta} min
              </Text>
            </View>
            <View style={styles.fareContainer}>
              <Text style={[styles.fare, { color: isSelected ? colors.primary : colors.foreground }]}>
                ₹{fare}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  capacity: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  fareContainer: {
    alignItems: "flex-end",
  },
  fare: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
