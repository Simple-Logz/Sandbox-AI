'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ORG_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { href: '/', label: 'Home' },
      { href: '/templates', label: 'Templates', badge: 'NEW' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/deployments', label: 'Deployments', badge: 'NEW' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/alerts', label: 'Alerts' },
    ],
  },
  {
    label: 'Configure',
    items: [
      { href: '/policies', label: 'Policies' },
      { href: '/integrations', label: 'Integrations' },
      { href: '/api-keys', label: 'API Keys' },
      { href: '/settings', label: 'Settings' },
    ],
  },
];

interface NavLinkProps {
  item: NavItem;
}

function NavLink({ item }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14.5px] font-medium transition-colors ${
        active ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal/20 text-teal">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3.5 m-3 rounded-[20px] bg-gradient-to-b from-[#161616] to-[#1e1e1e] h-[calc(100vh-1.5rem)]">
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-4">
        <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-teal to-teal-2 flex items-center justify-center font-bold text-[13px] text-white">
          S
        </div>
        <span className="font-serif font-bold text-[16px] text-white">
          Sandbox<span className="text-teal">.ai</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-4 overflow-y-auto flex-1">
        {ORG_GROUPS.map((group, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {group.label && (
              <div className="text-[11px] font-bold uppercase tracking-wide text-white/35 px-3 mb-1 mt-2">
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
