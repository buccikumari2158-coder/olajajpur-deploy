import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, Car, Star, CheckCircle, Ban, UserX, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetDriver, getGetDriverQueryKey, useDriverAction, useVerifyDriverDocument, getListDriversQueryKey, DriverActionInputAction, DocumentVerificationInputDocumentType, DocumentVerificationInputStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColor: Record<string, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  banned: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};
const approvalColor: Record<string, string> = {
  approved: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};
const docColor: Record<string, string> = {
  approved: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};
const rideStatusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const DOC_TYPES = [
  { type: "aadhaar", label: "Aadhaar Card" },
  { type: "driving_license", label: "Driving License" },
  { type: "vehicle_rc", label: "Vehicle RC" },
  { type: "vehicle_photo", label: "Vehicle Photo" },
  { type: "selfie", label: "Selfie" },
];

export default function DriverDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: driver, isLoading } = useGetDriver(id, { query: { queryKey: getGetDriverQueryKey(id) } });
  const action = useDriverAction();
  const verifyDoc = useVerifyDriverDocument();

  const handleAction = (act: string) => {
    action.mutate({ id, data: { action: act as DriverActionInputAction } }, {
      onSuccess: () => {
        toast({ title: `Action '${act}' performed` });
        queryClient.invalidateQueries({ queryKey: getGetDriverQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const handleDocVerify = (documentType: string, status: string) => {
    verifyDoc.mutate({ id, data: { documentType: documentType as DocumentVerificationInputDocumentType, status: status as DocumentVerificationInputStatus } }, {
      onSuccess: () => {
        toast({ title: `Document ${status}` });
        queryClient.invalidateQueries({ queryKey: getGetDriverQueryKey(id) });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!driver) return <div className="text-center py-20 text-muted-foreground">Driver not found</div>;

  const anyDriver = driver as any;

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/drivers")} className="text-muted-foreground hover:text-white" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">{driver.name}</h2>
          <p className="text-muted-foreground text-sm">Driver #{driver.id} · {driver.vehicleType}</p>
        </div>
        <Badge className={`${statusColor[driver.status] ?? ""} border ml-2`}>{driver.status}</Badge>
        <Badge className={`${approvalColor[driver.approvalStatus] ?? ""} border`}>{driver.approvalStatus}</Badge>
        {driver.isOnline && <Badge className="bg-primary/10 text-primary border border-primary/20 neon-glow">Online</Badge>}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Rides", value: driver.totalRides, icon: Car },
          { label: "Total Earnings", value: `₹${driver.totalEarnings?.toFixed(2)}`, icon: CheckCircle },
          { label: "Rating", value: driver.rating > 0 ? `${driver.rating?.toFixed(1)} ★` : "N/A", icon: Star },
          { label: "Vehicle No.", value: driver.vehicleNumber ?? "—", icon: Car },
        ].map((s) => (
          <Card key={s.label} className="glass-card border-white/5">
            <CardContent className="flex items-center gap-3 p-5">
              <s.icon className="w-6 h-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Profile Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-white">{driver.phone}</span>
            </div>
            {driver.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-white">{driver.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="text-white capitalize">{driver.vehicleType}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {driver.approvalStatus === "pending" && (
                <>
                  <Button size="sm" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" onClick={() => handleAction("approve")} disabled={action.isPending} data-testid="button-approve-driver">
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleAction("reject")} disabled={action.isPending} data-testid="button-reject-driver">
                    <Ban className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </>
              )}
              {driver.status !== "banned" && (
                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleAction("ban")} disabled={action.isPending} data-testid="button-ban-driver">
                  <Ban className="w-4 h-4 mr-1" /> Ban
                </Button>
              )}
              {driver.status === "banned" && (
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleAction("unban")} disabled={action.isPending} data-testid="button-unban-driver">
                  <CheckCircle className="w-4 h-4 mr-1" /> Unban
                </Button>
              )}
              {driver.status !== "suspended" && (
                <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" onClick={() => handleAction("suspend")} disabled={action.isPending} data-testid="button-suspend-driver">
                  <UserX className="w-4 h-4 mr-1" /> Suspend
                </Button>
              )}
              {driver.status === "suspended" && (
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleAction("unsuspend")} disabled={action.isPending} data-testid="button-unsuspend-driver">
                  <CheckCircle className="w-4 h-4 mr-1" /> Unsuspend
                </Button>
              )}
              {driver.isOnline && (
                <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={() => handleAction("force_offline")} disabled={action.isPending} data-testid="button-force-offline">
                  <WifiOff className="w-4 h-4 mr-1" /> Force Offline
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/5">
        <CardHeader><CardTitle>Document Verification</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {DOC_TYPES.map(({ type, label }) => {
              const doc = anyDriver.documents?.find((d: any) => d.documentType === type);
              return (
                <div key={type} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-2" data-testid={`doc-${type}`}>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-white">{label}</p>
                    <Badge className={`${doc ? docColor[doc.status] ?? "" : "bg-white/5 text-muted-foreground border-white/10"} border text-xs`}>
                      {doc?.status ?? "Missing"}
                    </Badge>
                  </div>
                  {doc?.status !== "approved" && (
                    <Button size="sm" className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs" onClick={() => handleDocVerify(type, "approved")} disabled={verifyDoc.isPending} data-testid={`button-approve-doc-${type}`}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Approve
                    </Button>
                  )}
                  {doc?.status === "approved" && (
                    <Button size="sm" variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 text-xs" onClick={() => handleDocVerify(type, "rejected")} disabled={verifyDoc.isPending} data-testid={`button-reject-doc-${type}`}>
                      <Ban className="w-3 h-3 mr-1" /> Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {anyDriver.recentRides?.length > 0 && (
        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Recent Rides</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anyDriver.recentRides.map((ride: any) => (
                <div key={ride.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm" data-testid={`row-ride-${ride.id}`}>
                  <div>
                    <p className="text-white font-medium">{ride.pickupAddress} → {ride.dropAddress}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{new Date(ride.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-semibold">₹{ride.fare?.toFixed(2)}</span>
                    <Badge className={`${rideStatusColor[ride.status] ?? ""} border text-xs`}>{ride.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
