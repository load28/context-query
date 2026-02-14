import { LayoutDashboard, Users, Building2, UserPlus } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";
import { currentViewAtom, formModeAtom } from "@/store/hrStore";
import type { ViewType } from "@/store/types";

const navItems: { view: ViewType; label: string; icon: typeof Users }[] = [
  { view: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { view: "employees", label: "직원 관리", icon: Users },
  { view: "departments", label: "부서 관리", icon: Building2 },
];

export function Sidebar() {
  const [currentView, setCurrentView] = useAtom(currentViewAtom);
  const setFormMode = useSetAtom(formModeAtom);

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      <div className="p-6 border-b border-sidebar-muted">
        <h1 className="text-xl font-bold tracking-tight">HR 인사관리</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">
          Jotai 기반
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === view
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-muted">
        <button
          onClick={() => {
            setCurrentView("employees");
            setFormMode("add");
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={18} />
          직원 추가
        </button>
      </div>
    </aside>
  );
}
