/**
 * Custom React Query hooks for the Jajpur Jatri API.
 * These are hand-written to cover endpoints not yet in the OpenAPI spec.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  UseMutationOptions,
  UseQueryOptions,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  photo?: string | null;
  role: "passenger" | "driver";
  walletBalance?: number | null;
  isDriver?: boolean | null;
  driverStatus?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface DriverProfile {
  id: string;
  name?: string | null;
  phone?: string | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  vehicleModel?: string | null;
  rating?: number | null;
  totalRides?: number | null;
  isOnline?: boolean | null;
  status?: string | null;
  /** Latitude from the nearby-drivers endpoint */
  lat?: number | null;
  /** Longitude from the nearby-drivers endpoint */
  lng?: number | null;
}

export interface RideDriver {
  name?: string | null;
  phone?: string | null;
  photo?: string | null;
  rating?: number | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  eta?: number | null;
}

export interface Ride {
  id: string;
  fare?: number | null;
  distance?: number | null;
  pickupAddress?: string | null;
  dropAddress?: string | null;
  vehicleType?: string | null;
  paymentMethod?: string | null;
  otp?: string | null;
  status?: string | null;
  driver?: RideDriver | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropLat?: number | null;
  dropLng?: number | null;
  createdAt?: string | null;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  description: string;
  amount: number;
  createdAt?: string | null;
}

export interface PaymentOrder {
  keyId: string;
  orderId: string;
}

export interface EarningsData {
  totalEarnings?: number;
  dailyData?: Array<{ date?: string; amount?: number }>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function useFirebaseLogin(
  options?: { mutation?: UseMutationOptions<AuthResponse, Error, { data: { idToken: string; role: string } }> }
): UseMutationResult<AuthResponse, Error, { data: { idToken: string; role: string } }> {
  return useMutation<AuthResponse, Error, { data: { idToken: string; role: string } }>({
    mutationFn: ({ data }) =>
      customFetch<AuthResponse>("/api/auth/firebase-login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUpdateMe(
  options?: { mutation?: UseMutationOptions<AuthUser, Error, { data: { name?: string; email?: string; photo?: string } }> }
): UseMutationResult<AuthUser, Error, { data: { name?: string; email?: string; photo?: string } }> {
  return useMutation<AuthUser, Error, { data: { name?: string; email?: string; photo?: string } }>({
    mutationFn: ({ data }) =>
      customFetch<AuthUser>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export const getGetDriverProfileQueryKey = () => ["/api/drivers/profile"] as const;

export function useGetDriverProfile(
  options?: { query?: UseQueryOptions<DriverProfile, Error> }
): UseQueryResult<DriverProfile, Error> {
  return useQuery<DriverProfile, Error>({
    queryKey: getGetDriverProfileQueryKey(),
    queryFn: () => customFetch<DriverProfile>("/api/drivers/profile"),
    ...options?.query,
  });
}

export function useRegisterDriver(
  options?: { mutation?: UseMutationOptions<{ message: string }, Error, { data: Record<string, unknown> }> }
): UseMutationResult<{ message: string }, Error, { data: Record<string, unknown> }> {
  return useMutation<{ message: string }, Error, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) =>
      customFetch<{ message: string }>("/api/drivers/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

export function useUpdateDriverStatus(
  options?: { mutation?: UseMutationOptions<DriverProfile, Error, { data: { isOnline: boolean; lat?: number; lng?: number } }> }
): UseMutationResult<DriverProfile, Error, { data: { isOnline: boolean; lat?: number; lng?: number } }> {
  return useMutation<DriverProfile, Error, { data: { isOnline: boolean; lat?: number; lng?: number } }>({
    mutationFn: ({ data }) =>
      customFetch<DriverProfile>("/api/drivers/status", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

export const getGetDriverEarningsQueryKey = (params?: Record<string, unknown>) =>
  params ? (["/api/drivers/earnings", params] as const) : (["/api/drivers/earnings"] as const);

export function useGetDriverEarnings(
  params?: Record<string, unknown>,
  options?: { query?: UseQueryOptions<EarningsData, Error> }
): UseQueryResult<EarningsData, Error> {
  const search = params && Object.keys(params).length
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return useQuery<EarningsData, Error>({
    queryKey: getGetDriverEarningsQueryKey(params),
    queryFn: () => customFetch<EarningsData>(`/api/drivers/earnings${search}`),
    ...options?.query,
  });
}

// ─── Rides ────────────────────────────────────────────────────────────────────

export const getGetCurrentRideQueryKey = () => ["/api/rides/current"] as const;

export function useGetCurrentRide(
  options?: { query?: UseQueryOptions<{ ride: Ride | null }, Error> }
): UseQueryResult<{ ride: Ride | null }, Error> {
  return useQuery<{ ride: Ride | null }, Error>({
    queryKey: getGetCurrentRideQueryKey(),
    queryFn: () => customFetch<{ ride: Ride | null }>("/api/rides/current"),
    ...options?.query,
  });
}

export const getGetRideQueryKey = (id: string) => [`/api/rides/${id}`] as const;

export function useGetRide(
  id: string,
  options?: { query?: UseQueryOptions<Ride, Error> }
): UseQueryResult<Ride, Error> {
  return useQuery<Ride, Error>({
    queryKey: getGetRideQueryKey(id),
    queryFn: () => customFetch<Ride>(`/api/rides/${id}`),
    enabled: !!id,
    ...options?.query,
  });
}

export const getGetRideHistoryQueryKey = (params?: Record<string, unknown>) =>
  params ? (["/api/rides/history", params] as const) : (["/api/rides/history"] as const);

export function useGetRideHistory(
  params?: Record<string, unknown>,
  options?: { query?: UseQueryOptions<{ rides: Ride[] }, Error> }
): UseQueryResult<{ rides: Ride[] }, Error> {
  return useQuery<{ rides: Ride[] }, Error>({
    queryKey: getGetRideHistoryQueryKey(params),
    queryFn: () => customFetch<{ rides: Ride[] }>("/api/rides/history"),
    ...options?.query,
  });
}

export function useBookRide(
  options?: { mutation?: UseMutationOptions<{ id: string }, Error, { data: Record<string, unknown> }> }
): UseMutationResult<{ id: string }, Error, { data: Record<string, unknown> }> {
  return useMutation<{ id: string }, Error, { data: Record<string, unknown> }>({
    mutationFn: ({ data }) =>
      customFetch<{ id: string }>("/api/rides", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

export function useCancelRide(
  options?: { mutation?: UseMutationOptions<void, Error, { id: string }> }
): UseMutationResult<void, Error, { id: string }> {
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) =>
      customFetch<void>(`/api/rides/${id}/cancel`, { method: "POST" }),
    ...options?.mutation,
  });
}

export function useStartRide(
  options?: { mutation?: UseMutationOptions<Ride, Error, { id: string; data: { otp: string } }> }
): UseMutationResult<Ride, Error, { id: string; data: { otp: string } }> {
  return useMutation<Ride, Error, { id: string; data: { otp: string } }>({
    mutationFn: ({ id, data }) =>
      customFetch<Ride>(`/api/rides/${id}/start`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

export function useCompleteRide(
  options?: { mutation?: UseMutationOptions<Ride, Error, { id: string }> }
): UseMutationResult<Ride, Error, { id: string }> {
  return useMutation<Ride, Error, { id: string }>({
    mutationFn: ({ id }) =>
      customFetch<Ride>(`/api/rides/${id}/complete`, { method: "POST" }),
    ...options?.mutation,
  });
}

export function useRateRide(
  options?: { mutation?: UseMutationOptions<void, Error, { id: string; data: { rating: number; comment?: string } }> }
): UseMutationResult<void, Error, { id: string; data: { rating: number; comment?: string } }> {
  return useMutation<void, Error, { id: string; data: { rating: number; comment?: string } }>({
    mutationFn: ({ id, data }) =>
      customFetch<void>(`/api/rides/${id}/rate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

// ─── Nearby drivers ───────────────────────────────────────────────────────────

export const getGetNearbyDriversQueryKey = (params?: Record<string, unknown>) =>
  params ? (["/api/drivers/nearby", params] as const) : (["/api/drivers/nearby"] as const);

export function useGetNearbyDrivers(
  params?: Record<string, unknown>,
  options?: { query?: UseQueryOptions<{ drivers: DriverProfile[] }, Error> }
): UseQueryResult<{ drivers: DriverProfile[] }, Error> {
  const search =
    params && Object.keys(params).length
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
  return useQuery<{ drivers: DriverProfile[] }, Error>({
    queryKey: getGetNearbyDriversQueryKey(params),
    queryFn: () =>
      customFetch<{ drivers: DriverProfile[] }>(`/api/drivers/nearby${search}`),
    ...options?.query,
  });
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const getGetWalletBalanceQueryKey = () => ["/api/wallet/balance"] as const;

export function useGetWalletBalance(
  options?: { query?: UseQueryOptions<{ balance: number }, Error> }
): UseQueryResult<{ balance: number }, Error> {
  return useQuery<{ balance: number }, Error>({
    queryKey: getGetWalletBalanceQueryKey(),
    queryFn: () => customFetch<{ balance: number }>("/api/wallet/balance"),
    ...options?.query,
  });
}

export const getGetWalletTransactionsQueryKey = () => ["/api/wallet/transactions"] as const;

export function useGetWalletTransactions(
  options?: { query?: UseQueryOptions<{ transactions: WalletTransaction[] }, Error> }
): UseQueryResult<{ transactions: WalletTransaction[] }, Error> {
  return useQuery<{ transactions: WalletTransaction[] }, Error>({
    queryKey: getGetWalletTransactionsQueryKey(),
    queryFn: () =>
      customFetch<{ transactions: WalletTransaction[] }>("/api/wallet/transactions"),
    ...options?.query,
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function useCreatePaymentOrder(
  options?: { mutation?: UseMutationOptions<PaymentOrder, Error, { data: { amount: number; rideId?: string } }> }
): UseMutationResult<PaymentOrder, Error, { data: { amount: number; rideId?: string } }> {
  return useMutation<PaymentOrder, Error, { data: { amount: number; rideId?: string } }>({
    mutationFn: ({ data }) =>
      customFetch<PaymentOrder>("/api/payments/order", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

export function useVerifyPayment(
  options?: {
    mutation?: UseMutationOptions<
      { success: boolean },
      Error,
      { data: { orderId: string; paymentId: string; signature: string; rideId?: string; amount?: number } }
    >;
  }
): UseMutationResult<
  { success: boolean },
  Error,
  { data: { orderId: string; paymentId: string; signature: string; rideId?: string; amount?: number } }
> {
  return useMutation<
    { success: boolean },
    Error,
    { data: { orderId: string; paymentId: string; signature: string; rideId?: string; amount?: number } }
  >({
    mutationFn: ({ data }) =>
      customFetch<{ success: boolean }>("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}
