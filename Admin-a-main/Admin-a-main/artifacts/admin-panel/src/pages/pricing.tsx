import { useGetPricing, useUpdatePricing, getGetPricingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { IndianRupee, Save } from "lucide-react";

const pricingSchema = z.object({
  basePerKm: z.coerce.number().min(0),
  minimumFare: z.coerce.number().min(0),
  maximumFare: z.coerce.number().min(0),
  nightChargeMultiplier: z.coerce.number().min(1),
  waitingChargePerMin: z.coerce.number().min(0),
  cancellationFee: z.coerce.number().min(0),
  serviceRadiusKm: z.coerce.number().min(1),
});

export default function Pricing() {
  const { data: pricing, isLoading } = useGetPricing();
  const updatePricing = useUpdatePricing();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      basePerKm: 15,
      minimumFare: 50,
      maximumFare: 5000,
      nightChargeMultiplier: 1.5,
      waitingChargePerMin: 2,
      cancellationFee: 50,
      serviceRadiusKm: 30,
    }
  });

  useEffect(() => {
    if (pricing) {
      form.reset(pricing);
    }
  }, [pricing, form]);

  const onSubmit = (values: z.infer<typeof pricingSchema>) => {
    updatePricing.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Pricing updated." });
        queryClient.invalidateQueries({ queryKey: getGetPricingQueryKey() });
      }
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-wider">PRICING & FARES</h2>
        <p className="text-muted-foreground">Configure base fares, multipliers, and fees.</p>
      </div>

      <div className="glass-card p-6 rounded-xl border-white/5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="basePerKm" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Base Per KM</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-black/50 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minimumFare" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Minimum Fare</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-black/50 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nightChargeMultiplier" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Night Charge Multiplier</FormLabel>
                  <FormControl><Input type="number" step="0.1" {...field} className="bg-black/50 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="waitingChargePerMin" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Waiting Charge (Per Min)</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-black/50 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cancellationFee" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Cancellation Fee</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-black/50 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="serviceRadiusKm" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Service Radius (KM)</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-black/50 border-white/10 text-white" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <Button type="submit" disabled={updatePricing.isPending} className="w-full md:w-auto bg-primary text-primary-foreground font-bold neon-glow">
              <Save className="w-4 h-4 mr-2" />
              {updatePricing.isPending ? "Saving..." : "Save Pricing Settings"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
