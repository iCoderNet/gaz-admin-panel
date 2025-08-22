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
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Users",
      url: "/users",
      icon: IconUsers,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: IconBasketDollar,
    },
    {
      title: "Azots",
      url: "/azots",
      icon: IconDatabase,
    },
    {
      title: "Accessories",
      url: "/accessories",
      icon: IconPropeller,
    },
    {
      title: "Services",
      url: "/services",
      icon: IconReport,
    },
    {
      title: "Promocodes",
      url: "/promocodes",
      icon: IconGift,
    },
    {
      title: "Send Messages",
      url: "/tg-messages",
      icon: IconSend,
    }
  ],
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
                <span className="text-base font-semibold">Admin Panel</span>
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
