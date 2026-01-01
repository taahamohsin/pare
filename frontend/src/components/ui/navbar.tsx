import { useAuthContext } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SignInButton from "@/components/ui/sign-in-button";
import Sidenav from "@/components/ui/sidenav";
import logo from "../../assets/logo.svg";
import { useState } from "react";

export default function Navbar() {
    const { user, loading } = useAuthContext();
    const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

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
        <nav className="border-b bg-zinc-950 text-zinc-50 border-zinc-800 overflow-x-hidden">
            <div className="w-full flex h-16 items-center justify-between px-2 sm:px-4 md:px-6 gap-2">
                <div className="flex-1 flex justify-start min-w-0">
                    <Sidenav />
                </div>

                <div className="flex-none flex justify-center">
                    <Link to="/" className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90">
                        <div className="size-7 sm:size-8 md:size-9 shrink-0 overflow-hidden">
                            <img
                                src={logo}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex flex-col justify-center sm:border-l border-zinc-800 sm:pl-2 md:pl-3">
                            <h1 className="text-xs sm:text-sm md:text-base font-bold leading-tight tracking-tight text-zinc-100 whitespace-nowrap">
                                Pare
                            </h1>

                        </div>
                    </Link>
                </div>

                <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                    {loading || isSigningIn ? (
                        <div className="h-9 w-20 sm:w-24 animate-pulse rounded-md bg-zinc-800" />
                    ) : user ? (
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            to="/"
                                            className="rounded-full ring-offset-zinc-950 transition-all hover:ring-2 hover:ring-zinc-700 hover:ring-offset-2 shrink-0"
                                        >
                                            <Avatar className="size-8 sm:size-9 border border-zinc-800">
                                                <AvatarImage src={getAvatarUrl()} alt={user.email || "User"} />
                                                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs font-semibold">
                                                    {getAvatarUrl() ? "" : getUserInitials()}
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
                                className="h-8 w-8 sm:h-9 sm:w-9 md:w-auto text-zinc-400 hover:text-red-400 hover:bg-red-950/20 px-0 md:px-3 shrink-0"
                            >
                                <IconLogout className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    ) : (
                        <SignInButton setIsSigningIn={setIsSigningIn} />
                    )}
                </div>
            </div>
        </nav>
    );
}
