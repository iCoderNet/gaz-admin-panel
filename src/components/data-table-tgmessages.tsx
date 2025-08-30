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
import { Textarea } from "@/components/ui/textarea"

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
// import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconSend,
  IconMessageCircle,
  IconUsers,
  IconClock,
  IconCheck,
  IconX,
  IconEye,
} from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"

// Message batch schema
const messageBatchSchema = z.object({
  id: z.number(),
  message: z.string(),
  user_ids: z.array(z.union([z.string(), z.number()]).transform(val => String(val))),
  stats: z.object({
    total: z.number(),
    success: z.number(),
    failed: z.number(),
    pending: z.number(),
  }),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  created_by: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  creator: z.object({
    id: z.number(),
    tg_id: z.string(),
    username: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    role: z.string().optional(),
    status: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }).nullable().optional(),
})

const messageFormSchema = z.object({
  message: z.string().min(1, "Message is required").max(4096, "Message too long"),
  tg_ids: z.array(z.string()).optional(),
  send_to_all: z.boolean().default(false),
})

// Laravel pagination response schema
const messageBatchApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    current_page: z.number(),
    data: z.array(messageBatchSchema),
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

type MessageBatch = z.infer<typeof messageBatchSchema>
type MessageFormData = z.infer<typeof messageFormSchema>
// type MessageBatchApiResponse = z.infer<typeof messageBatchApiResponseSchema>

// Global handlers
let globalHandleView: (batch: MessageBatch) => void = () => {};

const columns: ColumnDef<MessageBatch>[] = [
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
        ID пакета
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => <div className="font-mono text-muted-foreground">#{row.original.id}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "message",
    header: "Сообщение",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-md border flex items-center justify-center">
          <IconMessageCircle className="h-4 w-4 text-blue-600" />
        </div>
        <div className="max-w-[300px]">
          <div className="font-medium truncate" title={row.original.message}>
            {row.original.message}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.message.length} символов
          </div>
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "stats",
    header: "Получатели",
    cell: ({ row }) => {
      const stats = row.original.stats;
      return (
        <div className="flex items-center gap-2">
          <IconUsers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{stats.total}</span>
          <span className="text-muted-foreground">пользователей</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.original.status;
      const stats = row.original.stats;
      
      const getStatusConfig = (status: string) => {
        switch (status) {
          case "pending":
            return { variant: "secondary" as const, color: "text-yellow-600", icon: IconClock };
          case "processing":
            return { variant: "secondary" as const, color: "text-blue-600", icon: IconSend };
          case "completed":
            return { variant: "default" as const, color: "text-green-600", icon: IconCheck };
          case "failed":
            return { variant: "destructive" as const, color: "text-red-600", icon: IconX };
          default:
            return { variant: "secondary" as const, color: "text-gray-600", icon: IconClock };
        }
      };
      
      const config = getStatusConfig(status);
      const Icon = config.icon;
      const progress = stats.total > 0 ? ((stats.success + stats.failed) / stats.total) * 100 : 0;
      
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className="capitalize">
              <Icon className="w-3 h-3 mr-1" />
              {status}
            </Badge>
          </div>
          {status === "processing" && (
            <Progress value={progress} className="w-20 h-2" />
          )}
          <div className="text-xs text-muted-foreground">
            ✓ {stats.success} • ✗ {stats.failed} • ⏳ {stats.pending}
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "creator",
    header: "Создано",
    cell: ({ row }) => {
      const creator = row.original.creator;
      return (
        <div className="text-sm">
          {creator ? (
            <div>
              <div className="font-medium">{creator.username || "Нет имени пользователя"}</div>
              <div className="text-muted-foreground">{creator.phone || creator.tg_id}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">Неизвестно</span>
          )}
        </div>
      );
    },
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
      const date = new Date(row.original.created_at);
      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground">{date.toLocaleTimeString()}</div>
        </div>
      );
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
          <DropdownMenuItem onClick={() => globalHandleView(row.original)}>
            <IconEye className="mr-2 h-4 w-4" />
            Посмотреть детали
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function TelegramMessagesDataTable() {
  const [data, setData] = React.useState<MessageBatch[]>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "created_at", desc: true }])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 })
  const [pageCount, setPageCount] = React.useState(-1)
  const [totalRows, setTotalRows] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [viewingBatch, setViewingBatch] = React.useState<MessageBatch | null>(null)
  const [batchDetails, setBatchDetails] = React.useState<any>(null)
  const [createDrawerOpen, setCreateDrawerOpen] = React.useState(false)
  const [allUsers, setAllUsers] = React.useState<any[]>([])
  const [userSearchQuery, setUserSearchQuery] = React.useState("")
  const [loadingUsers, setLoadingUsers] = React.useState(false)
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

  const form = useForm<MessageFormData>({
    // resolver: zodResolver(messageFormSchema),
    defaultValues: {
      message: "",
      tg_ids: [],
      send_to_all: false,
    },
  })

  const fetchMessageBatches = React.useCallback(
    debounce(async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching message batches...');
        
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

        const response = await api.get("/tg-messages", { params })
        console.log('API Response:', response.data);
        
        const parsed = messageBatchApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          console.error('Schema validation error:', parsed.error);
          throw new Error(`Invalid API response: ${parsed.error.message}`)
        }
        
        if (parsed.data.success) {
          console.log('Message batches data:', parsed.data.data.data);
          setData(parsed.data.data.data)
          setTotalRows(parsed.data.data.total)
          setPageCount(parsed.data.data.last_page)
        } else {
          throw new Error("API returned success: false")
        }
      } catch (err: any) {
        console.error('Error fetching message batches:', err);
        setError(err.message || "Error fetching message batches")
        toast.error(err.message || "Error fetching message batches")
        setData([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [sorting, columnFilters, globalFilter, pagination.pageSize, pagination.pageIndex]
  )

  const fetchUsers = React.useCallback(
    debounce(async (searchQuery?: string) => {
      setLoadingUsers(true)
      try {
        const params = searchQuery ? { search: searchQuery } : {}
        const response = await api.get("/users", { params })
        if (response.data.success) {
          setAllUsers(response.data.data.data || response.data.data)
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false)
      }
    }, 300),
    []
  )

  const filteredUsers = React.useMemo(() => {
    if (!userSearchQuery) return allUsers
    return allUsers.filter(user => {
      const searchLower = userSearchQuery.toLowerCase()
      return (
        user.username?.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(userSearchQuery) ||
        user.tg_id?.toString().includes(userSearchQuery) ||
        user.email?.toLowerCase().includes(searchLower)
      )
    })
  }, [allUsers, userSearchQuery])

  React.useEffect(() => {
    fetchMessageBatches()
    return () => fetchMessageBatches.cancel()
  }, [fetchMessageBatches])

  React.useEffect(() => {
    if (createDrawerOpen) {
      setUserSearchQuery("")
      fetchUsers()
    }
  }, [createDrawerOpen, fetchUsers])

  React.useEffect(() => {
    if (createDrawerOpen && userSearchQuery) {
      fetchUsers(userSearchQuery)
    }
    return () => fetchUsers.cancel()
  }, [userSearchQuery, createDrawerOpen, fetchUsers])

  const handleSubmit = async (formData: MessageFormData) => {
    try {
      const response = await api.post("/tg-messages", formData);
      
      console.log('Submit response:', response.data);
      
      toast.success("Отправка сообщения успешно начата");
      setCreateDrawerOpen(false);
      form.reset();
      fetchMessageBatches();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Ошибка при отправке сообщения";
      toast.error(errorMessage);
    }
  }

  const handleView = async (batch: MessageBatch) => {
    console.log('Viewing batch:', batch);
    setViewingBatch(batch)
    try {
      const response = await api.get(`/tg-messages/${batch.id}`)
      if (response.data.status === 'success') {
        setBatchDetails(response.data.data)
        // API dan kelgan yangilangan batch ma'lumotini viewingBatch ga ham o'rnatish
        if (response.data.data.batch) {
          setViewingBatch(response.data.data.batch)
        }
      }
    } catch (err) {
      console.error('Error fetching batch details:', err);
      toast.error("Ошибка при получении деталей пакета")
    }
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setCreateDrawerOpen(true)
  }

  // Global handlers ni set qilish
  React.useEffect(() => {
    globalHandleView = handleView;
  }, [handleView]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск сообщений..."
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">В ожидании</SelectItem>
              <SelectItem value="processing">В обработке</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
              <SelectItem value="failed">Неудачно</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                Колонки
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
                    {column.id === "message" ? "Сообщение" : 
                     column.id === "stats" ? "Получатели" :
                     column.id === "creator" ? "Создано" :
                     column.id.charAt(0).toUpperCase() + column.id.slice(1).replace('_', ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAdd}>
            <IconPlus className="mr-2 h-4 w-4" />
            Отправить сообщение
          </Button>
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
                  Пакеты сообщений не найдены.
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
                {[10, 15, 20, 30, 50].map((size) => (
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

      {/* View Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Детали пакета сообщений</DrawerTitle>
            <DrawerDescription>Просмотр информации о пакете сообщений и получателях.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {viewingBatch && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID пакета</Label>
                    <p className="font-mono">#{viewingBatch.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Статус</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={viewingBatch.status === "completed" ? "default" : "secondary"}>
                        {viewingBatch.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Создано</Label>
                    <p>{viewingBatch.creator?.username || "Неизвестно"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Дата создания</Label>
                    <p>{new Date(viewingBatch.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Сообщение</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="whitespace-pre-wrap">{viewingBatch.message}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Статистика доставки</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <div className="text-center p-3 bg-muted rounded-md">
                      <div className="text-2xl font-bold">{viewingBatch.stats.total}</div>
                      <div className="text-sm text-muted-foreground">Всего</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-md">
                      <div className="text-2xl font-bold text-green-600">{viewingBatch.stats.success}</div>
                      <div className="text-sm text-muted-foreground">Успешно</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-md">
                      <div className="text-2xl font-bold text-red-600">{viewingBatch.stats.failed}</div>
                      <div className="text-sm text-muted-foreground">Неудачно</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-md">
                      <div className="text-2xl font-bold text-yellow-600">{viewingBatch.stats.pending}</div>
                      <div className="text-sm text-muted-foreground">В ожидании</div>
                    </div>
                  </div>
                </div>

                {batchDetails?.users && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Получатели ({batchDetails.users.length})</Label>
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                      {batchDetails.users.map((user: any) => (
                        <div key={user.id} className="p-2 border-b last:border-b-0 flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <IconUsers className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{user.username || `Пользователь ${user.tg_id}`}</div>
                            <div className="text-xs text-muted-foreground">
                              TG ID: {user.tg_id} • {user.phone || user.address || "Нет контактов"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Закрыть</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Create Message Drawer */}
      <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Отправить сообщение в Telegram</DrawerTitle>
            <DrawerDescription>Создайте и отправьте сообщение выбранным пользователям или всем пользователям.</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Label htmlFor="message">Сообщение *</Label>
              <Textarea 
                id="message" 
                {...form.register("message")} 
                placeholder="Введите ваше сообщение..."
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {form.formState.errors.message && (
                    <span className="text-destructive">{form.formState.errors.message.message}</span>
                  )}
                </span>
                <span>{form.watch("message")?.length || 0}/4096</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex flex-col gap-1">
                <Label htmlFor="send_to_all">Отправить всем пользователям</Label>
                <p className="text-sm text-muted-foreground">
                  Отправить это сообщение всем зарегистрированным пользователям
                </p>
              </div>
              <Switch
                id="send_to_all"
                checked={form.watch("send_to_all")}
                onCheckedChange={(checked) => form.setValue("send_to_all", checked)}
              />
            </div>

            {!form.watch("send_to_all") && (
              <div className="flex flex-col gap-2">
                <Label>Выбрать получателей</Label>
                <div className="relative">
                  <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск пользователей..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-8 mb-2"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {loadingUsers ? (
                    <div className="text-center text-muted-foreground py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Поиск пользователей...
                      </div>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={form.watch("tg_ids")?.includes(user.tg_id) || false}
                          onCheckedChange={(checked) => {
                            const currentIds = form.watch("tg_ids") || [];
                            if (checked) {
                              form.setValue("tg_ids", [...currentIds, user.tg_id]);
                            } else {
                              form.setValue("tg_ids", currentIds.filter(id => id !== user.tg_id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          <div>{user.username || user.name || `Пользователь ${user.tg_id}`}</div>
                          <div className="text-xs text-muted-foreground">
                            TG ID: {user.tg_id} • {user.phone || user.email || "Нет контакта"}
                          </div>
                        </label>
                      </div>
                    ))
                  ) : userSearchQuery ? (
                    <div className="text-center text-muted-foreground py-4">
                      Пользователи по запросу "{userSearchQuery}" не найдены
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      Пользователи не найдены
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{form.watch("tg_ids")?.length || 0} выбрано</span>
                  <span>{filteredUsers.length} из {allUsers.length} пользователей</span>
                </div>
                {!form.watch("send_to_all") && (!form.watch("tg_ids") || form.watch("tg_ids")?.length === 0) && (
                  <p className="text-destructive text-sm">Пожалуйста, выберите хотя бы одного получателя или включите "Отправить всем пользователям"</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
              <IconSend className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">Готово к отправке</div>
                <div className="text-blue-600">
                  {form.watch("send_to_all") 
                    ? `Сообщение будет отправлено всем ${allUsers.length} пользователям`
                    : `Сообщение будет отправлено ${form.watch("tg_ids")?.length || 0} выбранным пользователям`
                  }
                </div>
              </div>
            </div>
          </form>
          <DrawerFooter>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(handleSubmit)} 
              disabled={loading || (!form.watch("send_to_all") && (!form.watch("tg_ids") || form.watch("tg_ids")?.length === 0))}
            >
              <IconSend className="mr-2 h-4 w-4" />
              Отправить сообщение
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