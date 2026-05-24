import {
  Box,
  Calendar,
  ChartLine,
  Database,
  FileText,
  Folder,
  Globe,
  Image,
  Layers,
  LayoutDashboard,
  Settings,
  Shield,
  ShoppingCart,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'

const ENTITY_ICONS: Record<string, LucideIcon> = {
  posts: FileText,
  pages: Layers,
  categories: Tag,
  tags: Tag,
  media: Image,
  files: Folder,
  users: Users,
  roles: Shield,
  customers: Users,
  products: Box,
  orders: ShoppingCart,
  analytics: ChartLine,
  settings: Settings,
  schedule: Calendar,
  globals: Globe,
}

const GROUP_ICONS: Record<string, LucideIcon> = {
  Content: FileText,
  Media: Image,
  Commerce: ShoppingCart,
  Admin: Shield,
  System: Shield,
  Settings: Settings,
  Analytics: ChartLine,
  Default: Folder,
}

export const iconForSlug = (slug: string): LucideIcon =>
  ENTITY_ICONS[slug] ?? Database

export const iconForGroup = (label: string): LucideIcon =>
  GROUP_ICONS[label] ?? GROUP_ICONS.Default

export const dashboardIcon: LucideIcon = LayoutDashboard
