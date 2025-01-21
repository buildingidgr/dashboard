'use client';

import { DocumentsGrid } from "@/components/documents/documents-grid";

export default function DocumentsPage() {
  return (
    <div className="flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Create and manage documents.
          </p>
        </div>
      </div>
      <DocumentsGrid />
    </div>
  );
} 