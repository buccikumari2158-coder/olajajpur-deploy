import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Ban, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetPendingDriverApprovals, getGetPendingDriverApprovalsQueryKey, useDriverAction, getListDriversQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function DriverApprovals() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pending, isLoading } = useGetPendingDriverApprovals({ query: { queryKey: getGetPendingDriverApprovalsQueryKey() } });
  const action = useDriverAction();

  const handleAction = (id: string, act: "approve" | "reject") => {
    action.mutate({ id, data: { action: act } }, {
      onSuccess: () => {
        toast({ title: `Driver ${act}d` });
        queryClient.invalidateQueries({ queryKey: getGetPendingDriverApprovalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/drivers")} className="text-muted-foreground hover:text-white" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">Pending Approvals</h2>
          <p className="text-muted-foreground text-sm">Drivers waiting for approval</p>
        </div>
        <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{(pending ?? []).length} pending</Badge>
      </motion.div>

      <Card className="glass-card border-white/5">
        <CardHeader><CardTitle>Approval Queue</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {(pending ?? []).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10" data-testid={`row-pending-${d.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{d.name}</p>
                      <p className="text-sm text-muted-foreground">{d.phone} · <span className="capitalize">{d.vehicleType}</span> {d.vehicleNumber && `· ${d.vehicleNumber}`}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Applied {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" onClick={() => handleAction(d.id, "approve")} disabled={action.isPending} data-testid={`button-approve-${d.id}`}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleAction(d.id, "reject")} disabled={action.isPending} data-testid={`button-reject-${d.id}`}>
                      <Ban className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/10" onClick={() => setLocation(`/drivers/${d.id}`)} data-testid={`button-view-driver-${d.id}`}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              {(!pending || pending.length === 0) && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
