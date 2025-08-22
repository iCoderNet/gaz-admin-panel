"use client"


import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { TablerIcon } from "@tabler/icons-react";
import { useLocation, Link } from "react-router-dom"

export function NavMain({ items }: { items: { title: string; url: string; icon?: TablerIcon }[] }) {
  const location = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = location.pathname === item.url

          return (
            <SidebarMenuItem key={item.title} className={isActive ? "bg-muted" : ""}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className={isActive ? "text-primary font-semibold" : ""}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

