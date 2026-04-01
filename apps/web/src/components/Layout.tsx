import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, localeLabel, toggleLocale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function isActive(path: string) {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="absolute -top-full left-4 z-10000 px-5 py-3 bg-accent-primary text-bg-primary font-bold rounded-sm font-display transition-[top] duration-200 focus:top-4"
      >
        {t("layout.skipToContent")}
      </a>
      <nav
        className="bg-bg-glass backdrop-blur-xl border-b border-border px-8 h-[68px] flex items-center justify-between sticky top-0 z-50 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-px after:bg-border-accent"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="font-display text-[1.3rem] font-extrabold text-accent-primary flex items-center gap-2 tracking-tight"
        >
          <span className="text-[1.5rem] text-current!">⚡</span> FlashMind
        </Link>
        <ul className="flex items-center gap-1 list-none">
          {user ? (
            <>
              <li>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-sm font-medium text-sm font-display transition-colors ${isActive("/") && location.pathname === "/" ? "text-accent-primary bg-accent-primary/10" : "text-text-secondary hover:text-text-primary hover:bg-white/5"}`}
                >
                  {t("layout.dashboard")}
                </Link>
              </li>
              <li>
                <Link
                  to="/decks"
                  className={`px-4 py-2 rounded-sm font-medium text-sm font-display transition-colors ${isActive("/decks") ? "text-accent-primary bg-accent-primary/10" : "text-text-secondary hover:text-text-primary hover:bg-white/5"}`}
                >
                  {t("layout.decks")}
                </Link>
              </li>
              <li>
                <button
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-bold text-[0.75rem] font-display transition-all whitespace-nowrap tracking-widest uppercase bg-white/5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 border border-border hover:border-accent-primary/30"
                  onClick={toggleLocale}
                  aria-label={`Switch language to ${localeLabel === "EN" ? "Portuguese" : "English"}`}
                  id="locale-toggle"
                >
                  {localeLabel}
                </button>
              </li>
              <li>
                <div className="relative" ref={menuRef}>
                  <button
                    className="w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary font-bold text-sm flex items-center justify-center transition-colors hover:bg-accent-primary/30 cursor-pointer"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="User menu"
                    aria-expanded={menuOpen}
                  >
                    {user?.name?.charAt(0).toUpperCase() || "?"}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-bg-secondary border border-border rounded-lg shadow-lg min-w-[180px] py-1 z-50 animate-fade-in">
                      <Link
                        to="/settings"
                        className="block px-4 py-2.5 text-sm font-display text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t("layout.settings")}
                      </Link>
                      <div className="h-px bg-border mx-2" />
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-display text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                        onClick={() => {
                          setMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        {t("layout.signOut")}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            </>
          ) : (
            <>
              <li>
                <button
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-bold text-[0.75rem] font-display transition-all whitespace-nowrap tracking-widest uppercase bg-white/5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 border border-border hover:border-accent-primary/30"
                  onClick={toggleLocale}
                  aria-label={`Switch language to ${localeLabel === "EN" ? "Portuguese" : "English"}`}
                  id="locale-toggle"
                >
                  {localeLabel}
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
      <main
        className="flex-1 py-10 px-8 w-full max-w-[1200px] mx-auto max-md:py-5 max-md:px-4"
        id="main-content"
      >
        <Outlet />
      </main>
    </div>
  );
}
