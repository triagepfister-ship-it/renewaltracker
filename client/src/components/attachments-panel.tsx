import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2, File as FileIcon } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAuthUser } from "@/lib/auth";
import type { Attachment } from "@shared/schema";
import { format } from "date-fns";
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
import { useState } from "react";
import type { UploadResult } from "@uppy/core";

interface AttachmentsPanelProps {
  renewalId: string;
}

export function AttachmentsPanel({ renewalId }: AttachmentsPanelProps) {
  const { toast } = useToast();
  const user = getAuthUser();
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  const { data: attachments, isLoading } = useQuery<Attachment[]>({
    queryKey: ['/api/renewals', renewalId, 'attachments'],
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      apiRequest("DELETE", `/api/attachments/${attachmentId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/renewals', renewalId, 'attachments'] });
      toast({
        title: "Attachment deleted",
        description: "The file has been successfully removed.",
      });
      setDeletingAttachmentId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete attachment",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {});
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) {
      toast({
        title: "Upload failed",
        description: "No files were uploaded successfully",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const file of result.successful) {
        // Extract the object path from the upload URL
        const uploadURL = file.uploadURL || '';
        const urlObj = new URL(uploadURL);
        const objectPath = urlObj.pathname;
        
        await apiRequest("POST", "/api/attachments", {
          renewalId,
          fileName: file.name,
          filePath: objectPath,
          fileSize: file.size,
          uploadedBy: user?.id,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/renewals', renewalId, 'attachments'] });
      toast({
        title: "Files uploaded",
        description: `${result.successful.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save attachment metadata",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await apiRequest("GET", `/api/attachments/${attachment.id}/download`, {});
      window.open(response.downloadURL, '_blank');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">Uploaded Files</h3>
        <ObjectUploader
          maxNumberOfFiles={10}
          maxFileSize={10485760}
          onGetUploadParameters={handleGetUploadParameters}
          onComplete={handleUploadComplete}
          variant="default"
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </ObjectUploader>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
              data-testid={`attachment-${attachment.id}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-md bg-muted">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)} • {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(attachment)}
                  data-testid={`button-download-${attachment.id}`}
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingAttachmentId(attachment.id)}
                  data-testid={`button-delete-attachment-${attachment.id}`}
                  title="Delete file"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No files uploaded yet
          </p>
          <ObjectUploader
            maxNumberOfFiles={10}
            maxFileSize={10485760}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First File
          </ObjectUploader>
        </div>
      )}

      <AlertDialog open={!!deletingAttachmentId} onOpenChange={() => setDeletingAttachmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAttachmentId && deleteMutation.mutate(deletingAttachmentId)}
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
