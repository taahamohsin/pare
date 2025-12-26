import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ReactNode } from "react";

interface ContentCardProps {
  children: ReactNode;
  footer?: string;
  className?: string;
}

export default function ContentCard({ children, footer, className }: ContentCardProps) {
  return (
    <div className={`flex justify-center min-h-full px-4 py-6 sm:py-8 md:py-12 bg-black ${className}`}>
      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-[880px] bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 my-auto">
        <CardContent className="space-y-6 w-full p-0">
          {children}
        </CardContent>
        {footer && (
          <CardFooter className="justify-center text-sm text-muted-foreground">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
