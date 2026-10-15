import { useState, useEffect } from "react";
import type { Profile } from "@/lib/data/me";
import {
  groundOwnerOverview,
  updateGroundDetails,
  createGround,
  cancelBooking,
} from "@/lib/data/actions";
import { rupees, formatDate } from "@/lib/ids";
import { GroundPhotoModal } from "@/components/sports/GroundPhotoModal";
import {
  MapPin,
  CalendarDays,
  TrendingUp,
  Plus,
  RefreshCw,
  LogOut,
  Camera,
  Edit2,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface TurfOwnerAdminPanelProps {
  profile: Profile;
  onSignOut: () => void;
}

export function TurfOwnerAdminPanel({ profile, onSignOut }: TurfOwnerAdminPanelProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof groundOwnerOverview>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"grounds" | "bookings" | "revenue" | "settings">("grounds");
  const [bookingFilter, setBookingFilter] = useState<string>("all");

  // Edit turf modal state
  const [editingGround, setEditingGround] = useState<{
    id: string;
    name: string;
    city: string;
    locality: string;
    price_per_hour: number;
    pitch_type: string;
    facilities: string;
    description: string;
  } | null>(null);

  // Photo modal state
  const [photoGround, setPhotoGround] = useState<{
    id: string;
    name: string;
    city?: string;
    image_url?: string;
  } | null>(null);

  // Register new turf modal state
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTurfForm, setNewTurfForm] = useState({
    name: "",
    city: profile.city || "Bengaluru",
    locality: "",
    pitch_type: "Box turf",
    price_per_hour: 900,
    description: "Enclosed floodlit turf arena with professional amenities.",
    facilities: "Floodlights,Changing room,Parking,Water",
    image_url: "/grounds/koramangala.jpg",
  });

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await groundOwnerOverview();
      setData(res);
    } catch (e) {
      console.error("Failed to load turf owner overview:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groundsList = data?.grounds ?? [];
  const bookingsList = data?.upcoming ?? [];
  const filteredBookings =
    bookingFilter === "all"
      ? bookingsList
      : bookingsList.filter((b) => (b.status || "confirmed") === bookingFilter);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ─── Top Control Header ─── */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="gz-wrap-wide flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              GenZ360
            </span>
            <span className="text-line">/</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-700">
                Turf Owner Admin
              </span>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {profile.org_name || "Arena Operations"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-block text-xs text-mute font-medium">
              {profile.display_name}
            </span>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="gz-btn gz-btn-ghost !min-h-8 !px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="gz-btn !min-h-8 !px-3 text-xs text-coral border border-coral/30 hover:bg-coral/10 hover:border-coral transition-colors rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="gz-wrap-wide py-8 space-y-8 animate-gz-fade-in">
        {/* ─── Executive Welcome Banner ─── */}
        <div className="rounded-2xl border border-line bg-gradient-to-r from-white via-white to-amber-50/40 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                <ShieldCheck className="h-3 w-3 text-amber-600" />
                Verified Arena Partner
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              {profile.org_name || "Turf Operations Command"}
            </h1>
            <p className="text-xs text-ink-soft max-w-[65ch]">
              Manage only your authorized box cricket pitches, pricing, amenities, live slot reservations, and automated revenue settlements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRegistering(true)}
            className="gz-btn gz-btn-primary shrink-0 text-xs !min-h-9 !px-4 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Register New Turf</span>
          </button>
        </div>

        {/* ─── Metric Cards ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="gz-card-interactive rounded-2xl border border-line bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <p className="gz-kicker text-mute">Today's Bookings</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <CalendarDays className="h-4 w-4" />
              </span>
            </div>
            <p className="font-display text-3xl font-bold tabular-nums text-ink">
              {loading ? "…" : data?.today ?? 0}
            </p>
            <p className="text-[11px] text-mute mt-1">Confirmed match slots today</p>
          </div>

          <div className="gz-card-interactive rounded-2xl border border-line bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <p className="gz-kicker text-mute">Weekly Turf Revenue</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="font-display text-3xl font-bold tabular-nums text-emerald-600">
              {loading ? "…" : rupees(data?.revenue ?? 0)}
            </p>
            <p className="text-[11px] text-mute mt-1">Settled weekly gross earnings</p>
          </div>

          <div className="gz-card-interactive rounded-2xl border border-line bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <p className="gz-kicker text-mute">Active Grounds</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <MapPin className="h-4 w-4" />
              </span>
            </div>
            <p className="font-display text-3xl font-bold tabular-nums text-ink">
              {loading ? "…" : groundsList.length}
            </p>
            <p className="text-[11px] text-mute mt-1">Facilities registered under your account</p>
          </div>

          <div className="gz-card-interactive rounded-2xl border border-line bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <p className="gz-kicker text-mute">Payout Status</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/10 text-mint">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="font-display text-xl font-bold text-mint mt-1">
              Direct UPI Live
            </p>
            <p className="text-[11px] text-mute mt-1">Next auto-settlement at midnight</p>
          </div>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="flex items-center gap-1 border-b border-line overflow-x-auto">
          {[
            { id: "grounds", label: "My Grounds & Pitches", count: groundsList.length, icon: MapPin },
            { id: "bookings", label: "Bookings Ledger", count: bookingsList.length, icon: CalendarDays },
            { id: "revenue", label: "Revenue & Settlements", icon: TrendingUp },
            { id: "settings", label: "Facility Settings", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer -mb-px whitespace-nowrap ${
                  isActive
                    ? "border-amber-600 text-amber-700 font-bold"
                    : "border-transparent text-mute hover:text-ink hover:border-line"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="font-mono text-xs font-bold bg-paper-2 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: MY GROUNDS & PITCHES
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "grounds" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  Your Registered Sports Facilities
                </h2>
                <p className="text-xs text-mute mt-0.5">
                  You can edit pricing, details, and photos for only your owned facilities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="gz-btn gz-btn-primary !min-h-8 !px-3 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Register Turf</span>
              </button>
            </div>

            {groundsList.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-12 text-center space-y-3">
                <MapPin className="h-8 w-8 text-amber-500 mx-auto" />
                <h3 className="font-display text-lg font-bold">No Turfs Registered Yet</h3>
                <p className="text-xs text-mute max-w-sm mx-auto">
                  Click the button below to register your sports facility or box cricket cage on GenZ360.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="gz-btn gz-btn-primary !min-h-8 !px-4 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Register First Turf</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groundsList.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="relative h-48 w-full bg-paper-2 overflow-hidden">
                        <img
                          src={g.image_url}
                          alt={g.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-mono text-white font-semibold uppercase tracking-wider">
                          {g.pitch_type || "Box Turf"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhotoGround(g)}
                          className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black/90 text-white text-[11px] font-semibold backdrop-blur-xs shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Camera className="h-3 w-3" />
                          <span>Change Photo</span>
                        </button>
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-lg font-bold text-ink leading-snug">
                            {g.name}
                          </h3>
                        </div>
                        <p className="text-xs text-mute flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span>{g.locality ? `${g.locality}, ${g.city}` : g.city}</span>
                        </p>
                        <div className="pt-2 flex flex-wrap gap-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-2 text-ink-soft">
                            ₹{g.price_per_hour}/hr
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                            Verified Owner
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-line/60 mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-mute block">Rate</span>
                        <span className="text-base font-bold text-accent font-mono">
                          {rupees(g.price_per_hour)}/hr
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingGround({
                              id: g.id,
                              name: g.name,
                              city: g.city,
                              locality: g.locality,
                              price_per_hour: g.price_per_hour,
                              pitch_type: g.pitch_type,
                              facilities: "Floodlights,Changing room,Parking,Water",
                              description: "Enclosed floodlit turf arena with professional amenities.",
                            })
                          }
                          className="gz-btn gz-btn-ghost !min-h-8 !px-3 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: BOOKINGS LEDGER
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Turf Bookings Ledger</h2>
                <p className="text-xs text-mute mt-0.5">
                  Real-time schedule of all student and public slot reservations on your grounds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {["all", "confirmed", "cancelled"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setBookingFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      bookingFilter === filter
                        ? "bg-amber-600 text-white"
                        : "bg-paper-2 text-ink-soft hover:text-ink"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-10 text-center space-y-2">
                <CalendarDays className="h-7 w-7 text-mute mx-auto" />
                <p className="text-sm font-semibold">No bookings found for this filter</p>
                <p className="text-xs text-mute">Incoming match reservations will appear here.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
                <table className="gz-table w-full">
                  <thead>
                    <tr>
                      <th>Ground / Pitch</th>
                      <th>Match Date</th>
                      <th>Time Slot</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="font-semibold text-ink">{b.name}</td>
                        <td className="tabular-nums font-mono text-xs">{formatDate(b.booking_date)}</td>
                        <td className="tabular-nums font-mono text-xs">{b.slot_start}</td>
                        <td className="tabular-nums font-bold text-emerald-600 font-mono">
                          {rupees(b.amount)}
                        </td>
                        <td>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              b.status === "cancelled"
                                ? "bg-coral/10 text-coral"
                                : "bg-mint/10 text-mint"
                            }`}
                          >
                            {b.status || "confirmed"}
                          </span>
                        </td>
                        <td>
                          {b.status !== "cancelled" ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Cancel this booking slot?")) {
                                  await cancelBooking({ data: { id: b.id } });
                                  load(true);
                                }
                              }}
                              className="text-xs text-coral hover:underline font-medium cursor-pointer"
                            >
                              Cancel Slot
                            </button>
                          ) : (
                            <span className="text-xs text-mute">Cancelled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 3: REVENUE & SETTLEMENTS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "revenue" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Settlement & Payout Ledger</h2>
              <p className="text-xs text-mute mt-0.5">
                Automated platform settlements for {profile.org_name || "your sports facility"}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="gz-panel rounded-2xl p-5 border border-line bg-white">
                <p className="gz-kicker text-mute">Current Week Revenue</p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-emerald-600">
                  {rupees(data?.revenue ?? 0)}
                </p>
                <p className="text-[11px] text-mute mt-1">Processed through GenZ360 Pay</p>
              </div>

              <div className="gz-panel rounded-2xl p-5 border border-line bg-white">
                <p className="gz-kicker text-mute">Settlement Frequency</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">T+1 Daily Payout</p>
                <p className="text-[11px] text-mute mt-1">Direct to registered bank UPI account</p>
              </div>

              <div className="gz-panel rounded-2xl p-5 border border-line bg-white">
                <p className="gz-kicker text-mute">Platform Service Fee</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">0% Promotional</p>
                <p className="text-[11px] text-mute mt-1">Zero commission for registered arena partners</p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
              <h3 className="font-display text-base font-bold text-ink">Payout Method</h3>
              <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-paper/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    UPI
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Direct UPI Auto-Settlement</p>
                    <p className="text-xs text-mute font-mono">smasharena@icici · Verified</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-mint/10 text-mint">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 4: FACILITY SETTINGS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Facility Information</h2>
              <p className="text-xs text-mute mt-0.5">
                Official contact and location information for your sports arena.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-soft">Arena Business Name</label>
                <input
                  className="gz-input mt-1"
                  defaultValue={profile.org_name || "Smash Arena Sports Complex"}
                  disabled
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Operations Manager</label>
                  <input
                    className="gz-input mt-1"
                    defaultValue={profile.display_name}
                    disabled
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">City</label>
                  <input
                    className="gz-input mt-1"
                    defaultValue={profile.city || "Bengaluru"}
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-soft">Operating Hours</label>
                <input
                  className="gz-input mt-1"
                  defaultValue="6:00 AM – 11:30 PM (All 7 Days)"
                  disabled
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-soft">Amenities Provided</label>
                <p className="text-xs text-ink-soft mt-1 bg-paper/50 p-3 rounded-xl border border-line">
                  Floodlit illumination, changing rooms, mineral water dispenser, parking, first-aid box, clean turf rubber granule infill.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Edit Details Modal ─── */}
      {editingGround && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-line animate-gz-scale-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-lg font-bold text-ink">Edit Turf Details</h3>
              <button
                type="button"
                onClick={() => setEditingGround(null)}
                className="p-1 rounded-lg hover:bg-paper-2 text-mute cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSaving(true);
                try {
                  await updateGroundDetails({
                    data: {
                      groundId: editingGround.id,
                      name: editingGround.name,
                      city: editingGround.city,
                      locality: editingGround.locality,
                      price_per_hour: Number(editingGround.price_per_hour),
                      pitch_type: editingGround.pitch_type,
                      facilities: editingGround.facilities,
                      description: editingGround.description,
                    },
                  });
                  setEditingGround(null);
                  load(true);
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to update turf details");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              <div>
                <label className="text-xs font-semibold text-ink-soft">Ground Name</label>
                <input
                  className="gz-input mt-1"
                  value={editingGround.name}
                  onChange={(e) => setEditingGround({ ...editingGround, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-soft">City</label>
                  <input
                    className="gz-input mt-1"
                    value={editingGround.city}
                    onChange={(e) => setEditingGround({ ...editingGround, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Locality</label>
                  <input
                    className="gz-input mt-1"
                    value={editingGround.locality}
                    onChange={(e) => setEditingGround({ ...editingGround, locality: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Hourly Rate (₹)</label>
                  <input
                    className="gz-input mt-1"
                    type="number"
                    min={100}
                    value={editingGround.price_per_hour}
                    onChange={(e) =>
                      setEditingGround({ ...editingGround, price_per_hour: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Pitch Type</label>
                  <input
                    className="gz-input mt-1"
                    value={editingGround.pitch_type}
                    onChange={(e) => setEditingGround({ ...editingGround, pitch_type: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-soft">Facilities</label>
                <input
                  className="gz-input mt-1"
                  value={editingGround.facilities}
                  onChange={(e) => setEditingGround({ ...editingGround, facilities: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-soft">Description</label>
                <textarea
                  className="gz-input mt-1 min-h-[70px]"
                  value={editingGround.description}
                  onChange={(e) => setEditingGround({ ...editingGround, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingGround(null)}
                  className="gz-btn gz-btn-ghost text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="gz-btn gz-btn-primary text-xs cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Register New Turf Modal ─── */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-line animate-gz-scale-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-500" />
                <h3 className="font-display text-lg font-bold text-ink">Register New Turf</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="p-1 rounded-lg hover:bg-paper-2 text-mute cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSaving(true);
                try {
                  await createGround({
                    data: {
                      name: newTurfForm.name,
                      city: newTurfForm.city,
                      locality: newTurfForm.locality,
                      pitch_type: newTurfForm.pitch_type,
                      price_per_hour: Number(newTurfForm.price_per_hour),
                      description: newTurfForm.description,
                      facilities: newTurfForm.facilities,
                      image_url: newTurfForm.image_url,
                    },
                  });
                  setIsRegistering(false);
                  setNewTurfForm({
                    name: "",
                    city: profile.city || "Bengaluru",
                    locality: "",
                    pitch_type: "Box turf",
                    price_per_hour: 900,
                    description: "Enclosed floodlit turf arena with professional amenities.",
                    facilities: "Floodlights,Changing room,Parking,Water",
                    image_url: "/grounds/koramangala.jpg",
                  });
                  load(true);
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to register turf");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              <div>
                <label className="text-xs font-semibold text-ink-soft">Facility Name</label>
                <input
                  className="gz-input mt-1"
                  placeholder="e.g. Whitefield Premier Box Turf"
                  value={newTurfForm.name}
                  onChange={(e) => setNewTurfForm({ ...newTurfForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-soft">City</label>
                  <input
                    className="gz-input mt-1"
                    value={newTurfForm.city}
                    onChange={(e) => setNewTurfForm({ ...newTurfForm, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Locality / Landmark</label>
                  <input
                    className="gz-input mt-1"
                    placeholder="e.g. ITPL Main Road"
                    value={newTurfForm.locality}
                    onChange={(e) => setNewTurfForm({ ...newTurfForm, locality: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Hourly Rate (₹)</label>
                  <input
                    className="gz-input mt-1"
                    type="number"
                    min={100}
                    value={newTurfForm.price_per_hour}
                    onChange={(e) =>
                      setNewTurfForm({ ...newTurfForm, price_per_hour: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Pitch Type</label>
                  <input
                    className="gz-input mt-1"
                    value={newTurfForm.pitch_type}
                    onChange={(e) => setNewTurfForm({ ...newTurfForm, pitch_type: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-soft">Facilities</label>
                <input
                  className="gz-input mt-1"
                  value={newTurfForm.facilities}
                  onChange={(e) => setNewTurfForm({ ...newTurfForm, facilities: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="gz-btn gz-btn-ghost text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="gz-btn gz-btn-primary text-xs cursor-pointer"
                >
                  {isSaving ? "Registering..." : "Register Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Change Photo Modal ─── */}
      {photoGround && (
        <GroundPhotoModal
          ground={photoGround}
          isOpen={Boolean(photoGround)}
          onClose={() => setPhotoGround(null)}
          onSuccess={() => {
            setPhotoGround(null);
            load(true);
          }}
        />
      )}
    </div>
  );
}
