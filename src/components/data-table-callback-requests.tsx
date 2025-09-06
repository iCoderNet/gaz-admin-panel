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
import { toast } from "sonner"
import debounce from "lodash.debounce"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
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
  IconPhone,
  IconUser,
  IconCalendar,
} from "@tabler/icons-react"
import api from "@/lib/api"
// import { cn } from "@/lib/utils"

// Status options with translations
const STATUS_OPTIONS = {
  'new': 'Новый',
  'in_progress': 'В процессе', 
  'waiting': 'Ожидает',
  'callback': 'Перезвон',
  'no_answer': 'Нет ответа',
  'invalid_number': 'Неверный номер',
  'not_interested': 'Не заинтересован',
  'converted': 'Конвертирован',
  'blocked': 'Заблокирован',
  'duplicate': 'Дубликат',
  'closed': 'Закрыт',
  'archived': 'Архив',
}

// Status badge variants
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  'new': 'default',
  'in_progress': 'default',
  'waiting': 'secondary', 
  'callback': 'outline',
  'no_answer': 'destructive',
  'invalid_number': 'destructive',
  'not_interested': 'destructive',
  'converted': 'default',
  'blocked': 'destructive',
  'duplicate': 'secondary',
  'closed': 'secondary',
  'archived': 'secondary',
}

// User schema
const userSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  tg_id: z.string(),
  username: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(), 
  role: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

// CallbackRequest schema
const callbackRequestSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  admin_id: z.number().nullable(),
  phone: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  user: userSchema.nullable().optional(),
  admin: userSchema.nullable().optional(),
})

// Laravel pagination response schema  
const callbackRequestApiResponseSchema = z.object({
  current_page: z.number(),
  data: z.array(callbackRequestSchema),
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
})

type CallbackRequest = z.infer<typeof callbackRequestSchema>

// Global handlers for status update and delete
let globalHandleStatusUpdate: (id: number, status: string) => void = () => {};
let globalHandleDelete: (id: number) => void = () => {};

const StatusSelect = ({ request }: { request: CallbackRequest }) => {
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === request.status) return
    
    setIsUpdating(true)
    try {
      await api.patch(`/callback-requests/${request.id}/status`, { status: newStatus })
      toast.success("Статус успешно обновлен")
      globalHandleStatusUpdate(request.id, newStatus)
    } catch (err: any) {
      console.error('Status update error:', err)
      const errorMessage = err.response?.data?.message || "Ошибка обновления статуса"
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select
      value={request.status}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-40">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Badge 
              variant={STATUS_VARIANTS[request.status] || "secondary"}
              className="text-xs"
            >
              {STATUS_OPTIONS[request.status as keyof typeof STATUS_OPTIONS] || request.status}
            </Badge>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_OPTIONS).map(([status, label]) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <Badge 
                variant={STATUS_VARIANTS[status] || "secondary"}
                className="text-xs"
              >
                {label}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const columns: ColumnDef<CallbackRequest>[] = [
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
        ID
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => <div className="font-mono text-muted-foreground">#{row.original.id}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Номер телефона
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-muted rounded-md border flex items-center justify-center">
          <IconPhone className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-medium">
          {row.original.phone}
        </div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "user",
    header: "Пользователь",
    cell: ({ row }) => {
      const user = row.original.user
      return user ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full border flex items-center justify-center">
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{user.username || "Без имени"}</div>
            <div className="text-sm text-muted-foreground">{user.phone}</div>
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">Н/Д</span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "admin",
    header: "Администратор",
    cell: ({ row }) => {
      const admin = row.original.admin
      return admin ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full border flex items-center justify-center">
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="font-medium">{admin.username}</div>
        </div>
      ) : (
        <span className="text-muted-foreground">Не назначен</span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => <StatusSelect request={row.original} />,
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Дата создания
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      return (
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(date).toLocaleDateString('ru-RU')}</span>
        </div>
      )
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
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => globalHandleDelete(row.original.id)}
          >
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function CallbackRequestDataTable() {
  const [data, setData] = React.useState<CallbackRequest[]>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 })
  const [pageCount, setPageCount] = React.useState(-1)
  const [totalRows, setTotalRows] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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

  const fetchCallbackRequests = React.useCallback(
    debounce(async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching callback requests...');
        
        const sort = sorting[0]
        const statusFilter = columnFilters.find((f) => f.id === "status")?.value as string | undefined

        const params = {
          per_page: pagination.pageSize,
          page: pagination.pageIndex + 1,
          search: globalFilter || undefined,
          status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
          sort_by: sort?.id || "created_at",
          sort_order: sort?.desc ? "desc" : "asc",
        }

        console.log('Request params:', params);

        const response = await api.get("/callback-requests", { params })
        console.log('API Response:', response.data);
        
        const parsed = callbackRequestApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          console.error('Schema validation error:', parsed.error);
          throw new Error(`Неверный ответ API: ${parsed.error.message}`)
        }
        
        console.log('Callback requests data:', parsed.data.data);
        setData(parsed.data.data)
        setTotalRows(parsed.data.total)
        setPageCount(parsed.data.last_page)
        
      } catch (err: any) {
        console.error('Error fetching callback requests:', err);
        setError(err.message || "Ошибка загрузки заявок")
        toast.error(err.message || "Ошибка загрузки заявок")
        setData([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [sorting, columnFilters, globalFilter, pagination.pageSize, pagination.pageIndex]
  )

  React.useEffect(() => {
    fetchCallbackRequests()
    return () => fetchCallbackRequests.cancel()
  }, [fetchCallbackRequests])

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту заявку?")) return
    try {
      const response = await api.delete(`/callback-requests/${id}`)
      console.log('Delete response:', response.data);
      toast.success("Заявка успешно удалена")
      fetchCallbackRequests()
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || "Ошибка удаления заявки"
      toast.error(errorMessage)
    }
  }

  const handleStatusUpdate = (id: number, status: string) => {
    // Update local data to reflect the change immediately
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, status } : item
      )
    )
  }

  // Global handlers ni set qilish
  React.useEffect(() => {
    globalHandleStatusUpdate = handleStatusUpdate;
    globalHandleDelete = handleDelete;
  }, [handleStatusUpdate, handleDelete]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по телефону, статусу или имени..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 md:w-80"
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
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {Object.entries(STATUS_OPTIONS).map(([status, label]) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={STATUS_VARIANTS[status] || "secondary"}
                      className="text-xs"
                    >
                      {label}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
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
                .map((column) => {
                  const labels: Record<string, string> = {
                    id: "ID",
                    phone: "Номер телефона",
                    user: "Пользователь",
                    admin: "Администратор", 
                    status: "Статус",
                    created_at: "Дата создания"
                  }
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {labels[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
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
                  className="hover:bg-muted/50"
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
                  Заявки не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} из {totalRows} строк выбрано.
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
                {[15, 25, 50, 100].map((size) => (
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
    </div>
  )
}