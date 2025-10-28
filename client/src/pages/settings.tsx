import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAuthUser } from "@/lib/auth";
import type { NotificationPreference, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Save, Users, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

const salespersonFormSchema = z.object({
  name: z.string().min(1, "Salesperson name is required"),
  email: z.string().email("Invalid email address"),
});

type SalespersonFormData = z.infer<typeof salespersonFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const user = getAuthUser();

  const { data: preferences, isLoading } = useQuery<NotificationPreference>({
    queryKey: ['/api/notification-preferences', user?.id],
    enabled: !!user?.id,
  });

  const { data: salespeople, isLoading: isLoadingSalespeople } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const [enable2Months, setEnable2Months] = useState(true);
  const [enable1Month, setEnable1Month] = useState(true);
  const [enable1Week, setEnable1Week] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingSalespersonId, setDeletingSalespersonId] = useState<string | null>(null);
  const [fromSalespersonId, setFromSalespersonId] = useState<string>("");
  const [toSalespersonId, setToSalespersonId] = useState<string>("");
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);

  useEffect(() => {
    if (preferences) {
      setEnable2Months(preferences.enable2Months);
      setEnable1Month(preferences.enable1Month);
      setEnable1Week(preferences.enable1Week);
    }
  }, [preferences]);

  const form = useForm<SalespersonFormData>({
    resolver: zodResolver(salespersonFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

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

  const createSalespersonMutation = useMutation({
    mutationFn: (data: SalespersonFormData) =>
      apiRequest("POST", "/api/users", {
        ...data,
        password: "changeme123",
        role: "salesperson",
        status: "active",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Salesperson added successfully",
        description: `${variables.name} has been added with temporary password: changeme123. Please ask them to change their password immediately after first login.`,
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add salesperson",
        variant: "destructive",
      });
    },
  });

  const deleteSalespersonMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Salesperson removed",
        description: "The salesperson has been successfully removed.",
      });
      setDeletingSalespersonId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove salesperson",
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

  const handleCreateSalesperson = (data: SalespersonFormData) => {
    createSalespersonMutation.mutate(data);
  };

  const bulkReassignMutation = useMutation({
    mutationFn: (data: { fromSalespersonId: string; toSalespersonId: string }) =>
      apiRequest("POST", "/api/users/bulk-reassign", data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/renewals'] });
      toast({
        title: "Bulk reassignment completed",
        description: `Successfully reassigned ${data.customersUpdated} customers and ${data.renewalsUpdated} renewals.`,
      });
      setIsReassignDialogOpen(false);
      setFromSalespersonId("");
      setToSalespersonId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reassign salesperson",
        variant: "destructive",
      });
    },
  });

  const handleBulkReassign = () => {
    if (!fromSalespersonId || !toSalespersonId) {
      toast({
        title: "Error",
        description: "Please select both salespersons",
        variant: "destructive",
      });
      return;
    }

    if (fromSalespersonId === toSalespersonId) {
      toast({
        title: "Error",
        description: "Cannot reassign to the same salesperson",
        variant: "destructive",
      });
      return;
    }

    bulkReassignMutation.mutate({ fromSalespersonId, toSalespersonId });
  };

  const activeSalespeople = salespeople?.filter(s => s.role === 'salesperson' && s.status === 'active') || [];

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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Manage Salespersons</CardTitle>
                <CardDescription className="mt-1">
                  Add or remove salespersons from your team
                </CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-salesperson">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Salesperson
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Salesperson</DialogTitle>
                  <DialogDescription>
                    Enter the salesperson's details to add them to your team
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateSalesperson)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salesperson Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} data-testid="input-salesperson-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salesperson Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} data-testid="input-salesperson-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-salesperson"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createSalespersonMutation.isPending}
                        data-testid="button-submit-salesperson"
                      >
                        {createSalespersonMutation.isPending ? "Adding..." : "Add Salesperson"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSalespeople ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activeSalespeople.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No salespersons added yet</p>
              <p className="text-sm mt-1">Click "Add Salesperson" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSalespeople.map((salesperson) => (
                <div
                  key={salesperson.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  data-testid={`salesperson-item-${salesperson.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{salesperson.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {salesperson.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{salesperson.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingSalespersonId(salesperson.id)}
                    data-testid={`button-delete-salesperson-${salesperson.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Bulk Reassign Salesperson</CardTitle>
              <CardDescription className="mt-1">
                Reassign all customers and renewals from one salesperson to another
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Salesperson</label>
                <Select value={fromSalespersonId} onValueChange={setFromSalespersonId}>
                  <SelectTrigger data-testid="select-from-salesperson">
                    <SelectValue placeholder="Select salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSalespeople.map((salesperson) => (
                      <SelectItem key={salesperson.id} value={salesperson.id}>
                        {salesperson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Salesperson</label>
                <Select value={toSalespersonId} onValueChange={setToSalespersonId}>
                  <SelectTrigger data-testid="select-to-salesperson">
                    <SelectValue placeholder="Select salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSalespeople.map((salesperson) => (
                      <SelectItem key={salesperson.id} value={salesperson.id}>
                        {salesperson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!fromSalespersonId || !toSalespersonId || fromSalespersonId === toSalespersonId}
                    data-testid="button-bulk-reassign"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reassign All
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Bulk Reassignment</DialogTitle>
                    <DialogDescription>
                      This will reassign all customers and renewals from{" "}
                      <strong>{activeSalespeople.find(s => s.id === fromSalespersonId)?.name}</strong> to{" "}
                      <strong>{activeSalespeople.find(s => s.id === toSalespersonId)?.name}</strong>.
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsReassignDialogOpen(false)}
                      data-testid="button-cancel-reassign"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkReassign}
                      disabled={bulkReassignMutation.isPending}
                      data-testid="button-confirm-reassign"
                    >
                      {bulkReassignMutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={deletingSalespersonId !== null}
        onOpenChange={(open) => !open && setDeletingSalespersonId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Salesperson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this salesperson? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSalespersonId && deleteSalespersonMutation.mutate(deletingSalespersonId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
