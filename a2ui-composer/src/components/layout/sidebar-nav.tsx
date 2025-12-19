'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SquarePlus, LayoutGrid, Box, Shapes, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  selected?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, href, selected, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
        selected
          ? 'bg-white text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const navItems = [
    { icon: SquarePlus, label: 'Create', href: '/' },
    { icon: LayoutGrid, label: 'Gallery', href: '/gallery' },
    { icon: Box, label: 'Components', href: '/components' },
    { icon: Shapes, label: 'Icons', href: '/icons' },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          icon={item.icon}
          label={item.label}
          href={item.href}
          selected={pathname === item.href}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}
