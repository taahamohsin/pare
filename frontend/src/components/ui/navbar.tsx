import { useAuth } from "@/lib/useAuth";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SignInButton from "@/components/ui/sign-in-button";
import logo from "../../assets/logo.svg";

export default function Navbar() {
    const { user, loading } = useAuth();

    const getAvatarUrl = () => {
        if (user?.user_metadata?.avatar_url) {
            return user.user_metadata.avatar_url;
        }
        if (user?.email) {
            const hash = user.email.toLowerCase().trim();
            return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
        }
        return undefined;
    };

    const getUserInitials = () => {
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (user?.email) {
            return user.email.slice(0, 2).toUpperCase();
        }
        return "U";
    };

    return (
        <nav className="border-b bg-zinc-950 text-zinc-50 border-zinc-800">
            <div className="container mx-auto grid grid-cols-3 h-16 items-center px-4">
                <div className="flex justify-start">
                    {/* Placeholder for Sidenav trigger */}
                </div>

                <div className="flex justify-center">
                    <Link to="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
                        <div className="size-9 shrink-0 overflow-hidden">
                            <img
                                src={logo}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex flex-col justify-center border-l border-zinc-800 pl-3">
                            <p className="text-[10px] text-zinc-500 font-medium leading-tight uppercase tracking-wider">
                                AI Powered
                            </p>
                            <h1 className="text-base font-bold leading-tight tracking-tight text-zinc-100">
                                Cover Letter Generator
                            </h1>

                        </div>
                    </Link>
                </div>

                <div className="flex justify-end items-center gap-4">
                    {loading ? (
                        <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-800" />
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            to="/"
                                            className="rounded-full ring-offset-zinc-950 transition-all hover:ring-2 hover:ring-zinc-700 hover:ring-offset-2"
                                        >
                                            <Avatar className="h-9 w-9 border border-zinc-800">
                                                <AvatarImage src={getAvatarUrl()} alt={user.email || "User"} />
                                                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs font-semibold">
                                                    {getUserInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-100 flex flex-col gap-0.5 p-2 shadow-xl">
                                        <p className="font-semibold text-sm">{user.user_metadata?.full_name || "User"}</p>
                                        <p className="text-[11px] text-zinc-400 leading-none">{user.email}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Button
                                onClick={() => logout()}
                                variant="ghost"
                                size="sm"
                                className="h-9 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 gap-2 px-3"
                            >
                                <IconLogout className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <SignInButton />
                    )}
                </div>
            </div>
        </nav>
    );
}
