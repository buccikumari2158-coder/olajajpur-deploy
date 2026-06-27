import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, Shield, MapPin, Wallet, Ban, CheckCircle, UserX, Lock, UnlockKeyhole } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetUser, getGetUserQueryKey, useUserAction, useAdjustUserWallet, getListUsersQueryKey, UserActionInputAction, WalletAdjustmentInputType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColor: Record<string, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  banned: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};
const rideStatusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function UserDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletType, setWalletType] = useState("credit");
  const [walletReason, setWalletReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useGetUser(id, { query: { queryKey: getGetUserQueryKey(id) } });
  const action = useUserAction();
  const adjustWallet = useAdjustUserWallet();

  const handleAction = (act: string) => {
    action.mutate({ id, data: { action: act as UserActionInputAction } }, {
      onSuccess: () => {
        toast({ title: `Action '${act}' performed` });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  const handleWalletAdjust = () => {
    const amt = parseFloat(walletAmount);
    if (!amt || amt <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    adjustWallet.mutate({ id, data: { amount: amt, type: walletType as WalletAdjustmentInputType, reason: walletReason } }, {
      onSuccess: () => {
        toast({ title: "Wallet adjusted" });
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(id) });
        setWalletOpen(false);
        setWalletAmount("");
        setWalletReason("");
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <div className="text-center py-20 text-muted-foreground">User not found</div>;

  const anyUser = user as any;

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/users")} className="text-muted-foreground hover:text-white" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-muted-foreground text-sm">User #{user.id}</p>
        </div>
        <Badge className={`${statusColor[user.status] ?? ""} border ml-2`}>{user.status}</Badge>
        {user.isVerified && <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Verified</Badge>}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Rides", value: user.totalRides, icon: MapPin },
          { label: "Wallet Balance", value: `₹${user.walletBalance?.toFixed(2)}`, icon: Wallet },
          { label: "Total Spending", value: `₹${user.totalSpending?.toFixed(2)}`, icon: Shield },
          { label: "Cancelled Rides", value: user.cancelledRides, icon: Ban },
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
              <span className="text-white">{user.phone}</span>
            </div>
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-white">{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Booking blocked:</span>
              <span className="text-white">{user.isBlockedFromBooking ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Member since:</span>
              <span className="text-white">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {user.status !== "banned" && (
                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleAction("ban")} disabled={action.isPending} data-testid="button-ban-user">
                  <Ban className="w-4 h-4 mr-1" /> Ban User
                </Button>
              )}
              {user.status === "banned" && (
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleAction("unban")} disabled={action.isPending} data-testid="button-unban-user">
                  <CheckCircle className="w-4 h-4 mr-1" /> Unban
                </Button>
              )}
              {user.status !== "suspended" && (
                <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" onClick={() => handleAction("suspend")} disabled={action.isPending} data-testid="button-suspend-user">
                  <UserX className="w-4 h-4 mr-1" /> Suspend
                </Button>
              )}
              {user.status === "suspended" && (
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleAction("unsuspend")} disabled={action.isPending} data-testid="button-unsuspend-user">
                  <CheckCircle className="w-4 h-4 mr-1" /> Unsuspend
                </Button>
              )}
              {!user.isVerified && (
                <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={() => handleAction("verify")} disabled={action.isPending} data-testid="button-verify-user">
                  <Shield className="w-4 h-4 mr-1" /> Verify
                </Button>
              )}
              {!user.isBlockedFromBooking && (
                <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10" onClick={() => handleAction("block_booking")} disabled={action.isPending} data-testid="button-block-booking">
                  <Lock className="w-4 h-4 mr-1" /> Block Booking
                </Button>
              )}
              {user.isBlockedFromBooking && (
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleAction("unblock_booking")} disabled={action.isPending} data-testid="button-unblock-booking">
                  <UnlockKeyhole className="w-4 h-4 mr-1" /> Unblock
                </Button>
              )}
              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setWalletOpen(true)} data-testid="button-adjust-wallet">
                <Wallet className="w-4 h-4 mr-1" /> Adjust Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {anyUser.recentRides?.length > 0 && (
        <Card className="glass-card border-white/5">
          <CardHeader><CardTitle>Recent Rides</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anyUser.recentRides.map((ride: any) => (
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

      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Adjust Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select value={walletType} onValueChange={setWalletType}>
                <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-wallet-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Add Money)</SelectItem>
                  <SelectItem value="debit">Debit (Deduct Money)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Amount (₹)</label>
              <Input value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} type="number" className="bg-white/5 border-white/10" placeholder="0.00" data-testid="input-wallet-amount" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Reason</label>
              <Input value={walletReason} onChange={(e) => setWalletReason(e.target.value)} className="bg-white/5 border-white/10" placeholder="Reason for adjustment" data-testid="input-wallet-reason" />
            </div>
            <Button className="w-full bg-primary text-primary-foreground" onClick={handleWalletAdjust} disabled={adjustWallet.isPending} data-testid="button-submit-wallet">
              {adjustWallet.isPending ? "Processing..." : "Adjust Wallet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
