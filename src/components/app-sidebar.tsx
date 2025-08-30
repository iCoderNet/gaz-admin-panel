"use client"

import * as React from "react"
import {
  IconDashboard,
  IconDatabase,
  IconInnerShadowTop,
  IconReport,
  IconPropeller,
  IconUsers,
  IconGift,
  IconSend,
  IconBasketDollar
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Панель управления",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Пользователи",
      url: "/users",
      icon: IconUsers,
    },
    {
      title: "Заказы",
      url: "/orders",
      icon: IconBasketDollar,
    },
    {
      title: "Азот",
      url: "/azots",
      icon: IconDatabase,
    },
    {
      title: "Аксессуары",
      url: "/accessories",
      icon: IconPropeller,
    },
    {
      title: "Услуги",
      url: "/services",
      icon: IconReport,
    },
    {
      title: "Промокоды",
      url: "/promocodes",
      icon: IconGift,
    },
    {
      title: "Отправить сообщения",
      url: "/tg-messages",
      icon: IconSend,
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Админ-панель</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
