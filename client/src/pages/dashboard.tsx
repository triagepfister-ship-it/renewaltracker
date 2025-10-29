import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, FileText, Bell, TrendingUp, AlertCircle, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, isBefore, addMonths } from "date-fns";
import type { RenewalWithRelations, Notification } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: renewals, isLoading: renewalsLoading } = useQuery<RenewalWithRelations[]>({
    queryKey: ['/api/renewals'],
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const { data: customers } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  const now = new Date();
  const upcomingRenewals = renewals?.filter(r =>
    isAfter(new Date(r.nextDueDate), now) &&
    isBefore(new Date(r.nextDueDate), addMonths(now, 2)) &&
    r.status === 'contacted'
  ) || [];

  const overdueRenewals = renewals?.filter(r =>
    isBefore(new Date(r.nextDueDate), now) &&
    r.status === 'contacted'
  ) || [];

  const totalRenewals = renewals?.length || 0;
  const totalCustomers = customers?.length || 0;
  const pendingNotifications = notifications?.filter(n => n.status === 'pending').length || 0;

  const stats = [
    {
      title: "Total Renewals",
      value: totalRenewals,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Upcoming (60 days)",
      value: upcomingRenewals.length,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Overdue",
      value: overdueRenewals.length,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'contacted': return 'secondary';
      case 'completed': return 'default';
      case 'dead': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Track renewal opportunities and follow-up activities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {renewalsLoading ? <Skeleton className="h-9 w-16" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">Upcoming Renewals</CardTitle>
            <Link href="/renewals">
              <Button variant="outline" size="sm" data-testid="button-view-all-renewals">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {renewalsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : upcomingRenewals.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No upcoming renewals in the next 60 days
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingRenewals.slice(0, 5).map((renewal) => (
                  <div
                    key={renewal.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`card-renewal-${renewal.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {renewal.customer?.companyName || 'Unknown Customer'}
                        </p>
                        {renewal.status === 'contacted' && (
                          <MessageCircle className="h-4 w-4 text-blue-600 flex-shrink-0" data-testid="icon-contacted" />
                        )}
                      </div>
                      {renewal.address && (
                        <p className="text-xs text-muted-foreground truncate">
                          {renewal.address}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground font-mono">
                        Due: {format(new Date(renewal.nextDueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(renewal.status)}>
                      {renewal.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">Overdue Renewals</CardTitle>
            <Badge variant="destructive" className="text-xs">
              {overdueRenewals.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {renewalsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : overdueRenewals.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Great! No overdue renewals
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueRenewals.slice(0, 5).map((renewal) => (
                  <div
                    key={renewal.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                    data-testid={`card-overdue-${renewal.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {renewal.customer?.companyName || 'Unknown Customer'}
                      </p>
                      {renewal.address && (
                        <p className="text-xs text-muted-foreground truncate">
                          {renewal.address}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground font-mono">
                        Due: {format(new Date(renewal.nextDueDate), 'MMM dd, yyyy')}
                      </p>
                      {renewal.assignedSalesperson && (
                        <p className="text-sm text-muted-foreground">
                          Salesperson: {renewal.assignedSalesperson.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive">
                      {renewal.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
