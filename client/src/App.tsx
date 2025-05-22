import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Pipeline from "@/pages/pipeline";
import Contacts from "@/pages/contacts";
import ContactForm from "@/pages/contact-form";
import ContactDetail from "@/pages/contact-detail";
import ContactsGoogle from "@/pages/contacts-google";
import Tasks from "@/pages/tasks";
import Messages from "@/pages/messages";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Calendar from "@/pages/calendar";
import { AuthProvider } from "./context/AuthContext";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useState } from "react";

function Router() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/50 ${
          sidebarOpen ? "block" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>
      
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Login} />
          <Route path="/pipeline" component={Pipeline} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/contacts/new" component={ContactForm} />
          <Route path="/contacts/:id" component={ContactDetail} />
          <Route path="/contacts-google" component={ContactsGoogle} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/messages" component={Messages} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
