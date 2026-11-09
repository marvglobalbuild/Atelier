import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Scissors,
  Users,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MapPin,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  appointmentsQuery,
  ordersQuery,
  customersQuery,
  useBusiness,
  useInvalidate,
  supabase,
} from "@/lib/api";
import { shortDate, longDate, isoDay } from "@/lib/format";
import { PageHeader, Empty, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  validateSearch: (s: Record<string, unknown>): { status?: string; from?: string } => ({
    ...(typeof s.status === "string" ? { status: s.status } : {}),
    ...(typeof s.from === "string" ? { from: s.from } : {}),
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(appointmentsQuery),
      context.queryClient.ensureQueryData(ordersQuery),
      context.queryClient.ensureQueryData(customersQuery),
    ]),
  head: () => ({ meta: [{ title: "Fittings & Calendar — Atelier" }] }),
  component: CalendarPage,
});

export function CalendarPage() {
  const b = useBusiness();
  const inv = useInvalidate();

  const { data: appointments = [] } = useQuery(appointmentsQuery);
  const { data: orders = [] } = useQuery(ordersQuery);
  const { data: customers = [] } = useQuery(customersQuery);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => isoDay(new Date()));
  const [filterType, setFilterType] = useState<string>("all");
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Form states for booking appointment
  const [bookTitle, setBookTitle] = useState("");
  const [bookCustomerId, setBookCustomerId] = useState("");
  const [bookOrderId, setBookOrderId] = useState("");
  const [bookKind, setBookKind] = useState("fitting");
  const [bookDate, setBookDate] = useState(() => isoDay(new Date()));
  const [bookTime, setBookTime] = useState("14:00");
  const [bookNotes, setBookNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar month days calculation
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const days = [];
    // Pad previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      days.push(isoDay(d));
    }
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Map events to date strings
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, typeof appointments>();
    appointments.forEach((apt) => {
      const dayStr = apt.starts_at.slice(0, 10);
      const list = map.get(dayStr) || [];
      list.push(apt);
      map.set(dayStr, list);
    });
    return map;
  }, [appointments]);

  // Map order delivery due dates to date strings
  const deliveriesByDate = useMemo(() => {
    const map = new Map<string, typeof orders>();
    orders.forEach((o) => {
      if (o.due_date && o.status !== "delivered" && o.status !== "cancelled") {
        const list = map.get(o.due_date) || [];
        list.push(o);
        map.set(o.due_date, list);
      }
    });
    return map;
  }, [orders]);

  // Selected date events
  const selectedDayAppointments = appointmentsByDate.get(selectedDate) || [];
  const selectedDayDeliveries = deliveriesByDate.get(selectedDate) || [];

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return toast.error("Please enter a title or purpose");

    const startsAt = new Date(`${bookDate}T${bookTime}:00`).toISOString();
    setIsSubmitting(true);

    try {
      await supabase.from("appointments").insert({
        business_id: b.id,
        title: bookTitle.trim(),
        kind: bookKind,
        customer_id: bookCustomerId || null,
        order_id: bookOrderId || null,
        starts_at: startsAt,
        notes: bookNotes.trim() || null,
      });

      await inv("appointments");
      toast.success("Appointment booked successfully");
      setIsBookOpen(false);
      setBookTitle("");
      setBookNotes("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to schedule appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Remove this appointment?")) return;
    try {
      await supabase.from("appointments").delete().eq("id", id);
      await inv("appointments");
      toast.success("Appointment removed");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to remove appointment");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fittings & Atelier Calendar"
        sub="Track customer fittings, style consultations, and delivery milestones."
        action={
          <Button variant="hero" onClick={() => setIsBookOpen(true)}>
            <Plus className="size-4 mr-2" />
            Book Fitting / Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Month Calendar */}
        <div className="lg:col-span-7 space-y-4">
          <Panel className="p-5">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="font-display text-xl text-foreground flex items-center gap-2">
                <CalendarIcon className="size-5 text-primary" />
                {monthName}
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={prevMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    setSelectedDate(isoDay(today));
                  }}
                >
                  Today
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={nextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground pt-4 pb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-sm">
              {calendarGrid.map((dayStr, idx) => {
                if (!dayStr) {
                  return <div key={`empty-${idx}`} className="h-14 rounded-md bg-secondary/15" />;
                }

                const dayNum = parseInt(dayStr.split("-")[2]!, 10);
                const isSelected = selectedDate === dayStr;
                const isToday = isoDay(new Date()) === dayStr;

                const dayApts = appointmentsByDate.get(dayStr) || [];
                const dayDels = deliveriesByDate.get(dayStr) || [];
                const hasEvents = dayApts.length > 0 || dayDels.length > 0;

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => setSelectedDate(dayStr)}
                    className={cn(
                      "h-14 p-1.5 rounded-md flex flex-col justify-between items-start transition-all relative border text-left",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm font-semibold"
                        : "border-border/60 hover:bg-secondary/60 bg-card",
                      isToday && !isSelected && "ring-1 ring-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground",
                      )}
                    >
                      {dayNum}
                    </span>

                    {/* Dots / Indicators */}
                    {hasEvents && (
                      <div className="flex items-center gap-1 w-full overflow-hidden">
                        {dayApts.some((a) => a.kind === "fitting") && (
                          <span
                            className="size-1.5 rounded-full bg-primary shrink-0"
                            title="Fitting scheduled"
                          />
                        )}
                        {dayApts.some((a) => a.kind === "consultation") && (
                          <span
                            className="size-1.5 rounded-full bg-blue-500 shrink-0"
                            title="Consultation"
                          />
                        )}
                        {dayDels.length > 0 && (
                          <span
                            className="size-1.5 rounded-full bg-success shrink-0"
                            title="Order due"
                          />
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                          {dayApts.length + dayDels.length}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Fitting Session
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500" /> Style Consultation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" /> Order Delivery Deadline
              </span>
            </div>
          </Panel>
        </div>

        {/* Right Column: Selected Day Schedule */}
        <div className="lg:col-span-5 space-y-4">
          <Panel className="p-5 h-full">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <p className="eyebrow">Schedule for</p>
                <h3 className="font-display text-xl text-foreground">{longDate(selectedDate)}</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBookDate(selectedDate);
                  setIsBookOpen(true);
                }}
              >
                <Plus className="size-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* Appointments and Deliveries for Selected Day */}
            <div className="mt-4 space-y-3">
              {selectedDayAppointments.length === 0 && selectedDayDeliveries.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <CalendarDays className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No fittings or deadlines on this day</p>
                  <p className="text-xs mt-1">Select another day or book a new fitting session.</p>
                </div>
              ) : (
                <>
                  {/* Delivery Deadlines */}
                  {selectedDayDeliveries.map((del) => (
                    <div
                      key={`del-${del.id}`}
                      className="p-3.5 rounded-lg border border-success/30 bg-success-soft/30 flex items-start gap-3"
                    >
                      <div className="p-2 rounded bg-success/15 text-success">
                        <Scissors className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-success">
                            Order Due Date
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-success text-white font-medium">
                            {del.status}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-foreground mt-1 truncate">
                          {del.outfit_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Client: {del.customers?.full_name ?? "Client"}
                        </p>
                        <Link
                          to="/orders/$id"
                          params={{ id: del.id }}
                          className="mt-2 text-xs text-primary underline-offset-4 hover:underline block font-medium"
                        >
                          View order details →
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Appointments */}
                  {selectedDayAppointments.map((apt) => {
                    const timeStr = new Date(apt.starts_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const isFitting = apt.kind === "fitting";

                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          "p-3.5 rounded-lg border surface transition-all",
                          isFitting ? "border-primary/20 bg-wine-soft/20" : "border-border",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide",
                                isFitting
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
                              )}
                            >
                              {apt.kind}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" /> {timeStr}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAppointment(apt.id)}
                            title="Cancel appointment"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        <h4 className="font-medium text-sm text-foreground mt-2">{apt.title}</h4>

                        {apt.customers && (
                          <div className="mt-1 flex items-center text-xs text-muted-foreground">
                            <Users className="size-3 mr-1 text-primary" />
                            Client: {apt.customers.full_name}
                          </div>
                        )}

                        {apt.notes && (
                          <p className="mt-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded leading-relaxed">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Schedule Fitting / Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="apt-title">Appointment Title *</Label>
              <Input
                id="apt-title"
                required
                placeholder="e.g., First Fitting — Wine Wrap Dress"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apt-kind">Event Type</Label>
                <select
                  id="apt-kind"
                  value={bookKind}
                  onChange={(e) => setBookKind(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="fitting">Fitting Session</option>
                  <option value="consultation">Design Consultation</option>
                  <option value="pickup">Final Pickup</option>
                  <option value="fabric">Fabric Review</option>
                </select>
              </div>

              <div>
                <Label htmlFor="apt-customer">Customer</Label>
                <select
                  id="apt-customer"
                  value={bookCustomerId}
                  onChange={(e) => setBookCustomerId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select client…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apt-date">Date</Label>
                <Input
                  id="apt-date"
                  type="date"
                  required
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="apt-time">Time</Label>
                <Input
                  id="apt-time"
                  type="time"
                  required
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apt-order">Linked Order (Optional)</Label>
              <select
                id="apt-order"
                value={bookOrderId}
                onChange={(e) => setBookOrderId(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No linked order</option>
                {orders
                  .filter((o) => !bookCustomerId || o.customer_id === bookCustomerId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.outfit_name} ({o.customers?.full_name ?? "Client"})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="apt-notes">Fitting Notes / Preparation</Label>
              <Textarea
                id="apt-notes"
                placeholder="Check pinned zipper, prepare matching lining thread, customer will bring shoes…"
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsBookOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="ink" disabled={isSubmitting}>
                {isSubmitting ? "Booking…" : "Confirm Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
