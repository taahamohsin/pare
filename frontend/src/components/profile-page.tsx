import { useAuth } from "@/lib/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-full bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 bg-black text-white">
        <p className="text-lg">Please sign in to view your profile</p>
        <Button asChild>
          <Link to="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

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
    <div className="min-h-full bg-black px-4 py-6 sm:py-8 md:py-12">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Profile</h1>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 py-4">
              <Avatar className="size-24 border-2 border-zinc-700">
                <AvatarImage src={getAvatarUrl()} alt={user.email || "User"} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-2xl font-semibold">
                  {getAvatarUrl() ? "" : getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h2 className="text-xl font-semibold text-zinc-100">
                  {user.user_metadata?.full_name || "User"}
                </h2>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-zinc-800 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Provider
                  </label>
                  <p className="text-sm text-zinc-300 mt-1 capitalize">
                    {user.app_metadata?.provider || "GitHub"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Account Created
                  </label>
                  <p className="text-sm text-zinc-300 mt-1">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
