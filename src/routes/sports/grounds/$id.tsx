import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/layout/Page";
import { ErrorState, LoadingState, StatusPill } from "@/components/ui/State";
import { getGround, groundAvailability } from "@/lib/data/catalog";
import { bookGround, cancelBooking } from "@/lib/data/actions";
import { listMyBookings, getMyProfile } from "@/lib/data/me";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { rupees, formatDate } from "@/lib/ids";
import { GroundPhotoModal } from "@/components/sports/GroundPhotoModal";
import confetti from "canvas-confetti";
import {
  Camera,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  Banknote,
  Sparkles,
  Trophy,
  ArrowRight,
  X,
  FileCheck,
  Download,
  AlertCircle,
  MapPin,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/sports/grounds/$id")({
  component: GroundPage,
});

interface BookingReceipt {
  id: string;
  paymentId: string;
  amount: number;
  originalAmount: number;
  pointsDiscount: number;
  groundName: string;
  locality: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  provider: string;
}

function GroundPage() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [ground, setGround] = useState<Awaited<ReturnType<typeof getGround>> | undefined>(
    undefined,
  );
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<{ start: string; end: string; open: boolean }[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listMyBookings>>>([]);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyProfile>> | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Phase 3: Interactive Checkout & Receipt Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedReceipt, setConfirmedReceipt] = useState<BookingReceipt | null>(null);
  const [paymentMode, setPaymentMode] = useState<"upi" | "card" | "turf">("upi");
  const [usePoints, setUsePoints] = useState(false);

  useEffect(() => {
    getGround({ data: { id } })
      .then(setGround)
      .catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (!ground) return;
    groundAvailability({ data: { groundId: ground.id, date } })
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [ground, date, msg]);

  useEffect(() => {
    if (!user) return;
    listMyBookings().then(setHistory).catch(() => {});
    getMyProfile().then(setProfile).catch(() => {});
  }, [user, msg]);

  const isSuperAdmin = profile?.role === "super_admin";
  const isThisGroundOwner = Boolean(
    profile?.role === "ground_owner" &&
    ground &&
    (
      (ground.owner_user_id && ground.owner_user_id === profile.user_id) ||
      (profile.org_name && ground.owner_name?.toLowerCase() === profile.org_name.toLowerCase()) ||
      (profile.display_name && ground.owner_name?.toLowerCase() === profile.display_name.toLowerCase())
    )
  );
  const isOwnerOrAdmin = isSuperAdmin || isThisGroundOwner;

  const days = useMemo(() => {
    const out: string[] = [];
    const start = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, []);

  const selectedSlotObj = useMemo(() => {
    return slots.find((s) => s.start === picked);
  }, [slots, picked]);

  // Pricing calculations
  const baseRate = ground?.price_per_hour ?? 0;
  const gstAmount = Math.round(baseRate * 0.18);
  const pointsSavings = usePoints ? Math.min(100, baseRate) : 0;
  const totalPayable = Math.max(baseRate + gstAmount - pointsSavings, 0);

  async function handleConfirmBooking() {
    if (!ground || !selectedSlotObj) return;
    setBusy(true);
    setErr("");
    try {
      const res = await bookGround({
        data: {
          groundId: ground.id,
          date,
          slotStart: selectedSlotObj.start,
          slotEnd: selectedSlotObj.end,
          paymentMethod: paymentMode === "upi" ? "Instant UPI (GPay/PhonePe)" : paymentMode === "card" ? "Credit/Debit Card" : "Pay at Turf Arrival",
          pointsRedeemed: pointsSavings,
        },
      });

      // Trigger celebratory confetti
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#1857FF", "#10B981", "#F59E0B", "#E85A3C"],
      });

      setConfirmedReceipt(res as BookingReceipt);
      setIsCheckoutOpen(false);
      setMsg(`Confirmed. Ledger payment ${res.paymentId} · ${rupees(res.amount)}.`);
      setPicked(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Booking transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  if (ground === undefined && !err) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <LoadingState label="Opening ground" />
        </div>
      </Page>
    );
  }
  if (!ground) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <ErrorState message={err || "Ground not found."} />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <article className="gz-wrap-wide py-8 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="gz-kicker">
            <Link to="/sports/box-cricket">Box cricket</Link> / {ground.city}
          </p>
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPhotoModalOpen(true)}
                className="gz-btn !min-h-8 !px-3 text-xs bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Camera className="h-3.5 w-3.5 text-amber-600" />
                <span>Upload Pictures</span>
              </button>
              <Link
                to="/app/sports"
                className="gz-btn gz-btn-primary !min-h-8 !px-3 text-xs flex items-center gap-1.5"
              >
                <span>Owner Dashboard</span>
              </Link>
            </div>
          )}
        </div>

        {isOwnerOrAdmin && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>You manage this facility as a verified Turf Owner</span>
            </div>
            <p className="text-amber-800 text-[11px]">
              Click <strong>Upload Pictures</strong> to change or add new ground photos.
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="relative group overflow-hidden rounded-[22px] bg-paper-2">
              <img
                src={ground.image_url}
                alt={ground.name}
                className="max-h-[420px] w-full rounded-[22px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="absolute bottom-4 right-4 gz-btn !bg-white/95 !text-ink hover:!bg-white !min-h-8 !px-3 text-xs font-semibold shadow-lg flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition-transform hover:scale-105"
                  title="Upload / Change Ground Photo"
                >
                  <Camera className="h-3.5 w-3.5 text-amber-600" />
                  <span>Change Photo</span>
                </button>
              )}
            </div>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl tracking-[-0.04em] font-bold text-ink">{ground.name}</h1>
            <p className="mt-2 text-ink-soft flex items-center gap-1.5 flex-wrap">
              <span>{ground.locality} · {ground.owner_name} ·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>{ground.rating} ({ground.review_count} ratings)</span>
              </span>
            </p>
            <p className="mt-4 max-w-[60ch] text-sm text-ink-soft leading-relaxed">{ground.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {ground.facilities.split(",").map((f) => (
                <span key={f} className="gz-chip">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Booking Slot Selection Card */}
          <div className="gz-panel rounded-[24px] p-6 bg-white border border-line shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-mono uppercase text-mute">Hourly Slot Fee</p>
                <p className="font-display text-3xl font-bold tabular-nums text-ink">
                  {rupees(ground.price_per_hour)} <span className="text-sm font-normal text-mute">/ hr</span>
                </p>
              </div>
              <span className="gz-chip text-xs bg-mint/15 text-mint border border-mint/20 font-mono">
                INSTANT CONFIRMATION
              </span>
            </div>

            <div>
              <p className="gz-kicker !text-ink">1. Select Date</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`gz-chip transition-all ${
                      date === d ? "bg-ink text-paper font-bold shadow-xs scale-105" : "hover:bg-paper-2"
                    }`}
                    onClick={() => setDate(d)}
                  >
                    {formatDate(d).replace(`, ${new Date().getFullYear()}`, "")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="gz-kicker !text-ink">2. Available 1-Hour Time Slots</p>
                <span className="text-[11px] text-mute font-mono">60-minute match</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    disabled={!s.open}
                    onClick={() => setPicked(s.start)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-mono tabular-nums transition-all ${
                      !s.open
                        ? "border-line/60 bg-paper/50 text-mute/60 line-through cursor-not-allowed"
                        : picked === s.start
                        ? "border-accent bg-accent text-white font-bold shadow-xs scale-102"
                        : "border-line bg-white hover:border-ink/40 text-ink"
                    }`}
                  >
                    {s.start} - {s.end}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Slot Summary Callout */}
            {picked && selectedSlotObj && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[10px] text-accent font-semibold uppercase">Selected Session</span>
                  <p className="font-bold text-ink mt-0.5">
                    {formatDate(date)} · {selectedSlotObj.start} to {selectedSlotObj.end}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-base font-bold text-accent">{rupees(ground.price_per_hour)}</span>
                </div>
              </div>
            )}

            {isPending ? (
              <div className="h-11 animate-pulse rounded-full bg-paper-2" />
            ) : user ? (
              <button
                type="button"
                className="gz-btn gz-btn-primary w-full !py-3 font-bold flex items-center justify-center gap-2 shadow-xs"
                disabled={!picked || busy}
                onClick={() => setIsCheckoutOpen(true)}
              >
                <CreditCard className="h-4 w-4" />
                <span>{picked ? `Proceed to Checkout · ${rupees(ground.price_per_hour)}` : "Select a slot above"}</span>
              </button>
            ) : (
              <Link
                to="/login"
                search={{ redirect: `/sports/grounds/${ground.id}` }}
                className="gz-btn gz-btn-primary w-full !py-3 text-center font-bold"
              >
                Sign in to Book Turf
              </Link>
            )}

            {msg && <p className="text-xs text-mint font-medium">{msg}</p>}
            {err && <p className="text-xs text-coral font-medium">{err}</p>}

            <div className="pt-2 border-t border-line/60 text-[11px] text-mute flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-mint shrink-0" />
              <span>Includes equipment, turf floodlights, match balls, and umpire score tablet.</span>
            </div>
          </div>
        </div>

        {/* ── FLOW: INTERACTIVE CHECKOUT MODAL ── */}
        {isCheckoutOpen && ground && selectedSlotObj && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-gz-fade-in">
            <div className="gz-panel max-w-lg w-full bg-white rounded-[24px] p-6 sm:p-7 border border-line shadow-lift animate-gz-scale-in relative max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">Confirm Turf Reservation</h3>
                    <p className="text-xs text-mute font-mono">Ledger Verified Checkout</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="text-mute hover:text-ink transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Slot Summary */}
              <div className="rounded-xl bg-paper p-4 border border-line space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-mute">Ground:</span>
                  <span className="font-bold text-ink">{ground.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-mute">Location:</span>
                  <span className="text-ink">{ground.locality}, {ground.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-mute">Date & Slot:</span>
                  <span className="font-mono font-semibold text-accent">
                    {formatDate(date)} · {selectedSlotObj.start} – {selectedSlotObj.end} (1 hr)
                  </span>
                </div>
              </div>

              {/* Reward Points Discount Checkbox */}
              <div className="rounded-xl border border-mint/30 bg-mint/5 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-mint" />
                  <div>
                    <p className="text-xs font-bold text-ink">Redeem 100 GZ Reward Points</p>
                    <p className="text-[11px] text-mute">Save ₹100 instantly on this booking</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="h-4 w-4 rounded accent-mint cursor-pointer"
                />
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-1.5 text-xs border-y border-line/60 py-3">
                <div className="flex justify-between text-mute">
                  <span>Base Turf Fee (1 hr)</span>
                  <span className="font-mono text-ink">{rupees(baseRate)}</span>
                </div>
                <div className="flex justify-between text-mute">
                  <span>Floodlights & Ball Kit</span>
                  <span className="font-mono text-mint">FREE</span>
                </div>
                <div className="flex justify-between text-mute">
                  <span>GST (18%)</span>
                  <span className="font-mono text-ink">{rupees(gstAmount)}</span>
                </div>
                {pointsSavings > 0 && (
                  <div className="flex justify-between text-mint font-semibold">
                    <span>GZ Reward Points Applied</span>
                    <span className="font-mono">- {rupees(pointsSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-ink pt-2 border-t border-line/40">
                  <span>Total Amount Payable</span>
                  <span className="font-display text-base text-accent">{rupees(totalPayable)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-2">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("upi")}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      paymentMode === "upi"
                        ? "border-accent bg-accent/5 ring-1 ring-accent text-accent font-bold"
                        : "border-line bg-white hover:bg-paper text-ink"
                    }`}
                  >
                    <QrCode className="h-5 w-5 mx-auto mb-1 text-accent" />
                    <span className="text-xs block">UPI Pay</span>
                    <span className="text-[10px] text-mute">GPay/PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("card")}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      paymentMode === "card"
                        ? "border-accent bg-accent/5 ring-1 ring-accent text-accent font-bold"
                        : "border-line bg-white hover:bg-paper text-ink"
                    }`}
                  >
                    <CreditCard className="h-5 w-5 mx-auto mb-1 text-accent" />
                    <span className="text-xs block">Cards / Net</span>
                    <span className="text-[10px] text-mute">All Banks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("turf")}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      paymentMode === "turf"
                        ? "border-accent bg-accent/5 ring-1 ring-accent text-accent font-bold"
                        : "border-line bg-white hover:bg-paper text-ink"
                    }`}
                  >
                    <Banknote className="h-5 w-5 mx-auto mb-1 text-mint" />
                    <span className="text-xs block">Pay at Turf</span>
                    <span className="text-[10px] text-mute">On Arrival</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleConfirmBooking}
                  className="gz-btn gz-btn-primary w-full !py-3 font-bold flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{busy ? "Processing Ledger Transaction…" : `Pay ${rupees(totalPayable)} & Confirm Slot`}</span>
                </button>
                <p className="text-[11px] text-center text-mute">
                  Secured by GenZ360 Transaction Gateway. Instant refund on cancellations 2h prior.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── FLOW: DIGITAL RECEIPT MODAL ── */}
        {confirmedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-gz-fade-in">
            <div className="gz-panel max-w-lg w-full bg-white rounded-[24px] p-6 sm:p-8 border border-line shadow-lift animate-gz-scale-in text-center space-y-5">
              <div className="h-16 w-16 rounded-2xl bg-mint/15 text-mint flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <span className="gz-chip text-xs bg-mint/15 text-mint border border-mint/20 font-mono">
                  TRANSACTION CONFIRMED
                </span>
                <h3 className="font-display text-2xl font-bold text-ink mt-2">
                  Turf Slot Reserved!
                </h3>
                <p className="text-xs text-mute mt-1">
                  Your box cricket booking has been broadcasted to {confirmedReceipt.groundName} managers.
                </p>
              </div>

              {/* Digital Receipt Card */}
              <div className="rounded-2xl border border-line/80 bg-paper/60 p-5 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-mute">Booking Ref:</span>
                  <span className="font-bold text-ink">{confirmedReceipt.id}</span>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-mute">Ledger Payment ID:</span>
                  <span className="text-accent">{confirmedReceipt.paymentId}</span>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-mute">Ground:</span>
                  <span className="text-ink">{confirmedReceipt.groundName} ({confirmedReceipt.locality})</span>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-mute">Date & Time:</span>
                  <span className="text-ink">{formatDate(confirmedReceipt.date)} · {confirmedReceipt.slotStart} - {confirmedReceipt.slotEnd}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-sm">
                  <span>Paid via {confirmedReceipt.provider}:</span>
                  <span className="text-ink">{rupees(confirmedReceipt.amount)}</span>
                </div>
              </div>

              {/* Incentive Callout */}
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3.5 text-xs text-left flex items-start gap-2.5">
                <Trophy className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ink">Student Wellness Rewards Unlocked</p>
                  <p className="text-[11px] text-mute mt-0.5">
                    +1 Physical Session added · +2 Wellness Passport score boost · +50 GZ points credited to your profile!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  to="/app/bookings"
                  className="gz-btn gz-btn-primary w-full !py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>View in My Bookings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmedReceipt(null)}
                  className="gz-btn gz-btn-outline w-full !py-2.5 text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Booking History */}
        {user && history.length ? (
          <section className="mt-14 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Your Past & Upcoming Sessions</h2>
              <Link to="/app/bookings" className="text-xs text-accent font-semibold hover:underline">
                View all bookings →
              </Link>
            </div>
            <table className="gz-table w-full">
              <thead>
                <tr>
                  <th>Ground</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium text-ink">{b.name}</td>
                    <td className="tabular-nums font-mono text-xs">{formatDate(b.booking_date)}</td>
                    <td className="tabular-nums font-mono text-xs">
                      {b.slot_start}–{b.slot_end}
                    </td>
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
                            setMsg("Booking cancelled and refund marked on ledger.");
                          }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-mute">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {photoModalOpen && ground && (
          <GroundPhotoModal
            ground={ground}
            isOpen={photoModalOpen}
            onClose={() => setPhotoModalOpen(false)}
            onSuccess={(newUrl) => {
              setGround((prev) => (prev ? { ...prev, image_url: newUrl } : prev));
              setMsg("Ground photograph updated successfully!");
            }}
          />
        )}
      </article>
    </Page>
  );
}
