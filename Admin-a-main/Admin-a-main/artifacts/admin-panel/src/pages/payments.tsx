import { useState } from "react";
import { motion } from "framer-motion";
import { IndianRupee, RefreshCw, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListPayments, getListPaymentsQueryKey, useRefundPayment, useGetPaymentSummary, getGetPaymentSummaryQueryKey, PaymentStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColor: Record<string, string> = {
  success: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function Payments() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { page, limit: 20, ...(statusFilter !== "all" ? { status: statusFilter as PaymentStatus } : {}) };
  const { data, isLoading } = useListPayments(params, { query: { queryKey: getListPaymentsQueryKey(params) } });
  const { data: summary } = useGetPaymentSummary({ query: { queryKey: getGetPaymentSummaryQueryKey() } });
  const refund = useRefundPayment();

  const handleRefund = (id: string) => {
    refund.mutate({ id, data: { reason: "Admin initiated refund" } }, {
      onSuccess: () => {
        toast({ title: "Payment refunded successfully" });
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey(params) });
        queryClient.invalidateQueries({ queryKey: getGetPaymentSummaryQueryKey() });
      },
      onError: () => toast({ title: "Failed to refund", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-1">Payments</h2>
        <p className="text-muted-foreground">Transaction history and refund management</p>
      </motion.div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Revenue", value: `₹${summary.totalRevenue?.toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
            { label: "Commission Earned", value: `₹${summary.totalCommission?.toFixed(2)}`, icon: IndianRupee, color: "text-blue-400" },
            { label: "Total Refunds", value: `₹${summary.totalRefunds?.toFixed(2)}`, icon: AlertCircle, color: "text-destructive" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="flex items-center gap-4 p-6">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="glass-card border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-white/5">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`row-payment-${p.id}`}>
                      <td className="py-3 px-4 text-muted-foreground">#{p.id}</td>
                      <td className="py-3 px-4 text-white">{(p as any).userName ?? "—"}</td>
                      <td className="py-3 px-4 font-semibold text-primary">₹{p.amount?.toFixed(2)}</td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">{p.method}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusColor[p.status] ?? ""} border text-xs`}>{p.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {p.status === "success" && (
                          <Button size="sm" variant="outline" className="border-white/10 hover:bg-destructive/10 hover:text-destructive text-xs" onClick={() => handleRefund(p.id)} disabled={refund.isPending} data-testid={`button-refund-${p.id}`}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.data || data.data.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No payments found</p>
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
    </div>
  );
}
