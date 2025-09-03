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
import { zodResolver } from "@hookform/resolvers/zod"
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
import { NumericFormat } from 'react-number-format';

import { Skeleton } from "@/components/ui/skeleton"

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
  IconDiscount,
  IconCalendar,
  IconClock,
  IconUsers,
} from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"
import PricePipe from "@/lib/price"
import { cn } from "@/lib/utils"

// Promocode schema
const promocodeSchema = z.object({
  id: z.number().optional(),
  promocode: z.string().min(1, "Промокод обязателен"),
  amount: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  status: z.enum(["active", "archive"]).optional(),
  type: z.enum(["countable", "fixed-term"]),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  countable: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return val;
  }).optional().nullable(),
  used_count: z.number().optional(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

const promocodeFormSchema = promocodeSchema.extend({
  promocode: z.string().min(1, "Промокод обязателен").min(3, "Промокод должен содержать минимум 3 символа"),
  amount: z.number().min(0, "Сумма должна быть не менее 0"),
  countable: z.number().min(1, "Количество использований должно быть не менее 1").optional().nullable(),
})

// Laravel pagination response schema
const promocodeApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    current_page: z.number(),
    data: z.array(promocodeSchema),
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

type Promocode = z.infer<typeof promocodeSchema>
type PromocodeFormData = z.infer<typeof promocodeFormSchema>
// type PromocodeApiResponse = z.infer<typeof promocodeApiResponseSchema>

// Global handlers for edit and delete
let globalHandleEdit: (promocode: Promocode) => void = () => {};
let globalHandleDelete: (id: number) => void = () => {};

const columns: ColumnDef<Promocode>[] = [
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
    accessorKey: "promocode",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Промокод
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md border flex items-center justify-center">
          <IconDiscount className="h-4 w-4 text-white" />
        </div>
        <div className="font-mono font-semibold text-purple-600 max-w-[200px] truncate" title={row.original.promocode}>
          {row.original.promocode}
        </div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Сумма
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-semibold text-green-600">
        <PricePipe value={typeof row.original.amount === 'string' ? parseFloat(row.original.amount).toFixed(0) : row.original.amount.toFixed(0)} suffix="₽" />
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "type",
    header: "Тип",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <div className="flex items-center gap-1">
          {type === "countable" ? <IconUsers className="h-4 w-4" /> : <IconCalendar className="h-4 w-4" />}
          <Badge variant={type === "countable" ? "default" : "secondary"} className="capitalize">
            {type === "countable" ? "Количественный" : "Срочный"}
          </Badge>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "usage",
    header: "Использование",
    cell: ({ row }) => {
      const { type, countable, used_count = 0, start_date, end_date } = row.original;
      
      if (type === "countable") {
        return (
          <div className="text-sm">
            <div className="font-medium"><PricePipe value={used_count} suffix="" /> / <PricePipe value={countable || 0} suffix="" /></div>
            <div className="text-muted-foreground">использовано</div>
          </div>
        );
      } else {
        const now = new Date();
        const start = start_date ? new Date(start_date) : null;
        const end = end_date ? new Date(end_date) : null;
        
        let status = "Активен";
        let color = "text-green-600";
        
        if (start && now < start) {
          status = "Не начат";
          color = "text-yellow-600";
        } else if (end && now > end) {
          status = "Истек";
          color = "text-red-600";
        }
        
        return (
          <div className="text-sm">
            <div className={`font-medium ${color}`}>{status}</div>
            <div className="text-muted-foreground">
              {start_date ? new Date(start_date).toLocaleDateString() : 'Без начала'} - {end_date ? new Date(end_date).toLocaleDateString() : 'Без окончания'}
            </div>
          </div>
        );
      }
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = status === "active" ? "default" : "secondary";
      
      return (
        <Badge variant={variant} className="capitalize">
          {status === "active" ? "Активен" : "Архив"}
        </Badge>
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
          <DropdownMenuItem onClick={() => globalHandleEdit(row.original)}>
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => globalHandleDelete(row.original.id!)}
          >
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function PromocodeDataTable() {
  const [data, setData] = React.useState<Promocode[]>([])
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
  const [editingPromocode, setEditingPromocode] = React.useState<Promocode | null>(null)
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

  const form = useForm<PromocodeFormData>({
    resolver: zodResolver(promocodeFormSchema),
    defaultValues: {
      promocode: "",
      amount: 0,
      status: "active",
      type: "countable",
      start_date: "",
      end_date: "",
      countable: 1,
    },
  })

  const selectedType = form.watch("type")

  React.useEffect(() => {
    if (editingPromocode) {
      form.reset({
        ...editingPromocode,
        start_date: editingPromocode.start_date ? new Date(editingPromocode.start_date).toISOString().split('T')[0] : "",
        end_date: editingPromocode.end_date ? new Date(editingPromocode.end_date).toISOString().split('T')[0] : "",
      })
    } else {
      form.reset({
        promocode: "",
        amount: 0,
        status: "active",
        type: "countable",
        start_date: "",
        end_date: "",
        countable: 1,
      })
    }
  }, [editingPromocode, form])

  const fetchPromocodes = React.useCallback(
    debounce(async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching promocodes...');
        
        const sort = sorting[0]
        const statusFilter = columnFilters.find((f) => f.id === "status")?.value as string | undefined
        const typeFilter = columnFilters.find((f) => f.id === "type")?.value as string | undefined

        const params = {
          per_page: pagination.pageSize,
          page: pagination.pageIndex + 1,
          search: globalFilter || undefined,
          status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
          sort_by: sort?.id || "id",
          sort_order: sort?.desc ? "desc" : "asc",
        }

        console.log('Request params:', params);

        const response = await api.get("/promocodes", { params })
        console.log('API Response:', response.data);
        
        const parsed = promocodeApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          console.error('Schema validation error:', parsed.error);
          throw new Error(`Неверный ответ API: ${parsed.error.message}`)
        }
        
        if (parsed.data.success) {
          console.log('Promocodes data:', parsed.data.data.data);
          setData(parsed.data.data.data)
          setTotalRows(parsed.data.data.total)
          setPageCount(parsed.data.data.last_page)
        } else {
          throw new Error("API вернул success: false")
        }
      } catch (err: any) {
        console.error('Error fetching promocodes:', err);
        setError(err.message || "Ошибка загрузки промокодов")
        toast.error(err.message || "Ошибка загрузки промокодов")
        setData([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [sorting, columnFilters, globalFilter, pagination.pageSize, pagination.pageIndex]
  )

  React.useEffect(() => {
    fetchPromocodes()
    return () => fetchPromocodes.cancel()
  }, [fetchPromocodes])

  const handleSubmit = async (formData: PromocodeFormData) => {
    try {
      // Clean up the data before sending
      const submitData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        countable: formData.type === "countable" ? formData.countable : null,
      }

      let response;
      if (editingPromocode?.id) {
        response = await api.put(`/promocodes/${editingPromocode.id}`, submitData);
      } else {
        response = await api.post("/promocodes", submitData);
      }
      
      console.log('Submit response:', response.data);
      
      toast.success(editingPromocode ? "Промокод успешно обновлен" : "Промокод успешно создан");
      setDrawerOpen(false);
      setEditingPromocode(null);
      fetchPromocodes();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Ошибка сохранения промокода";
      toast.error(errorMessage);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот промокод?")) return
    try {
      const response = await api.delete(`/promocodes/${id}`)
      console.log('Delete response:', response.data);
      toast.success("Промокод успешно удален")
      fetchPromocodes()
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || "Ошибка удаления промокода"
      toast.error(errorMessage)
    }
  }

  const handleEdit = (promocode: Promocode) => {
    console.log('Editing promocode:', promocode);
    setEditingPromocode(promocode)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditingPromocode(null)
    setDrawerOpen(true)
  }

  // Global handlers ni set qilish
  React.useEffect(() => {
    globalHandleEdit = handleEdit;
    globalHandleDelete = handleDelete;
  }, [handleEdit, handleDelete]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск промокодов..."
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
              <SelectItem value="active">Активен</SelectItem>
              <SelectItem value="archive">Архив</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={(columnFilters.find((f) => f.id === "type")?.value as string) ?? "all"}
            onValueChange={(value) =>
              setColumnFilters((prev) => [
                ...prev.filter((f) => f.id !== "type"),
                ...(value !== "all" ? [{ id: "type", value }] : []),
              ])
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="countable">Количественный</SelectItem>
              <SelectItem value="fixed-term">Срочный</SelectItem>
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
                    {column.id === "promocode" ? "Промокод" : 
                     column.id === "created_at" ? "Дата создания" :
                     column.id === "amount" ? "Сумма" :
                     column.id === "type" ? "Тип" :
                     column.id === "usage" ? "Использование" :
                     column.id === "status" ? "Статус" :
                     column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAdd}>
            <IconPlus className="mr-2 h-4 w-4" />
            Добавить промокод
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
                  onClick={() => handleEdit(row.original)}
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
                  Промокоды не найдены.
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

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingPromocode ? "Редактировать промокод" : "Создать промокод"}</DrawerTitle>
            <DrawerDescription>Заполните данные промокода ниже.</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promocode">Промокод *</Label>
              <Input 
                id="promocode" 
                {...form.register("promocode")} 
                placeholder="Введите промокод (например, SAVE20, WELCOME)" 
                className="uppercase"
                style={{ textTransform: 'uppercase' }}
              />
              {form.formState.errors.promocode && (
                <p className="text-destructive text-sm">{form.formState.errors.promocode.message}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Сумма *</Label>
              <NumericFormat
                  value={form.watch("amount")}
                  thousandSeparator=" "
                  decimalSeparator="."
                  decimalScale={2}
                  allowNegative={false}
                  placeholder="0.00"
                  onValueChange={(values) => {
                    form.setValue("amount", values.floatValue ?? 0);
                  }}
                  className={cn(
                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                  )}
                />
              {form.formState.errors.amount && (
                <p className="text-destructive text-sm">{form.formState.errors.amount.message}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Тип *</Label>
              <Select
                onValueChange={(value) => form.setValue("type", value as "countable" | "fixed-term")}
                value={form.watch("type")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="countable">
                    <div className="flex items-center gap-2">
                      <IconUsers className="h-4 w-4" />
                      <span>Количественный</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed-term">
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4" />
                      <span>Срочный</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-destructive text-sm">{form.formState.errors.type.message}</p>
              )}
            </div>

            {/* Conditional fields based on type */}
            {selectedType === "countable" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="countable">Лимит использований *</Label>
                <NumericFormat
                  value={form.watch("countable")}
                  thousandSeparator=" "
                  decimalSeparator="."
                  decimalScale={2}
                  allowNegative={false}
                  placeholder="Введите лимит использований (например, 100)"
                  onValueChange={(values) => {
                    form.setValue("countable", values.floatValue ?? 0);
                  }}
                  className={cn(
                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                  )}
                />
                {form.formState.errors.countable && (
                  <p className="text-destructive text-sm">{form.formState.errors.countable.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Количество раз, которое можно использовать этот промокод
                </p>
              </div>
            )}

            {selectedType === "fixed-term" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="start_date">Дата начала</Label>
                  <Input 
                    id="start_date" 
                    type="date"
                    {...form.register("start_date")} 
                  />
                  {form.formState.errors.start_date && (
                    <p className="text-destructive text-sm">{form.formState.errors.start_date.message}</p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="end_date">Дата окончания</Label>
                  <Input 
                    id="end_date" 
                    type="date"
                    {...form.register("end_date")} 
                  />
                  {form.formState.errors.end_date && (
                    <p className="text-destructive text-sm">{form.formState.errors.end_date.message}</p>
                  )}
                </div>
              </>
            )}
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                onValueChange={(value) => form.setValue("status", value as "active" | "archive")}
                value={form.watch("status")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Активен</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="archive">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span>Архив</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info section based on type */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">
                    {selectedType === "countable" ? "Количественный тип" : "Срочный тип"}
                  </p>
                  <p>
                    {selectedType === "countable" 
                      ? "Этот промокод будет действителен до достижения лимита использований."
                      : "Этот промокод будет действителен между указанными датами начала и окончания."
                    }
                  </p>
                </div>
              </div>
            </div>
          </form>
          <DrawerFooter>
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
              {editingPromocode ? "Обновить промокод" : "Создать промокод"}
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