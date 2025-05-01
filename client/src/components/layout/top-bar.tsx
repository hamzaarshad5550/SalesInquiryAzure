import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusIcon, UserPlusIcon, ListTodoIcon, Sun, Moon, Menu, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";

type TopBarProps = {
  onMenuClick: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const isMobile = useMobile();

  const { data: user } = useQuery({
    queryKey: ['/api/users/current'],
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center flex-1 ml-3">
            <div className="relative w-full max-w-xl">
              <div className="flex items-center">
                <div className="mr-3 text-slate-400 text-sm hidden md:block">Quick Actions:</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2 h-8 text-xs flex items-center"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1.5" /> New Deal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2 h-8 text-xs flex items-center"
                >
                  <UserPlusIcon className="h-3.5 w-3.5 mr-1.5" /> Add Contact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex items-center"
                >
                  <ListTodoIcon className="h-3.5 w-3.5 mr-1.5" /> New Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 bg-destructive w-2 h-2 rounded-full"></span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {!isMobile && (
            <div className="hidden md:flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback>{user?.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="ml-2 font-medium text-sm">{user?.name}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3.5 w-3.5 ml-2 text-slate-500" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
