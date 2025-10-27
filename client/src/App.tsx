import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CustomersPage from "@/pages/customers";
import RenewalsPage from "@/pages/renewals";
import CalendarPage from "@/pages/calendar";
import NotificationsPage from "@/pages/notifications";
import AdminUsersPage from "@/pages/admin-users";
import SettingsPage from "@/pages/settings";
import { isAuthenticated, isAdmin } from "@/lib/auth";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any; adminOnly?: boolean }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/login");
    } else if (adminOnly && !isAdmin()) {
      setLocation("/");
    }
  }, [setLocation, adminOnly]);

  if (!isAuthenticated()) {
    return null;
  }

  if (adminOnly && !isAdmin()) {
    return null;
  }

  return <Component />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        {() => {
          if (!isAuthenticated()) {
            return <Redirect to="/login" />;
          }
          return (
            <AppLayout>
              <ProtectedRoute component={DashboardPage} />
            </AppLayout>
          );
        }}
      </Route>

      <Route path="/calendar">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CalendarPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/customers">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CustomersPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/renewals">
        {() => (
          <AppLayout>
            <ProtectedRoute component={RenewalsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/notifications">
        {() => (
          <AppLayout>
            <ProtectedRoute component={NotificationsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/users">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminUsersPage} adminOnly={true} />
          </AppLayout>
        )}
      </Route>

      <Route path="/settings">
        {() => (
          <AppLayout>
            <ProtectedRoute component={SettingsPage} />
          </AppLayout>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
