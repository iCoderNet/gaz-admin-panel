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
  IconPhoto,
  IconX,
} from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"
import PricePipe from "@/lib/price"
import { NumericFormat } from "react-number-format"
import { cn } from "@/lib/utils"

// Accessory schema
const accessorySchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Заголовок обязателен"),
  description: z.string().optional().nullable(),
  price: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }),
  image: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(), // Laravel dan qo'shimcha field kelishi mumkin
  status: z.enum(["active", "archive"]).optional(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

const accessoryFormSchema = accessorySchema.extend({
  price: z.number().min(0, "Цена должна быть не менее 0"), // Form uchun number qoladi
  image_file: z.any().optional(), // File input uchun
})

// Laravel pagination response schema
const accessoryApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    current_page: z.number(),
    data: z.array(accessorySchema),
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

type Accessory = z.infer<typeof accessorySchema>
type AccessoryFormData = z.infer<typeof accessoryFormSchema>
// type AccessoryApiResponse = z.infer<typeof accessoryApiResponseSchema>

// Global handlers for edit and delete
let globalHandleEdit: (accessory: Accessory) => void = () => {};
let globalHandleDelete: (id: number) => void = () => {};

const columns: ColumnDef<Accessory>[] = [
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
    accessorKey: "image",
    header: "Изображение",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.original.image ? (
          <img
            src={row.original.image_url || `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${row.original.image}`}
            alt={row.original.title}
            className="w-12 h-12 object-cover rounded-md border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded-md border flex items-center justify-center">
            <IconPhoto className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        {row.original.image && (
          <div className="w-12 h-12 bg-muted rounded-md border items-center justify-center hidden">
            <IconPhoto className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Название
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium max-w-[200px] truncate" title={row.original.title}>
        {row.original.title}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "description",
    header: "Описание",
    cell: ({ row }) => (
      <div className="max-w-[250px] truncate text-muted-foreground" title={row.original.description || ""}>
        {row.original.description || "Н/Д"}
      </div>
    ),
    enableSorting: false,
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
      <div className="font-medium">
        <PricePipe value={typeof row.original.price === 'string' ? parseFloat(row.original.price).toFixed(0) : row.original.price.toFixed(0)} suffix="₽" />
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
      const statusText = status === "active" ? "активный" : "архив";
      
      return (
        <Badge variant={variant} className="capitalize">
          {statusText}
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
        Создано
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
            onClick={(e) => {e.stopPropagation(); globalHandleDelete(row.original.id!)}}
          >
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function AccessoryDataTable() {
  const [data, setData] = React.useState<Accessory[]>([])
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
  const [editingAccessory, setEditingAccessory] = React.useState<Accessory | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
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

  const form = useForm<AccessoryFormData>({
    resolver: zodResolver(accessoryFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      status: "active",
    },
  })

  React.useEffect(() => {
    if (editingAccessory) {
      form.reset({
        ...editingAccessory,
        description: editingAccessory.description || "",
      })
      // Mavjud rasm uchun preview
      if (editingAccessory.image) {
        const imageUrl = editingAccessory.image_url || `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${editingAccessory.image}`;
        setImagePreview(imageUrl);
      } else {
        setImagePreview(null);
      }
    } else {
      form.reset({
        title: "",
        description: "",
        price: 0,
        status: "active",
      })
      setImagePreview(null);
    }
  }, [editingAccessory, form])

  const fetchAccessories = React.useCallback(
    debounce(async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching accessories...');
        
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

        const response = await api.get("/accessories", { params })
        console.log('API Response:', response.data);
        
        const parsed = accessoryApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          console.error('Schema validation error:', parsed.error);
          throw new Error(`Неверный ответ API: ${parsed.error.message}`)
        }
        
        if (parsed.data.success) {
          console.log('Accessories data:', parsed.data.data.data);
          setData(parsed.data.data.data)
          setTotalRows(parsed.data.data.total)
          setPageCount(parsed.data.data.last_page)
        } else {
          throw new Error("API вернул success: false")
        }
      } catch (err: any) {
        console.error('Error fetching accessories:', err);
        setError(err.message || "Ошибка получения аксессуаров")
        toast.error(err.message || "Ошибка получения аксессуаров")
        setData([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [sorting, columnFilters, globalFilter, pagination.pageSize, pagination.pageIndex]
  )

  React.useEffect(() => {
    fetchAccessories()
    return () => fetchAccessories.cancel()
  }, [fetchAccessories])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size check (30MB = 30 * 1024 * 1024 bytes)
      if (file.size > 30 * 1024 * 1024) {
        toast.error("Размер файла должен быть менее 30МБ");
        return;
      }
      
      // File type check
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Недопустимый тип файла. Разрешены только JPEG, PNG, JPG, GIF, WEBP, BMP, TIFF, SVG.");
        return;
      }

      form.setValue("image_file", file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue("image_file", undefined);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (formData: AccessoryFormData) => {
    try {
      const submitData = new FormData();
      
      submitData.append("title", formData.title);
      submitData.append("description", formData.description || "");
      submitData.append("price", formData.price.toString());
      submitData.append("status", formData.status || "active");
      
      if (formData.image_file) {
        submitData.append("image", formData.image_file);
      }

      let response;
      if (editingAccessory?.id) {
        // Laravel da PUT request FormData bilan muammo qiladi, shuning uchun POST + _method ishlatamiz
        submitData.append("_method", "PUT");
        response = await api.post(`/accessories/${editingAccessory.id}`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await api.post("/accessories", submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      console.log('Submit response:', response.data);
      
      toast.success(editingAccessory ? "Аксессуар успешно обновлен" : "Аксессуар успешно создан");
      setDrawerOpen(false);
      setEditingAccessory(null);
      setImagePreview(null);
      fetchAccessories();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Ошибка сохранения аксессуара";
      toast.error(errorMessage);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот аксессуар?")) return
    try {
      const response = await api.delete(`/accessories/${id}`)
      console.log('Delete response:', response.data);
      toast.success("Аксессуар успешно удален")
      fetchAccessories()
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || "Ошибка удаления аксессуара"
      toast.error(errorMessage)
    }
  }

  const handleEdit = (accessory: Accessory) => {
    console.log('Editing accessory:', accessory);
    setEditingAccessory(accessory)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditingAccessory(null)
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
              placeholder="Поиск аксессуаров..."
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
              <SelectItem value="active">Активный</SelectItem>
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
                .map((column) => {
                  const columnLabels: Record<string, string> = {
                    image: "Изображение",
                    title: "Название",
                    description: "Описание",
                    price: "Цена",
                    status: "Статус",
                    created_at: "Создано"
                  };
                  
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {columnLabels[column.id] || column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAdd}>
            <IconPlus className="mr-2 h-4 w-4" />
            Добавить аксессуар
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
                  Аксессуары не найдены.
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

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingAccessory ? "Редактировать аксессуар" : "Создать аксессуар"}</DrawerTitle>
            <DrawerDescription>Заполните детали аксессуара ниже.</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Название *</Label>
              <Input id="title" {...form.register("title")} placeholder="Название аксессуара" />
              {form.formState.errors.title && (
                <p className="text-destructive text-sm">{form.formState.errors.title.message}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea 
                id="description"
                {...form.register("description")} 
                placeholder="Accessory description" 
                rows={3}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Цена *</Label>
              <NumericFormat
                value={form.watch("price")}
                thousandSeparator=" "
                decimalSeparator="."
                decimalScale={2}
                allowNegative={false}
                placeholder="0"
                onValueChange={(values) => {
                  form.setValue("price", values.floatValue ?? 0);
                }}
                className={cn(
                  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                )}
              />
              {form.formState.errors.price && (
                <p className="text-destructive text-sm">{form.formState.errors.price.message}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="image">Изображение</Label>
              <Input 
                id="image" 
                type="file" 
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml"
                onChange={handleImageChange}
              />
              <p className="text-xs text-muted-foreground">
                Максимальный размер: 30 МБ. Форматы: JPEG, PNG, JPG, GIF, WEBP, BMP, TIFF, SVG.
              </p>
              {imagePreview && (
                <div className="relative inline-block max-w-xs">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <IconX className="h-3 w-3" />
                  </Button>
                </div>
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
                  <SelectItem value="active">Активный</SelectItem>
                  <SelectItem value="archive">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
          <DrawerFooter>
            <Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={loading}>
              {editingAccessory ? "Update Accessory" : "Create Accessory"}
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