import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings } from "@/lib/data/me";
import {
  cancelBooking,
  groundOwnerOverview,
  updateGroundDetails,
  createGround,
  purchaseSportsPass,
} from "@/lib/data/actions";
import { getMyProfile, type Profile } from "@/lib/data/me";
import { listTournaments, listGrounds, type Ground } from "@/lib/data/catalog";
type Tournament = Awaited<ReturnType<typeof listTournaments>>[number];
import { EmptyState, LoadingState, StatusPill } from "@/components/ui/State";
import { formatDate, rupees } from "@/lib/ids";
import { GroundPhotoModal } from "@/components/sports/GroundPhotoModal";
import {
  MapPin,
  Trophy,
  CalendarDays,
  Plus,
  TrendingUp,
  Settings,
  ExternalLink,
  Camera,
  UploadCloud,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Edit2,
  X,
  Building2,
  CreditCard,
  Flame,
} from "lucide-react";

export const Route = createFileRoute("/app/sports")({
  component: AppSports,
});

function AppSports() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyBookings>> | null>(null);
  const [grounds, setGrounds] = useState<Awaited<ReturnType<typeof groundOwnerOverview>> | null>(null);
  const [publicGrounds, setPublicGrounds] = useState<Ground[]>([]);
  const [tourneys, setTourneys] = useState<Tournament[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeStudentTab, setActiveStudentTab] = useState<"turfs" | "bookings" | "tournaments" | "memberships">("turfs");
  const [purchasedPasses, setPurchasedPasses] = useState<string[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("gz_sports_passes") : null;
      return saved ? JSON.parse(saved) : ["pass_night_box"];
    } catch {
      return ["pass_night_box"];
    }
  });
  const [buyingPassId, setBuyingPassId] = useState<string | null>(null);
  const [passSuccessModal, setPassSuccessModal] = useState<{ title: string; amount: number; paymentId: string } | null>(null);
  const [editingGround, setEditingGround] = useState<{
    id: string;
    name: string;
    city?: string;
    image_url?: string;
  } | null>(null);
  const [editingDetailsGround, setEditingDetailsGround] = useState<{
    id: string;
    name: string;
    city: string;
    locality: string;
    price_per_hour: number;
    pitch_type: string;
    facilities: string;
    description: string;
  } | null>(null);
  const [isRegisteringTurf, setIsRegisteringTurf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTurfForm, setNewTurfForm] = useState({
    name: "",
    city: "Bengaluru",
    locality: "",
    pitch_type: "Box turf",
    price_per_hour: 900,
    description: "Enclosed floodlit turf arena with professional amenities.",
    facilities: "Floodlights,Changing room,Parking,Water",
    image_url: "/grounds/koramangala.jpg",
  });

  // Default viewMode to "student". Ground owners are switched to "owner" when profile resolves
  const [viewMode, setViewMode] = useState<"owner" | "student">("student");

  useEffect(() => {
    listMyBookings().then(setRows).catch(() => setRows([]));
    groundOwnerOverview().then(setGrounds).catch(() => {});
    listGrounds({ data: {} }).then(setPublicGrounds).catch(() => {});
    listTournaments().then(setTourneys).catch(() => {});
    getMyProfile().then((p) => {
      setProfile(p);
      if (p?.role === "ground_owner") {
        setViewMode("owner");
      } else {
        setViewMode("student");
      }
    }).catch(() => {});
  }, []);

  const isGroundOwnerRole = profile?.role === "ground_owner" || profile?.role === "super_admin";

  // Mode switcher ONLY shown to actual ground owners or super admins
  const modeSwitcher = isGroundOwnerRole ? (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 mb-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode("owner")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            viewMode === "owner"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-paper-2 text-ink-soft hover:text-ink hover:bg-paper"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Turf Operations & Grounds</span>
          {grounds?.grounds.length ? (
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${viewMode === "owner" ? "bg-white/20 text-white" : "bg-ink/10 text-ink"}`}>
              {grounds.grounds.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setViewMode("student")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            viewMode === "student"
              ? "bg-ink text-paper shadow-xs"
              : "bg-paper-2 text-ink-soft hover:text-ink hover:bg-paper"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Student Booking View</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/sports/box-cricket"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
        >
          <span>Public Booking Directory &rarr;</span>
        </Link>
      </div>
    </div>
  ) : null;

  if (rows === null && !grounds) return <LoadingState />;

  // ─── Ground Owner View (Strictly for Ground Owners and Super Admins) ──────
  if (isGroundOwnerRole && viewMode === "owner" && grounds) {
    return (
      <div className="space-y-8">
        {modeSwitcher}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-amber-500" />
              <h1 className="font-display text-3xl font-bold tracking-tight">
                My Grounds & Pitches
              </h1>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Manage your sports facilities, photos, pricing, and availability on {profile?.org_name || "your platform"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsRegisteringTurf(true)}
              className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Register New Turf</span>
            </button>
            <Link
              to="/app/bookings"
              className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              All Bookings
            </Link>
          </div>
        </div>

        {/* Revenue & Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="gz-panel rounded-[18px] p-5">
            <p className="gz-kicker text-mute">Today's Bookings</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{grounds.today}</p>
          </div>
          <div className="gz-panel rounded-[18px] p-5">
            <p className="gz-kicker text-mute">Weekly Revenue</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-accent">{rupees(grounds.revenue)}</p>
          </div>
          <div className="gz-panel rounded-[18px] p-5">
            <p className="gz-kicker text-mute">Your Active Grounds</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{grounds.grounds.length}</p>
          </div>
        </div>

        {/* Grounds Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Your Facilities</h2>
              <p className="text-xs text-mute mt-0.5">Turfs owned by your facility. You have exclusive rights to edit pricing, details, and photos.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegisteringTurf(true)}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Facility</span>
            </button>
          </div>

          {grounds.grounds.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">No Facilities Registered</h3>
              <p className="text-xs text-mute max-w-sm mx-auto">
                You haven't listed any sports grounds or turfs under your account yet. Register your facility to receive bookings.
              </p>
              <button
                type="button"
                onClick={() => setIsRegisteringTurf(false)}
                className="gz-btn gz-btn-primary !min-h-8 !px-4 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Register Turf Facility</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {grounds.grounds.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full bg-paper-2 overflow-hidden group">
                    <img
                      src={g.image_url}
                      alt={g.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-white/20 text-white backdrop-blur-xs">
                          {g.pitch_type || "Box Turf"}
                        </span>
                        <h3 className="font-display text-lg font-bold text-white mt-1 drop-shadow-xs">
                          {g.name}
                        </h3>
                        <p className="text-xs text-white/80 flex items-center gap-1 drop-shadow-xs">
                          <MapPin className="h-3 w-3" />
                          {g.locality}, {g.city}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingGround({
                          id: g.id,
                          name: g.name,
                          city: g.city,
                          image_url: g.image_url,
                        })
                      }
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Upload Pictures</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-mute block">Pitch Type</span>
                        <span className="font-semibold text-ink capitalize">{g.pitch_type || "Turf"}</span>
                      </div>
                      <div>
                        <span className="text-mute block">Hourly Rate</span>
                        <span className="font-bold text-accent font-mono">{rupees(g.price_per_hour)}/hr</span>
                      </div>
                      <div>
                        <span className="text-mute block">Total Slots/Day</span>
                        <span className="font-semibold text-ink">12 slots</span>
                      </div>
                      <div>
                        <span className="text-mute block">Status</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-mint">
                          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to="/sports/grounds/$id"
                        params={{ id: g.id }}
                        className="text-xs font-semibold text-ink hover:text-accent flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Public View
                      </Link>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingDetailsGround({
                              id: g.id,
                              name: g.name,
                              city: g.city,
                              locality: g.locality,
                              price_per_hour: g.price_per_hour,
                              pitch_type: g.pitch_type,
                              facilities: (g as Record<string, unknown>).facilities as string || "Floodlights,Changing room,Parking,Water",
                              description: (g as Record<string, unknown>).description as string || "Floodlit sports turf with premium amenities.",
                            })
                          }
                          className="text-xs font-semibold text-ink-soft hover:text-ink flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingGround({
                              id: g.id,
                              name: g.name,
                              city: g.city,
                              image_url: g.image_url,
                            })
                          }
                          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="h-3 w-3" />
                          <span>Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ground Photo Upload Modal */}
        {editingGround && (
          <GroundPhotoModal
            ground={editingGround}
            isOpen={Boolean(editingGround)}
            onClose={() => setEditingGround(null)}
            onSuccess={(newUrl) => {
              setGrounds((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  grounds: prev.grounds.map((item) =>
                    item.id === editingGround.id ? { ...item, image_url: newUrl } : item
                  ),
                };
              });
            }}
          />
        )}

        {/* Ground Details Edit Modal */}
        {editingDetailsGround && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-line animate-gz-scale-in">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-amber-500" />
                  <h3 className="font-display text-lg font-bold text-ink">Edit Turf Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDetailsGround(null)}
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
                        groundId: editingDetailsGround.id,
                        name: editingDetailsGround.name,
                        price_per_hour: Number(editingDetailsGround.price_per_hour),
                        pitch_type: editingDetailsGround.pitch_type,
                        facilities: editingDetailsGround.facilities,
                        description: editingDetailsGround.description,
                        locality: editingDetailsGround.locality,
                        city: editingDetailsGround.city,
                      },
                    });
                    setEditingDetailsGround(null);
                    const fresh = await groundOwnerOverview();
                    setGrounds(fresh);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Failed to save details");
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Facility Name</label>
                  <input
                    className="gz-input mt-1"
                    value={editingDetailsGround.name}
                    onChange={(e) => setEditingDetailsGround({ ...editingDetailsGround, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-ink-soft">Hourly Rate (₹)</label>
                    <input
                      className="gz-input mt-1"
                      type="number"
                      min={100}
                      value={editingDetailsGround.price_per_hour}
                      onChange={(e) => setEditingDetailsGround({ ...editingDetailsGround, price_per_hour: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-soft">Pitch Type</label>
                    <input
                      className="gz-input mt-1"
                      value={editingDetailsGround.pitch_type}
                      onChange={(e) => setEditingDetailsGround({ ...editingDetailsGround, pitch_type: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Facilities</label>
                  <input
                    className="gz-input mt-1"
                    value={editingDetailsGround.facilities}
                    onChange={(e) => setEditingDetailsGround({ ...editingDetailsGround, facilities: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft">Description</label>
                  <textarea
                    className="gz-input mt-1 min-h-[70px]"
                    value={editingDetailsGround.description}
                    onChange={(e) => setEditingDetailsGround({ ...editingDetailsGround, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setEditingDetailsGround(null)}
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

        {/* Register New Turf Modal */}
        {isRegisteringTurf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-line animate-gz-scale-in">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-amber-500" />
                  <h3 className="font-display text-lg font-bold text-ink">Register New Turf</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisteringTurf(false)}
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
                    setIsRegisteringTurf(false);
                    setNewTurfForm({
                      name: "",
                      city: "Bengaluru",
                      locality: "",
                      pitch_type: "Box turf",
                      price_per_hour: 900,
                      description: "Enclosed floodlit turf arena with professional amenities.",
                      facilities: "Floodlights,Changing room,Parking,Water",
                      image_url: "/grounds/koramangala.jpg",
                    });
                    const fresh = await groundOwnerOverview();
                    setGrounds(fresh);
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
                      onChange={(e) => setNewTurfForm({ ...newTurfForm, price_per_hour: Number(e.target.value) })}
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
                    onClick={() => setIsRegisteringTurf(false)}
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

        {/* Upcoming bookings for ground owner */}
        {grounds.upcoming.length > 0 && (
          <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-line bg-paper/40 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Upcoming Bookings</h2>
              <Link
                to="/app/bookings"
                className="text-xs font-semibold text-accent hover:underline"
              >
                View full ledger →
              </Link>
            </div>
            <table className="gz-table w-full">
              <thead>
                <tr>
                  <th>Ground</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {grounds.upcoming.slice(0, 6).map((b) => (
                  <tr key={b.id}>
                    <td className="font-semibold text-ink">{b.name}</td>
                    <td className="tabular-nums font-mono text-sm">{formatDate(b.booking_date)}</td>
                    <td className="tabular-nums font-mono text-sm">{b.slot_start}</td>
                    <td className="tabular-nums font-bold text-accent">{rupees(b.amount)}</td>
                    <td>
                      <span className="rounded-full bg-mint/10 text-mint px-2.5 py-0.5 text-xs font-semibold capitalize">
                        {b.status || "confirmed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ─── Student View (Default & Dedicated for Students) ─────────────────────────
  return (
    <div className="space-y-8 animate-gz-fade-in">
      {modeSwitcher}

      {/* Student Sports Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Sports & Turfs</h1>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Reserve floodlit box cricket cages, practice nets, and register for college derby tournaments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/sports/box-cricket"
            className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Book a Turf Slot
          </Link>
          <Link
            to="/sports"
            className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5 text-accent" />
            All Tournaments
          </Link>
        </div>
      </div>

      {/* Student Category Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveStudentTab("turfs")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeStudentTab === "turfs"
              ? "bg-accent/10 text-accent font-bold ring-1 ring-accent/25"
              : "text-mute hover:text-ink hover:bg-paper-2"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Available Turfs & Pitches ({publicGrounds.length || grounds?.grounds.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStudentTab("bookings")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeStudentTab === "bookings"
              ? "bg-accent/10 text-accent font-bold ring-1 ring-accent/25"
              : "text-mute hover:text-ink hover:bg-paper-2"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>My Slot Bookings ({rows?.length ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStudentTab("tournaments")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeStudentTab === "tournaments"
              ? "bg-accent/10 text-accent font-bold ring-1 ring-accent/25"
              : "text-mute hover:text-ink hover:bg-paper-2"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Campus Tournaments ({tourneys.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStudentTab("memberships")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeStudentTab === "memberships"
              ? "bg-accent/10 text-accent font-bold ring-1 ring-accent/25"
              : "text-mute hover:text-ink hover:bg-paper-2"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-accent" />
          <span>Sports Passes & Perks ({purchasedPasses.length} Active)</span>
        </button>
      </div>

      {/* ── Tab 1: Available Grounds & Turfs for Student Booking ── */}
      {activeStudentTab === "turfs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Explore Sports Pitches</h2>
              <p className="text-xs text-mute mt-0.5">
                Floodlit box cricket turfs, practice nets, and multi-sport arenas available near colleges.
              </p>
            </div>
            <Link
              to="/sports/box-cricket"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>View full directory</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {(publicGrounds.length > 0 ? publicGrounds : (grounds?.grounds ?? [])).length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(publicGrounds.length > 0 ? publicGrounds : (grounds?.grounds ?? [])).map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="relative h-44 w-full bg-paper-2 overflow-hidden">
                      <img
                        src={g.image_url}
                        alt={g.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono text-white font-semibold uppercase tracking-wider">
                        {g.pitch_type || "Box Turf"}
                      </span>
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-mint/95 text-white text-[10px] font-semibold shadow-xs flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Open Slots
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-display text-lg font-bold text-ink group-hover:text-accent transition-colors">
                        {g.name}
                      </h3>
                      <p className="text-xs text-mute mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>{g.locality ? `${g.locality}, ${g.city}` : g.city}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-line/60 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-mute block">Price</span>
                      <span className="text-base font-bold text-accent tabular-nums font-mono">
                        {rupees(g.price_per_hour)}/hr
                      </span>
                    </div>
                    <Link
                      to="/sports/grounds/$id"
                      params={{ id: g.id }}
                      className="gz-btn gz-btn-primary !min-h-8 !px-3.5 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No turfs available"
              body="No sports facilities currently listed. Check back shortly."
            />
          )}
        </div>
      )}

      {/* ── Tab 2: My Bookings ── */}
      {activeStudentTab === "bookings" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Your Booked Turf Slots</h2>
            <p className="text-xs text-mute mt-0.5">
              Review your confirmed reservations, match timings, and booking receipts.
            </p>
          </div>

          {rows === null ? (
            <LoadingState />
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent mx-auto flex items-center justify-center">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">No Turf Bookings Yet</h3>
              <p className="text-xs text-mute max-w-sm mx-auto">
                Ready for a box cricket derby or practice session? Book an hourly slot on any floodlit turf.
              </p>
              <button
                type="button"
                onClick={() => setActiveStudentTab("turfs")}
                className="gz-btn gz-btn-primary !min-h-8 !px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Browse Available Turfs</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
              <table className="gz-table w-full">
                <thead>
                  <tr>
                    <th>Ground / Turf</th>
                    <th>Booking Date</th>
                    <th>Time Slot</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id}>
                      <td className="font-semibold text-ink">{b.name}</td>
                      <td className="tabular-nums font-mono text-sm">{formatDate(b.booking_date)}</td>
                      <td className="tabular-nums font-mono text-sm">
                        {b.slot_start}–{b.slot_end}
                      </td>
                      <td className="tabular-nums font-bold text-accent">{rupees(b.amount)}</td>
                      <td>
                        <StatusPill status={b.status} />
                      </td>
                      <td>
                        {b.status !== "cancelled" ? (
                          <button
                            type="button"
                            className="text-xs text-coral hover:underline font-medium cursor-pointer"
                            onClick={async () => {
                              await cancelBooking({ data: { id: b.id } });
                              setRows(await listMyBookings());
                            }}
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

      {/* ── Tab 3: Campus & Club Tournaments ── */}
      {activeStudentTab === "tournaments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Campus Cricket Tournaments</h2>
              <p className="text-xs text-mute mt-0.5">
                Join inter-college leagues, weekend knockout cups, and college derbies with live scoring.
              </p>
            </div>
            <Link
              to="/sports"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>Explore public sports hub</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tourneys.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-mono font-bold uppercase tracking-wider">
                      {t.kind} League
                    </span>
                    <span className="text-xs font-bold text-mint tabular-nums font-mono">
                      {t.teams_registered}/{t.max_teams} Teams
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-ink mt-2.5">{t.name}</h3>
                  <p className="text-xs text-mute mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-accent shrink-0" />
                    <span>{t.venue}, {t.city}</span>
                  </p>
                  <p className="text-xs text-ink-soft mt-2.5 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-mute block">Entry Fee</span>
                    <span className="text-sm font-bold text-accent font-mono">{rupees(t.fee)}/team</span>
                  </div>
                  <Link
                    to="/sports"
                    className="gz-btn gz-btn-primary !min-h-8 !px-3 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>View League</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 4: Memberships & Sports Passes ── */}
      {activeStudentTab === "memberships" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-accent" />
                <h2 className="font-display text-2xl font-bold text-ink">Sports Memberships & Season Passes</h2>
              </div>
              <p className="text-xs text-mute mt-1">
                Subsidized box cricket access, verified sports attendance, and direct wellness score boosts for your Placement Passport.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-paper border border-line px-3 py-1.5 rounded-xl text-ink-soft">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Synced with Placement Eligibility Engine</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                id: "pass_night_box",
                title: "Student Night Box Pass",
                badge: "Most Popular",
                badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
                price: 999,
                period: "/month",
                tagline: "Post-lecture night derbies and quick weekend box cricket matches.",
                perks: [
                  "4 complimentary 1-hr night turf slots per month",
                  "15% flat discount on all additional slot bookings",
                  "+150 GZ Points credited immediately",
                  "+6 Wellness Score boost to Academic Identity",
                  "48-hour early access to prime weekend slots",
                ],
              },
              {
                id: "pass_warriors",
                title: "Weekend Warriors Pass",
                badge: "Competitive",
                badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
                price: 1999,
                period: "/month",
                tagline: "For dedicated squads preparing for inter-college leagues.",
                perks: [
                  "Unlimited weekend open practice nets access",
                  "2 Tournament registrations with zero platform fee",
                  "+300 GZ Points credited to student ledger",
                  "+12 Wellness Score boost for placement resumes",
                  "Official match-grade balls & umpire kit provided",
                ],
              },
              {
                id: "pass_inter_college",
                title: "Inter-College Derby Pass",
                badge: "Season Pass",
                badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
                price: 3499,
                period: "/season (3 mos)",
                tagline: "College varsity and department squad tournament package.",
                perks: [
                  "Guaranteed slot for 7-player squad in 2 City Cups",
                  "7 Custom GenZ360 moisture-wicking team jerseys",
                  "+500 GZ Points & sports excellence badge",
                  "+20 Wellness Score verified on official transcript",
                  "Recorded match video highlights in player portfolio",
                ],
              },
            ].map((p) => {
              const isOwned = purchasedPasses.includes(p.id);
              const isBusy = buyingPassId === p.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-[24px] border p-6 flex flex-col justify-between transition-all bg-white relative overflow-hidden ${
                    isOwned
                      ? "border-mint shadow-md ring-1 ring-mint/40"
                      : "border-line shadow-2xs hover:shadow-lift hover:border-ink/30"
                  }`}
                >
                  {isOwned && (
                    <div className="absolute top-0 right-0 bg-mint text-white text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Member
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-semibold ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-ink">{p.title}</h3>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">{p.tagline}</p>

                    <div className="mt-5 pb-5 border-b border-line flex items-baseline gap-1">
                      <span className="font-display text-3xl font-extrabold text-ink">{rupees(p.price)}</span>
                      <span className="text-xs text-mute font-mono">{p.period}</span>
                    </div>

                    <ul className="mt-5 space-y-2.5 text-xs">
                      {p.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2 text-ink-soft">
                          <CheckCircle2 className="h-4 w-4 text-mint shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line/60">
                    {isOwned ? (
                      <div className="w-full text-center py-2 rounded-xl bg-mint/10 border border-mint/20 text-mint text-xs font-bold font-mono inline-flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Subscription Active & Renewing</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setBuyingPassId(p.id);
                          try {
                            const res = await purchaseSportsPass({
                              data: {
                                passId: p.id,
                                title: p.title,
                                amount: p.price,
                                periodMonths: 1,
                                paymentMethod: "upi_ledger",
                              },
                            });
                            const next = [...purchasedPasses, p.id];
                            setPurchasedPasses(next);
                            if (typeof window !== "undefined") {
                              localStorage.setItem("gz_sports_passes", JSON.stringify(next));
                            }
                            setPassSuccessModal({
                              title: p.title,
                              amount: p.price,
                              paymentId: res.paymentId,
                            });
                          } catch (err: any) {
                            alert(err?.message || "Pass purchase failed. Please sign in.");
                          } finally {
                            setBuyingPassId(null);
                          }
                        }}
                        className="gz-btn gz-btn-primary w-full text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>{isBusy ? "Processing Payment…" : `Subscribe for ${rupees(p.price)}`}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PASS PURCHASE SUCCESS MODAL ── */}
      {passSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-gz-fade-in">
          <div className="gz-panel max-w-md w-full bg-white rounded-[24px] p-6 sm:p-7 border border-line shadow-lift text-center animate-gz-scale-in relative">
            <button
              type="button"
              onClick={() => setPassSuccessModal(null)}
              className="absolute top-5 right-5 text-mute hover:text-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-14 w-14 rounded-2xl bg-mint/15 text-mint mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-bold text-ink">
              Pass Activated Successfully!
            </h3>
            <p className="text-xs text-ink-soft mt-2 leading-relaxed">
              Your <strong>{passSuccessModal.title}</strong> is now active on your student profile.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-paper border border-line text-xs font-mono text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-mute">Amount Paid:</span>
                <span className="font-bold text-ink">{rupees(passSuccessModal.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Payment Ref:</span>
                <span className="text-ink font-semibold">{passSuccessModal.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Wellness Passport:</span>
                <span className="text-mint font-bold">+6 to +20 Boost Synced</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Reward Points:</span>
                <span className="text-accent font-bold">+150 GZ Points Credited</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setPassSuccessModal(null)}
                className="gz-btn gz-btn-primary w-full"
              >
                Done
              </button>
              <Link
                to="/app/profile"
                className="text-xs text-accent font-semibold hover:underline"
              >
                View Updated Placement & Sports Passport →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
