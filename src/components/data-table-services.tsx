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
  IconTools,
} from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"

// Service schema
const serviceSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Имя обязательно"),
  price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  status: z.enum(["active", "archive"]).optional(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

const serviceFormSchema = serviceSchema.extend({
  name: z.string().min(1, "Имя обязательно"),
  price: z.number().min(0, "Цена должна быть не менее 0"), // Form uchun number qoladi
})

// Laravel pagination response schema
const serviceApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    current_page: z.number(),
    data: z.array(serviceSchema),
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

type Service = z.infer<typeof serviceSchema>
type ServiceFormData = z.infer<typeof serviceFormSchema>
// type ServiceApiResponse = z.infer<typeof serviceApiResponseSchema>

// Global handlers for edit and delete
let globalHandleEdit: (service: Service) => void = () => {};
let globalHandleDelete: (id: number) => void = () => {};

const columns: ColumnDef<Service>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Название услуги
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-muted rounded-md border flex items-center justify-center">
          <IconTools className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-medium max-w-[250px] truncate" title={row.original.name}>
          {row.original.name}
        </div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Цена
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium text-green-600">
        {typeof row.original.price === 'string' ? parseFloat(row.original.price).toFixed(0) : row.original.price.toFixed(0)} ₽
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = status === "active" ? "default" : "secondary";
      
      return (
        <Badge variant={variant} className="capitalize">
          {status}
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

export function ServiceDataTable() {
  const [data, setData] = React.useState<Service[]>([])
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
  const [editingService, setEditingService] = React.useState<Service | null>(null)
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

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      status: "active",
    },
  })

  React.useEffect(() => {
    if (editingService) {
      form.reset({
        ...editingService,
      })
    } else {
      form.reset({
        name: "",
        price: 0,
        status: "active",
      })
    }
  }, [editingService, form])

  const fetchServices = React.useCallback(
    debounce(async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching services...');
        
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

        console.log('Request params:', params);

        const response = await api.get("/services", { params })
        console.log('API Response:', response.data);
        
        const parsed = serviceApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          console.error('Schema validation error:', parsed.error);
          throw new Error(`Неверный ответ API: ${parsed.error.message}`)
        }
        
        if (parsed.data.success) {
          console.log('Services data:', parsed.data.data.data);
          setData(parsed.data.data.data)
          setTotalRows(parsed.data.data.total)
          setPageCount(parsed.data.data.last_page)
        } else {
          throw new Error("API вернул success: false")
        }
      } catch (err: any) {
        console.error('Error fetching services:', err);
        setError(err.message || "Ошибка загрузки услуг")
        toast.error(err.message || "Ошибка загрузки услуг")
        setData([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [sorting, columnFilters, globalFilter, pagination.pageSize, pagination.pageIndex]
  )

  React.useEffect(() => {
    fetchServices()
    return () => fetchServices.cancel()
  }, [fetchServices])

  const handleSubmit = async (formData: ServiceFormData) => {
    try {
      let response;
      if (editingService?.id) {
        response = await api.put(`/services/${editingService.id}`, formData);
      } else {
        response = await api.post("/services", formData);
      }
      
      console.log('Submit response:', response.data);
      
      toast.success(editingService ? "Услуга успешно обновлена" : "Услуга успешно создана");
      setDrawerOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Ошибка сохранения услуги";
      toast.error(errorMessage);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту услугу?")) return
    try {
      const response = await api.delete(`/services/${id}`)
      console.log('Delete response:', response.data);
      toast.success("Услуга успешно удалена")
      fetchServices()
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || "Ошибка удаления услуги"
      toast.error(errorMessage)
    }
  }

  const handleEdit = (service: Service) => {
    console.log('Editing service:', service);
    setEditingService(service)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditingService(null)
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
              placeholder="Поиск услуг..."
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
                    {column.id === "name" ? "Название услуги" : column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAdd}>
            <IconPlus className="mr-2 h-4 w-4" />
            Добавить услугу
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
                  Услуги не найдены.
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
            <DrawerTitle>{editingService ? "Редактировать услугу" : "Создать услугу"}</DrawerTitle>
            <DrawerDescription>Заполните данные услуги ниже.</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Название услуги *</Label>
              <Input id="name" {...form.register("name")} placeholder="Введите название услуги" />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Цена *</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                {...form.register("price", { valueAsNumber: true })} 
                placeholder="0.00" 
              />
              {form.formState.errors.price && (
                <p className="text-destructive text-sm">{form.formState.errors.price.message}</p>
              )}
            </div>
            
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
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="archive">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <DrawerFooter>
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
              {editingService ? "Обновить услугу" : "Создать услугу"}
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