import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertRenewalSchema, type RenewalWithRelations, type CustomerWithRelations, type User } from "@shared/schema";
import type { z } from "zod";
import { addMonths, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerForm } from "./customer-form";
import { useState } from "react";

type RenewalFormData = z.infer<typeof insertRenewalSchema>;

interface RenewalFormProps {
  renewal?: RenewalWithRelations;
  onSuccess?: () => void;
}

export function RenewalForm({ renewal, onSuccess }: RenewalFormProps) {
  const { toast } = useToast();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  const { data: customers } = useQuery<CustomerWithRelations[]>({
    queryKey: ['/api/customers'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const salespersons = users?.filter(u => u.status === 'active') || [];

  const form = useForm<RenewalFormData>({
    resolver: zodResolver(insertRenewalSchema),
    defaultValues: {
      customerId: renewal?.customerId || "",
      serviceType: renewal?.serviceType || "Infrared Thermography Analysis",
      siteCode: renewal?.siteCode || "",
      referenceId: renewal?.referenceId || undefined,
      lastServiceDate: renewal?.lastServiceDate ? new Date(renewal.lastServiceDate) : new Date(),
      nextDueDate: renewal?.nextDueDate ? new Date(renewal.nextDueDate) : addMonths(new Date(), 12),
      intervalType: renewal?.intervalType || "annual",
      customIntervalMonths: renewal?.customIntervalMonths || undefined,
      status: renewal?.status || "pending",
      notes: renewal?.notes || "",
      assignedSalespersonId: renewal?.assignedSalespersonId || undefined,
      salesforceOpportunityUrl: renewal?.salesforceOpportunityUrl || "",
    },
  });

  const watchIntervalType = form.watch("intervalType");
  const watchLastServiceDate = form.watch("lastServiceDate");

  const handleIntervalChange = (intervalType: string) => {
    const lastDate = watchLastServiceDate;
    if (!lastDate) return;

    let nextDate = new Date(lastDate);
    if (intervalType === "annual") {
      nextDate = addMonths(lastDate, 12);
    } else if (intervalType === "bi-annual") {
      nextDate = addMonths(lastDate, 6);
    } else if (intervalType === "2-year") {
      nextDate = addMonths(lastDate, 24);
    } else if (intervalType === "3-year") {
      nextDate = addMonths(lastDate, 36);
    } else if (intervalType === "5-year") {
      nextDate = addMonths(lastDate, 60);
    }
    
    form.setValue("nextDueDate", nextDate);
  };

  const createMutation = useMutation({
    mutationFn: (data: RenewalFormData) => apiRequest("POST", "/api/renewals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/renewals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Renewal created",
        description: "The renewal has been successfully added and notifications scheduled.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create renewal",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RenewalFormData) =>
      apiRequest("PUT", `/api/renewals/${renewal?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/renewals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Renewal updated",
        description: "The renewal has been successfully updated.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update renewal",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RenewalFormData) => {
    const payload = {
      ...data,
      lastServiceDate: data.lastServiceDate instanceof Date ? data.lastServiceDate.toISOString() : data.lastServiceDate,
      nextDueDate: data.nextDueDate instanceof Date ? data.nextDueDate.toISOString() : data.nextDueDate,
    };
    
    if (renewal) {
      updateMutation.mutate(payload as any);
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleCustomerCreated = async () => {
    setIsCustomerDialogOpen(false);
    await queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    const updatedCustomers = queryClient.getQueryData<CustomerWithRelations[]>(['/api/customers']);
    if (updatedCustomers && updatedCustomers.length > 0) {
      const newestCustomer = updatedCustomers[updatedCustomers.length - 1];
      form.setValue("customerId", newestCustomer.id);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-customer">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCustomerDialogOpen(true)}
                      data-testid="button-add-customer"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-service-type">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Infrared Thermography Analysis">Infrared Thermography Analysis</SelectItem>
                    <SelectItem value="Arc Flash Hazard Assessment">Arc Flash Hazard Assessment</SelectItem>
                    <SelectItem value="VUMO">VUMO</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Switchgear Maintenance (EPM)">Switchgear Maintenance (EPM)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="siteCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Code</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">S-</span>
                    <Input
                      placeholder="12345"
                      maxLength={5}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        field.onChange(value);
                      }}
                      data-testid="input-site-code"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Enter 5-digit site code (displayed as S-xxxxx)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Reference ID"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                      field.onChange(value);
                    }}
                    data-testid="input-reference-id"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="lastServiceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Last Service Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-last-service-date"
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextDueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Next Due Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-next-due-date"
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="intervalType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Renewal Interval *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleIntervalChange(value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-interval-type">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="annual">Annual (12 months)</SelectItem>
                    <SelectItem value="bi-annual">Bi-Annual (6 months)</SelectItem>
                    <SelectItem value="2-year">2 Year (24 months)</SelectItem>
                    <SelectItem value="3-year">3 Year (36 months)</SelectItem>
                    <SelectItem value="5-year">5 Year (60 months)</SelectItem>
                    <SelectItem value="custom">Custom Interval</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  NFPA 70E/70B requires minimum annual intervals
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchIntervalType === "custom" && (
            <FormField
              control={form.control}
              name="customIntervalMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Interval (months) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="12"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-custom-interval"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assignedSalespersonId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Salesperson</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "unassigned" ? undefined : value)}
                value={field.value || "unassigned"}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-renewal-salesperson">
                    <SelectValue placeholder="Select a salesperson" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {salespersons.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this renewal..."
                  className="resize-none min-h-24"
                  {...field}
                  data-testid="input-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salesforceOpportunityUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salesforce Opportunity URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://..."
                  {...field}
                  data-testid="input-salesforce-url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-submit-renewal"
          >
            {isLoading ? "Saving..." : renewal ? "Update Renewal" : "Create Renewal"}
          </Button>
        </div>
      </form>
    </Form>

    <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to the system and it will be automatically selected.
          </DialogDescription>
        </DialogHeader>
        <CustomerForm onSuccess={handleCustomerCreated} />
      </DialogContent>
    </Dialog>
    </>
  );
}
