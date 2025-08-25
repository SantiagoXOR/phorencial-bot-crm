"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bell
} from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string | number
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Users,
    badge: "1,247"
  },
  {
    name: "Documents", // Nueva página
    href: "/documents",
    icon: FileText,
    badge: "12"
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: BarChart3
  },
  {
    name: "Settings", // Nueva página
    href: "/settings",
    icon: Settings
  },
  {
    name: "Admin",
    href: "/admin",
    icon: Shield
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const { data: session } = useSession()

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/90 backdrop-blur-sm border-gray-200"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )} data-testid="sidebar">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900" />
        
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
        
        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-white/10" data-testid="sidebar-logo">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Phorencial</h1>
                <p className="text-xs text-gray-300">CRM Formosa</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href)
              const expanded = expandedItems.includes(item.name)
              
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        active ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                      )} />
                      <span>{item.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <Badge 
                          variant={active ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            active 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-700 text-gray-300"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      
                      {item.children && (
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          expanded ? "rotate-180" : ""
                        )} />
                      )}
                    </div>
                  </Link>

                  {/* Submenu */}
                  {item.children && expanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "block px-3 py-2 text-sm rounded-md transition-colors",
                            isActive(child.href)
                              ? "text-blue-400 bg-blue-500/10"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            {/* Notifications */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Bell className="h-4 w-4 mr-2" />
                <span>Notificaciones</span>
                <Badge variant="destructive" className="ml-auto">
                  3
                </Badge>
              </Button>
            </div>

            {/* User info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">U</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {session?.user?.email || 'email@ejemplo.com'}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Hook para obtener información de navegación
export function useNavigation() {
  const pathname = usePathname()
  
  const getCurrentPage = () => {
    const currentItem = navigation.find(item => 
      pathname === item.href || pathname.startsWith(item.href + "/")
    )
    return currentItem?.name || "Dashboard"
  }

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    return segments.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: "/" + segments.slice(0, index + 1).join("/"),
      isLast: index === segments.length - 1
    }))
  }

  return {
    currentPage: getCurrentPage(),
    breadcrumbs: getBreadcrumbs(),
    navigation
  }
}
