'use client';

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Document, DocumentsService } from "@/lib/services/documents";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export function DocumentsTable() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    orderBy: string;
    order: "asc" | "desc";
  }>({
    orderBy: "updatedAt",
    order: "desc",
  });

  const { data } = useQuery({
    queryKey: ["documents", sortConfig, currentCursor],
    queryFn: () =>
      DocumentsService.getDocuments({
        orderBy: sortConfig.orderBy,
        order: sortConfig.order,
        cursor: currentCursor,
      }),
  });

  const handleSort = (column: string) => {
    setSortConfig((prev) => ({
      orderBy: column,
      order: prev.orderBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
    // Reset pagination when sorting changes
    setCurrentCursor(undefined);
    setCursorStack([]);
  };

  const handleNextPage = () => {
    if (data?.pagination.nextCursor) {
      setCursorStack((prev) => [...prev, currentCursor || '']);
      setCurrentCursor(data.pagination.nextCursor);
    }
  };

  const handlePreviousPage = () => {
    const previousCursors = [...cursorStack];
    const previousCursor = previousCursors.pop();
    setCursorStack(previousCursors);
    setCurrentCursor(previousCursor);
  };

  const handleRowClick = (documentId: string) => {
    router.push(`/editor?id=${documentId}`);
  };

  const handleDelete = async (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation(); // Prevent row click from triggering
    try {
      await DocumentsService.deleteDocument(documentId);
      // Invalidate and refetch documents
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  if (!data?.items.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background p-8">
        <div className="w-60 h-60">
          <img
            src="/empty-documents.svg"
            alt="No documents"
            className="w-full h-full"
          />
        </div>
        <div className="max-w-[420px] space-y-2 text-center">
          <h3 className="text-xl font-semibold">No documents found</h3>
          <p className="text-muted-foreground text-sm">
            Get started by creating your first document. You can write, edit, and manage your documents here.
          </p>
          <Button 
            onClick={handleCreateDocument}
            className="mt-4"
          >
            <Plus className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
            Create your first document
          </Button>
        </div>
      </div>
    );
  }

  const currentPage = cursorStack.length + 1;
  const totalPages = Math.ceil((data?.pagination.totalCount || 0) / (data?.pagination.pageSize || 10));
  const startItem = ((currentPage - 1) * (data?.pagination.pageSize || 10)) + 1;
  const endItem = Math.min(startItem + (data?.pagination.pageSize || 10) - 1, data?.pagination.totalCount || 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateDocument}>
          <Plus className="mr-2 h-4 w-4" />
          Create Document
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("title")}
              >
                Title
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Created
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("updatedAt")}
              >
                Last Modified
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((document) => (
              <TableRow 
                key={document.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(document.id)}
              >
                <TableCell>{document.title}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(document.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(document.updatedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, document.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {data?.pagination.totalCount || 0} documents
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!data?.pagination.hasMore}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 