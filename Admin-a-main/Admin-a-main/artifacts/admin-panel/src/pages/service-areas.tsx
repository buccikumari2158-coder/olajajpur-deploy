import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, MapPin, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  useListServiceAreas, getListServiceAreasQueryKey, useCreateServiceArea, useUpdateServiceArea, useDeleteServiceArea,
  useListSurgeZones, getListSurgeZonesQueryKey, useCreateSurgeZone, useUpdateSurgeZone, useDeleteSurgeZone,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const areaSchema = z.object({
  name: z.string().min(1, "Name required"),
  radiusKm: z.coerce.number().positive(),
  centerLat: z.coerce.number(),
  centerLng: z.coerce.number(),
});
const surgeSchema = z.object({
  name: z.string().min(1, "Name required"),
  multiplier: z.coerce.number().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type AreaForm = z.infer<typeof areaSchema>;
type SurgeForm = z.infer<typeof surgeSchema>;

export default function ServiceAreas() {
  const [areaOpen, setAreaOpen] = useState(false);
  const [surgeOpen, setSurgeOpen] = useState(false);
  const [editAreaId, setEditAreaId] = useState<string | null>(null);
  const [editSurgeId, setEditSurgeId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: areas, isLoading: areasLoading } = useListServiceAreas({ query: { queryKey: getListServiceAreasQueryKey() } });
  const { data: surges, isLoading: surgesLoading } = useListSurgeZones({ query: { queryKey: getListSurgeZonesQueryKey() } });

  const createArea = useCreateServiceArea();
  const updateArea = useUpdateServiceArea();
  const deleteArea = useDeleteServiceArea();
  const createSurge = useCreateSurgeZone();
  const updateSurge = useUpdateSurgeZone();
  const deleteSurge = useDeleteSurgeZone();

  const areaForm = useForm<AreaForm>({ resolver: zodResolver(areaSchema), defaultValues: { name: "", radiusKm: 30, centerLat: 20.849, centerLng: 86.0 } });
  const surgeForm = useForm<SurgeForm>({ resolver: zodResolver(surgeSchema), defaultValues: { name: "", multiplier: 1.5, startTime: "", endTime: "" } });

  const onAreaSubmit = (values: AreaForm) => {
    if (editAreaId) {
      updateArea.mutate({ id: editAreaId, data: values }, { onSuccess: () => { toast({ title: "Area updated" }); queryClient.invalidateQueries({ queryKey: getListServiceAreasQueryKey() }); setAreaOpen(false); } });
    } else {
      createArea.mutate({ data: values }, { onSuccess: () => { toast({ title: "Area created" }); queryClient.invalidateQueries({ queryKey: getListServiceAreasQueryKey() }); setAreaOpen(false); } });
    }
  };

  const onSurgeSubmit = (values: SurgeForm) => {
    if (editSurgeId) {
      updateSurge.mutate({ id: editSurgeId, data: values }, { onSuccess: () => { toast({ title: "Surge zone updated" }); queryClient.invalidateQueries({ queryKey: getListSurgeZonesQueryKey() }); setSurgeOpen(false); } });
    } else {
      createSurge.mutate({ data: values }, { onSuccess: () => { toast({ title: "Surge zone created" }); queryClient.invalidateQueries({ queryKey: getListSurgeZonesQueryKey() }); setSurgeOpen(false); } });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-1">Service Areas</h2>
        <p className="text-muted-foreground">Manage operational zones and surge pricing areas</p>
      </motion.div>

      <Card className="glass-card border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Service Zones</CardTitle>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setEditAreaId(null); areaForm.reset({ name: "", radiusKm: 30, centerLat: 20.849, centerLng: 86.0 }); setAreaOpen(true); }} data-testid="button-add-area">
            <Plus className="w-4 h-4 mr-1" /> Add Area
          </Button>
        </CardHeader>
        <CardContent>
          {areasLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
            <div className="space-y-3">
              {(areas ?? []).map((area) => (
                <div key={area.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5" data-testid={`row-area-${area.id}`}>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-white">{area.name}</p>
                      <p className="text-xs text-muted-foreground">Radius: {area.radiusKm}km · {area.centerLat?.toFixed(4)}, {area.centerLng?.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {area.isActive ? <Badge className="bg-primary/10 text-primary border border-primary/20">Active</Badge> : <Badge className="bg-white/5 text-muted-foreground border border-white/10">Inactive</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => { setEditAreaId(area.id); areaForm.reset({ name: area.name, radiusKm: area.radiusKm, centerLat: area.centerLat, centerLng: area.centerLng }); setAreaOpen(true); }} data-testid={`button-edit-area-${area.id}`}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="hover:text-destructive" onClick={() => deleteArea.mutate({ id: area.id }, { onSuccess: () => { toast({ title: "Deleted" }); queryClient.invalidateQueries({ queryKey: getListServiceAreasQueryKey() }); } })} data-testid={`button-delete-area-${area.id}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              {(!areas || areas.length === 0) && <p className="text-center py-6 text-muted-foreground">No service areas defined</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> Surge Zones</CardTitle>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setEditSurgeId(null); surgeForm.reset({ name: "", multiplier: 1.5 }); setSurgeOpen(true); }} data-testid="button-add-surge">
            <Plus className="w-4 h-4 mr-1" /> Add Surge Zone
          </Button>
        </CardHeader>
        <CardContent>
          {surgesLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
            <div className="space-y-3">
              {(surges ?? []).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5" data-testid={`row-surge-${s.id}`}>
                  <div>
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Multiplier: <span className="text-yellow-400">{s.multiplier}x</span> · {s.startTime ?? "—"} to {s.endTime ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.isActive ? <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Active</Badge> : <Badge className="bg-white/5 text-muted-foreground border border-white/10">Inactive</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => { setEditSurgeId(s.id); surgeForm.reset({ name: s.name, multiplier: s.multiplier, startTime: s.startTime ?? "", endTime: s.endTime ?? "" }); setSurgeOpen(true); }} data-testid={`button-edit-surge-${s.id}`}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="hover:text-destructive" onClick={() => deleteSurge.mutate({ id: s.id }, { onSuccess: () => { toast({ title: "Deleted" }); queryClient.invalidateQueries({ queryKey: getListSurgeZonesQueryKey() }); } })} data-testid={`button-delete-surge-${s.id}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              {(!surges || surges.length === 0) && <p className="text-center py-6 text-muted-foreground">No surge zones defined</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={areaOpen} onOpenChange={setAreaOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader><DialogTitle className="text-white">{editAreaId ? "Edit" : "Add"} Service Area</DialogTitle></DialogHeader>
          <Form {...areaForm}>
            <form onSubmit={areaForm.handleSubmit(onAreaSubmit)} className="space-y-4">
              <FormField control={areaForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="Jajpur City" data-testid="input-area-name" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={areaForm.control} name="radiusKm" render={({ field }) => (<FormItem><FormLabel>Radius (km)</FormLabel><FormControl><Input {...field} type="number" className="bg-white/5 border-white/10" data-testid="input-area-radius" /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={areaForm.control} name="centerLat" render={({ field }) => (<FormItem><FormLabel>Center Lat</FormLabel><FormControl><Input {...field} type="number" step="0.0001" className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={areaForm.control} name="centerLng" render={({ field }) => (<FormItem><FormLabel>Center Lng</FormLabel><FormControl><Input {...field} type="number" step="0.0001" className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createArea.isPending || updateArea.isPending} data-testid="button-submit-area">Save Area</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={surgeOpen} onOpenChange={setSurgeOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader><DialogTitle className="text-white">{editSurgeId ? "Edit" : "Add"} Surge Zone</DialogTitle></DialogHeader>
          <Form {...surgeForm}>
            <form onSubmit={surgeForm.handleSubmit(onSurgeSubmit)} className="space-y-4">
              <FormField control={surgeForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="Peak Hours Zone" data-testid="input-surge-name" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={surgeForm.control} name="multiplier" render={({ field }) => (<FormItem><FormLabel>Multiplier</FormLabel><FormControl><Input {...field} type="number" step="0.1" className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={surgeForm.control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Start Time</FormLabel><FormControl><Input {...field} type="time" className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={surgeForm.control} name="endTime" render={({ field }) => (<FormItem><FormLabel>End Time</FormLabel><FormControl><Input {...field} type="time" className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createSurge.isPending || updateSurge.isPending} data-testid="button-submit-surge">Save Surge Zone</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
