import { PropsWithChildren, useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import SidebarSneat from "@/Components/SidebarSneat";
import Header from "@/Components/Header";
import { Toaster } from "@/Components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface AuthenticatedLayoutProps {
    title?: string;
    user?: User;
    header?: React.ReactNode;
}

export default function AuthenticatedLayout({
    title,
    children,
    user: propUser,
    header,
}: PropsWithChildren<AuthenticatedLayoutProps>) {
    // Get the user from the page props if not provided explicitly
    const page = usePage().props;
    const user = propUser || page.auth?.user;

    // State for mobile sidebar visibility
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // State for sidebar collapse (desktop) - com persistência
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Carregar estado inicial do localStorage
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    // Persistir estado quando mudar
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
    }, [sidebarCollapsed]);

    // Show toast notifications from flash messages
    useEffect(() => {
        const flash = page.flash as any;
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
    }, [page.flash]);

    return (
        <>
            {title && <Head title={title} />}
            <Toaster position="top-right" richColors />

            <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                {/* Sidebar */}
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition duration-200 ease-in-out",
                        sidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full md:translate-x-0",
                    )}
                >
                    <SidebarSneat 
                        isCollapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />

                    {/* Close sidebar button (mobile only) */}
                    <div
                        className="absolute top-0 right-0 -mr-12 pt-2 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        {sidebarOpen && (
                            <button className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                <span className="sr-only">Close sidebar</span>
                                <svg
                                    className="h-6 w-6 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <Header
                        user={user}
                        onMenuButtonClick={() => setSidebarOpen(true)}
                    />

                    {/* Page Header (if provided) */}
                    {header && (
                        <header className="border-b bg-white shadow-sm">
                            <div className="px-6 py-4">
                                {header}
                            </div>
                        </header>
                    )}

                    {/* Main content */}
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
                        {children}
                    </main>
                </div>
            </div>

            {/* Backdrop for mobile sidebar (shows when sidebar is open) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
}
