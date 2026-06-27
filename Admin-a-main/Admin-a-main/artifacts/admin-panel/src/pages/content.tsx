import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Image, Megaphone, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  useListBanners, getListBannersQueryKey, useCreateBanner, useUpdateBanner, useDeleteBanner,
  useListAnnouncements, getListAnnouncementsQueryKey, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const bannerSchema = z.object({ title: z.string().min(1), imageUrl: z.string().url("Valid URL required"), linkUrl: z.string().optional() });
const announcementSchema = z.object({ title: z.string().min(1), content: z.string().min(1), expiresAt: z.string().optional() });

type BannerForm = z.infer<typeof bannerSchema>;
type AnnouncementForm = z.infer<typeof announcementSchema>;

export default function Content() {
  const [bannerOpen, setBannerOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [editBannerId, setEditBannerId] = useState<string | null>(null);
  const [editAnnouncementId, setEditAnnouncementId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: banners } = useListBanners({ query: { queryKey: getListBannersQueryKey() } });
  const { data: announcements } = useListAnnouncements({ query: { queryKey: getListAnnouncementsQueryKey() } });

  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const bannerForm = useForm<BannerForm>({ resolver: zodResolver(bannerSchema), defaultValues: { title: "", imageUrl: "", linkUrl: "" } });
  const announcementForm = useForm<AnnouncementForm>({ resolver: zodResolver(announcementSchema), defaultValues: { title: "", content: "", expiresAt: "" } });

  const onBannerSubmit = (values: BannerForm) => {
    if (editBannerId) {
      updateBanner.mutate({ id: editBannerId, data: values }, { onSuccess: () => { toast({ title: "Banner updated" }); queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }); setBannerOpen(false); } });
    } else {
      createBanner.mutate({ data: values }, { onSuccess: () => { toast({ title: "Banner created" }); queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }); setBannerOpen(false); } });
    }
  };

  const onAnnouncementSubmit = (values: AnnouncementForm) => {
    const payload = { ...values, expiresAt: values.expiresAt || undefined };
    if (editAnnouncementId) {
      updateAnnouncement.mutate({ id: editAnnouncementId, data: payload }, { onSuccess: () => { toast({ title: "Updated" }); queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); setAnnouncementOpen(false); } });
    } else {
      createAnnouncement.mutate({ data: payload }, { onSuccess: () => { toast({ title: "Created" }); queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); setAnnouncementOpen(false); } });
    }
  };

  const toggleBanner = (b: any) => updateBanner.mutate({ id: b.id, data: { isActive: !b.isActive } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }) });
  const toggleAnnouncement = (a: any) => updateAnnouncement.mutate({ id: a.id, data: { isActive: !a.isActive } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }) });

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-1">Content Management</h2>
        <p className="text-muted-foreground">Manage banners and announcements</p>
      </motion.div>

      <Card className="glass-card border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Banners</CardTitle>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setEditBannerId(null); bannerForm.reset(); setBannerOpen(true); }} data-testid="button-add-banner"><Plus className="w-4 h-4 mr-1" /> Add Banner</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(banners ?? []).map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5" data-testid={`row-banner-${b.id}`}>
                <div className="w-16 h-10 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{b.title}</p>
                  {b.linkUrl && <p className="text-xs text-muted-foreground">{b.linkUrl}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={b.isActive ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-muted-foreground border border-white/10"}>{b.isActive ? "Active" : "Inactive"}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => toggleBanner(b)} data-testid={`button-toggle-banner-${b.id}`}>{b.isActive ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditBannerId(b.id); bannerForm.reset({ title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? "" }); setBannerOpen(true); }} data-testid={`button-edit-banner-${b.id}`}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="hover:text-destructive" onClick={() => deleteBanner.mutate({ id: b.id }, { onSuccess: () => { toast({ title: "Deleted" }); queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }); } })} data-testid={`button-delete-banner-${b.id}`}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {(!banners || banners.length === 0) && <p className="text-center py-6 text-muted-foreground">No banners</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-yellow-400" /> Announcements</CardTitle>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setEditAnnouncementId(null); announcementForm.reset(); setAnnouncementOpen(true); }} data-testid="button-add-announcement"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(announcements ?? []).map((a) => (
              <div key={a.id} className="flex items-start justify-between p-4 rounded-lg bg-white/5 border border-white/5" data-testid={`row-announcement-${a.id}`}>
                <div className="flex-1">
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                  {a.expiresAt && <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(a.expiresAt).toLocaleDateString()}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge className={a.isActive ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-muted-foreground border border-white/10"}>{a.isActive ? "Active" : "Inactive"}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => toggleAnnouncement(a)} data-testid={`button-toggle-announcement-${a.id}`}>{a.isActive ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditAnnouncementId(a.id); announcementForm.reset({ title: a.title, content: a.content, expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().split("T")[0] : "" }); setAnnouncementOpen(true); }} data-testid={`button-edit-announcement-${a.id}`}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="hover:text-destructive" onClick={() => deleteAnnouncement.mutate({ id: a.id }, { onSuccess: () => { toast({ title: "Deleted" }); queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); } })} data-testid={`button-delete-announcement-${a.id}`}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {(!announcements || announcements.length === 0) && <p className="text-center py-6 text-muted-foreground">No announcements</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader><DialogTitle className="text-white">{editBannerId ? "Edit" : "Add"} Banner</DialogTitle></DialogHeader>
          <Form {...bannerForm}>
            <form onSubmit={bannerForm.handleSubmit(onBannerSubmit)} className="space-y-4">
              <FormField control={bannerForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-banner-title" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={bannerForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="https://..." data-testid="input-banner-image-url" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={bannerForm.control} name="linkUrl" render={({ field }) => (<FormItem><FormLabel>Link URL (optional)</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="https://..." /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createBanner.isPending || updateBanner.isPending} data-testid="button-submit-banner">Save Banner</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader><DialogTitle className="text-white">{editAnnouncementId ? "Edit" : "Add"} Announcement</DialogTitle></DialogHeader>
          <Form {...announcementForm}>
            <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="space-y-4">
              <FormField control={announcementForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-announcement-title" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={announcementForm.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content</FormLabel><FormControl><Textarea {...field} className="bg-white/5 border-white/10 resize-none" rows={3} data-testid="input-announcement-content" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={announcementForm.control} name="expiresAt" render={({ field }) => (<FormItem><FormLabel>Expires At (optional)</FormLabel><FormControl><Input {...field} type="date" className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createAnnouncement.isPending || updateAnnouncement.isPending} data-testid="button-submit-announcement">Save</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
