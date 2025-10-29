import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import type { RenewalWithRelations } from "@shared/schema";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuthUser } from "@/lib/auth";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const user = getAuthUser();

  const { data: renewals, isLoading } = useQuery<RenewalWithRelations[]>({
    queryKey: ['/api/renewals'],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredRenewals = renewals?.filter((renewal) => {
    const matchesSalesperson = 
      salespersonFilter === "all" ||
      (salespersonFilter === "mine" && renewal.assignedSalespersonId === user?.id) ||
      renewal.assignedSalespersonId === salespersonFilter;
    return matchesSalesperson;
  }) || [];

  const getRenewalsForDay = (day: Date) => {
    return filteredRenewals.filter((renewal) =>
      isSameDay(new Date(renewal.nextDueDate), day)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-l-yellow-500';
      case 'contacted': return 'border-l-blue-500';
      case 'completed': return 'border-l-green-500';
      case 'renewed': return 'border-l-green-600';
      case 'overdue': return 'border-l-red-500';
      default: return 'border-l-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Calendar</h1>
          <p className="text-muted-foreground">
            View renewal schedules and upcoming opportunities
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl font-semibold font-mono">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
            </div>
            <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
              <SelectTrigger className="w-48" data-testid="select-salesperson-filter">
                <SelectValue placeholder="Filter by salesperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salespersons</SelectItem>
                <SelectItem value="mine">My Renewals</SelectItem>
                {users?.filter((u: any) => u.status === 'active').map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-muted">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {daysInCalendar.map((day, index) => {
                  const dayRenewals = getRenewalsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-32 p-2 border-r border-b ${
                        index % 7 === 6 ? 'border-r-0' : ''
                      } ${!isCurrentMonth ? 'bg-muted/30' : ''}`}
                      data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                    >
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isToday
                            ? 'bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center'
                            : isCurrentMonth
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayRenewals.map((renewal) => (
                          <div
                            key={renewal.id}
                            className={`text-xs p-2 rounded border-l-2 bg-card ${getStatusColor(renewal.status)} hover-elevate cursor-pointer`}
                            data-testid={`calendar-renewal-${renewal.id}`}
                            title={`${renewal.customer?.companyName} - ${renewal.serviceType}${renewal.customer?.address ? ` - ${renewal.customer.address}` : ''}`}
                          >
                            <p className="font-medium truncate">
                              {renewal.customer?.companyName}
                            </p>
                            {renewal.customer?.address && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {renewal.customer.address}
                              </p>
                            )}
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 px-1 mt-1"
                            >
                              {renewal.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-yellow-500 rounded"></div>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-blue-500 rounded"></div>
              <span className="text-sm">Contacted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-600 rounded"></div>
              <span className="text-sm">Renewed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded"></div>
              <span className="text-sm">Overdue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
