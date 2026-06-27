import { useEffect } from "react";
import { motion } from "framer-motion";
import { Settings2, Phone, IndianRupee, Globe, ShieldAlert, FileText, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const settingsSchema = z.object({
  appName: z.string().min(1, "Required"),
  appLogoUrl: z.string().optional(),
  supportNumber: z.string().min(1, "Required"),
  commissionPercent: z.coerce.number().min(0).max(100),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  privacyPolicyUrl: z.string().optional(),
  termsUrl: z.string().optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { data, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const update = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { appName: "JAJPUR JATRI", supportNumber: "+919583789411", commissionPercent: 20, maintenanceMode: false, registrationEnabled: true, privacyPolicyUrl: "", termsUrl: "" },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        appName: data.appName,
        appLogoUrl: data.appLogoUrl ?? "",
        supportNumber: data.supportNumber,
        commissionPercent: data.commissionPercent,
        maintenanceMode: data.maintenanceMode,
        registrationEnabled: data.registrationEnabled,
        privacyPolicyUrl: data.privacyPolicyUrl ?? "",
        termsUrl: data.termsUrl ?? "",
      });
    }
  }, [data, form]);

  const onSubmit = (values: SettingsForm) => {
    update.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Settings saved" });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-white mb-1">App Settings</h2>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </motion.div>

      {data?.supportNumber && (
        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-5">
            <Phone className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Support Helpline</p>
              <p className="text-2xl font-bold text-primary neon-text">{data.supportNumber}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-card border-white/5">
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="appName" render={({ field }) => (
                <FormItem><FormLabel>App Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-app-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="appLogoUrl" render={({ field }) => (
                <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="https://..." /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Support & Commission</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="supportNumber" render={({ field }) => (
                <FormItem><FormLabel>Support Number</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-support-number" /></FormControl><FormDescription className="text-xs text-muted-foreground">Displayed to riders and drivers</FormDescription><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="commissionPercent" render={({ field }) => (
                <FormItem><FormLabel>Commission Percentage (%)</FormLabel><FormControl><Input {...field} type="number" min="0" max="100" className="bg-white/5 border-white/10" data-testid="input-commission" /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Legal URLs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="privacyPolicyUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Policy URL</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="https://example.com/privacy" data-testid="input-privacy-policy-url" /></FormControl>
                  <FormDescription className="text-xs text-muted-foreground">Displayed in the user app and driver app</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="termsUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions URL</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="https://example.com/terms" data-testid="input-terms-url" /></FormControl>
                  <FormDescription className="text-xs text-muted-foreground">Shown during registration and in the user app</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-yellow-400" /> Platform Controls</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="maintenanceMode" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4">
                  <div>
                    <FormLabel className="text-white text-base">Maintenance Mode</FormLabel>
                    <FormDescription className="text-muted-foreground text-sm mt-1">Disable the app for all users</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-maintenance-mode" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="registrationEnabled" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4">
                  <div>
                    <FormLabel className="text-white text-base">Registration Enabled</FormLabel>
                    <FormDescription className="text-muted-foreground text-sm mt-1">Allow new users and drivers to register</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-registration" /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow h-12 text-base font-semibold" disabled={update.isPending} data-testid="button-save-settings">
            {update.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
