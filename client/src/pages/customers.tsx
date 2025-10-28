import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, User as UserIcon, ChevronDown, ChevronRight, Calendar, Clock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customer-form";
import { RenewalForm } from "@/components/renewal-form";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CustomerWithRelations, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";

interface CustomerRowProps {
  customer: CustomerWithRelations;
  onEdit: (customer: CustomerWithRelations) => void;
  onDelete: (id: string) => void;
  onAddRenewal: (customer: CustomerWithRelations) => void;
}

function CustomerRow({ customer, onEdit, onDelete, onAddRenewal }: CustomerRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: renewals, isLoading: renewalsLoading } = useQuery<any[]>({
    queryKey: ['/api/customers', customer.id, 'renewals'],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customer.id}/renewals`);
      if (!response.ok) throw new Error('Failed to fetch renewals');
      return response.json();
    },
    enabled: isOpen,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'overdue':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getIntervalLabel = (intervalType: string, customMonths?: number) => {
    if (intervalType === 'custom' && customMonths) {
      return `Every ${customMonths} months`;
    }
    return intervalType === 'annual' ? 'Annual' : 'Bi-annual';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg mb-3" data-testid={`customer-row-${customer.id}`}>
        <div className="flex items-center gap-4 p-4 hover-elevate">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-toggle-renewals-${customer.id}`}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div>
              <div className="font-medium" data-testid={`text-company-${customer.id}`}>
                {customer.companyName}
              </div>
              <div className="text-sm text-muted-foreground">
                {customer.contactName || '—'}
              </div>
            </div>

            <div className="text-sm">
              <div className="text-muted-foreground">{customer.email || '—'}</div>
              <div className="text-muted-foreground">{customer.phone || '—'}</div>
            </div>

            <div className="text-sm">
              {customer.address && (
                <div className="text-muted-foreground">{customer.address}</div>
              )}
            </div>

            <div>
              {customer.assignedSalesperson ? (
                <Badge variant="secondary">
                  {customer.assignedSalesperson.name}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Unassigned</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddRenewal(customer)}
                data-testid={`button-add-renewal-${customer.id}`}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Renewal
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(customer)}
                data-testid={`button-edit-customer-${customer.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(customer.id)}
                data-testid={`button-delete-customer-${customer.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Renewal History</h4>
            </div>

            {renewalsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !renewals || renewals.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No renewals found for this customer
              </div>
            ) : (
              <div className="space-y-2">
                {renewals.map((renewal) => (
                  <div
                    key={renewal.id}
                    className="bg-background border rounded-md p-3"
                    data-testid={`renewal-item-${renewal.id}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Service Type</div>
                        <div className="text-sm font-medium">{renewal.serviceType}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Last Service</div>
                        <div className="text-sm font-mono">
                          {format(new Date(renewal.lastServiceDate), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Next Due</div>
                        <div className="text-sm font-mono font-medium">
                          {format(new Date(renewal.nextDueDate), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getIntervalLabel(renewal.intervalType, renewal.customIntervalMonths)}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(renewal.status)}`}>
                          {renewal.status}
                        </Badge>
                      </div>
                    </div>

                    {renewal.notes && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Notes</div>
                        <div className="text-sm text-muted-foreground">{renewal.notes}</div>
                      </div>
                    )}

                    {renewal.assignedSalesperson && (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Assigned to {renewal.assignedSalesperson.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithRelations | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [renewalCustomer, setRenewalCustomer] = useState<CustomerWithRelations | null>(null);
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<CustomerWithRelations[]>({
    queryKey: ['/api/customers'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const salespersons = users?.filter(u => u.status === 'active') || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/customers/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully removed.",
      });
      setDeletingCustomerId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSalesperson = salespersonFilter === "all" || customer.assignedSalespersonId === salespersonFilter;
    return matchesSearch && matchesSalesperson;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information and view renewal history
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-customer">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to track renewal opportunities
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-customers"
              />
            </div>
            <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-salesperson-filter-customers">
                <SelectValue placeholder="Filter by salesperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salespeople</SelectItem>
                {salespersons.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
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
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || salespersonFilter !== "all" ? "No customers found matching your filters" : "No customers yet"}
              </p>
              {!searchQuery && salespersonFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {filteredCustomers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onEdit={setEditingCustomer}
                  onDelete={setDeletingCustomerId}
                  onAddRenewal={setRenewalCustomer}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingCustomer && (
        <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer information
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => setEditingCustomer(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deletingCustomerId} onOpenChange={() => setDeletingCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This will also delete all associated renewals and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCustomerId && deleteMutation.mutate(deletingCustomerId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {renewalCustomer && (
        <Dialog open={!!renewalCustomer} onOpenChange={() => setRenewalCustomer(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Renewal for {renewalCustomer.companyName}</DialogTitle>
              <DialogDescription>
                Create a new renewal record with customer information pre-filled
              </DialogDescription>
            </DialogHeader>
            <RenewalForm
              initialCustomerId={renewalCustomer.id}
              initialSalespersonId={renewalCustomer.assignedSalespersonId || undefined}
              onSuccess={() => {
                setRenewalCustomer(null);
                queryClient.invalidateQueries({ queryKey: ['/api/customers', renewalCustomer.id, 'renewals'] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
