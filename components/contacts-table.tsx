"use client";

import { useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { getAccessToken, exchangeClerkToken, setAccessToken } from '@/lib/services/auth'
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ColumnDef,
  type Table as TableInstance,
  type Row,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type ColumnMeta as TColumnMeta,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedUniqueValues,
  flexRender,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleX,
  Columns3,
  Ellipsis,
  Filter,
  ListFilter,
  Plus,
  Trash,
  Building2,
  Phone,
  Mail,
} from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phones: Array<{
    type: string;
    number: string;
    primary: boolean;
  }>;
  address: {
    streetNumber: string;
    street: string;
    city: string;
    area: string;
    country: string;
    countryCode: string;
    postalCode?: string;
  };
  company: {
    name: string;
    title?: string;
    type?: string;
  };
  opportunityIds: string[];
  projectIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

type ColumnMetaType = {
  className?: string;
}

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Contact> = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.firstName} ${row.original.lastName} ${row.original.email}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const columns: ColumnDef<Contact, any>[] = [
  {
    id: "select",
    header: ({ table }: { table: TableInstance<Contact> }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: { row: Row<Contact> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 48,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "fullName",
    header: "Name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </div>
    ),
    size: 180,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Email",
    accessorKey: "email",
    size: 220,
  },
  {
    header: "Phone",
    accessorFn: (row) => row.phones.find(p => p.primary)?.number || row.phones[0]?.number,
    cell: ({ row }) => {
      const primaryPhone = row.original.phones.find(p => p.primary) || row.original.phones[0];
      return primaryPhone ? (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <a href={`tel:${primaryPhone.number}`} className="hover:underline">
            {primaryPhone.number}
          </a>
          {primaryPhone.type && (
            <Badge variant="secondary" className="ml-2">
              {primaryPhone.type}
            </Badge>
          )}
        </div>
      ) : null;
    },
    size: 180,
  },
  {
    header: "Company",
    accessorFn: (row) => row.company?.name,
    cell: ({ row }) => (
      row.original.company && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.company.name}</span>
          {row.original.company.title && (
            <span className="text-muted-foreground text-sm">({row.original.company.title})</span>
          )}
        </div>
      )
    ),
    size: 200,
  },
  {
    header: "Location",
    accessorFn: (row) => row.address ? `${row.address.city}, ${row.address.area}, ${row.address.country}` : '',
    cell: ({ row }) => (
      <div>
        {row.original.address ? `${row.original.address.city}, ${row.original.address.area}, ${row.original.address.country}` : '-'}
      </div>
    ),
    size: 150,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row} />,
    size: 60,
    enableHiding: false,
  },
];

export function ContactsTable() {
  const id = useId();
  const router = useRouter();
  const { session } = useSession();
  const { user } = useUser();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "fullName",
      desc: false,
    },
  ]);

  const [data, setData] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTokenAndFetch = async () => {
      if (!session) {
        setIsLoading(false)
        return
      }

      try {
        let accessToken = getAccessToken()
        
        if (!accessToken && user?.id && session?.id) {
          const tokens = await exchangeClerkToken(session.id, user.id)
          setAccessToken(tokens.access_token)
          accessToken = tokens.access_token
        }

        if (accessToken) {
          await fetchContacts()
        }
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast.error('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeTokenAndFetch()
  }, [session, user])

  async function fetchContacts() {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      const response = await fetch('/api/contacts', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const responseData = await response.json()
      if (Array.isArray(responseData.data)) {
        setData(responseData.data)
      } else {
        setData(responseData)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRows = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const deletedIds = selectedRows.map(row => row.original.id);
    
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      await Promise.all(deletedIds.map(id => 
        fetch(`/api/contacts/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      ));
      
      const updatedData = data.filter(
        (item) => !deletedIds.includes(item.id)
      );
      setData(updatedData);
      table.resetRowSelection();
      toast.success('Contacts deleted successfully');
    } catch (error) {
      console.error('Failed to delete contacts:', error);
      toast.error('Failed to delete contacts');
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-4">
      {table.getRowModel().rows?.length > 0 ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Filter by name or email */}
              <div className="relative">
                <Input
                  id={`${id}-input`}
                  ref={inputRef}
                  className={cn(
                    "peer min-w-60 ps-9",
                    Boolean(table.getColumn("fullName")?.getFilterValue()) && "pe-9",
                  )}
                  value={(table.getColumn("fullName")?.getFilterValue() ?? "") as string}
                  onChange={(e) => table.getColumn("fullName")?.setFilterValue(e.target.value)}
                  placeholder="Filter by name or email..."
                  type="text"
                  aria-label="Filter by name or email"
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
                </div>
                {Boolean(table.getColumn("fullName")?.getFilterValue()) && (
                  <button
                    className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Clear filter"
                    onClick={() => {
                      table.getColumn("fullName")?.setFilterValue("");
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                  >
                    <CircleX size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>
              {/* Toggle columns visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Columns3
                      className="-ms-1 me-2 opacity-60"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          onSelect={(event) => event.preventDefault()}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-3">
              {table.getSelectedRowModel().rows.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600">
                      <Trash className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                      Delete {table.getSelectedRowModel().rows.length}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the selected contacts.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleDeleteRows}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {/* Add contact button */}
              <Button 
                className="ml-auto" 
                variant="outline"
                onClick={() => router.push('/contacts/new')}
              >
                <Plus className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                Add contact
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <Table className="table-fixed">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        style={{ width: header.column.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="last:py-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-8">
            {/* Results per page */}
            <div className="flex items-center gap-3">
              <Label htmlFor={id} className="max-sm:sr-only">
                Rows per page
              </Label>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                  <SelectValue placeholder="Select number of results" />
                </SelectTrigger>
                <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                  {[5, 10, 25, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Page number information */}
            <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
              <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
                <span className="text-foreground">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                  {Math.min(
                    Math.max(
                      table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                        table.getState().pagination.pageSize,
                      0,
                    ),
                    table.getRowCount(),
                  )}
                </span>{" "}
                of <span className="text-foreground">{table.getRowCount().toString()}</span>
              </p>
            </div>

            {/* Pagination buttons */}
            <div>
              <Pagination>
                <PaginationContent>
                  {/* First page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.firstPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Go to first page"
                    >
                      <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                  {/* Previous page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                  {/* Next page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Go to next page"
                    >
                      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                  {/* Last page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.lastPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Go to last page"
                    >
                      <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-background p-8">
          <div className="w-60 h-60">
            {/* This is a placeholder for the SVG. Replace src with your actual SVG path */}
            <img
              src="/empty-contacts.svg"
              alt="No contacts"
              className="w-full h-full"
            />
          </div>
          <div className="max-w-[420px] space-y-2 text-center">
            <h3 className="text-xl font-semibold">No contacts found</h3>
            <p className="text-muted-foreground text-sm">
              Get started by creating your first contact. You can add basic information, phone numbers, and more.
            </p>
            <Button 
              onClick={() => router.push('/contacts/new')}
              className="mt-4"
            >
              <Plus className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
              Add your first contact
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({ row }: { row: Row<Contact> }) {
  const router = useRouter();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button size="icon" variant="ghost" className="shadow-none" aria-label="Edit contact">
            <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(`/contacts/${row.original.id}/edit`)}>
            <span>Edit</span>
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/contacts/${row.original.id}`)}>
            <span>View Details</span>
            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <span>Delete</span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 