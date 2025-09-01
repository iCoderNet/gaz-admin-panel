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
  IconCreditCard,
} from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"

// Order schemas with fixed cargo_price validation
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
  azot: z.object({
    id: z.number(),
    title: z.string(),
    type: z.string(),
    image: z.string().nullable(),
    description: z.string().nullable(),
    country: z.string().nullable(),
    status: z.string(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    image_url: z.string().nullable(),
  }).optional(),
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
  accessory: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().nullable(),
    price: z.union([z.number(), z.string()]).transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    }),
    status: z.string(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    image_url: z.string().nullable(),
  }).optional(),
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
  service: z.object({
    id: z.number(),
    name: z.string(),
    price: z.union([z.number(), z.string()]).transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    }),
    status: z.string(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
  }).optional(),
})

const userSchema = z.object({
  id: z.number(),
  tg_id: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
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
  payment_type: z.string().nullable().optional(),
  promo_price: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  cargo_price: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === undefined) return 0;
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
  price_type: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  status: z.enum(["new", "pending", "accepted", "rejected", "completed"]),
  status_text: z.string().optional(),
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
      return "bg-emerald-100 text-emerald-800 border-emerald-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

const getPaymentTypeColor = (paymentType: string | null) => {
  if (!paymentType) return "bg-gray-100 text-gray-600 border-gray-300"
  
  switch (paymentType.toLowerCase()) {
    case "nalichi":
    case "cash":
      return "bg-green-100 text-green-700 border-green-300"
    case "card":
    case "karta":
      return "bg-blue-100 text-blue-700 border-blue-300"
    case "online":
      return "bg-purple-100 text-purple-700 border-purple-300"
    default:
      return "bg-orange-100 text-orange-700 border-orange-300"
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
          aria-label="Выбрать все"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Выбрать строку"
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
        ID Заказа
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
    header: "Клиент",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full border flex items-center justify-center">
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium max-w-[150px] truncate">
              {user?.full_name || user?.username || "Без имени"}
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
    accessorKey: "status_text",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText = row.original.status_text;
      return (
        <Badge className={getStatusColor(status)}>
          {statusText || status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "payment_type",
    header: "Оплата",
    cell: ({ row }) => {
      const paymentType = row.original.payment_type;
      if (!paymentType) {
        return <Badge className="bg-gray-100 text-gray-500 border-gray-300">Не указано</Badge>;
      }
      return (
        <Badge className={getPaymentTypeColor(paymentType)}>
          <IconCreditCard className="h-3 w-3 mr-1" />
          {paymentType}
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
        Подытог
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium text-muted-foreground">
        {typeof row.original.all_price === 'string' 
          ? parseFloat(row.original.all_price) 
          : row.original.all_price} ₽
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
        Итого
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-bold text-green-600">
        {typeof row.original.total_price === 'string' 
          ? parseFloat(row.original.total_price) 
          : row.original.total_price} ₽
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
        Создан
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      return date ? new Date(date).toLocaleDateString() : "Н/Д";
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
            <span className="sr-only">Открыть меню</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            globalHandleView(row.original);
          }}>
            <IconEye className="mr-2 h-4 w-4" />
            Просмотр деталей
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            globalHandleEdit(row.original);
          }}>
            <IconPencil className="mr-2 h-4 w-4" />
            Изменить статус
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              globalHandleDelete(row.original.id!);
            }}
          >
            Удалить
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
          sort_order: sort?.desc ? "asc" : "desc",
        }

        const response = await api.get("/orders", { params })
        const parsed = orderApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          console.error("Validation errors:", parsed.error.issues)
          throw new Error(`Invalid API response: ${JSON.stringify(parsed.error.format())}`)
        }
        
        if (parsed.data.success) {
          setData(parsed.data.data.data)
          setTotalRows(parsed.data.data.total)
          setPageCount(parsed.data.data.last_page)
        } else {
          throw new Error("API returned success: false")
        }
      } catch (err: any) {
        setError(err.message || "Ошибка загрузки заказов")
        toast.error(err.message || "Ошибка загрузки заказов")
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
        const updateData = { status: formData.status, payment_type: formData.payment_type };
        const response = await api.put(`/orders/${editingOrder.id}`, updateData);
        console.log('Update response:', response.data);
        toast.success("Статус заказа успешно обновлен");
      }
      
      setDrawerOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Ошибка обновления заказа";
      toast.error(errorMessage);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот заказ?")) return
    try {
      await api.delete(`/orders/${id}`)
      toast.success("Заказ успешно удален")
      fetchOrders()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Ошибка удаления заказа"
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
              placeholder="Поиск заказов, клиентов..."
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
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Не Оформлен</SelectItem>
              <SelectItem value="pending">Оформлен</SelectItem>
              <SelectItem value="accepted">Принято</SelectItem>
              <SelectItem value="rejected">Отклонено</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                Столбцы
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
                    {column.id === "id" ? "ID Заказа" : 
                     column.id === "user" ? "Клиент" :
                     column.id === "status_text" ? "Статус" :
                     column.id === "payment_type" ? "Оплата" :
                     column.id === "all_price" ? "Подытог" :
                     column.id === "total_price" ? "Итого" :
                     column.id === "created_at" ? "Создан" :
                     column.id.charAt(0).toUpperCase() + column.id.slice(1).replace('_', ' ')}
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
                  Заказы не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} из {totalRows} строк(и) выбрано.
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Строк на странице</Label>
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
            Страница {pagination.pageIndex + 1} из {Math.max(pageCount, 1)}
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
        <DrawerContent className="max-w-full">
          <DrawerHeader>
            <DrawerTitle>Детали заказа #{viewingOrder?.id}</DrawerTitle>
            <DrawerDescription>Полная информация о заказе и товарах</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[80vh]">
            {viewingOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconShoppingCart className="h-5 w-5" />
                      Информация о заказе
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Статус</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(viewingOrder.status)}>
                          {viewingOrder.status_text || viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Тип оплаты</Label>
                      <div className="mt-1">
                        <Badge className={getPaymentTypeColor(viewingOrder.payment_type || null)}>
                          <IconCreditCard className="h-3 w-3 mr-1" />
                          {viewingOrder.payment_type || "Не указано"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Дата создания</Label>
                      <div className="mt-1 text-sm">
                        {viewingOrder.created_at ? new Date(viewingOrder.created_at).toLocaleString() : "Н/Д"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Последнее обновление</Label>
                      <div className="mt-1 text-sm">
                        {viewingOrder.updated_at ? new Date(viewingOrder.updated_at).toLocaleString() : "Н/Д"}
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
                        Информация о клиенте
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">Имя пользователя</Label>
                        <div className="mt-1 text-sm">
                          {viewingOrder.user.full_name || viewingOrder.user.username || "Без имени"}
                        </div>
                      </div>
                      {viewingOrder.user.phone && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Телефон</Label>
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
                      {viewingOrder.user.role && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Роль</Label>
                          <div className="mt-1 text-sm capitalize">
                            {viewingOrder.user.role}
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
                      Информация о доставке
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {viewingOrder.phone && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Телефон для доставки</Label>
                        <div className="mt-1 text-sm flex items-center gap-1">
                          <IconPhone className="h-3 w-3" />
                          {viewingOrder.phone}
                        </div>
                      </div>
                    )}
                    {viewingOrder.address && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Адрес доставки</Label>
                        <div className="mt-1 text-sm">
                          {viewingOrder.address}
                        </div>
                      </div>
                    )}
                    {viewingOrder.comment && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Комментарий к заказу</Label>
                        <div className="mt-1 text-sm bg-muted p-2 rounded-md">
                          {viewingOrder.comment}
                        </div>
                      </div>
                    )}
                    {!viewingOrder.phone && !viewingOrder.address && !viewingOrder.comment && (
                      <div className="text-sm text-muted-foreground italic">
                        Информация о доставке не предоставлена
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Price Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconCurrencyDollar className="h-5 w-5" />
                      Детали цены
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Подытог:</span>
                      <span className="text-sm font-medium">
                        {typeof viewingOrder.all_price === 'string' 
                          ? parseFloat(viewingOrder.all_price) 
                          : viewingOrder.all_price} ₽
                      </span>
                    </div>
                    {viewingOrder.cargo_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconTruck className="h-3 w-3" />
                          Стоимость доставки:
                        </span>
                        <span className="text-sm">
                          {typeof viewingOrder.cargo_price === 'string' 
                            ? parseFloat(viewingOrder.cargo_price) 
                            : viewingOrder.cargo_price} ₽
                        </span>
                      </div>
                    )}
                    {viewingOrder.promo_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconTag className="h-3 w-3" />
                          Скидка по промокоду:
                        </span>
                        <span className="text-sm text-red-600">
                          -{typeof viewingOrder.promo_price === 'string' 
                            ? parseFloat(viewingOrder.promo_price) 
                            : viewingOrder.promo_price} ₽
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Итого:</span>
                      <span className="font-bold text-green-600">
                        {typeof viewingOrder.total_price === 'string' 
                          ? parseFloat(viewingOrder.total_price) 
                          : viewingOrder.total_price} ₽
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                {(viewingOrder.azots?.length || viewingOrder.accessories?.length || viewingOrder.services?.length) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Товары заказа</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Azots */}
                      {viewingOrder.azots && viewingOrder.azots.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-blue-600">Азоты</h4>
                          <div className="space-y-2">
                            {viewingOrder.azots.map((azot, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-secondary border border-secondary rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {azot.azot?.title || `Азот #${azot.azot_id}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Тип: {azot.azot?.type} • Количество: {azot.count}
                                  </div>
                                  {azot.azot?.country && (
                                    <div className="text-xs text-muted-foreground">
                                      Страна: {azot.azot.country}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{azot.total_price} ₽</div>
                                  <div className="text-xs text-muted-foreground">
                                    {azot.price} ₽ за штуку
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Accessories */}
                      {viewingOrder.accessories && viewingOrder.accessories.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-purple-600">Аксессуары</h4>
                          <div className="space-y-2">
                            {viewingOrder.accessories.map((accessory, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-secondary border border-secondary rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {accessory.accessory?.title || 'Аксессуар'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Количество: {accessory.count}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{accessory.total_price} ₽</div>
                                  <div className="text-xs text-muted-foreground">
                                    {accessory.price} ₽ за штуку
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      {viewingOrder.services && viewingOrder.services.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-green-600">Услуги</h4>
                          <div className="space-y-2">
                            {viewingOrder.services.map((service, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-secondary border border-secondary rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {service.service?.name || `Услуга #${service.additional_service_id}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Количество: {service.count}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{service.total_price} ₽</div>
                                  <div className="text-xs text-muted-foreground">
                                    {service.price} ₽ за штуку
                                  </div>
                                </div>
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
                        Применен промокод
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <div>
                          <div className="font-mono text-sm font-medium">{viewingOrder.promocode.promocode}</div>
                          <div className="text-xs text-muted-foreground capitalize">Скидка {viewingOrder.promocode.type}</div>
                        </div>
                        <div className="text-sm font-medium text-red-600">
                          -{viewingOrder.promocode.amount} ₽
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
          <DrawerFooter>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(viewingOrder!)} size="sm">
                <IconPencil className="h-4 w-4 mr-2" />
                Изменить статус
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Закрыть</Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Order Status Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Обновить статус заказа #{editingOrder?.id}</DrawerTitle>
            <DrawerDescription>Изменить статус заказа и способ оплаты</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Статус заказа *</Label>
                <Select
                  onValueChange={(value) => form.setValue("status", value as "new" | "pending" | "accepted" | "rejected" | "completed")}
                  value={form.watch("status")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="new">Не Оформлен</SelectItem>
                      <SelectItem value="pending">Оформлен</SelectItem>
                      <SelectItem value="accepted">Принято</SelectItem>
                      <SelectItem value="rejected">Отклонено</SelectItem>
                      <SelectItem value="completed">Завершено</SelectItem>

                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-destructive text-sm">{form.formState.errors.status.message}</p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="payment_type">Тип оплаты</Label>
                <input
                  id="payment_type"
                  type="text"
                  placeholder="Введите тип оплаты"
                  className="border rounded px-3 py-2"
                  value={form.watch("payment_type") || ""}
                  onChange={(e) => form.setValue("payment_type", e.target.value)}
                />
              </div>

            </div>
          </form>
          <DrawerFooter>
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
              {loading ? "Обновление..." : "Обновить заказ"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Отмена</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}