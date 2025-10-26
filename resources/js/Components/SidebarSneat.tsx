import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { 
  Building2, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  FileText, 
  LayoutDashboard, 
  Settings, 
  Ticket, 
  Users,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import ApplicationLogo from "./ApplicationLogo";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function SidebarSneat({ className, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { auth, reviewTicketsCount, closedTicketsCount, openTicketsCount } = usePage().props as any;
  const isSuperAdmin = auth?.user?.is_super_admin === true;
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    route().current("tickets.*") ? "tickets" : null
  );
  const [isHovering, setIsHovering] = useState(false);

  const toggleMenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };
  
  // Determina se deve mostrar expandida (permanente ou hover temporário)
  const showExpanded = !isCollapsed || isHovering;
  
  return (
    <div 
      className={cn(
        "h-screen flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300",
        showExpanded ? "w-64" : "w-20",
        className
      )}
      onMouseEnter={() => isCollapsed && setIsHovering(true)}
      onMouseLeave={() => isCollapsed && setIsHovering(false)}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center",
        showExpanded ? "p-6 pb-8" : "p-4 pb-8"
      )}>
        <Link href="/">
          {!showExpanded ? (
            <div className="h-10 w-10 bg-gradient-to-br from-[#03c3ec] to-[#0284c7] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S8</span>
            </div>
          ) : (
            <ApplicationLogo className="h-10 w-auto fill-current text-[#03c3ec]" />
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {/* Dashboard */}
        <NavItem
          href={route("dashboard")}
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          active={route().current("dashboard")}
          hasSubmenu
          isCollapsed={!showExpanded}
        />
        
        {/* Tickets */}
        <NavItemWithSubmenu
          icon={<Ticket className="h-5 w-5" />}
          label="Tickets"
          active={route().current("tickets.*")}
          expanded={expandedMenu === "tickets"}
          onToggle={() => toggleMenu("tickets")}
          isCollapsed={!showExpanded}
          submenuItems={[
            {
              label: "Novo ticket",
              href: route("tickets.create"),
              active: route().current("tickets.create")
            },
            {
              label: "Abertos",
              href: route("tickets.open.index"),
              active: route().current("tickets.open.index"),
              badge: openTicketsCount || 0
            },
            {
              label: "Pré-tickets",
              href: route("tickets.pre-tickets.index"),
              active: route().current("tickets.pre-tickets.*")
            },
            {
              label: "Autorizações",
              href: route("tickets.authorizations.index"),
              active: route().current("tickets.authorizations.*")
            },
            {
              label: "Em revisão",
              href: route("tickets.review.index"),
              active: route().current("tickets.review.index"),
              badge: reviewTicketsCount || 0
            },
            {
              label: "Fechados",
              href: route("tickets.closed.index"),
              active: route().current("tickets.closed.index"),
              badge: closedTicketsCount || 0
            },
          ]}
        />
        
        {/* Clientes */}
        <NavItem
          href={route("clients.index")}
          icon={<Users className="h-5 w-5" />}
          label="Clientes"
          active={route().current("clients.*")}
          hasSubmenu
          isCollapsed={!showExpanded}
        />
        
        {/* Contratos */}
        <NavItem
          href={route("contracts.index")}
          icon={<FileText className="h-5 w-5" />}
          label="Contratos"
          active={route().current("contracts.*")}
          hasSubmenu
          isCollapsed={!showExpanded}
        />

        {/* Apps e Configurações Section */}
        {showExpanded && (
          <div className="pt-6 pb-2">
            <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Apps e Configurações
            </span>
          </div>
        )}

        <NavItem
          href="#"
          icon={<MessageSquare className="h-5 w-5" />}
          label="Chat"
          isCollapsed={!showExpanded}
        />
        
        <NavItem
          href={route("settings.index")}
          icon={<Settings className="h-5 w-5" />}
          label="Configurações"
          active={route().current("settings.*")}
          hasSubmenu
          isCollapsed={!showExpanded}
        />

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <>
            {showExpanded && (
              <div className="pt-6 pb-2">
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
            )}
            <NavItem
              href={route("superadmin.tenants.index")}
              icon={<Building2 className="h-5 w-5" />}
              label="Plataforma"
              active={route().current("superadmin.*")}
              hasSubmenu
              isCollapsed={!showExpanded}
            />
          </>
        )}
      </nav>

      {/* Toggle Button - Footer */}
      {onToggleCollapse && (
        <div className="p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-center transition-all duration-200 hover:scale-110 relative z-50"
          >
            <div className="h-6 w-6 rounded-full bg-[#03c3ec] flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              {showExpanded ? (
                <ChevronLeft className="h-3 w-3 text-white" />
              ) : (
                <ChevronRight className="h-3 w-3 text-white" />
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  hasSubmenu?: boolean;
  isCollapsed?: boolean;
}

function NavItem({ href, icon, label, active, badge, hasSubmenu, isCollapsed }: NavItemProps) {
  if (isCollapsed) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
          active
            ? "bg-[#03c3ec]/10 text-[#03c3ec]"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
        title={label}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#03c3ec] rounded-r-full" />
        )}
        <span className={cn(
          "transition-colors",
          active ? "text-[#03c3ec]" : "text-gray-400 group-hover:text-gray-600"
        )}>
          {icon}
        </span>
        {badge && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
        active
          ? "bg-[#03c3ec]/10 text-[#03c3ec]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#03c3ec] rounded-r-full" />
      )}
      
      <span className={cn(
        "transition-colors",
        active ? "text-[#03c3ec]" : "text-gray-400 group-hover:text-gray-600"
      )}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && (
        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs rounded-full">
          {badge}
        </Badge>
      )}
      {hasSubmenu && (
        <ChevronRight className={cn(
          "h-4 w-4 transition-colors",
          active ? "text-[#03c3ec]" : "text-gray-400 group-hover:text-gray-600"
        )} />
      )}
    </Link>
  );
}

interface SubmenuItem {
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}

interface NavItemWithSubmenuProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded?: boolean;
  onToggle: () => void;
  submenuItems: SubmenuItem[];
  isCollapsed?: boolean;
}

function NavItemWithSubmenu({ 
  icon, 
  label, 
  active, 
  expanded, 
  onToggle, 
  submenuItems,
  isCollapsed
}: NavItemWithSubmenuProps) {
  const showExpanded = !isCollapsed;
  
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
          active
            ? "bg-[#03c3ec]/10 text-[#03c3ec]"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
        title={label}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#03c3ec] rounded-r-full" />
        )}
        <span className={cn(
          "transition-colors",
          active ? "text-[#03c3ec]" : "text-gray-400 group-hover:text-gray-600"
        )}>
          {icon}
        </span>
      </button>
    );
  }
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
          active
            ? "bg-[#03c3ec]/10 text-[#03c3ec]"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        {/* Barra lateral esquerda para item ativo */}
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#03c3ec] rounded-r-full" />
        )}
        
        <span className={cn(
          "transition-colors",
          active ? "text-[#03c3ec]" : "text-gray-400 group-hover:text-gray-600"
        )}>
          {icon}
        </span>
        <span className="flex-1 text-left">{label}</span>
        {expanded ? (
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            active ? "text-[#03c3ec]" : "text-gray-400 group-hover:text-gray-600"
          )} />
        ) : (
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            active ? "text-[#03c3ec]" : "text-gray-400 group-hover:text-gray-600"
          )} />
        )}
      </button>
      
      {/* Submenu */}
      {expanded && showExpanded && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
          {submenuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="flex items-center gap-2">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  item.active ? "bg-[#03c3ec]" : "bg-gray-400"
                )} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs rounded-full">
                    {item.badge}
                  </Badge>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
