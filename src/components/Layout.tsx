import { Link, useLocation } from "react-router-dom";
import { Scissors, LogOut, User, FolderOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user, loading, signOut } = useAuth();

  return (
    <div className="min-h-screen linen-texture">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              PatternCraft
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {!isHome && (
              <>
                <Link
                  to="/"
                  className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                  Home
                </Link>
                <Link
                  to="/upload"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  New Pattern
                </Link>
              </>
            )}

            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {user.user_metadata?.display_name || user.email?.split("@")[0] || "Account"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/my-patterns" className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" /> My Patterns
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
