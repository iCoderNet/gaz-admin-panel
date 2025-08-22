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
  site_title: z.string().min(1, "Site title is required").default("My Site"),
  site_logo: z.any().optional(),
  cargo_price: z.number().min(0, "Cargo price must be positive").default(500),
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
      site_title: "My Site",
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
        
        // Set logo preview if exists
        if (settingsData.site_logo) {
          setLogoPreview(settingsData.site_logo)
        }
      } else {
        throw new Error("Failed to fetch settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [form])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (30MB max)
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Image must be less than 30MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Set form value
    form.setValue("site_logo", file)
  }

  // Handle form submission
  const onSubmit = async (data: Settings) => {
    try {
      setSaving(true)
      console.log(data);
      
      
      // Create FormData for file upload
      const formData = new FormData()
      
      // Append all fields to FormData with proper formatting
      Object.entries(data).forEach(([key, value]) => {
        if (key === "site_logo" && value instanceof File) {
          formData.append(key, value)
        } else if (key === "enable_promocode" || key === "require_phone_on_order") {
          // Convert boolean values to string "1" or "0" for Laravel validation
          formData.append(key, value ? "1" : "0")
        } else if (key === "cargo_price") {
          // Convert number to string
          formData.append(key, value.toString())
        } else {
          formData.append(key, value.toString())
        }
      })

      const response = await api.post("/settings/save", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.message) {
        toast.success("Settings saved successfully")
        // Refresh settings after save
        fetchSettings()
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error: any) {
      console.error("Error saving settings:", error)
      const errorMessage = error.response?.data?.message || "Failed to save settings"
      toast.error(errorMessage)
      
      // Additional error details might be in error.response.data.errors
      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors)
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
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your application settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <IconReload className="mr-2 h-4 w-4" />
            Reload
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Site Information</CardTitle>
                  <CardDescription>
                    Configure your site title and logo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_title">Site Title</Label>
                    <Input
                      id="site_title"
                      {...form.register("site_title")}
                      placeholder="Enter site title"
                    />
                    {form.formState.errors.site_title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.site_title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_logo">Site Logo</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <div className="h-16 w-16 rounded-md overflow-hidden border">
                          <img
                            src={logoPreview}
                            alt="Site logo preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="site_logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <Label
                          htmlFor="site_logo"
                          className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted/50"
                        >
                          <IconUpload className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground text-center">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            SVG, PNG, JPG or GIF (max. 30MB)
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Settings</CardTitle>
                  <CardDescription>
                    Configure shipping and delivery options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo_price">Cargo Price</Label>
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
                  <CardTitle>Order Settings</CardTitle>
                  <CardDescription>
                    Configure order processing options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="require_phone_on_order">Require Phone Number</Label>
                      <p className="text-sm text-muted-foreground">
                        Customers must provide a phone number when ordering
                      </p>
                    </div>
                    <Switch
                      id="require_phone_on_order"
                      checked={form.watch("require_phone_on_order")}
                      onCheckedChange={(checked) => 
                        form.setValue("require_phone_on_order", checked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable_promocode">Enable Promo Codes</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to apply promo codes during checkout
                      </p>
                    </div>
                    <Switch
                      id="enable_promocode"
                      checked={form.watch("enable_promocode")}
                      onCheckedChange={(checked) => 
                        form.setValue("enable_promocode", checked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
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
                  <CardTitle>Telegram Bot Settings</CardTitle>
                  <CardDescription>
                    Configure Telegram notifications for new orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot_token">Bot Token</Label>
                    <Input
                      id="bot_token"
                      {...form.register("bot_token")}
                      placeholder="Enter Telegram bot token"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chat_id">Chat ID</Label>
                    <Input
                      id="chat_id"
                      {...form.register("chat_id")}
                      placeholder="Enter Telegram chat ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order_notification">Order Notification Message</Label>
                    <Textarea
                      id="order_notification"
                      {...form.register("order_notification")}
                      placeholder="Enter notification message"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance of your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <div className="flex items-center gap-4">
                      <Select value={theme} onValueChange={toggleTheme}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center">
                              <IconSun className="mr-2 h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center">
                              <IconMoon className="mr-2 h-4 w-4" />
                              Dark
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
                      The theme controls the color scheme of the application interface.
                      Changes are saved automatically to your browser's local storage.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    See how your theme will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                    <h3 className="font-semibold mb-2">Theme Preview</h3>
                    <p className="text-sm mb-3">
                      This is how text will appear in your selected theme.
                    </p>
                    <div className={`p-3 rounded-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <p className="text-xs">Card element example</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button type="button" className={`px-3 py-1 rounded text-xs ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        Button
                      </button>
                      <button type="button" className={`px-3 py-1 rounded text-xs ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                        Secondary
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
            {saving ? "Saving Changes..." : "Save All Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}