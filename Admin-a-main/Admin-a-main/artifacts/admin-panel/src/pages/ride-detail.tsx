import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, User, Car, IndianRupee, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetRide, getGetRideQueryKey, useCancelRide, useAssignDriverToRide } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function RideDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [driverIdInput, setDriverIdInput] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ride, isLoading } = useGetRide(id, { query: { queryKey: getGetRideQueryKey(id) } });
  const cancel = useCancelRide();
  const assign = useAssignDriverToRide();

  const handleCancel = () => {
    if (!cancelReason.trim()) { toast({ title: "Enter a reason", variant: "destructive" }); return; }
    cancel.mutate({ id, data: { reason: cancelReason } }, {
      onSuccess: () => {
        toast({ title: "Ride cancelled" });
        queryClient.invalidateQueries({ queryKey: getGetRideQueryKey(id) });
        setCancelOpen(false);
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const handleAssign = () => {
    if (!driverIdInput.trim()) { toast({ title: "Enter a valid driver ID", variant: "destructive" }); return; }
    assign.mutate({ id, data: { driverId: driverIdInput } }, {
      onSuccess: () => {
        toast({ title: "Driver assigned" });
        queryClient.invalidateQueries({ queryKey: getGetRideQueryKey(id) });
        setAssignOpen(false);
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!ride) return <div className="text-center py-20 text-muted-foreground">Ride not found</div>;

  const anyRide = ride as any;

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/rides")} className="text-muted-foreground hover:text-white" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">Ride #{ride.id}</h2>
          <p className="text-muted-foreground text-sm">{new Date(ride.createdAt).toLocaleString()}</p>
        </div>
        <Badge className={`${statusColor[ride.status] ?? ""} border ml-2`}>{ride.status}</Badge>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Fare", value: `₹${ride.fare?.toFixed(2)}`, icon: IndianRupee, color: "text-primary" },
          { label: "Distance", value: ride.distanceKm ? `${ride.distanceKm.toFixed(1)} km` : "—", icon: MapPin, color: "text-blue-400" },
          { label: "Duration", value: (ride as any).durationMin ? `${(ride as any).durationMin} min` : "—", icon: Clock, color: "text-yellow-400" },
          { label: "Payment", value: ride.paymentMethod, icon: IndianRupee, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="glass-card border-white/5">
            <CardContent className="flex items-center gap-3 p-5">
              <s.icon className={`w-6 h-6 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-white capitalize">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Route</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-0.5 h-8 bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-destructive" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="text-sm text-white font-medium">{ride.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Drop-off</p>
                  <p className="text-sm text-white font-medium">{ride.dropAddress}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Parties</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <User className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Rider</p>
                <p className="text-white text-sm font-medium">{anyRide.userName ?? "—"} {ride.userId ? `(#${ride.userId})` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <Car className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Driver</p>
                <p className="text-white text-sm font-medium">{anyRide.driverName ?? "Not assigned"} {ride.driverId ? `(#${ride.driverId})` : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {["pending", "active"].includes(ride.status) && (
        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {!ride.driverId && (
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setAssignOpen(true)} data-testid="button-assign-driver">
                  <Car className="w-4 h-4 mr-2" /> Assign Driver
                </Button>
              )}
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setCancelOpen(true)} data-testid="button-cancel-ride">
                <XCircle className="w-4 h-4 mr-2" /> Cancel Ride
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ride.status === "cancelled" && ride.cancelReason && (
        <Card className="glass-card border-destructive/20 bg-destructive/5">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Cancellation Reason</p>
            <p className="text-white mt-1">{ride.cancelReason}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Cancel Ride</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Reason</label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="bg-white/5 border-white/10" placeholder="Enter cancellation reason" data-testid="input-cancel-reason" />
            </div>
            <Button className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleCancel} disabled={cancel.isPending} data-testid="button-confirm-cancel">
              {cancel.isPending ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Assign Driver</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Driver ID</label>
              <Input value={driverIdInput} onChange={(e) => setDriverIdInput(e.target.value)} type="number" className="bg-white/5 border-white/10" placeholder="Enter driver ID" data-testid="input-driver-id" />
            </div>
            <Button className="w-full bg-primary text-primary-foreground" onClick={handleAssign} disabled={assign.isPending} data-testid="button-confirm-assign">
              {assign.isPending ? "Assigning..." : "Assign Driver"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
