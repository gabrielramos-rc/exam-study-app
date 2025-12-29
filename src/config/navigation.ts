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
    title: "Exams",
    href: "/admin/exams",
    icon: BookOpen,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: FolderCog,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
