"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconDeviceFloppy, IconReload, IconUpload, IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from '@/contexts/ThemeContext'
import api from "@/lib/api"

// Define the settings schema
const settingsSchema = z.object({
  enable_promocode: z.boolean().default(false),
  require_phone_on_order: z.boolean().default(true),
  site_title: z.string().min(1, "Название сайта обязательно").default("Мой сайт"),
  site_logo: z.any().optional(),
  cargo_price: z.number().min(0, "Цена доставки должна быть положительной").default(500),
  bot_token: z.string().default("TOKEN"),
  order_notification: z.string().default("Новый заказ создан ✅"),
  chat_id: z.string().default("ID NUMBER"),
})

type Settings = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const [, setSettings] = React.useState<Settings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()

  const form = useForm<Settings>({
    // resolver: zodResolver(settingsSchema),
    defaultValues: {
      enable_promocode: false,
      require_phone_on_order: true,
      site_title: "Мой сайт",
      cargo_price: 500,
      bot_token: "TOKEN",
      order_notification: "Новый заказ создан ✅",
      chat_id: "ID NUMBER",
    }
  })

  // Fetch settings from API
  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get("/settings")
      
      if (response.data.success) {
        const settingsData = response.data.data
        setSettings(settingsData)
        form.reset(settingsData)
        
        if (settingsData.site_logo) {
          setLogoPreview(settingsData.site_logo)
        }
      } else {
        throw new Error("Не удалось загрузить настройки")
      }
    } catch (error) {
      console.error("Ошибка при загрузке настроек:", error)
      toast.error("Не удалось загрузить настройки")
    } finally {
      setLoading(false)
    }
  }, [form])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Пожалуйста, выберите файл изображения")
      return
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.error("Изображение должно быть меньше 30MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    form.setValue("site_logo", file)
  }

  const onSubmit = async (data: Settings) => {
    try {
      setSaving(true)
      console.log(data);
      
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === "site_logo" && value instanceof File) {
          formData.append(key, value)
        } else if (key === "enable_promocode" || key === "require_phone_on_order") {
          formData.append(key, value ? "1" : "0")
        } else if (key === "cargo_price") {
          formData.append(key, value.toString())
        } else {
          formData.append(key, value.toString())
        }
      })

      const response = await api.post("/settings/save", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.message) {
        toast.success("Настройки успешно сохранены")
        fetchSettings()
      } else {
        throw new Error("Не удалось сохранить настройки")
      }
    } catch (error: any) {
      console.error("Ошибка при сохранении настроек:", error)
      const errorMessage = error.response?.data?.message || "Не удалось сохранить настройки"
      toast.error(errorMessage)
      if (error.response?.data?.errors) {
        console.error("Ошибки валидации:", error.response.data.errors)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Настройки</h2>
          <p className="text-muted-foreground">
            Управляйте настройками и предпочтениями приложения
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <IconReload className="mr-2 h-4 w-4" />
            Перезагрузить
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </div>
      </div>

      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general">Общие</TabsTrigger>
            <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Информация о сайте</CardTitle>
                  <CardDescription>
                    Настройте название и логотип сайта
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_title">Название сайта</Label>
                    <Input
                      id="site_title"
                      {...form.register("site_title")}
                      placeholder="Введите название сайта"
                    />
                    {form.formState.errors.site_title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.site_title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_logo">Логотип сайта</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <div className="h-16 w-16 rounded-md overflow-hidden border">
                          <img
                            src={logoPreview}
                            alt="Предпросмотр логотипа"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input id="site_logo" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        <Label htmlFor="site_logo" className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted/50">
                          <IconUpload className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground text-center">
                            Нажмите, чтобы загрузить или перетащите файл
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            SVG, PNG, JPG или GIF (макс. 30MB)
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Настройки доставки</CardTitle>
                  <CardDescription>
                    Настройте параметры доставки
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo_price">Стоимость доставки</Label>
                    <Input
                      id="cargo_price"
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register("cargo_price", { valueAsNumber: true })}
                    />
                    {form.formState.errors.cargo_price && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.cargo_price.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ecommerce" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки заказов</CardTitle>
                  <CardDescription>
                    Настройте параметры обработки заказов
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="require_phone_on_order">Включить раздел обратного вызова</Label>
                      <p className="text-sm text-muted-foreground">
                        Клиенты могут подать заявку на обратный звонок
                      </p>
                    </div>
                    <Switch
                      id="require_phone_on_order"
                      checked={form.watch("require_phone_on_order")}
                      onCheckedChange={(checked) => 
                        form.setValue("require_phone_on_order", checked, { shouldValidate: true, shouldDirty: true })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable_promocode">Включить промокоды</Label>
                      <p className="text-sm text-muted-foreground">
                        Разрешить клиентам использовать промокоды при оформлении заказа
                      </p>
                    </div>
                    <Switch
                      id="enable_promocode"
                      checked={form.watch("enable_promocode")}
                      onCheckedChange={(checked) => 
                        form.setValue("enable_promocode", checked, { shouldValidate: true, shouldDirty: true })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки Telegram-бота</CardTitle>
                  <CardDescription>
                    Настройте уведомления о новых заказах через Telegram
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot_token">Токен бота</Label>
                    <Input id="bot_token" {...form.register("bot_token")} placeholder="Введите токен Telegram-бота" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chat_id">Chat ID</Label>
                    <Input id="chat_id" {...form.register("chat_id")} placeholder="Введите Telegram Chat ID" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order_notification">Текст уведомления о заказе</Label>
                    <Textarea id="order_notification" {...form.register("order_notification")} placeholder="Введите текст уведомления" rows={3} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки темы</CardTitle>
                  <CardDescription>
                    Настройте внешний вид приложения
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Тема</Label>
                    <div className="flex items-center gap-4">
                      <Select value={theme} onValueChange={toggleTheme}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Выберите тему" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center">
                              <IconSun className="mr-2 h-4 w-4" />
                              Светлая
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center">
                              <IconMoon className="mr-2 h-4 w-4" />
                              Тёмная
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        {theme === 'dark' ? (
                          <IconMoon className="h-6 w-6" />
                        ) : (
                          <IconSun className="h-6 w-6" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      Тема управляет цветовой схемой интерфейса приложения.
                      Изменения сохраняются автоматически в локальное хранилище вашего браузера.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Предпросмотр</CardTitle>
                  <CardDescription>
                    Посмотрите, как будет выглядеть тема
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                    <h3 className="font-semibold mb-2">Предпросмотр темы</h3>
                    <p className="text-sm mb-3">
                      Так будет выглядеть текст в выбранной теме.
                    </p>
                    <div className={`p-3 rounded-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <p className="text-xs">Пример карточки</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button type="button" className={`px-3 py-1 rounded text-xs ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        Кнопка
                      </button>
                      <button type="button" className={`px-3 py-1 rounded text-xs ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                        Вторичная
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end sticky bottom-4 bg-background p-4 rounded-lg border shadow-sm">
          <Button type="submit" disabled={saving}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Сохраняем изменения..." : "Сохранить все изменения"}
          </Button>
        </div>
      </form>
    </div>
  )
}