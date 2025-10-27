import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAuthUser } from "@/lib/auth";
import type { NotificationPreference } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { toast } = useToast();
  const user = getAuthUser();

  const { data: preferences, isLoading } = useQuery<NotificationPreference>({
    queryKey: ['/api/notification-preferences', user?.id],
    enabled: !!user?.id,
  });

  const [enable2Months, setEnable2Months] = useState(true);
  const [enable1Month, setEnable1Month] = useState(true);
  const [enable1Week, setEnable1Week] = useState(true);

  useEffect(() => {
    if (preferences) {
      setEnable2Months(preferences.enable2Months);
      setEnable1Month(preferences.enable1Month);
      setEnable1Week(preferences.enable1Week);
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PUT", "/api/notification-preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences', user?.id] });
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      userId: user?.id,
      enable2Months,
      enable1Month,
      enable1Week,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground">
          Manage your notification preferences and account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription className="mt-1">
                Choose when you want to receive renewal reminders
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">2 Months Before Renewal</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified 60 days before a renewal is due
                  </p>
                </div>
                <Switch
                  checked={enable2Months}
                  onCheckedChange={setEnable2Months}
                  data-testid="switch-2-months"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">1 Month Before Renewal</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified 30 days before a renewal is due
                  </p>
                </div>
                <Switch
                  checked={enable1Month}
                  onCheckedChange={setEnable1Month}
                  data-testid="switch-1-month"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">1 Week Before Renewal</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified 7 days before a renewal is due
                  </p>
                </div>
                <Switch
                  checked={enable1Week}
                  onCheckedChange={setEnable1Week}
                  data-testid="switch-1-week"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-preferences"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
