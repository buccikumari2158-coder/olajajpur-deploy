import { useState } from "react";
import { useListRides } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, MapPin } from "lucide-react";

export default function Rides() {
  const [search, setSearch] = useState("");
  const { data: rides, isLoading } = useListRides();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-primary/20 text-primary border-primary/30';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const filteredRides = rides?.data.filter(r => 
    r.id.toString().includes(search) || 
    r.userName?.toLowerCase().includes(search.toLowerCase()) ||
    r.driverName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-wider">RIDES</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rides (ID, Name)..."
            className="pl-8 bg-card/30 border-white/10 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-white/5">
              <TableHead className="text-muted-foreground">ID / Date</TableHead>
              <TableHead className="text-muted-foreground">Customer & Driver</TableHead>
              <TableHead className="text-muted-foreground">Locations</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Fare</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredRides.map((ride) => (
              <TableRow key={ride.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <div className="font-medium text-white">#{ride.id}</div>
                  <div className="text-xs text-muted-foreground">{new Date(ride.createdAt).toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-white">👤 {ride.userName || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground mt-1">🚗 {ride.driverName || 'Unassigned'}</div>
                </TableCell>
                <TableCell className="max-w-[250px]">
                  <div className="flex items-start gap-1 text-sm text-white truncate">
                    <MapPin className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span className="truncate">{ride.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-1 text-sm text-muted-foreground truncate mt-1">
                    <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="truncate">{ride.dropAddress}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(ride.status)}>
                    {ride.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-primary">₹{ride.fare}</div>
                  <div className="text-xs text-muted-foreground">{ride.distanceKm?.toFixed(1) ?? "—"} km</div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/rides/${ride.id}`} className="text-primary hover:underline flex items-center justify-end gap-1">
                    <Eye className="w-4 h-4" /> View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
