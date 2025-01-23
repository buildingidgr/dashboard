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
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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

  const { data, isLoading } = useQuery({
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const currentPage = cursorStack.length + 1;
  const totalPages = Math.ceil((data?.pagination.totalCount || 0) / (data?.pagination.pageSize || 10));
  const startItem = ((currentPage - 1) * (data?.pagination.pageSize || 10)) + 1;
  const endItem = Math.min(startItem + (data?.pagination.pageSize || 10) - 1, data?.pagination.totalCount || 0);

  return (
    <div className="space-y-4">
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