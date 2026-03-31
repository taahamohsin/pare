import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import ApiKeySettings from "@/components/api-key-settings";

export default function ProfilePage() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-full bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) return null;

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
    <div className="min-h-full min-w-full bg-black px-4 py-6 sm:py-8 md:py-12 flex items-center justify-center">
      <div className="container mx-auto flex flex-col items-center justify-center space-y-6">
        <Card className="w-full max-w-2xl bg-white border-zinc-200 text-black shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="size-24 border-2 border-zinc-700">
                <AvatarImage src={getAvatarUrl()} alt={user.email || "User"} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-2xl font-semibold">
                  {getAvatarUrl() ? "" : getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold">
                  {user.user_metadata?.full_name || "User"}
                </h2>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div className="flex flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider">
                    Provider
                  </label>
                  <p className="text-sm mt-1 capitalize">
                    {user.app_metadata?.provider || "GitHub"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <label className="text-xs font-medium uppercase tracking-wider">
                    Account Created
                  </label>
                  <p className="text-sm mt-1">
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

        <div className="w-full max-w-2xl">
          <ApiKeySettings />
        </div>
      </div>
    </div>
  );
}
