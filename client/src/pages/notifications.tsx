import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, CheckCircle2 } from "lucide-react";
import type { NotificationWithRelations } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthUser } from "@/lib/auth";

export default function NotificationsPage() {
  const user = getAuthUser();

  const { data: notifications, isLoading } = useQuery<NotificationWithRelations[]>({
    queryKey: ['/api/notifications'],
  });

  const myNotifications = notifications?.filter(
    n => n.salespersonId === user?.id
  ) || [];

  const pendingNotifications = myNotifications.filter(n => n.status === 'pending');
  const sentNotifications = myNotifications.filter(n => n.status === 'sent');

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case '2_months': return '2 Months Before';
      case '1_month': return '1 Month Before';
      case '1_week': return '1 Week Before';
      default: return type;
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case '2_months': return 'secondary';
      case '1_month': return 'outline';
      case '1_week': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Notifications</h1>
        <p className="text-muted-foreground">
          Track upcoming renewal reminders and follow-ups
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reminders
            </CardTitle>
            <div className="p-2 rounded-md bg-orange-50">
              <Bell className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="text-pending-count">
              {isLoading ? <Skeleton className="h-9 w-16" /> : pendingNotifications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent Notifications
            </CardTitle>
            <div className="p-2 rounded-md bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="text-sent-count">
              {isLoading ? <Skeleton className="h-9 w-16" /> : sentNotifications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Notifications
            </CardTitle>
            <div className="p-2 rounded-md bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="text-total-count">
              {isLoading ? <Skeleton className="h-9 w-16" /> : myNotifications.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Pending Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pendingNotifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No pending notifications at the moment
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Renewal Due Date</TableHead>
                    <TableHead>Notification Type</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingNotifications.map((notification) => (
                    <TableRow key={notification.id} data-testid={`notification-${notification.id}`}>
                      <TableCell className="font-medium">
                        {notification.renewal?.customer?.companyName || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {notification.renewal?.nextDueDate
                          ? format(new Date(notification.renewal.nextDueDate), 'MMM dd, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getNotificationTypeBadge(notification.notificationType) as any}>
                          {getNotificationTypeLabel(notification.notificationType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(notification.scheduledDate), 'MMM dd, yyyy')}
                        <span className="text-muted-foreground text-xs block">
                          {formatDistanceToNow(new Date(notification.scheduledDate), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Pending</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Sent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sentNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No sent notifications yet
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Notification Type</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentNotifications.slice(0, 10).map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">
                        {notification.renewal?.customer?.companyName || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getNotificationTypeBadge(notification.notificationType) as any}>
                          {getNotificationTypeLabel(notification.notificationType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {notification.sentAt
                          ? format(new Date(notification.sentAt), 'MMM dd, yyyy HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Sent</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
