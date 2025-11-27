/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { IconSearch, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { rouletteAPI } from "@/lib/api"
import { toast } from "sonner"

interface RouletteSpin {
    id: number
    user_id: number
    order_id?: number
    roulette_item_id: number
    created_at: string
    user?: {
        id: number
        username: string
        phone: string
        tg_id: string
    }
    roulette_item?: {
        id: number
        title: string
        image_url?: string
    }
    order?: {
        id: number
        order_number: number
    }
}

export default function DataTableRouletteSpins() {
    const [spins, setSpins] = React.useState<RouletteSpin[]>([])
    const [loading, setLoading] = React.useState(false)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(1)
    const [perPage, setPerPage] = React.useState(15)
    const [search, setSearch] = React.useState("")

    const fetchSpins = async () => {
        try {
            setLoading(true)
            const response = await rouletteAPI.getHistory({
                per_page: perPage,
                page: currentPage,
            })

            const data = response.data.data
            setSpins(data.data || [])
            setTotalPages(data.last_page || 1)
        } catch (error: any) {
            toast.error("Ошибка загрузки истории")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchSpins()
    }, [currentPage, perPage])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const filteredSpins = spins.filter((spin) => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            spin.user?.username?.toLowerCase().includes(searchLower) ||
            spin.user?.phone?.includes(search) ||
            spin.roulette_item?.title?.toLowerCase().includes(searchLower) ||
            spin.id.toString().includes(search)
        )
    })

    return (
        <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-2xl font-bold">История рулетки</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Поиск..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Пользователь</TableHead>
                            <TableHead>Приз</TableHead>
                            <TableHead>Заказ</TableHead>
                            <TableHead>Дата</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Загрузка...</TableCell>
                            </TableRow>
                        ) : filteredSpins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">История не найдена</TableCell>
                            </TableRow>
                        ) : (
                            filteredSpins.map((spin) => (
                                <TableRow key={spin.id}>
                                    <TableCell className="font-mono text-muted-foreground">#{spin.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{spin.user?.username || "N/A"}</span>
                                            <span className="text-sm text-muted-foreground">{spin.user?.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {spin.roulette_item?.image_url && (
                                                <img
                                                    src={spin.roulette_item.image_url}
                                                    alt={spin.roulette_item.title}
                                                    className="w-8 h-8 object-cover rounded"
                                                />
                                            )}
                                            <span className="font-medium">{spin.roulette_item?.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {spin.order ? (
                                            <Badge variant="outline">Заказ #{spin.order.order_number || spin.order.id}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(spin.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label className="text-sm">Строк на странице</Label>
                    <Select
                        value={perPage.toString()}
                        onValueChange={(value) => {
                            setPerPage(Number(value))
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 15, 20, 50].map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Страница {currentPage} из {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <IconChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <IconChevronRight />
                    </Button>
                </div>
            </div>
        </div>
    )
}
