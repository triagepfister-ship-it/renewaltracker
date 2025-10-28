import {
  Calendar,
  Users,
  FileText,
  Bell,
  Settings,
  LayoutDashboard,
  LogOut,
  UserCog,
  ScanLine,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { getAuthUser, isAdmin, clearAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    roles: ['admin', 'salesperson'],
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    roles: ['admin', 'salesperson'],
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
    roles: ['admin', 'salesperson'],
  },
  {
    title: "Renewals",
    url: "/renewals",
    icon: FileText,
    roles: ['admin', 'salesperson'],
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    roles: ['admin', 'salesperson'],
  },
];

const adminItems = [
  {
    title: "User Management",
    url: "/admin/users",
    icon: UserCog,
    roles: ['admin'],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ['admin', 'salesperson'],
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuth();
    setLocation("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userRole = user?.role || 'salesperson';
  const filteredMainItems = mainItems.filter(item => item.roles.includes(userRole));
  const filteredAdminItems = adminItems.filter(item => item.roles.includes(userRole));

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <ScanLine className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Renewal Tracker</h2>
            <p className="text-xs text-muted-foreground">Infrared Thermography</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs font-medium bg-accent">
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">{user?.name}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
        <SidebarMenuButton onClick={handleLogout} className="w-full" data-testid="button-logout">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
