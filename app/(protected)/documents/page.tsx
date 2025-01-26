'use client';

import { DocumentsTable } from "@/components/documents/documents-table";
import { useToast } from "@/components/ui/use-toast";

export default function DocumentsPage() {
  const { toast } = useToast();

  return (
    <div className="flex-1 flex-col p-8 md:flex">
      <DocumentsTable />
    </div>
  );
} 