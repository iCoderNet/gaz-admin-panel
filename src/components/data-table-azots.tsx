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
import { useForm, useFieldArray } from "react-hook-form"
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
  IconPlus,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconTrash,
  IconPhoto,
  IconCurrencyDollar,
  IconWorldWww,
  IconTag,
  IconX
} from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"

// Price Type schema
const priceTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Название обязательно"),
  price: z.coerce.number().min(0, "Цена должна быть положительной"),
})

// Azot schema
const azotSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Заголовок обязателен"),
  type: z.string().min(1, "Тип обязателен"),
  image: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  country: z.string().min(1, "Страна обязательна"),
  status: z.enum(["active", "archive"]).optional(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  price_types: z.array(priceTypeSchema).optional().default([]),
})

const azotFormSchema = azotSchema.extend({
  image_file: z.any().optional(), // File input uchun
})

// Laravel pagination response schema
const azotApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    current_page: z.number(),
    data: z.array(azotSchema),
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

// type PriceType = z.infer<typeof priceTypeSchema>
type Azot = z.infer<typeof azotSchema>
type AzotFormData = z.infer<typeof azotFormSchema>
// type AzotApiResponse = z.infer<typeof azotApiResponseSchema>

// Global handlers for edit and delete
let globalHandleEdit: (azot: Azot) => void = () => {};
let globalHandleDelete: (id: number) => void = () => {};

const columns: ColumnDef<Azot>[] = [
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
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
        {row.original.image ? (
          <img 
            src={row.original.image_url || undefined} 
            alt={row.original.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <IconPhoto className="w-6 h-6 text-muted-foreground" />
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
      <div className="font-medium max-w-[200px]">
        <div className="truncate">{row.original.title}</div>
        {row.original.description && (
          <div className="text-xs text-muted-foreground truncate">
            {row.original.description}
          </div>
        )}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <IconTag className="mr-1 h-4 w-4" />
        Тип
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.type}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "country",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <IconWorldWww className="mr-1 h-4 w-4" />
        Страна
        {column.getIsSorted() === "asc" ? <IconChevronUp className="ml-2 h-4 w-4" /> : null}
        {column.getIsSorted() === "desc" ? <IconChevronDown className="ml-2 h-4 w-4" /> : null}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.country}</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "price_types",
    header: () => (
      <div className="flex items-center gap-1">
        <IconCurrencyDollar className="h-4 w-4" />
        Цены
      </div>
    ),
    cell: ({ row }) => {
      const priceTypes = row.original.price_types || [];
      return (
        <div className="max-w-[150px]">
          {priceTypes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {priceTypes.slice(0, 2).map((pt, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {pt.name}: {pt.price} ₽
                </Badge>
              ))}
              {priceTypes.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{priceTypes.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Нет цен</span>
          )}
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
      let variant: "default" | "secondary" = "secondary";
      
      if (status === "active") variant = "default";
      
      const statusText = status === "active" ? "активный" : "архив";
      
      return (
        <Badge variant={variant} className="capitalize">
          {statusText}
        </Badge>
      );
    },
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
            onClick={() => globalHandleDelete(row.original.id!)}
          >
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function AzotDataTable() {
  const [data, setData] = React.useState<Azot[]>([])
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
  const [editingAzot, setEditingAzot] = React.useState<Azot | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
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

  const form = useForm<AzotFormData>({
    // resolver: zodResolver(azotFormSchema),
    defaultValues: {
      title: "",
      type: "",
      description: "",
      country: "",
      status: "active",
      price_types: [],
    },
  })

  const { fields: priceTypeFields, append: appendPriceType, remove: removePriceType } = useFieldArray({
    control: form.control,
    name: "price_types",
  })

  React.useEffect(() => {
    if (editingAzot) {
      form.reset({
        ...editingAzot,
        price_types: editingAzot.price_types || [],
      })
      setImagePreview(editingAzot.image ? editingAzot.image_url || null : null)
    } else {
      form.reset({
        title: "",
        type: "",
        description: "",
        country: "",
        status: "active",
        price_types: [],
      })
      setImagePreview(null)
    }
  }, [editingAzot, form])

  const fetchAzots = React.useCallback(
    debounce(async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching azots...');
        
        const sort = sorting[0]
        const typeFilter = columnFilters.find((f) => f.id === "type")?.value as string | undefined
        const countryFilter = columnFilters.find((f) => f.id === "country")?.value as string | undefined
        const statusFilter = columnFilters.find((f) => f.id === "status")?.value as string | undefined

        const params = {
          per_page: pagination.pageSize,
          page: pagination.pageIndex + 1,
          search: globalFilter || undefined,
          type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
          country: countryFilter && countryFilter !== "all" ? countryFilter : undefined,
          status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
          sort_by: sort?.id || "id",
          sort_order: sort?.desc ? "desc" : "asc",
        }

        console.log('Request params:', params);

        const response = await api.get("/azots", { params })
        console.log('API Response:', response.data);
        
        const parsed = azotApiResponseSchema.safeParse(response.data)
        
        if (!parsed.success) {
          console.error('Schema validation error:', parsed.error);
          throw new Error(`Неверный ответ API: ${parsed.error.message}`)
        }
        
        if (parsed.data.success) {
          console.log('Azots data:', parsed.data.data.data);
          setData(parsed.data.data.data)
          setTotalRows(parsed.data.data.total)
          setPageCount(parsed.data.data.last_page)
        } else {
          throw new Error("API вернул success: false")
        }
      } catch (err: any) {
        console.error('Error fetching azots:', err);
        setError(err.message || "Ошибка получения данных азота")
        toast.error(err.message || "Ошибка получения данных азота")
        setData([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [sorting, columnFilters, globalFilter, pagination.pageSize, pagination.pageIndex]
  )

  React.useEffect(() => {
    fetchAzots()
    return () => fetchAzots.cancel()
  }, [fetchAzots])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
      form.setValue("image_file", file)
    }
  }

  const handleSubmit = async (formData: AzotFormData) => {
    try {
      const submitData = new FormData()
      
      // Basic fields
      submitData.append("title", formData.title)
      submitData.append("type", formData.type)
      submitData.append("country", formData.country)
      submitData.append("status", formData.status || "active")
      
      if (formData.description) {
        submitData.append("description", formData.description)
      }

      // Image file
      if (formData.image_file) {
        submitData.append("image", formData.image_file)
      }

      // Price types
      if (formData.price_types && formData.price_types.length > 0) {
        formData.price_types.forEach((pt, index) => {
          if (pt.id) {
            submitData.append(`price_types[${index}][id]`, pt.id.toString())
          }
          submitData.append(`price_types[${index}][name]`, pt.name)
          submitData.append(`price_types[${index}][price]`, pt.price.toString())
        })
      }

      let response
      if (editingAzot?.id) {
        // FormData bilan PUT request uchun _method field qo'shamiz
        submitData.append("_method", "PUT")
        response = await api.post(`/azots/${editingAzot.id}`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        response = await api.post("/azots", submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }
      
      console.log('Submit response:', response.data);
      
      toast.success(editingAzot ? "Азот успешно обновлен" : "Азот успешно создан")
      setDrawerOpen(false)
      setEditingAzot(null)
      setImagePreview(null)
      fetchAzots()
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Ошибка сохранения азота"
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот азот?")) return
    try {
      const response = await api.delete(`/azots/${id}`)
      console.log('Delete response:', response.data);
      toast.success("Азот успешно удален")
      fetchAzots()
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || "Ошибка удаления азота"
      toast.error(errorMessage)
    }
  }

  const handleEdit = (azot: Azot) => {
    console.log('Editing azot:', azot);
    setEditingAzot(azot)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditingAzot(null)
    setDrawerOpen(true)
  }

  const addPriceType = () => {
    appendPriceType({ name: "", price: 0 })
  }

  const removePriceTypeHandler = (index: number) => {
    removePriceType(index)
  }

  // Global handlers ni set qilish
  React.useEffect(() => {
    globalHandleEdit = handleEdit;
    globalHandleDelete = handleDelete;
  }, [handleEdit, handleDelete]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск азота..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 md:w-64"
            />
          </div>
          {/* <Select
            value={(columnFilters.find((f) => f.id === "type")?.value as string) ?? "all"}
            onValueChange={(value) =>
              setColumnFilters((prev) => [
                ...prev.filter((f) => f.id !== "type"),
                ...(value !== "all" ? [{ id: "type", value }] : []),
              ])
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="fertilizer">Удобрение</SelectItem>
              <SelectItem value="supplement">Добавка</SelectItem>
            </SelectContent>
          </Select> */}
          <Select
            value={(columnFilters.find((f) => f.id === "country")?.value as string) ?? "all"}
            onValueChange={(value) =>
              setColumnFilters((prev) => [
                ...prev.filter((f) => f.id !== "country"),
                ...(value !== "all" ? [{ id: "country", value }] : []),
              ])
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Страна" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все страны</SelectItem>
              <SelectItem value="uzbekistan">Узбекистан</SelectItem>
              <SelectItem value="russia">Россия</SelectItem>
              <SelectItem value="china">Китай</SelectItem>
            </SelectContent>
          </Select>
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
                    type: "Тип",
                    country: "Страна",
                    price_types: "Цены",
                    status: "Статус",
                    created_at: "Создано"
                  };
                  
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {columnLabels[column.id] || column.id.charAt(0).toUpperCase() + column.id.slice(1).replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAdd}>
            <IconPlus className="mr-2 h-4 w-4" />
            Добавить азот
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
                  Азот не найден.
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
        <DrawerContent className="h-full max-h-screen">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              {editingAzot ? "Редактировать азот" : "Создать азот"}
              {editingAzot && <Badge variant="outline">ID: {editingAzot.id}</Badge>}
            </DrawerTitle>
            <DrawerDescription>Заполните детали азота ниже.</DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconTag className="h-5 w-5" />
                    Основная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Название *</Label>
                      <Input 
                        id="title" 
                        {...form.register("title")} 
                        placeholder="Название азотного удобрения"
                      />
                      {form.formState.errors.title && (
                        <p className="text-destructive text-sm">{form.formState.errors.title.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Тип *</Label>
                      <Input 
                        id="type" 
                        {...form.register("type")} 
                        placeholder="напр. Удобрение, Добавка"
                      />
                      {form.formState.errors.type && (
                        <p className="text-destructive text-sm">{form.formState.errors.type.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Страна *</Label>
                      <Input 
                        id="country" 
                        {...form.register("country")} 
                        placeholder="напр. Узбекистан, Россия"
                      />
                      {form.formState.errors.country && (
                        <p className="text-destructive text-sm">{form.formState.errors.country.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea 
                      id="description" 
                      {...form.register("description")} 
                      placeholder="Подробное описание азотного продукта..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconPhoto className="h-5 w-5" />
                    Изображение продукта
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image">Изображение</Label>
                    <Input 
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    <p className="text-xs text-muted-foreground">
                      Поддерживаемые форматы: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG (Макс: 30МБ)
                    </p>
                  </div>
                  
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Предварительный просмотр" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setImagePreview(null)
                          form.setValue("image_file", null)
                        }}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Типы цен
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Добавить различные типы цен для этого азотного продукта (например, Оптовая, Розничная, Крупный опт)
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {priceTypeFields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconCurrencyDollar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Типы цен еще не добавлены</p>
                      <p className="text-xs">Нажмите "Добавить тип цены" чтобы начать</p>
                    </div>
                  )}

                  {priceTypeFields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`price_types.${index}.name`}>
                              Название типа *
                            </Label>
                            <Input
                              {...form.register(`price_types.${index}.name`)}
                              placeholder="напр. Оптовая, Розничная, Крупный опт"
                            />
                            {form.formState.errors.price_types?.[index]?.name && (
                              <p className="text-destructive text-sm">
                                {form.formState.errors.price_types[index]?.name?.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`price_types.${index}.price`}>
                              Цена (руб) *
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"> ₽</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...form.register(`price_types.${index}.price`)}
                                placeholder="0.00"
                                className="pl-8"
                              />
                            </div>
                            {form.formState.errors.price_types?.[index]?.price && (
                              <p className="text-destructive text-sm">
                                {form.formState.errors.price_types[index]?.price?.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removePriceTypeHandler(index)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPriceType}
                    className="w-full"
                  >
                    <IconPlus className="mr-2 h-4 w-4" />
                    Добавить тип цены
                  </Button>
                </CardContent>
              </Card>
            </form>
          </div>

          <Separator />
          
          <DrawerFooter>
            <div className="flex gap-2 w-full">
              <Button 
                onClick={form.handleSubmit(handleSubmit)} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Сохранение..." : editingAzot ? "Обновить азот" : "Создать азот"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">Отмена</Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}