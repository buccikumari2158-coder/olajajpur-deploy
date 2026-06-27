import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import UserDetail from "@/pages/user-detail";
import Drivers from "@/pages/drivers";
import DriverApprovals from "@/pages/driver-approvals";
import DriverDetail from "@/pages/driver-detail";
import Rides from "@/pages/rides";
import RideDetail from "@/pages/ride-detail";
import Pricing from "@/pages/pricing";
import Payments from "@/pages/payments";
import Wallets from "@/pages/wallets";
import Notifications from "@/pages/notifications";
import Promos from "@/pages/promos";
import Support from "@/pages/support";
import ServiceAreas from "@/pages/service-areas";
import Content from "@/pages/content";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

setAuthTokenGetter(async () => {
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
});

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/users/:id" component={({ params }: { params: { id: string } }) => <ProtectedRoute component={UserDetail} id={params.id} />} />
      <Route path="/drivers" component={() => <ProtectedRoute component={Drivers} />} />
      <Route path="/drivers/approvals" component={() => <ProtectedRoute component={DriverApprovals} />} />
      <Route path="/drivers/:id" component={({ params }: { params: { id: string } }) => <ProtectedRoute component={DriverDetail} id={params.id} />} />
      <Route path="/rides" component={() => <ProtectedRoute component={Rides} />} />
      <Route path="/rides/:id" component={({ params }: { params: { id: string } }) => <ProtectedRoute component={RideDetail} id={params.id} />} />
      <Route path="/pricing" component={() => <ProtectedRoute component={Pricing} />} />
      <Route path="/payments" component={() => <ProtectedRoute component={Payments} />} />
      <Route path="/wallets" component={() => <ProtectedRoute component={Wallets} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/promos" component={() => <ProtectedRoute component={Promos} />} />
      <Route path="/support" component={() => <ProtectedRoute component={Support} />} />
      <Route path="/service-areas" component={() => <ProtectedRoute component={ServiceAreas} />} />
      <Route path="/content" component={() => <ProtectedRoute component={Content} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
