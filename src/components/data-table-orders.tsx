"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"
import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import debounce from "lodash.debounce"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import { Drawer } from "@/components/ui/drawer"
import { DrawerClose } from "@/components/ui/drawer"
import { DrawerContent } from "@/components/ui/drawer"
import { DrawerDescription } from "@/components/ui/drawer"
import { DrawerFooter } from "@/components/ui/drawer"
import { DrawerHeader } from "@/components/ui/drawer"
import { DrawerTitle } from "@/components/ui/drawer"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"

import { Select } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectItem } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"

import { Table } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableCell } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"

import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconShoppingCart,
  IconUser,
  IconPhone,
  IconMapPin,
  IconTruck,
  IconTag,
  IconCurrencyDollar,
  IconEye,
  IconPencil,
} from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"

// Order schemas
const orderAzotSchema = z.object({
  id: z.number().optional(),
  order_id: z.number(),
  azot_id: z.number(),
  count: z.number(),
  price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  total_price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

const orderAccessorySchema = z.object({
  id: z.number().optional(),
  order_id: z.number(),
  accessory_id: z.number(),
  count: z.number(),
  price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  total_price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

const orderServiceSchema = z.object({
  id: z.number().optional(),
  order_id: z.number(),
  additional_service_id: z.number(),
  count: z.number(),
  price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  total_price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

const userSchema = z.object({
  id: z.number(),
  tg_id: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
})

const promocodeSchema = z.object({
  id: z.number(),
  promocode: z.string(),
  amount: z.number(),
  type: z.string(),
})

const orderSchema = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  promocode_id: z.number().nullable().optional(),
  promo_price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  cargo_price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  all_price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  total_price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  status: z.enum(["new", "pending", "accepted", "rejected", "completed"]),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  // Relations
  user: userSchema.optional(),
  promocode: promocodeSchema.nullable().optional(),
  azots: z.array(orderAzotSchema).optional(),
  accessories: z.array(orderAccessorySchema).optional(),
  services: z.array(orderServiceSchema).optional(),
})

const orderFormSchema = orderSchema.extend({
  phone: z.string().optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
  cargo_price: z.number().min(0, "Cargo price must be at least 0"),
})

// Laravel pagination response schema
const orderApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    current_page: z.number(),
    data: z.array(orderSchema),
    first_page_url: z.string().optional(),
    from: z.number().nullable(),
    last_page: z.number(),
    last_page_url: z.string().optional(),
    links: z.array(z.any()).optional(),
    next_page_url: z.string().nullable().optional(),
    path: z.string().optional(),
    per_page: z.number(),
    prev_page_url: z.string().nullable().optional(),
    to: z.number().nullable(),
    total: z.number(),
  }),
  errors: z.record(z.string(), z.any()).optional(),
})

type Order = z.infer<typeof orderSchema>
type OrderFormData = z.infer<typeof orderFormSchema>
// type OrderApiResponse = z.infer<typeof orderApiResponseSchema>

// Global handlers for view, edit and delete
let globalHandleView: (order: Order) => void = () => {};
let globalHandleEdit: (order: Order) => void = () => {};
let globalHandleDelete: (id: number) => void = () => {};

const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 border-blue-300"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "accepted":
      return "bg-green-100 text-green-800 border-green-300"
    case "rejected":
      return "bg-red-100 text-red-800 border-red-300"
    case "completed":
      return "bg-gray-100 text-gray-800 border-gray-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Order ID
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-muted-foreground">
        #{row.original.id}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "user",
    header: "Customer",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full border flex items-center justify-center">
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium max-w-[150px] truncate">
              {user?.full_name || user?.username || "No name"}
            </div>
            {user?.phone && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <IconPhone className="h-3 w-3" />
                {user.phone}
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge className={getStatusColor(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "all_price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Subtotal
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium text-muted-foreground">
        ${typeof row.original.all_price === 'string' 
          ? parseFloat(row.original.all_price).toFixed(2) 
          : row.original.all_price.toFixed(2)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "total_price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-bold text-green-600">
        ${typeof row.original.total_price === 'string' 
          ? parseFloat(row.original.total_price).toFixed(2) 
          : row.original.total_price.toFixed(2)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created At
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="size-8">
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            globalHandleView(row.original);
          }}>
            <IconEye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            globalHandleEdit(row.original);
          }}>
            <IconPencil className="mr-2 h-4 w-4" />
            Edit Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              globalHandleDelete(row.original.id!);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function OrderDataTable() {
  const [data, setData] = React.useState<Order[]>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [pageCount, setPageCount] = React.useState(-1)
  const [totalRows, setTotalRows] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [viewDrawerOpen, setViewDrawerOpen] = React.useState(false)
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null)
  const isMobile = useIsMobile()

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: "includesString",
  })

  const form = useForm<OrderFormData>({
    // resolver: zodResolver(orderFormSchema),
    defaultValues: {
      status: "new",
      phone: "",
      address: "",
      comment: "",
      cargo_price: 0,
    },
  })

  React.useEffect(() => {
    if (editingOrder) {
      form.reset({
        ...editingOrder,
        phone: editingOrder.phone || "",
        address: editingOrder.address || "",
        comment: editingOrder.comment || "",
      })
    } else {
      form.reset({
        status: "new",
        phone: "",
        address: "",
        comment: "",
        cargo_price: 0,
      })
    }
  }, [editingOrder, form])

  const fetchOrders = React.useCallback(
    debounce(async () => {
      setLoading(true)
      setError(null)
      try {
        const sort = sorting[0]
        const statusFilter = columnFilters.find((f) => f.id === "status")?.value as string | undefined

        const params = {
          per_page: pagination.pageSize,
          page: pagination.pageIndex + 1,
          search: globalFilter || undefined,
          status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
          sort_by: sort?.id || "id",
          sort_order: sort?.desc ? "desc" : "asc",
        }

        const response = await api.get("/orders", { params })
        const parsed = orderApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          throw new Error(`Invalid API response: ${parsed.error.message}`)
        }
        
        if (parsed.data.success) {
          setData(parsed.data.data.data)
          setTotalRows(parsed.data.data.total)
          setPageCount(parsed.data.data.last_page)
        } else {
          throw new Error("API returned success: false")
        }
      } catch (err: any) {
        setError(err.message || "Error fetching orders")
        toast.error(err.message || "Error fetching orders")
        setData([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [sorting, columnFilters, globalFilter, pagination.pageSize, pagination.pageIndex]
  )

  React.useEffect(() => {
    fetchOrders()
    return () => fetchOrders.cancel()
  }, [fetchOrders])

  const handleSubmit = async (formData: OrderFormData) => {
    try {
      if (editingOrder?.id) {
        // Only update status for orders
        const updateData = { status: formData.status };
        const response = await api.put(`/orders/${editingOrder.id}`, updateData);
        console.log('Update response:', response.data);
        toast.success("Order status updated successfully");
      }
      
      setDrawerOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Error updating order";
      toast.error(errorMessage);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order?")) return
    try {
      await api.delete(`/orders/${id}`)
      toast.success("Order deleted successfully")
      fetchOrders()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Error deleting order"
      toast.error(errorMessage)
    }
  }

  const handleEdit = (order: Order) => {
    setEditingOrder(order)
    setDrawerOpen(true)
  }

  const handleView = (order: Order) => {
    setViewingOrder(order)
    setViewDrawerOpen(true)
  }

  // Global handlers ni set qilish
  React.useEffect(() => {
    globalHandleView = handleView;
    globalHandleEdit = handleEdit;
    globalHandleDelete = handleDelete;
  }, [handleView, handleEdit, handleDelete]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders, customers..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 md:w-64"
            />
          </div>
          <Select
            value={(columnFilters.find((f) => f.id === "status")?.value as string) ?? "all"}
            onValueChange={(value) =>
              setColumnFilters((prev) => [
                ...prev.filter((f) => f.id !== "status"),
                ...(value !== "all" ? [{ id: "status", value }] : []),
              ])
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === "id" ? "Order ID" : 
                     column.id === "user" ? "Customer" :
                     column.id === "all_price" ? "Subtotal" :
                     column.id === "total_price" ? "Total" :
                     column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleView(row.original)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {totalRows} row(s) selected.
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Rows per page</Label>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm font-medium">
            Page {pagination.pageIndex + 1} of {Math.max(pageCount, 1)}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      {/* View Order Details Drawer */}
      <Drawer open={viewDrawerOpen} onOpenChange={setViewDrawerOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent className="max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Order Details #{viewingOrder?.id}</DrawerTitle>
            <DrawerDescription>Complete order information and items</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[80vh]">
            {viewingOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconShoppingCart className="h-5 w-5" />
                      Order Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(viewingOrder.status)}>
                          {viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Created Date</Label>
                      <div className="mt-1 text-sm">
                        {viewingOrder.created_at ? new Date(viewingOrder.created_at).toLocaleString() : "N/A"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                {viewingOrder.user && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconUser className="h-5 w-5" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">Name</Label>
                        <div className="mt-1 text-sm">
                          {viewingOrder.user.full_name || viewingOrder.user.username || "No name"}
                        </div>
                      </div>
                      {viewingOrder.user.phone && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Phone</Label>
                          <div className="mt-1 text-sm flex items-center gap-1">
                            <IconPhone className="h-3 w-3" />
                            {viewingOrder.user.phone}
                          </div>
                        </div>
                      )}
                      {viewingOrder.user.tg_id && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Telegram ID</Label>
                          <div className="mt-1 text-sm font-mono">
                            {viewingOrder.user.tg_id}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconMapPin className="h-5 w-5" />
                      Delivery Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {viewingOrder.phone && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Phone</Label>
                        <div className="mt-1 text-sm flex items-center gap-1">
                          <IconPhone className="h-3 w-3" />
                          {viewingOrder.phone}
                        </div>
                      </div>
                    )}
                    {viewingOrder.address && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Address</Label>
                        <div className="mt-1 text-sm">
                          {viewingOrder.address}
                        </div>
                      </div>
                    )}
                    {viewingOrder.comment && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Comment</Label>
                        <div className="mt-1 text-sm">
                          {viewingOrder.comment}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Price Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconCurrencyDollar className="h-5 w-5" />
                      Price Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal:</span>
                      <span className="text-sm font-medium">
                        ${typeof viewingOrder.all_price === 'string' 
                          ? parseFloat(viewingOrder.all_price).toFixed(2) 
                          : viewingOrder.all_price.toFixed(2)}
                      </span>
                    </div>
                    {viewingOrder.cargo_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconTruck className="h-3 w-3" />
                          Cargo Price:
                        </span>
                        <span className="text-sm">
                          ${typeof viewingOrder.cargo_price === 'string' 
                            ? parseFloat(viewingOrder.cargo_price).toFixed(2) 
                            : viewingOrder.cargo_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {viewingOrder.promo_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconTag className="h-3 w-3" />
                          Promo Discount:
                        </span>
                        <span className="text-sm text-red-600">
                          -${typeof viewingOrder.promo_price === 'string' 
                            ? parseFloat(viewingOrder.promo_price).toFixed(2) 
                            : viewingOrder.promo_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-green-600">
                        ${typeof viewingOrder.total_price === 'string' 
                          ? parseFloat(viewingOrder.total_price).toFixed(2) 
                          : viewingOrder.total_price.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                {(viewingOrder.azots?.length || viewingOrder.accessories?.length || viewingOrder.services?.length) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Azots */}
                      {viewingOrder.azots && viewingOrder.azots.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Azots</h4>
                          <div className="space-y-2">
                            {viewingOrder.azots.map((azot, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                <div>
                                  <span className="text-sm">Azot ID: {azot.azot_id}</span>
                                  <span className="text-xs text-muted-foreground ml-2">x{azot.count}</span>
                                </div>
                                <span className="text-sm font-medium">${azot.total_price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Accessories */}
                      {viewingOrder.accessories && viewingOrder.accessories.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Accessories</h4>
                          <div className="space-y-2">
                            {viewingOrder.accessories.map((accessory, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                <div>
                                  <span className="text-sm">Accessory ID: {accessory.accessory_id}</span>
                                  <span className="text-xs text-muted-foreground ml-2">x{accessory.count}</span>
                                </div>
                                <span className="text-sm font-medium">${accessory.total_price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      {viewingOrder.services && viewingOrder.services.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Services</h4>
                          <div className="space-y-2">
                            {viewingOrder.services.map((service, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                <div>
                                  <span className="text-sm">Service ID: {service.additional_service_id}</span>
                                  <span className="text-xs text-muted-foreground ml-2">x{service.count}</span>
                                </div>
                                <span className="text-sm font-medium">${service.total_price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Promocode */}
                {viewingOrder.promocode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconTag className="h-5 w-5" />
                        Promocode
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm">{viewingOrder.promocode.promocode}</div>
                          <div className="text-xs text-muted-foreground capitalize">{viewingOrder.promocode.type}</div>
                        </div>
                        <div className="text-sm font-medium">
                          -${viewingOrder.promocode.amount.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Order Status Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Update Order Status #{editingOrder?.id}</DrawerTitle>
            <DrawerDescription>Change the order status</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Order Status *</Label>
              <Select
                onValueChange={(value) => form.setValue("status", value as "new" | "pending" | "accepted" | "rejected" | "completed")}
                value={form.watch("status")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-destructive text-sm">{form.formState.errors.status.message}</p>
              )}
            </div>
          </form>
          <DrawerFooter>
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
              Update Status
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}