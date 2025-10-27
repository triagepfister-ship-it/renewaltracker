import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, FileText, Upload, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { RenewalWithRelations } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AttachmentsPanel } from "@/components/attachments-panel";

export default function RenewalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState<RenewalWithRelations | null>(null);
  const [deletingRenewalId, setDeletingRenewalId] = useState<string | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<RenewalWithRelations | null>(null);
  const { toast } = useToast();

  const { data: renewals, isLoading } = useQuery<RenewalWithRelations[]>({
    queryKey: ['/api/renewals'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/renewals/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/renewals'] });
      toast({
        title: "Renewal deleted",
        description: "The renewal has been successfully removed.",
      });
      setDeletingRenewalId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete renewal",
        variant: "destructive",
      });
    },
  });

  const filteredRenewals = renewals?.filter((renewal) => {
    const matchesSearch =
      renewal.customer?.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      renewal.serviceType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || renewal.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'contacted': return 'secondary';
      case 'completed': return 'default';
      case 'renewed': return 'default';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getIntervalLabel = (renewal: RenewalWithRelations) => {
    if (renewal.intervalType === 'custom' && renewal.customIntervalMonths) {
      return `Every ${renewal.customIntervalMonths} months`;
    }
    return renewal.intervalType === 'annual' ? 'Annual' : 'Bi-Annual';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Renewals</h1>
          <p className="text-muted-foreground">
            Track and manage service renewal opportunities
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-renewal">
              <Plus className="h-4 w-4 mr-2" />
              Add Renewal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Renewal</DialogTitle>
              <DialogDescription>
                Add a new renewal record with service interval tracking
              </DialogDescription>
            </DialogHeader>
            <RenewalForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search renewals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-renewals"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="renewed">Renewed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
          ) : filteredRenewals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" ? "No renewals found matching your filters" : "No renewals yet"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Renewal
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRenewals.map((renewal) => (
                    <TableRow key={renewal.id} data-testid={`row-renewal-${renewal.id}`}>
                      <TableCell className="font-medium">
                        {renewal.customer?.companyName || 'Unknown'}
                      </TableCell>
                      <TableCell>{renewal.serviceType}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(renewal.lastServiceDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(renewal.nextDueDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {getIntervalLabel(renewal)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(renewal.status)}>
                          {renewal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renewal.assignedSalesperson ? (
                          <Badge variant="secondary">
                            {renewal.assignedSalesperson.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingAttachments(renewal)}
                            data-testid={`button-attachments-${renewal.id}`}
                            title="View attachments"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRenewal(renewal)}
                            data-testid={`button-edit-renewal-${renewal.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingRenewalId(renewal.id)}
                            data-testid={`button-delete-renewal-${renewal.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingRenewal && (
        <Dialog open={!!editingRenewal} onOpenChange={() => setEditingRenewal(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Renewal</DialogTitle>
              <DialogDescription>
                Update renewal information and status
              </DialogDescription>
            </DialogHeader>
            <RenewalForm
              renewal={editingRenewal}
              onSuccess={() => setEditingRenewal(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Sheet open={!!viewingAttachments} onOpenChange={() => setViewingAttachments(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Attachments</SheetTitle>
            <SheetDescription>
              {viewingAttachments?.customer?.companyName} - {viewingAttachments?.serviceType}
            </SheetDescription>
          </SheetHeader>
          {viewingAttachments && (
            <AttachmentsPanel renewalId={viewingAttachments.id} />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingRenewalId} onOpenChange={() => setDeletingRenewalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Renewal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this renewal? This will also delete all associated attachments and notifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRenewalId && deleteMutation.mutate(deletingRenewalId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
