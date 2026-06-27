import { useGetDashboardStats, useGetDashboardEarnings, useGetRideAnalytics, useGetRecentActivity } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { 
  Users, Car, CarFront, UserX, 
  MapPin, CheckCircle, XCircle, AlertCircle, 
  IndianRupee, Wallet, TrendingUp, TrendingDown,
  MessageSquare, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: earnings } = useGetDashboardEarnings();
  const { data: analytics } = useGetRideAnalytics();
  const { data: activities } = useGetRecentActivity();

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Total Drivers", value: stats.totalDrivers, icon: Car, color: "text-purple-500" },
    { title: "Online Drivers", value: stats.onlineDrivers, icon: CarFront, color: "text-primary neon-text" },
    { title: "Pending Approvals", value: stats.pendingApprovals, icon: AlertCircle, color: "text-yellow-500" },
    { title: "Active Rides", value: stats.activeRides, icon: MapPin, color: "text-primary" },
    { title: "Completed Rides", value: stats.completedRides, icon: CheckCircle, color: "text-green-500" },
    { title: "Cancelled Rides", value: stats.cancelledRides, icon: XCircle, color: "text-destructive" },
    { title: "Today Earnings", value: `₹${stats.todayEarnings}`, icon: IndianRupee, color: "text-primary neon-text" },
    { title: "Weekly Earnings", value: `₹${stats.weeklyEarnings}`, icon: TrendingUp, color: "text-green-400" },
    { title: "Monthly Earnings", value: `₹${stats.monthlyEarnings}`, icon: Wallet, color: "text-blue-400" },
    { title: "Complaints", value: stats.totalComplaints, icon: MessageSquare, color: "text-orange-500" },
    { title: "Notifications Sent", value: stats.totalNotifications, icon: Bell, color: "text-indigo-400" },
  ];

  const PIE_COLORS = ['#00FF88', '#FF4444', '#3B82F6', '#F59E0B'];
  const pieData = analytics ? [
    { name: 'Completed', value: analytics.completed },
    { name: 'Cancelled', value: analytics.cancelled },
    { name: 'Active', value: analytics.active },
    { name: 'Pending', value: analytics.pending },
  ] : [];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Operations Command Center</h2>
        <p className="text-muted-foreground">Real-time overview of Jajpur Jatri platform.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="glass-card border-white/5 hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="glass-card col-span-4">
          <CardHeader>
            <CardTitle>Revenue Analytics (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              {earnings && earnings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earnings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F0F16', borderColor: '#ffffff20', color: '#fff' }}
                      itemStyle={{ color: '#00FF88' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#00FF88" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No earnings data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card col-span-3">
          <CardHeader>
            <CardTitle>Ride Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {analytics ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F0F16', borderColor: '#ffffff20', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground">No ride data</div>
              )}
            </div>
            <div className="flex justify-center gap-4 text-sm mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>System Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities && activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary neon-glow" />
                  <div>
                    <p className="text-sm font-medium text-white">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
