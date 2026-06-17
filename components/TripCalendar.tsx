"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DashboardTrip = {
  id: string;
  name: string;
  destination: string;
  cover_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_total?: number;
  status: "CONFIRMED" | "PLANNING" | "ONGOING" | "PAST";
  role?: string;
  members?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string | null;
    role: "owner" | "contributor" | "viewer";
    joined_at?: string | null;
  }[];
};

const TRIP_COLORS = [
  { bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500",   border: "border-l-blue-500"   },
  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  { bg: "bg-violet-100", text: "text-violet-800",  dot: "bg-violet-500",  border: "border-l-violet-500"  },
  { bg: "bg-amber-100",  text: "text-amber-800",   dot: "bg-amber-500",   border: "border-l-amber-500"   },
  { bg: "bg-rose-100",   text: "text-rose-800",    dot: "bg-rose-500",    border: "border-l-rose-500"    },
  { bg: "bg-cyan-100",   text: "text-cyan-800",    dot: "bg-cyan-500",    border: "border-l-cyan-500"    },
  { bg: "bg-orange-100", text: "text-orange-800",  dot: "bg-orange-500",  border: "border-l-orange-500"  },
  { bg: "bg-pink-100",   text: "text-pink-800",    dot: "bg-pink-500",    border: "border-l-pink-500"    },
];

function getTripColor(index: number) {
  return TRIP_COLORS[index % TRIP_COLORS.length];
}

function toLocalDate(dateStr: string): Date {
  // Parse YYYY-MM-DD as local date (avoids UTC offset shifting the day)
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, start: Date, end: Date) {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

type TripWithColor = DashboardTrip & {
  colorIndex: number;
  startDateObj: Date | null;
  endDateObj: Date | null;
};

interface TripCalendarProps {
  trips: DashboardTrip[];
  onTripClick?: (tripId: string) => void;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TripCalendar({ trips, onTripClick }: TripCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const tripsWithColors: TripWithColor[] = useMemo(
    () =>
      trips.map((trip, i) => ({
        ...trip,
        colorIndex: i,
        startDateObj: trip.start_date ? toLocalDate(trip.start_date) : null,
        endDateObj: trip.end_date ? toLocalDate(trip.end_date) : null,
      })),
    [trips]
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startPad = firstDayOfMonth.getDay(); // 0 = Sun
  const totalCells = Math.ceil((startPad + lastDayOfMonth.getDate()) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > lastDayOfMonth.getDate()) return null;
    return new Date(year, month, dayNum);
  });

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }
  function goToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function getTripsForDay(date: Date): TripWithColor[] {
    return tripsWithColors.filter((trip) => {
      if (!trip.startDateObj) return false;
      const end = trip.endDateObj ?? trip.startDateObj;
      return isInRange(date, trip.startDateObj, end);
    });
  }

  function isStartDay(trip: TripWithColor, date: Date) {
    return trip.startDateObj ? isSameDay(trip.startDateObj, date) : false;
  }

  function isEndDay(trip: TripWithColor, date: Date) {
    const end = trip.endDateObj ?? trip.startDateObj;
    return end ? isSameDay(end, date) : false;
  }

  // Legend: only trips that have dates
  const legendTrips = tripsWithColors.filter((t) => t.startDateObj);

  return (
    <div className="rounded-lg border border-[#ead9bf] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ead9bf]">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={goToday}
            className="text-xs font-semibold px-3 py-1 rounded-full border border-[#dfb99d] text-[#7f2a07] hover:bg-[#fff3ea] transition"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-[#f3e4da] text-[#7f2a07] transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-[#f3e4da] text-[#7f2a07] transition"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-[#ead9bf]">
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7" style={{ minHeight: "360px" }}>
        {cells.map((date, i) => {
          const isToday = date ? isSameDay(date, today) : false;
          const isCurrentMonth = date !== null;
          const dayTrips = date ? getTripsForDay(date) : [];

          return (
            <div
              key={i}
              className={[
                "border-r border-b border-[#ead9bf] min-h-[90px] p-1",
                !isCurrentMonth ? "bg-[#faf7f4]" : "bg-white",
                i % 7 === 6 ? "border-r-0" : "",
              ].join(" ")}
            >
              {date && (
                <>
                  {/* Day number */}
                  <div className="flex justify-center mb-1">
                    <span
                      className={[
                        "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-[#9f411d] text-white"
                          : "text-foreground",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Trip pills */}
                  <div className="flex flex-col gap-0.5">
                    {dayTrips.slice(0, 3).map((trip) => {
                      const color = getTripColor(trip.colorIndex);
                      const start = isStartDay(trip, date);
                      const end = isEndDay(trip, date);
                      const single = start && end;

                      return (
                        <button
                          key={trip.id}
                          onClick={() => onTripClick?.(trip.id)}
                          title={trip.name}
                          className={[
                            "w-full text-left text-[10px] font-semibold px-1.5 py-0.5 leading-tight truncate transition hover:brightness-95",
                            color.bg,
                            color.text,
                            // Rounded corners only on start/end, flat edges for spanning days
                            single
                              ? "rounded-md"
                              : start
                              ? "rounded-l-md rounded-r-none"
                              : end
                              ? "rounded-r-md rounded-l-none"
                              : "rounded-none",
                            // Left border accent on start day
                            start ? `border-l-2 ${color.border}` : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {/* Show name only on start day */}
                          {start ? trip.name : "\u00A0"}
                        </button>
                      );
                    })}
                    {dayTrips.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1">
                        +{dayTrips.length - 3} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {legendTrips.length > 0 && (
        <div className="px-4 py-3 border-t border-[#ead9bf] flex flex-wrap gap-3">
          {legendTrips.map((trip) => {
            const color = getTripColor(trip.colorIndex);
            return (
              <div key={trip.id} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-sm ${color.dot}`} />
                <span className="text-xs text-muted-foreground font-medium">
                  {trip.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}