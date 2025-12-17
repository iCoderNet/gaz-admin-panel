/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react"
import { useIsMobile } from "@/hooks/use-mobile"
import api from "@/lib/api"

interface ForcedRouletteRule {
    id: number
    azot_id: number
    price_type_name: string
    roulette_item_id: number
    is_active: boolean
    azot?: {
        id: number
        title: string
    }
    roulette_item?: {
        id: number
        title: string
    }
    created_at: string
}

interface Azot {
    id: number
    title: string
    price_types?: {
        id: number
        name: string
        price: number
    }[]
}

interface RouletteItem {
    id: number
    title: string
}

export default function DataTableForcedRouletteRules() {
    const [rules, setRules] = React.useState<ForcedRouletteRule[]>([])
    const [azots, setAzots] = React.useState<Azot[]>([])
    const [rouletteItems, setRouletteItems] = React.useState<RouletteItem[]>([])
    const [loading, setLoading] = React.useState(false)
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [editingRule, setEditingRule] = React.useState<ForcedRouletteRule | null>(null)
    const isMobile = useIsMobile()

    // Form state
    const [formData, setFormData] = React.useState({
        azot_id: "",
        price_type_name: "",
        roulette_item_id: "",
        is_active: true,
    })

    const fetchRules = async () => {
        try {
            setLoading(true)
            const response = await api.get("/forced-roulette-rules")
            setRules(response.data.data.data || response.data.data || [])
        } catch (error: any) {
            toast.error("Ошибка загрузки правил")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAzots = async () => {
        try {
            const response = await api.get("/azots")
            setAzots(response.data.data.data || response.data.data || [])
        } catch (error) {
            console.error("Error fetching azots:", error)
        }
    }

    const fetchRouletteItems = async () => {
        try {
            const response = await api.get("/roulette-items")
            setRouletteItems(response.data.data.data || response.data.data || [])
        } catch (error) {
            console.error("Error fetching roulette items:", error)
        }
    }

    // Get price types for selected azot
    const getAvailablePriceTypes = () => {
        if (!formData.azot_id) {
            return [] // No azot selected, no price types
        }

        const selectedAzot = azots.find(a => a.id === parseInt(formData.azot_id))
        if (!selectedAzot || !selectedAzot.price_types || selectedAzot.price_types.length === 0) {
            return [] // No price types for this azot
        }

        return selectedAzot.price_types.map(pt => pt.name)
    }

    React.useEffect(() => {
        fetchRules()
        fetchAzots()
        fetchRouletteItems()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.azot_id || !formData.price_type_name || !formData.roulette_item_id) {
            toast.error("Заполните все обязательные поля")
            return
        }

        try {
            if (editingRule) {
                await api.put(`/forced-roulette-rules/${editingRule.id}`, formData)
                toast.success("Правило успешно обновлено")
            } else {
                await api.post("/forced-roulette-rules", formData)
                toast.success("Правило успешно создано")
            }
            setDrawerOpen(false)
            resetForm()
            fetchRules()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Ошибка сохранения")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Вы уверены, что хотите удалить это правило?")) return

        try {
            await api.delete(`/forced-roulette-rules/${id}`)
            toast.success("Правило успешно удалено")
            fetchRules()
        } catch (error: any) {
            toast.error("Ошибка удаления")
        }
    }

    const handleEdit = (rule: ForcedRouletteRule) => {
        setEditingRule(rule)
        setFormData({
            azot_id: rule.azot_id.toString(),
            price_type_name: rule.price_type_name,
            roulette_item_id: rule.roulette_item_id.toString(),
            is_active: rule.is_active,
        })
        setDrawerOpen(true)
    }

    const handleAdd = () => {
        resetForm()
        setDrawerOpen(true)
    }

    const resetForm = () => {
        setEditingRule(null)
        setFormData({
            azot_id: "",
            price_type_name: "",
            roulette_item_id: "",
            is_active: true,
        })
    }

    return (
        <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Принудительные призы рулетки</h2>
                <Button onClick={handleAdd}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Добавить правило
                </Button>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Азот (Продукт)</TableHead>
                            <TableHead>Тип оплаты</TableHead>
                            <TableHead>Гарантированный приз</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Загрузка...</TableCell>
                            </TableRow>
                        ) : rules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Правила не найдены</TableCell>
                            </TableRow>
                        ) : (
                            rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.azot?.title || `Azot #${rule.azot_id}`}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{rule.price_type_name}</Badge>
                                    </TableCell>
                                    <TableCell>{rule.roulette_item?.title || `Prize #${rule.roulette_item_id}`}</TableCell>
                                    <TableCell>
                                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                                            {rule.is_active ? "Активно" : "Неактивно"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(rule)}>
                                                <IconPencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id)}>
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
                        <DrawerTitle>{editingRule ? "Редактировать правило" : "Создать правило"}</DrawerTitle>
                        <DrawerDescription>Настройте гарантированный приз для определенного азота и типа оплаты</DrawerDescription>
                    </DrawerHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="azot_id">Азот (Продукт) *</Label>
                            <Select
                                value={formData.azot_id}
                                onValueChange={(value) => setFormData({ ...formData, azot_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите азот" />
                                </SelectTrigger>
                                <SelectContent>
                                    {azots.map((azot) => (
                                        <SelectItem key={azot.id} value={azot.id.toString()}>
                                            {azot.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="price_type_name">Тип оплаты *</Label>
                            <Select
                                value={formData.price_type_name}
                                onValueChange={(value) => setFormData({ ...formData, price_type_name: value })}
                                disabled={!formData.azot_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={formData.azot_id ? "Выберите тип оплаты" : "Сначала выберите азот"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailablePriceTypes().length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">
                                            {formData.azot_id ? "Нет доступных типов оплаты" : "Выберите азот"}
                                        </div>
                                    ) : (
                                        getAvailablePriceTypes().map((name) => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="roulette_item_id">Гарантированный приз *</Label>
                            <Select
                                value={formData.roulette_item_id}
                                onValueChange={(value) => setFormData({ ...formData, roulette_item_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите приз" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rouletteItems.map((item) => (
                                        <SelectItem key={item.id} value={item.id.toString()}>
                                            {item.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <Label htmlFor="is_active">Активно</Label>
                        </div>
                    </form>
                    <DrawerFooter>
                        <Button type="submit" onClick={handleSubmit}>
                            {editingRule ? "Обновить" : "Создать"}
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
