import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout() {
    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-[280px] shrink-0">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="flex md:hidden items-center p-4 border-b bg-white dark:bg-slate-900 h-16">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu size={24} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r-0 w-[280px]">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                    <div className="ml-4 font-bold text-lg">360Cert</div>
                </header>

                {/* Content Outlet */}
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
