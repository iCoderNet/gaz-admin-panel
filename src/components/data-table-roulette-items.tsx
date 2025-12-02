/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconPencil, IconTrash, IconPhoto } from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { rouletteAPI } from "@/lib/api"
import api from "@/lib/api"

interface RouletteItem {
    id: number
    title: string
    description?: string
    accessory_id?: number
    probability: number
    is_active: boolean
    image?: string
    image_url?: string
    accessory?: {
        id: number
        title: string
    }
}

interface Accessory {
    id: number
    title: string
}

export default function DataTableRouletteItems() {
    const [items, setItems] = React.useState<RouletteItem[]>([])
    const [accessories, setAccessories] = React.useState<Accessory[]>([])
    const [loading, setLoading] = React.useState(false)
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<RouletteItem | null>(null)
    const isMobile = useIsMobile()

    // Form state
    const [formData, setFormData] = React.useState({
        title: "",
        description: "",
        accessory_id: "",
        probability: "0",
        is_active: true,
        image: null as File | null,
    })

    const fetchItems = async () => {
        try {
            setLoading(true)
            const response = await rouletteAPI.getAll()
            setItems(response.data.data.data || response.data.data || [])
        } catch (error: any) {
            toast.error("Ошибка загрузки элементов рулетки")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAccessories = async () => {
        try {
            const response = await api.get("/accessories")
            setAccessories(response.data.data.data || response.data.data || [])
        } catch (error) {
            console.error("Error fetching accessories:", error)
        }
    }

    React.useEffect(() => {
        fetchItems()
        fetchAccessories()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const data = new FormData()
        data.append("title", formData.title)
        if (formData.description) data.append("description", formData.description)
        if (formData.accessory_id && formData.accessory_id !== "null") data.append("accessory_id", formData.accessory_id)
        data.append("probability", formData.probability)
        data.append("is_active", formData.is_active ? "1" : "0")
        if (formData.image) data.append("image", formData.image)

        try {
            if (editingItem) {
                data.append("_method", "PUT")
                await rouletteAPI.update(editingItem.id, data)
                toast.success("Элемент успешно обновлен")
            } else {
                await rouletteAPI.create(data)
                toast.success("Элемент успешно создан")
            }
            setDrawerOpen(false)
            resetForm()
            fetchItems()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Ошибка сохранения")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Вы уверены, что хотите удалить этот элемент?")) return

        try {
            await rouletteAPI.delete(id)
            toast.success("Элемент успешно удален")
            fetchItems()
        } catch (error: any) {
            toast.error("Ошибка удаления")
        }
    }

    const handleEdit = (item: RouletteItem) => {
        setEditingItem(item)
        setFormData({
            title: item.title,
            description: item.description || "",
            accessory_id: item.accessory_id?.toString() || "",
            probability: item.probability.toString(),
            is_active: item.is_active,
            image: null,
        })
        setDrawerOpen(true)
    }

    const handleAdd = () => {
        resetForm()
        setDrawerOpen(true)
    }

    const resetForm = () => {
        setEditingItem(null)
        setFormData({
            title: "",
            description: "",
            accessory_id: "",
            probability: "0",
            is_active: true,
            image: null,
        })
    }

    return (
        <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Элементы рулетки</h2>
                <Button onClick={handleAdd}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Добавить элемент
                </Button>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Изображение</TableHead>
                            <TableHead>Название</TableHead>
                            <TableHead>Аксессуар</TableHead>
                            <TableHead>Вероятность (%)</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Загрузка...</TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Элементы не найдены</TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover rounded" />
                                        ) : (
                                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                                <IconPhoto className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.accessory?.title || "—"}</TableCell>
                                    <TableCell>{item.probability}%</TableCell>
                                    <TableCell>
                                        <Badge variant={item.is_active ? "default" : "secondary"}>
                                            {item.is_active ? "Активен" : "Неактивен"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                                                <IconPencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                                                <IconTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction={isMobile ? "bottom" : "right"}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{editingItem ? "Редактировать элемент" : "Создать элемент"}</DrawerTitle>
                        <DrawerDescription>Заполните данные элемента рулетки</DrawerDescription>
                    </DrawerHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="title">Название *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Название приза"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Описание приза"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="accessory_id">Связанный аксессуар</Label>
                            <Select
                                value={formData.accessory_id}
                                onValueChange={(value) => setFormData({ ...formData, accessory_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите аксессуар" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">Без аксессуара</SelectItem>
                                    {accessories.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id.toString()}>
                                            {acc.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="probability">Вероятность (%) *</Label>
                            <Input
                                id="probability"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.probability}
                                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                                placeholder="0-100"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="image">Изображение</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                            />
                            {editingItem?.image_url && (
                                <img src={editingItem.image_url} alt="Current" className="w-24 h-24 object-cover rounded mt-2" />
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <Label htmlFor="is_active">Активен</Label>
                        </div>
                    </form>
                    <DrawerFooter>
                        <Button type="submit" onClick={handleSubmit}>
                            {editingItem ? "Обновить" : "Создать"}
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
