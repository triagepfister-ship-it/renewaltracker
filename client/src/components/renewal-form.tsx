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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertRenewalSchema, type RenewalWithRelations, type CustomerWithRelations, type User } from "@shared/schema";
import type { z } from "zod";
import { addMonths, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RenewalFormData = z.infer<typeof insertRenewalSchema>;

interface RenewalFormProps {
  renewal?: RenewalWithRelations;
  onSuccess?: () => void;
}

export function RenewalForm({ renewal, onSuccess }: RenewalFormProps) {
  const { toast } = useToast();

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
      lastServiceDate: renewal?.lastServiceDate ? new Date(renewal.lastServiceDate) : new Date(),
      nextDueDate: renewal?.nextDueDate ? new Date(renewal.nextDueDate) : addMonths(new Date(), 12),
      intervalType: renewal?.intervalType || "annual",
      customIntervalMonths: renewal?.customIntervalMonths || undefined,
      status: renewal?.status || "pending",
      notes: renewal?.notes || "",
      assignedSalespersonId: renewal?.assignedSalespersonId || undefined,
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
    if (renewal) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
                <FormControl>
                  <Input placeholder="Infrared Thermography Analysis" {...field} data-testid="input-service-type" />
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
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-interval-type">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="annual">Annual (12 months)</SelectItem>
                    <SelectItem value="bi-annual">Bi-Annual (6 months)</SelectItem>
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
                  defaultValue={field.value}
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
                onValueChange={field.onChange}
                defaultValue={field.value}
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
  );
}
