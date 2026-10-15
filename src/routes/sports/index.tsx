import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { LoadingState, EmptyState, ErrorState, StatusPill } from "@/components/ui/State";
import { listGrounds, listTournaments, listMatches } from "@/lib/data/catalog";
import { registerTeam } from "@/lib/data/actions";
import { rupees, formatDate } from "@/lib/ids";
import {
  Trophy,
  Users,
  CheckCircle2,
  X,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/sports/")({
  component: Sports,
  head: () => ({
    meta: [
      { title: "Sports & Box Cricket — GenZ360" },
      { name: "description", content: "Box cricket, ground booking, college leagues and weekend tournaments." },
    ],
  }),
});

type TournamentItem = Awaited<ReturnType<typeof listTournaments>>[number];

function Sports() {
  const [grounds, setGrounds] = useState<Awaited<ReturnType<typeof listGrounds>> | null>(null);
  const [tournaments, setTournaments] = useState<Awaited<ReturnType<typeof listTournaments>>>([]);
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof listMatches>>>([]);
  const [err, setErr] = useState("");

  // Filter states
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedPitch, setSelectedPitch] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Registration Modal State (Flow 8)
  const [selectedTourney, setSelectedTourney] = useState<TournamentItem | null>(null);
  const [teamName, setTeamName] = useState("");
  const [captainPhone, setCaptainPhone] = useState("");
  const [players, setPlayers] = useState<string[]>([
    "Player 1 (Captain)",
    "Player 2",
    "Player 3",
    "Player 4",
    "Player 5",
    "Player 6",
    "Player 7",
  ]);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [busyRegistering, setBusyRegistering] = useState(false);
  const [regError, setRegError] = useState("");

  useEffect(() => {
    listGrounds({ data: {} }).then(setGrounds).catch((e) => setErr(e.message));
    listTournaments().then(setTournaments).catch(() => {});
    listMatches().then(setMatches).catch(() => {});
  }, []);

  function handleOpenRegister(t: TournamentItem) {
    setSelectedTourney(t);
    setTeamName("");
    setCaptainPhone("");
    setRegError("");
    setRegisteredSuccess(false);
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTourney) return;
    setBusyRegistering(true);
    setRegError("");

    try {
      await registerTeam({
        data: {
          tournamentId: selectedTourney.id,
          name: teamName,
          captain: captainPhone || "Captain",
        },
      });

      setRegisteredSuccess(true);
      // Increment registered teams in local state
      setTournaments((prev) =>
        prev.map((item) =>
          item.id === selectedTourney.id
            ? { ...item, teams_registered: Math.min(item.max_teams, item.teams_registered + 1) }
            : item,
        ),
      );
    } catch (e: any) {
      setRegError(e.message || "Registration failed. Please make sure you are logged in.");
    } finally {
      setBusyRegistering(false);
    }
  }

  const cities = ["All", "Bengaluru", "Mumbai", "Chennai", "Hyderabad", "Pune", "Gurugram"];
  const pitchTypes = ["All", "Astroturf", "Synthetic", "Matting"];

  const filteredGrounds = grounds?.filter((g) => {
    if (selectedCity !== "All" && g.city !== selectedCity) return false;
    if (selectedPitch !== "All" && !g.pitch_type.toLowerCase().includes(selectedPitch.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!`${g.name} ${g.locality} ${g.city} ${g.pitch_type}`.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const leaderboard = [
    { rank: 1, team: "RV Strikers", played: 4, won: 4, nrr: "+2.42", points: 8 },
    { rank: 2, team: "Powai Titans", played: 4, won: 3, nrr: "+1.18", points: 6 },
    { rank: 3, team: "Koramangala Kings", played: 3, won: 2, nrr: "+0.65", points: 4 },
    { rank: 4, team: "CyberHub Blasters", played: 3, won: 1, nrr: "-0.40", points: 2 },
  ];

  return (
    <Page>
      <section className="gz-wrap-wide grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="gz-kicker">Sports</p>
          <h1 className="gz-hero-title mt-3">Play beyond the classroom.</h1>
          <p className="mt-5 max-w-[40ch] text-lg text-ink-soft">
            Box cricket as infrastructure. Grounds, slots, leagues, teams,
            results — in one desk.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/sports/box-cricket" className="gz-btn gz-btn-primary">
              Box cricket booking
            </Link>
            <a href="#calendar" className="gz-btn gz-btn-ghost">
              Tournament calendar
            </a>
            <Link to="/app/sports" className="gz-btn gz-btn-ghost flex items-center gap-1.5">
              <span>My Passes & Turf Bookings</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <img
          src="/images/sports-play.jpg"
          alt="Students playing cricket"
          className="h-full max-h-[420px] w-full rounded-[22px] object-cover"
        />
      </section>

      {/* ── Filters & Search ── */}
      <section className="gz-wrap-wide mt-10">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search turfs by name, locality..."
                className="gz-input !pl-10 text-xs w-full"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-mute font-mono">
              <SlidersHorizontal className="h-4 w-4" />
              <span>{filteredGrounds?.length ?? 0} Pitches Available</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-line/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-mute uppercase mr-1">City:</span>
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCity === city
                      ? "bg-ink text-white font-semibold shadow-xs"
                      : "bg-paper text-ink-soft hover:bg-line/60 border border-line"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              <span className="text-[11px] font-mono text-mute uppercase mr-1">Pitch:</span>
              {pitchTypes.map((pitch) => (
                <button
                  key={pitch}
                  type="button"
                  onClick={() => setSelectedPitch(pitch)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    selectedPitch === pitch
                      ? "bg-accent text-white font-semibold shadow-xs"
                      : "bg-paper text-ink-soft hover:bg-line/60 border border-line"
                  }`}
                >
                  {pitch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="gz-wrap-wide mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl">Grounds & Turfs</h2>
            <p className="text-xs text-mute font-mono mt-1">Book instantly with student ledger discount</p>
          </div>
        </div>

        {err ? <ErrorState message={err} /> : null}
        {!grounds ? <LoadingState label="Finding pitches" /> : null}
        {grounds && filteredGrounds && filteredGrounds.length === 0 ? (
          <EmptyState
            title="No grounds match filters"
            body="Try changing the city or pitch type filters."
          />
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGrounds?.map((g) => (
            <Link
              key={g.id}
              to="/sports/grounds/$id"
              params={{ id: g.id }}
              className="group flex flex-col justify-between overflow-hidden rounded-[24px] border border-line bg-white hover:border-ink/30 transition-all hover:shadow-lift"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-paper">
                  <img
                    src={g.image_url}
                    alt={g.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-ink/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {g.pitch_type}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-ink text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    <span>{g.rating}</span>
                    <span className="text-[10px] text-mute font-normal">({g.review_count})</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-xl font-bold group-hover:text-accent transition-colors">
                    {g.name}
                  </h3>
                  <p className="text-xs text-mute flex items-center gap-1 mt-1 font-mono">
                    <MapPin className="h-3 w-3 text-accent" />
                    <span>{g.locality}, {g.city}</span>
                  </p>
                  <p className="text-xs text-ink-soft mt-3 line-clamp-2 leading-relaxed">
                    {g.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {g.facilities.split(",").slice(0, 3).map((f) => (
                      <span key={f} className="text-[10px] font-mono bg-paper border border-line px-2 py-0.5 rounded-md text-ink-soft">
                        {f.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-line/60 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-mute block">Price</span>
                  <span className="font-display text-lg font-bold text-ink">{rupees(g.price_per_hour)}</span>
                  <span className="text-xs text-mute">/hr</span>
                </div>
                <span className="gz-btn gz-btn-primary !min-h-8 !px-3.5 text-xs font-semibold group-hover:bg-accent transition-colors">
                  Select Slot →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Flow 8: Tournament Calendar, Registration & Live Leaderboard ── */}
      <section id="calendar" className="gz-wrap-wide mt-20 grid min-w-0 gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 w-full">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Tournament calendar</h2>
            <span className="text-xs font-mono text-mute">{tournaments.length} Active Cups</span>
          </div>
          <div className="overflow-x-auto w-full min-w-0 mt-6" style={{ scrollbarWidth: "none" }}>
            <table className="gz-table min-w-[500px]">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>City</th>
                  <th>When</th>
                  <th>Draw</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs capitalize text-mute">{t.kind}</p>
                    </td>
                    <td>{t.city}</td>
                    <td className="tabular-nums">{formatDate(t.start_date)}</td>
                    <td className="tabular-nums">
                      <span className="font-semibold text-ink">{t.teams_registered}</span>
                      <span className="text-mute">/{t.max_teams}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleOpenRegister(t)}
                        className="gz-btn gz-btn-primary !min-h-7 !px-3 text-[11px] font-semibold"
                      >
                        Register Team →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tournament Live Leaderboard */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                <h3 className="font-display text-xl font-bold text-ink">Tournament Leaderboard</h3>
              </div>
              <span className="text-xs font-mono text-mute">City Cup Standings</span>
            </div>
            <div className="rounded-2xl border border-line bg-white overflow-x-auto shadow-2xs w-full min-w-0">
              <table className="w-full min-w-[460px] text-xs text-left">
                <thead className="bg-paper border-b border-line text-[10px] font-mono text-mute uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">Played</th>
                    <th className="py-2.5 px-3 text-center">Won</th>
                    <th className="py-2.5 px-3 text-right">NRR</th>
                    <th className="py-2.5 px-3 text-right font-bold">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-mono">
                  {leaderboard.map((row) => (
                    <tr key={row.rank} className="hover:bg-paper/40">
                      <td className="py-2.5 px-3 font-bold text-accent">{row.rank}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-ink">{row.team}</td>
                      <td className="py-2.5 px-3 text-center text-mute">{row.played}</td>
                      <td className="py-2.5 px-3 text-center text-mint font-semibold">{row.won}</td>
                      <td className="py-2.5 px-3 text-right text-mute">{row.nrr}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-ink">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>


        <div>
          <h2 className="font-display text-3xl">Board & Match Fixtures</h2>
          <ul className="mt-6 space-y-4">
            {matches.map((m) => (
              <li key={m.id} className="border-b border-line pb-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">
                    {m.home_team} <span className="text-mute font-normal">vs</span> {m.away_team}
                  </p>
                  <StatusPill status={m.status} />
                </div>
                <p className="mt-1 text-xs text-mute font-mono">
                  {formatDate(m.match_date)}
                  {m.result ? ` · ${m.result}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FLOW 8 MODAL: REGISTER TEAM ── */}
      {selectedTourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-gz-fade-in">
          <div className="gz-panel max-w-lg w-full bg-white rounded-[24px] p-6 sm:p-7 border border-line shadow-lift animate-gz-scale-in relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedTourney(null)}
              className="absolute top-5 right-5 text-mute hover:text-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {!registeredSuccess ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">
                      Register for {selectedTourney.name}
                    </h3>
                    <p className="text-xs text-mute font-mono inline-flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-accent shrink-0" />
                      <span>{selectedTourney.city} · {formatDate(selectedTourney.start_date)}</span>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-paper border border-line text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-mute">Format:</span>
                    <span className="font-semibold text-ink">7-a-side Box Cricket (6 Overs)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">Tournament Entry Fee:</span>
                    <span className="font-bold text-ink">₹1,500 / team</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">Draw Status:</span>
                    <span className="font-mono text-mint">
                      {selectedTourney.teams_registered}/{selectedTourney.max_teams} Slots Filled
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore Blasters / RV Cricket Club"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="gz-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                    Captain Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    className="gz-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                    Squad Roster (7 Players)
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {players.map((p, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={p}
                        onChange={(e) => {
                          const updated = [...players];
                          updated[idx] = e.target.value;
                          setPlayers(updated);
                        }}
                        className="gz-input text-xs py-1.5"
                      />
                    ))}
                  </div>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busyRegistering}
                  className="gz-btn gz-btn-primary w-full font-bold flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {busyRegistering ? "Processing Registration…" : "Pay ₹1,500 & Confirm Team Draw"}
                  </span>
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/15 text-mint mb-2">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-ink">
                  Team Registered Confirmed!
                </h3>
                <p className="text-xs text-ink-soft max-w-sm mx-auto">
                  <strong>{teamName || "Your Team"}</strong> has been added to the official match fixtures for <strong>{selectedTourney.name}</strong>.
                </p>
                <div className="p-3 bg-paper rounded-xl border border-line text-xs font-mono text-mute">
                  Match Schedule & Umpire briefing sent to {captainPhone || "+91 98765 43210"}.
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTourney(null)}
                  className="gz-btn gz-btn-primary !px-6"
                >
                  Back to Tournament Board
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
