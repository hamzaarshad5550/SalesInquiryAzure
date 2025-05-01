import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  PieChart,
  Settings,
  Users,
  Mail,
  CheckSquare,
  Layers
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
};

type TeamItem = {
  id: string;
  name: string;
  color: string;
}

export function Sidebar() {
  const [location] = useLocation();

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/current'],
  });

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <Home className="w-5 h-5 mr-3" />,
      active: location === "/",
    },
    {
      label: "Pipeline",
      href: "/pipeline",
      icon: <Layers className="w-5 h-5 mr-3" />,
      active: location === "/pipeline",
    },
    {
      label: "Contacts",
      href: "/contacts",
      icon: <Users className="w-5 h-5 mr-3" />,
      active: location === "/contacts",
    },
    {
      label: "Tasks",
      href: "/tasks",
      icon: <CheckSquare className="w-5 h-5 mr-3" />,
      active: location === "/tasks",
    },
    {
      label: "Messages",
      href: "/messages",
      icon: <Mail className="w-5 h-5 mr-3" />,
      active: location === "/messages",
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: <PieChart className="w-5 h-5 mr-3" />,
      active: location === "/analytics",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
      active: location === "/settings",
    },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 flex-shrink-0">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">NexusFlow</h1>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="relative mt-2 mb-4">
          <Input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"
          />
          <div className="absolute left-3 top-2.5 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md",
                item.active
                  ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 font-medium"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-4 py-2 border-t border-slate-200 dark:border-slate-700">
        <div className="pt-2 pb-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Teams
          </p>
          <div className="space-y-1">
            {teamsLoading ? (
              <>
                <div className="flex items-center space-x-3 py-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center space-x-3 py-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </>
            ) : (
              teams?.map((team: TeamItem) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-3`}
                    style={{ backgroundColor: team.color }}
                  />
                  <span>{team.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center px-3 py-3 mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          {userLoading ? (
            <>
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="ml-3 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </>
          ) : (
            <>
              <Avatar>
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback>{user?.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
