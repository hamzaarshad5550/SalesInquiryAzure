import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCalendarEvents, getMonthDateRange, createCalendarEvent } from "@/lib/googleApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addDays, subDays } from "date-fns";

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

type ViewMode = "month" | "week" | "day";

export function AdvancedCalendar() {
  const { currentUser, isGoogleApiInitialized, oauthToken } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  // Format date to display
  const formatDate = (date: Date) => {
    return format(date, "MMMM d, yyyy");
  };

  // Navigate to previous period
  const prevPeriod = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (viewMode) {
        case "month":
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() - 7);
          break;
        case "day":
          newDate.setDate(newDate.getDate() - 1);
          break;
      }
      return newDate;
    });
  };

  // Navigate to next period
  const nextPeriod = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (viewMode) {
        case "month":
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() + 7);
          break;
        case "day":
          newDate.setDate(newDate.getDate() + 1);
          break;
      }
      return newDate;
    });
  };

  // Fetch calendar events
  useEffect(() => {
    if (!isGoogleApiInitialized || !oauthToken) {
      setError("Google API not initialized");
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        let timeMin: string;
        let timeMax: string;

        switch (viewMode) {
          case "month":
            const { timeMin: monthMin, timeMax: monthMax } = getMonthDateRange(
              currentDate.getFullYear(),
              currentDate.getMonth()
            );
            timeMin = monthMin;
            timeMax = monthMax;
            break;
          case "week":
            timeMin = startOfWeek(currentDate).toISOString();
            timeMax = endOfWeek(currentDate).toISOString();
            break;
          case "day":
            timeMin = new Date(currentDate.setHours(0, 0, 0, 0)).toISOString();
            timeMax = new Date(currentDate.setHours(23, 59, 59, 999)).toISOString();
            break;
        }

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
  }, [currentDate, viewMode, isGoogleApiInitialized, oauthToken]);

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : event.start.date 
          ? new Date(event.start.date) 
          : null;

      if (!eventStart) return false;

      return isSameDay(eventStart, date);
    });
  };

  // Format time from ISO string
  const formatTime = (dateTimeString?: string): string => {
    if (!dateTimeString) return "";
    return format(new Date(dateTimeString), "h:mm a");
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Add days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(new Date(year, month, -i));
    }
    currentWeek.reverse();

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    // Add days from next month
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(year, month + 1, currentWeek.length + 1));
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((date, dayIndex) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonth = date.getMonth() === month;
              const isCurrentDay = isToday(date);

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "min-h-[120px] p-2 border rounded-lg flex flex-col",
                    !isCurrentMonth && "bg-gray-50 dark:bg-gray-800 text-gray-400",
                    isCurrentDay && "border-primary bg-primary/5",
                    "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full",
                      isCurrentDay ? "bg-primary text-primary-foreground" : "text-gray-900 dark:text-gray-50",
                      !isCurrentMonth && "text-gray-400 dark:text-gray-600 bg-transparent"
                    )}>
                      {format(date, "d")}
                    </span>
                    {isCurrentDay && (
                      <Badge variant="secondary" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 overflow-y-auto flex-grow">
                    {dayEvents.map((event) => (
                      <Popover key={event.id}>
                        <PopoverTrigger asChild>
                          <div
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer transition-colors break-words",
                              isCurrentDay ? "bg-primary/20 hover:bg-primary/30" : "bg-secondary/20 hover:bg-secondary/30"
                            )}
                            title={event.summary}
                          >
                            <div className="font-medium truncate">
                              {event.summary}
                            </div>
                            {event.start.dateTime && (
                              <div className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(event.start.dateTime)}
                              </div>
                            )}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none break-words">{event.summary}</h4>
                              {event.start.dateTime && (
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2" />
                                  {format(new Date(event.start.dateTime), "PPP")} {formatTime(event.start.dateTime)}
                                  {event.end?.dateTime && ` - ${formatTime(new Date(event.end.dateTime))}`}
                                </p>
                              )}
                              {event.location && (
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            {event.description && (
                              <div className="text-sm text-muted-foreground break-words">
                                {event.description}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((date) => {
          const dayEvents = getEventsForDay(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "min-h-[600px] p-2 border rounded-lg",
                isCurrentDay && "border-primary"
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={cn(
                  "text-sm font-medium",
                  isCurrentDay && "text-primary"
                )}>
                  {format(date, "EEE d")}
                </span>
                {isCurrentDay && (
                  <Badge variant="secondary" className="text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <Popover key={event.id}>
                    <PopoverTrigger asChild>
                      <div
                        className="text-xs p-2 bg-primary/10 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                        title={event.summary}
                      >
                        <div className="font-medium truncate">
                          {event.summary}
                        </div>
                        {event.start.dateTime && (
                          <div className="text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(event.start.dateTime)}
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">{event.summary}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-500">{event.description}</p>
                        )}
                        {event.start.dateTime && (
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2" />
                            {format(new Date(event.start.dateTime), "PPp")}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter(event => {
            if (!event.start.dateTime) return false;
            const eventHour = new Date(event.start.dateTime).getHours();
            return eventHour === hour;
          });

          return (
            <div key={hour} className="flex gap-4">
              <div className="w-20 text-sm text-gray-500">
                {format(new Date().setHours(hour, 0), "h:mm a")}
              </div>
              <div className="flex-1 min-h-[60px] border-t pt-2">
                {hourEvents.map((event) => (
                  <Popover key={event.id}>
                    <PopoverTrigger asChild>
                      <div
                        className="text-sm p-2 bg-primary/10 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                        title={event.summary}
                      >
                        <div className="font-medium">
                          {event.summary}
                        </div>
                        {event.start.dateTime && (
                          <div className="text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(event.start.dateTime)}
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">{event.summary}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-500">{event.description}</p>
                        )}
                        {event.start.dateTime && (
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2" />
                            {format(new Date(event.start.dateTime), "PPp")}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your calendar</h1>
          <p>You need to be signed in to access your Google Calendar events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-none p-4 border-b">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Calendar</h1>
              <p className="text-gray-500 dark:text-gray-400">View your Google Calendar events</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select
                value={viewMode}
                onValueChange={(value: ViewMode) => setViewMode(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => setIsAppointmentFormOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          <Card className="w-full shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{formatDate(currentDate)}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={prevPeriod}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextPeriod}>
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
                  {Array(6).fill(0).map((_, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-2">
                      {Array(7).fill(0).map((_, dayIndex) => (
                        <div key={dayIndex} className="aspect-square">
                          <Skeleton className="w-full h-full" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {viewMode === "month" && renderMonthView()}
                  {viewMode === "week" && renderWeekView()}
                  {viewMode === "day" && renderDayView()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
} 