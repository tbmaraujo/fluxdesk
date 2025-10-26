import { User, LogOut, Settings, Bell } from "lucide-react";
import { Link } from "@inertiajs/react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
    className?: string;
    user: {
        name: string;
        email: string;
    };
    onMenuButtonClick?: () => void;
}

export default function Header({
    className,
    user,
    onMenuButtonClick,
}: HeaderProps) {
    return (
        <header
            className={cn(
                "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 w-full",
                className,
            )}
        >
            <div className="h-full px-6 flex items-center justify-between w-full">
                <div className="flex items-center">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuButtonClick}
                        className="p-1 mr-4 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none md:hidden"
                    >
                        <span className="sr-only">Open menu</span>
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                    {/* Page title or breadcrumb can go here */}
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Icon */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 rounded-full hover:bg-gray-100"
                    >
                        <Bell className="h-5 w-5 text-gray-600" />
                    </Button>

                    {/* User Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-9 w-9 rounded-full p-0 hover:bg-gray-100"
                            >
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-semibold text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={route("profile.edit")}
                                    className="cursor-pointer flex w-full items-center"
                                >
                                    <Settings size={16} className="mr-2" />
                                    Perfil
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="cursor-pointer flex w-full items-center text-red-600 hover:text-red-700"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Sair
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
