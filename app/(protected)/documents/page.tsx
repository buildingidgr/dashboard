'use client';

import { DocumentsTable } from "@/components/documents/documents-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DocumentsService } from "@/lib/services/documents";
import { useToast } from "@/components/ui/use-toast";

export default function DocumentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateDocument = async () => {
    try {
      const document = await DocumentsService.createDocument();
      router.push(`/editor?id=${document.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Create and manage documents.
          </p>
        </div>
        <Button onClick={handleCreateDocument}>
          <Plus className="mr-2 h-4 w-4" />
          Create Document
        </Button>
      </div>
      <DocumentsTable />
    </div>
  );
} 