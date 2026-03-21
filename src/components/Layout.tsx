import { Link, useLocation } from "react-router-dom";
import { Scissors } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen linen-texture">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              PatternCraft
            </span>
          </Link>
          {!isHome && (
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                to="/upload"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                New Pattern
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
