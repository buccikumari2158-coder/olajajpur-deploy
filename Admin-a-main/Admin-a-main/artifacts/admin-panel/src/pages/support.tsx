import { useState } from "react";
import { motion } from "framer-motion";
import { LifeBuoy, MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useListSupportTickets, getListSupportTicketsQueryKey, useUpdateSupportTicket, useGetSupportStats, getGetSupportStatsQueryKey, useGetSupportTicket, getGetSupportTicketQueryKey, SupportTicketStatus, SupportTicketUpdateStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColor: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-primary/10 text-primary border-primary/20",
  closed: "bg-muted/10 text-muted-foreground border-white/10",
};

export default function Support() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("in_progress");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { page, limit: 20, ...(statusFilter !== "all" ? { status: statusFilter as SupportTicketStatus } : {}) };
  const { data, isLoading } = useListSupportTickets(params, { query: { queryKey: getListSupportTicketsQueryKey(params) } });
  const { data: stats } = useGetSupportStats({ query: { queryKey: getGetSupportStatsQueryKey() } });
  const { data: ticket } = useGetSupportTicket(selectedTicket!, { query: { enabled: !!selectedTicket, queryKey: getGetSupportTicketQueryKey(selectedTicket!) } });
  const update = useUpdateSupportTicket();

  const handleUpdate = () => {
    if (!selectedTicket) return;
    update.mutate({ id: selectedTicket, data: { status: newStatus as SupportTicketUpdateStatus, adminReply: reply } }, {
      onSuccess: () => {
        toast({ title: "Ticket updated" });
        queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey(params) });
        queryClient.invalidateQueries({ queryKey: getGetSupportStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(selectedTicket!) });
        setSelectedTicket(null);
        setReply("");
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-1">Support Tickets</h2>
        <p className="text-muted-foreground">Manage customer complaints and queries</p>
      </motion.div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Open", value: stats.open, icon: LifeBuoy, color: "text-yellow-400" },
            { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-blue-400" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "text-primary" },
            { label: "Closed", value: stats.closed, icon: XCircle, color: "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label} className="glass-card border-white/5">
              <CardContent className="flex items-center gap-3 p-5">
                <s.icon className={`w-7 h-7 ${s.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="glass-card border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Tickets</CardTitle>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {data?.data?.map((t) => (
                <div key={t.id} className="flex items-start justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => { setSelectedTicket(t.id); setNewStatus(t.status); setReply(t.adminReply ?? ""); }} data-testid={`row-ticket-${t.id}`}>
                  <div className="flex gap-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-white">{t.subject}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 capitalize">{t.category.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge className={`${statusColor[t.status] ?? ""} border text-xs shrink-0`}>{t.status.replace(/_/g, " ")}</Badge>
                </div>
              ))}
              {(!data?.data || data.data.length === 0) && <p className="text-center py-8 text-muted-foreground">No tickets found</p>}
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

      <Sheet open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)}>
        <SheetContent className="bg-card border-white/10 w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Ticket Detail</SheetTitle>
          </SheetHeader>
          {ticket && (
            <div className="mt-6 space-y-5">
              <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                <p className="font-semibold text-white text-lg">{ticket.subject}</p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">{ticket.category.replace(/_/g, " ")}</p>
                {ticket.description && <p className="text-sm text-white/70 mt-3">{ticket.description}</p>}
                <p className="text-xs text-muted-foreground mt-3">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Update Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-ticket-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Admin Reply</label>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} className="bg-white/5 border-white/10 resize-none" rows={4} placeholder="Write your reply..." data-testid="textarea-admin-reply" />
              </div>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleUpdate} disabled={update.isPending} data-testid="button-submit-reply">
                {update.isPending ? "Updating..." : "Update Ticket"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
