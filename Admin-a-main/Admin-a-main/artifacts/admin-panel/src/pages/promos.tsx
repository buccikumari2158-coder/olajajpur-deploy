import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useListPromos, getListPromosQueryKey, useCreatePromo, useUpdatePromo, useDeletePromo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const promoSchema = z.object({
  code: z.string().min(1, "Code required"),
  description: z.string().optional(),
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.coerce.number().positive("Must be positive"),
  minimumFare: z.coerce.number().optional(),
  maximumDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().optional(),
  expiresAt: z.string().optional(),
});
type PromoForm = z.infer<typeof promoSchema>;

export default function Promos() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { page, limit: 20 };
  const { data, isLoading } = useListPromos(params, { query: { queryKey: getListPromosQueryKey(params) } });
  const create = useCreatePromo();
  const update = useUpdatePromo();
  const del = useDeletePromo();

  const form = useForm<PromoForm>({
    resolver: zodResolver(promoSchema),
    defaultValues: { code: "", discountType: "percent", discountValue: 10, description: "" },
  });

  const openCreate = () => { setEditId(null); form.reset({ code: "", discountType: "percent", discountValue: 10 }); setOpen(true); };
  const openEdit = (promo: any) => {
    setEditId(promo.id);
    form.reset({ code: promo.code, description: promo.description ?? "", discountType: promo.discountType, discountValue: promo.discountValue, minimumFare: promo.minimumFare ?? undefined, maximumDiscount: promo.maximumDiscount ?? undefined, usageLimit: promo.usageLimit ?? undefined, expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split("T")[0] : "" });
    setOpen(true);
  };

  const onSubmit = (values: PromoForm) => {
    const payload = { ...values, expiresAt: values.expiresAt || undefined };
    if (editId) {
      update.mutate({ id: editId, data: payload }, {
        onSuccess: () => { toast({ title: "Promo updated" }); queryClient.invalidateQueries({ queryKey: getListPromosQueryKey(params) }); setOpen(false); },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      });
    } else {
      create.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Promo created" }); queryClient.invalidateQueries({ queryKey: getListPromosQueryKey(params) }); setOpen(false); },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: string) => {
    del.mutate({ id }, {
      onSuccess: () => { toast({ title: "Promo deleted" }); queryClient.invalidateQueries({ queryKey: getListPromosQueryKey(params) }); },
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Promo Codes</h2>
          <p className="text-muted-foreground">Manage discount codes and offers</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow" data-testid="button-create-promo">
          <Plus className="w-4 h-4 mr-2" /> Create Promo
        </Button>
      </motion.div>

      <Card className="glass-card border-white/5">
        <CardHeader><CardTitle>All Promo Codes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-white/5">
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Discount</th>
                    <th className="text-left py-3 px-4">Usage</th>
                    <th className="text-left py-3 px-4">Expires</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`row-promo-${p.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary" />
                          <span className="font-mono font-bold text-white">{p.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">{p.discountType}</td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {p.discountType === "percent" ? `${p.discountValue}%` : `₹${p.discountValue}`}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{p.usedCount}/{p.usageLimit ?? "∞"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "Never"}</td>
                      <td className="py-3 px-4">
                        {p.isActive
                          ? <Badge className="bg-primary/10 text-primary border border-primary/20">Active</Badge>
                          : <Badge className="bg-muted/10 text-muted-foreground border border-white/10">Inactive</Badge>}
                      </td>
                      <td className="py-3 px-4 flex gap-1">
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => openEdit(p)} data-testid={`button-edit-promo-${p.id}`}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)} data-testid={`button-delete-promo-${p.id}`}><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.data || data.data.length === 0) && <p className="text-center py-8 text-muted-foreground">No promo codes</p>}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editId ? "Edit Promo" : "Create Promo Code"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10 font-mono uppercase" placeholder="SUMMER20" data-testid="input-promo-code" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="Optional description" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="discountType" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="bg-white/5 border-white/10" data-testid="select-discount-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="flat">Flat Amount</SelectItem></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="discountValue" render={({ field }) => (
                  <FormItem><FormLabel>Value</FormLabel><FormControl><Input {...field} type="number" className="bg-white/5 border-white/10" data-testid="input-discount-value" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="usageLimit" render={({ field }) => (
                  <FormItem><FormLabel>Usage Limit</FormLabel><FormControl><Input {...field} type="number" className="bg-white/5 border-white/10" placeholder="Unlimited" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expiresAt" render={({ field }) => (
                  <FormItem><FormLabel>Expires At</FormLabel><FormControl><Input {...field} type="date" className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={create.isPending || update.isPending} data-testid="button-submit-promo">
                {editId ? "Update" : "Create"} Promo
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
