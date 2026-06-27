import { useState } from "react";
import { useListUsers, useUserAction, getListUsersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Ban, Shield, Unlock, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useListUsers();
  const userAction = useUserAction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: string, action: any, reason?: string) => {
    userAction.mutate({ id, data: { action, reason } }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Action applied to user." });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      }
    });
  };

  const filteredUsers = users?.data.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-wider">USER MANAGEMENT</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
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
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Contact</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Rides</TableHead>
              <TableHead className="text-muted-foreground">Wallet</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="font-medium text-white">
                  {user.name}
                  {user.isVerified && <Shield className="inline w-3 h-3 ml-2 text-primary" />}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div>{user.phone}</div>
                  <div className="text-xs opacity-50">{user.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "active" ? "default" : "destructive"} 
                    className={user.status === "active" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                    {user.status.toUpperCase()}
                  </Badge>
                  {user.isBlockedFromBooking && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">BLOCKED</Badge>
                  )}
                </TableCell>
                <TableCell className="text-white">{user.totalRides}</TableCell>
                <TableCell className="text-white">₹{user.walletBalance}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {user.status === "active" ? (
                      <Button variant="ghost" size="icon" onClick={() => handleAction(user.id, "ban", "Admin banned")} title="Ban">
                        <Ban className="w-4 h-4 text-destructive" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => handleAction(user.id, "unban")} title="Unban">
                        <Unlock className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/users/${user.id}`}>
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
