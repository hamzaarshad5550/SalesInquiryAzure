import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCalendarEvents, getMonthDateRange, createCalendarEvent } from "../lib/googleApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
}

export default function CalendarPage() {
  const { currentUser, isGoogleApiInitialized, oauthToken } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<(Date | null)[][]>([]);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  
  // Format date to display
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  // Generate calendar grid for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate total number of days to display (previous month, current month, next month)
    const daysInMonth = lastDay.getDate();
    
    // Build calendar grid with 6 rows (max possible for a month)
    const tempCalendar: Array<Array<Date | null>> = [];
    
    // Build array of week arrays
    let currentWeek: Array<Date | null> = [];
    
    // Add days from previous month to fill in first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(year, month, day));
      
      // Start a new week if we reached Sunday or end of month
      if (currentWeek.length === 7) {
        tempCalendar.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill in the remaining days of the last week if needed
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      tempCalendar.push(currentWeek);
    }
    
    setCalendar(tempCalendar);
  }, [currentDate]);
  
  // Fetch calendar events when month changes or Google API is initialized
  useEffect(() => {
    if (!isGoogleApiInitialized) {
      setError("Google API not initialized");
      setLoading(false);
      return;
    }
    
    if (!oauthToken) {
      setError("Authentication token missing. Please log in again.");
      setLoading(false);
      return;
    }
    
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const { timeMin, timeMax } = getMonthDateRange(year, month);
        
        const calendarEvents = await getCalendarEvents(timeMin, timeMax);
        setEvents(calendarEvents);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching calendar events:", err);
        setError(err.message || "Failed to fetch calendar events");
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentDate, isGoogleApiInitialized, oauthToken]);
  
  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : event.start.date 
          ? new Date(event.start.date) 
          : null;
      
      if (!eventStart) return false;
      
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Format time from ISO string
  const formatTime = (dateTimeString?: string): string => {
    if (!dateTimeString) return "";
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateTimeString;
    }
  };
  
  if (!currentUser) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your calendar</h1>
        <p>You need to be signed in to access your Google Calendar events.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400">View your Google Calendar events</p>
        </div>
        
        <Button 
          onClick={() => setIsAppointmentFormOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Appointment
        </Button>
      </div>
      
      {/* Appointment form dialog */}
      <AppointmentForm 
        isOpen={isAppointmentFormOpen}
        onClose={() => setIsAppointmentFormOpen(false)}
        onSuccess={() => {
          // Refresh calendar events after adding a new appointment
          const fetchEvents = async () => {
            setLoading(true);
            try {
              const { timeMin, timeMax } = getMonthDateRange(
                currentDate.getFullYear(), 
                currentDate.getMonth()
              );
              const calendarEvents = await getCalendarEvents(timeMin, timeMax);
              setEvents(calendarEvents);
            } catch (err: any) {
              console.error("Error fetching calendar events:", err);
              setError(err.message || "Failed to fetch calendar events");
            } finally {
              setLoading(false);
            }
          };
          fetchEvents();
        }}
      />
      
      <Card id="calendarView" className="w-full shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{formatMonth(currentDate)}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center font-medium text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>
              {Array(6)
                .fill(0)
                .map((_, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {Array(7)
                      .fill(0)
                      .map((_, dayIndex) => (
                        <Skeleton 
                          key={dayIndex} 
                          className="h-24 rounded-md"
                        />
                      ))}
                  </div>
                ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-400">
              <p className="font-medium mb-2">Error loading calendar events</p>
              <p className="text-sm mb-3">{error}</p>
              
              {error && (error.includes("Permission denied") || error.includes("API not initialized")) && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300 mt-4 text-sm">
                  <p className="font-medium mb-2">API Services Need to be Enabled</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Go to the <a href="https://console.developers.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Cloud Console</a></li>
                    <li>Select your project (ID: 88311205730)</li>
                    <li>Click on "Enable APIs and Services"</li>
                    <li>Search for and enable each of these APIs:
                      <ul className="list-disc pl-5 mt-1">
                        <li>Gmail API</li>
                        <li>Google Calendar API</li>
                        <li>People API</li>
                      </ul>
                    </li>
                    <li>After enabling the APIs, wait a few minutes and try again</li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center font-medium text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                {calendar.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {week.map((day, dayIndex) => {
                      const isToday = day && 
                        day.getDate() === new Date().getDate() &&
                        day.getMonth() === new Date().getMonth() &&
                        day.getFullYear() === new Date().getFullYear();
                      
                      const dayEvents = day ? getEventsForDay(day) : [];
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`min-h-[100px] p-2 border rounded-md ${
                            !day ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600' : 
                            isToday ? 'border-primary bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          {day && (
                            <>
                              <div className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                                {day.getDate()}
                              </div>
                              <div className="mt-1 space-y-1">
                                {dayEvents.length > 0 ? (
                                  dayEvents.slice(0, 3).map((event) => (
                                    <div 
                                      key={event.id} 
                                      className="text-xs p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded truncate"
                                      title={event.summary}
                                    >
                                      {event.start.dateTime && (
                                        <span className="font-medium mr-1">
                                          {formatTime(event.start.dateTime)}
                                        </span>
                                      )}
                                      {event.summary}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-gray-400 italic">No events</div>
                                )}
                                {dayEvents.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{dayEvents.length - 3} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
