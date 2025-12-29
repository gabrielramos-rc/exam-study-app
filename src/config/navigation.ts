import {
  LayoutDashboard,
  BookOpen,
  Settings,
  FolderCog,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: FolderCog,
  },
  {
    title: "Exams",
    href: "/admin/exams",
    icon: BookOpen,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
