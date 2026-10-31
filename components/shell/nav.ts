import type { Route } from 'next';
import {
  CalendarDays,
  Download,
  FolderOpen,
  House,
  Landmark,
  Layers,
  type LucideIcon,
  Settings2,
} from 'lucide-react';

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** Só fica ativo no caminho exato (o Início, por exemplo). */
  exact?: boolean;
}

export const primaryNav: NavItem[] = [
  { href: '/app', label: 'Início', icon: House, exact: true },
  { href: '/app/investimentos', label: 'Investimentos', icon: Layers },
  { href: '/app/calendario', label: 'Prazos', icon: CalendarDays },
  { href: '/app/carteiras', label: 'Carteiras', icon: FolderOpen },
  { href: '/app/instituicoes', label: 'Instituições', icon: Landmark },
];

export const secondaryNav: NavItem[] = [
  { href: '/app/exportar', label: 'Exportar dados', icon: Download },
  { href: '/app/definicoes', label: 'Definições', icon: Settings2 },
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
