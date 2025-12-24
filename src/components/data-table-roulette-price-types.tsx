/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

interface PriceType {
    name: string
    roulette_allowed: boolean
}

export default function DataTableRoulettePriceTypes() {
    const [priceTypes, setPriceTypes] = React.useState<PriceType[]>([])
    const [loading, setLoading] = React.useState(false)
    const [updating, setUpdating] = React.useState<string | null>(null)

    const fetchPriceTypes = async () => {
        try {
            setLoading(true)
            const response = await api.get("/roulette/price-types")
            setPriceTypes(response.data.data || [])
        } catch (error: any) {
            toast.error("Ошибка загрузки типов оплат")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchPriceTypes()
    }, [])

    const handleToggle = async (name: string, currentValue: boolean) => {
        try {
            setUpdating(name)
            await api.put(`/roulette/price-types/${encodeURIComponent(name)}`, {
                roulette_allowed: !currentValue,
            })

            // Update local state
            setPriceTypes((prev) =>
                prev.map((pt) =>
                    pt.name === name ? { ...pt, roulette_allowed: !currentValue } : pt
                )
            )

            toast.success(
                !currentValue
                    ? `Рулетка включена для "${name}"`
                    : `Рулетка выключена для "${name}"`
            )
        } catch (error: any) {
            toast.error("Ошибка обновления")
            console.error(error)
        } finally {
            setUpdating(null)
        }
    }

    return (
        <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-2xl font-bold">Настройки типов оплаты</h2>
                <p className="text-muted-foreground">
                    Включите или выключите рулетку для определенных типов оплаты.
                    Если тип отключен, заказы с этим типом не смогут участвовать в рулетке.
                </p>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="w-[300px]">Тип оплаты</TableHead>
                            <TableHead>Статус рулетки</TableHead>
                            <TableHead className="text-right">Действие</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        Загрузка...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : priceTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    Типы оплат не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            priceTypes.map((pt) => (
                                <TableRow key={pt.name}>
                                    <TableCell className="font-medium">{pt.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={pt.roulette_allowed ? "default" : "destructive"}>
                                            {pt.roulette_allowed ? "✓ Рулетка доступна" : "✗ Рулетка недоступна"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Label htmlFor={`switch-${pt.name}`} className="text-sm text-muted-foreground">
                                                {pt.roulette_allowed ? "Вкл" : "Выкл"}
                                            </Label>
                                            <Switch
                                                id={`switch-${pt.name}`}
                                                checked={pt.roulette_allowed}
                                                onCheckedChange={() => handleToggle(pt.name, pt.roulette_allowed)}
                                                disabled={updating === pt.name}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Важно</h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
                    <li>Отключенный тип оплаты блокирует рулетку для <strong>всех</strong> заказов с этим типом</li>
                    <li>Заказы только с аксессуарами (без баллонов) автоматически не могут участвовать в рулетке</li>
                    <li>Изменения применяются мгновенно</li>
                </ul>
            </div>
        </div>
    )
}
