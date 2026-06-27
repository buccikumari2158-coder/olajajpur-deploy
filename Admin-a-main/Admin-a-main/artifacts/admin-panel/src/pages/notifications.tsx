import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Bell, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useListNotifications, getListNotificationsQueryKey, useSendNotification, useDeleteNotification, NotificationInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const notifSchema = z.object({
  title: z.string().min(1, "Title required"),
  message: z.string().min(1, "Message required"),
  targetAudience: z.string().min(1),
  type: z.string().min(1),
});
type NotifForm = z.infer<typeof notifSchema>;

const typeColor: Record<string, string> = {
  promotional: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  emergency: "bg-destructive/10 text-destructive border-destructive/20",
  offer: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  announcement: "bg-primary/10 text-primary border-primary/20",
};

export default function Notifications() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { page, limit: 20 };
  const { data, isLoading } = useListNotifications(params, { query: { queryKey: getListNotificationsQueryKey(params) } });
  const send = useSendNotification();
  const del = useDeleteNotification();

  const form = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
    defaultValues: { title: "", message: "", targetAudience: "all", type: "announcement" },
  });

  const onSubmit = (values: NotifForm) => {
    send.mutate({ data: values as NotificationInput }, {
      onSuccess: () => {
        toast({ title: "Notification sent" });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey(params) });
        form.reset();
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to send", variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    del.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted" });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey(params) });
      },
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Notifications</h2>
          <p className="text-muted-foreground">Send and manage push notifications</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow" data-testid="button-send-notification">
              <Plus className="w-4 h-4 mr-2" /> Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Send Notification</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="Notification title" data-testid="input-notif-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl><Textarea {...field} className="bg-white/5 border-white/10 resize-none" rows={3} placeholder="Notification message..." data-testid="input-notif-message" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="targetAudience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-target-audience">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Users & Drivers</SelectItem>
                        <SelectItem value="all_users">All Users</SelectItem>
                        <SelectItem value="all_drivers">All Drivers</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-notif-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={send.isPending} data-testid="button-submit-notification">
                  {send.isPending ? "Sending..." : "Send Now"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Card className="glass-card border-white/5">
        <CardHeader><CardTitle>Sent Notifications</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {data?.data?.map((n) => (
                <div key={n.id} className="flex items-start justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors" data-testid={`row-notif-${n.id}`}>
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{n.title}</p>
                        <Badge className={`${typeColor[n.type] ?? ""} border text-xs`}>{n.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Audience: <span className="text-white/70">{n.targetAudience}</span> · {n.sentCount} sent · {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(n.id)} data-testid={`button-delete-notif-${n.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">No notifications sent yet</p>
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
