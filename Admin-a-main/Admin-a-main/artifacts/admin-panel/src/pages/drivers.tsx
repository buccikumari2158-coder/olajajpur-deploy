import { useState } from "react";
import { useListDrivers, useDriverAction, getListDriversQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, CarFront, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Drivers() {
  const [search, setSearch] = useState("");
  const { data: drivers, isLoading } = useListDrivers();
  const driverAction = useDriverAction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: string, action: any) => {
    driverAction.mutate({ id, data: { action } }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Action applied to driver." });
        queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
      }
    });
  };

  const filteredDrivers = drivers?.data.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.phone.includes(search) ||
    d.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-wider">DRIVER MANAGEMENT</h2>
        <div className="flex gap-4">
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/20">
            <Link href="/drivers/approvals">View Approvals</Link>
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drivers..."
              className="pl-8 bg-card/30 border-white/10 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-white/5">
              <TableHead className="text-muted-foreground">Driver Info</TableHead>
              <TableHead className="text-muted-foreground">Vehicle</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Online</TableHead>
              <TableHead className="text-muted-foreground">Stats</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredDrivers.map((driver) => (
              <TableRow key={driver.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <div className="font-medium text-white">{driver.name}</div>
                  <div className="text-sm text-muted-foreground">{driver.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-white">
                    <CarFront className="w-4 h-4 text-primary" />
                    <span className="capitalize">{driver.vehicleType}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{driver.vehicleNumber}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={driver.approvalStatus === "approved" ? "default" : "secondary"} 
                    className={driver.approvalStatus === "approved" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                    {driver.approvalStatus.toUpperCase()}
                  </Badge>
                  {driver.status !== 'active' && (
                    <Badge variant="destructive" className="ml-2">{driver.status.toUpperCase()}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {driver.isOnline ? (
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary neon-glow" /> <span className="text-sm text-white">Online</span></div>
                  ) : (
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-muted" /> <span className="text-sm text-muted-foreground">Offline</span></div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-white">★ {driver.rating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">{driver.totalRides} rides</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/drivers/${driver.id}`}>
                        <Eye className="w-4 h-4 text-primary" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
