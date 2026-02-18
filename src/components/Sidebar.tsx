import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Layout,
    Home,
    Menu,
    Maximize,
    Type,
    Star,
    Anchor,
    Info,
    FileText,
    List,
    Calendar,
    Clock,
    Trophy,
    Award,
    Image,
    Video,
    BookOpen,
    Phone,
    Users,
    Monitor,
    Inbox,
    Settings,
    Globe,
    Eye,
    Hexagon,
    LogOut
} from 'lucide-react';
import type { SidebarItem } from '../types/navigation';
import './Sidebar.css';

interface SidebarProps {
    menuItems: SidebarItem[];
    user: any;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems, user, onLogout }) => {
    const userRole = user?.role || 'secondary';
    const location = useLocation();

    const normalizePath = (path?: string) => {
        if (!path) return path;
        if (path === '/frontend-settings' || path === '/admin/frontend-settings') {
            return '/general-settings?tab=general';
        }
        if (path === '/general-settings' || path === '/admin/general-settings') {
            return '/general-settings?tab=general';
        }
        return path;
    };

    const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
        Layout,
        Home,
        Menu,
        Maximize,
        Type,
        Star,
        Anchor,
        Info,
        FileText,
        List,
        Calendar,
        Clock,
        Trophy,
        Award,
        Image,
        Video,
        BookOpen,
        Phone,
        Users,
        Monitor,
        Inbox,
        Settings,
        Globe,
        Eye
    };

    const IconComponent = ({ name, className }: { name: string; className?: string }) => {
        const Icon = iconMap[name];
        if (!Icon) return <Layout className={className} size={18} />;
        return <Icon className={className} size={18} />;
    };

    // Better active check including query params
    const isCurrentActive = (path?: string) => {
        const normalizedPath = normalizePath(path);
        if (!normalizedPath) return false;
        if (normalizedPath.includes('?')) {
            return (location.pathname + location.search) === normalizedPath;
        }
        return location.pathname === normalizedPath;
    };

    const renderLinkItem = (item: SidebarItem, parentIcon?: string, forcedPath?: string) => (
        <li key={item.title} className="sidebar-item">
            <NavLink
                to={normalizePath(forcedPath || item.path) || '#'}
                className={() => `sidebar-link ${isCurrentActive(normalizePath(forcedPath || item.path)) ? 'active' : ''}`}
            >
                {(item.icon || parentIcon) && <IconComponent name={item.icon || parentIcon || ''} className="sidebar-icon" />}
                <span className="sidebar-text">{item.title}</span>
                {item.badge && (
                    <span className={`badge ${item.badge.color} sidebar-badge`}>
                        {item.badge.text}
                    </span>
                )}
            </NavLink>
        </li>
    );

    const filterByRole = (items: SidebarItem[]): SidebarItem[] => {
        const restrictedPaths = ['/frontend-settings', '/general-settings', '/users-management'];

        const filtered = items
            .map((item) => {
                const children = item.children ? filterByRole(item.children) : undefined;
                const normalizedPath = normalizePath(item.path);

                if (userRole === 'secondary') {
                    const isRestricted = restrictedPaths.some(p => normalizedPath?.toLowerCase().startsWith(p));
                    if (isRestricted) return null;
                }

                // If parent has no direct path and all children are filtered out, hide it.
                if (!normalizedPath && (!children || children.length === 0)) return null;

                return { ...item, path: normalizedPath, children };
            })
            .filter(Boolean) as SidebarItem[];

        return filtered;
    };

    const dedupeMenuItems = (items: SidebarItem[]) => {
        const seenTitles = new Set<string>();
        const normalizeText = (value: string) =>
            (value || '')
                .toLocaleLowerCase('az')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();

        return items.filter((item) => {
            const key = normalizeText(item.title || '');
            if (!key) return false;
            if (seenTitles.has(key)) return false;
            seenTitles.add(key);
            return true;
        });
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand-logo">
                    <Hexagon className="logo-icon" size={24} fill="currentColor" />
                    <span className="brand-name">FORSAJ<span>PANEL</span></span>
                </div>
            </div>

            <div className="sidebar-content">
                <div className="sidebar-section-label">ƏSAS NAVİQASİYA</div>
                <ul className="sidebar-menu">
                    {dedupeMenuItems(filterByRole(menuItems)).map(item => {
                        const fallbackChildPath = item.children?.find(child => !!child.path)?.path;
                        return renderLinkItem(item, item.icon, item.path || fallbackChildPath);
                    })}
                    {menuItems.length === 0 && (
                        <div className="empty-sidebar-msg">
                            <p>Menyu boşdur</p>
                        </div>
                    )}
                </ul>
            </div>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogout}>
                    <LogOut size={18} />
                    <span>Çıxış</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
