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
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  ClipboardCheck,
  UserCircle,
  Settings,
  Bell,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = {
  main: [
    { title: "Dashboard", icon: LayoutDashboard, url: "/" },
    { title: "Clients", icon: Users, url: "/clients" },
    { title: "Quotations", icon: FileText, url: "/quotations", badge: 3 },
    { title: "Loans", icon: DollarSign, url: "/loans" },
    { title: "Attendance", icon: ClipboardCheck, url: "/attendance" },
  ],
  analytics: [
    { title: "Reports", icon: TrendingUp, url: "/reports" },
    { title: "Employees", icon: UserCircle, url: "/employees" },
    { title: "Payroll", icon: DollarSign, url: "/payroll" },
  ],
  settings: [
    { title: "Notifications", icon: Bell, url: "/notifications", badge: 5 },
    { title: "Settings", icon: Settings, url: "/settings" },
  ],
};

function UserProfileFooter() {
  const { user, userProfile } = useAuth();
  
  if (!user || !userProfile) {
    return null;
  }

  const initials = userProfile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover-elevate">
      <Avatar className="w-9 h-9">
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{userProfile.displayName}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate">
            {userProfile.email}
          </p>
          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
            {userProfile.role.toUpperCase()}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">F</span>
          </div>
          <div>
            <h2 className="font-bold text-xl font-serif">FinFlow</h2>
            <p className="text-xs text-muted-foreground">Loan Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.analytics.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <UserProfileFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
