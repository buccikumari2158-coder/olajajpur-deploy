import { useState } from "react";
import { motion } from "framer-motion";
import { Snowflake, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useListWallets, getListWalletsQueryKey, useFreezeWallet, useListWalletTransactions, getListWalletTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Wallets() {
  const [page, setPage] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { page, limit: 20 };
  const { data, isLoading } = useListWallets(params, { query: { queryKey: getListWalletsQueryKey(params) } });
  const freeze = useFreezeWallet();
  const { data: txData, isLoading: txLoading } = useListWalletTransactions(selectedWallet!, {
    query: { enabled: !!selectedWallet, queryKey: getListWalletTransactionsQueryKey(selectedWallet!) }
  });

  const handleFreeze = (id: string, frozen: boolean) => {
    freeze.mutate({ id, data: { frozen } }, {
      onSuccess: () => {
        toast({ title: frozen ? "Wallet frozen" : "Wallet unfrozen" });
        queryClient.invalidateQueries({ queryKey: getListWalletsQueryKey(params) });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-1">Wallets</h2>
        <p className="text-muted-foreground">User wallet management and transaction history</p>
      </motion.div>

      <Card className="glass-card border-white/5">
        <CardHeader><CardTitle>All Wallets</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-white/5">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Phone</th>
                    <th className="text-left py-3 px-4">Balance</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((w) => (
                    <tr key={w.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`row-wallet-${w.id}`}>
                      <td className="py-3 px-4 text-white">{(w as any).userName ?? "Unknown"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{(w as any).userPhone ?? "—"}</td>
                      <td className="py-3 px-4 font-semibold text-primary">₹{w.balance?.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {(w as any).isFrozen
                          ? <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Frozen</Badge>
                          : <Badge className="bg-primary/10 text-primary border border-primary/20">Active</Badge>}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button size="sm" variant="outline" className="border-white/10 text-xs" onClick={() => setSelectedWallet(w.id)} data-testid={`button-view-wallet-${w.id}`}>
                          <Eye className="w-3 h-3 mr-1" /> Txns
                        </Button>
                        <Button size="sm" variant="outline"
                          className={`border-white/10 text-xs ${(w as any).isFrozen ? "hover:bg-primary/10 hover:text-primary" : "hover:bg-blue-500/10 hover:text-blue-400"}`}
                          onClick={() => handleFreeze(w.id, !(w as any).isFrozen)}
                          disabled={freeze.isPending}
                          data-testid={`button-freeze-wallet-${w.id}`}
                        >
                          <Snowflake className="w-3 h-3 mr-1" />
                          {(w as any).isFrozen ? "Unfreeze" : "Freeze"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.data || data.data.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No wallets found</p>
              )}
            </div>
          )}
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <span>Total: {data?.total ?? 0}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">Prev</Button>
              <Button size="sm" variant="outline" className="border-white/10" disabled={!data || page * 20 >= data.total} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedWallet} onOpenChange={(o) => !o && setSelectedWallet(null)}>
        <SheetContent className="bg-card border-white/10 w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Transaction History</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {txLoading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : txData?.data?.length ? (
              txData.data.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5" data-testid={`row-tx-${tx.id}`}>
                  <div>
                    <p className="text-sm font-medium text-white">{tx.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === "credit" ? "text-primary" : "text-destructive"}`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount?.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Bal: ₹{tx.balance?.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No transactions</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
