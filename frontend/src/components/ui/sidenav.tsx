import { useState } from "react";
import { Menu, User, BookmarkIcon, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/useAuth";
import { Link } from "@tanstack/react-router";
import { IconLogout } from "@tabler/icons-react";
import { logout } from "@/lib/auth";

export default function Sidenav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 sm:h-9 sm:w-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 shrink-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col">
        <nav className="flex flex-col gap-2 mt-6">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-sm">Home</span>
          </Link>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <User className="h-5 w-5" />
            <span className="text-sm">Profile</span>
          </Link>
          <Link
            to="/saved"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <BookmarkIcon className="h-5 w-5" />
            <span className="text-sm">Saved Cover Letters</span>
          </Link>
        </nav>
        <SheetFooter className="mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 h-auto text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={() => logout()}
          >
            <IconLogout className="h-5 w-5" />
            <span className="text-sm">Logout</span>
          </Button>
        </SheetFooter>
      </SheetContent>

    </Sheet>
  );
}
