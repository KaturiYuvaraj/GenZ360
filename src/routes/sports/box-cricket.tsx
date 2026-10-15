import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { EmptyState, LoadingState } from "@/components/ui/State";
import { listGrounds } from "@/lib/data/catalog";
import { rupees } from "@/lib/ids";

const Ground3D = lazy(() =>
  import("@/components/three/CricketGround").then((m) => ({ default: m.CricketGround })),
);

export const Route = createFileRoute("/sports/box-cricket")({
  component: BoxCricket,
  head: () => ({
    meta: [{ title: "Box Cricket — GenZ360" }],
  }),
});

function BoxCricket() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [grounds, setGrounds] = useState<Awaited<ReturnType<typeof listGrounds>> | null>(null);
  const [show3d, setShow3d] = useState(false);

  useEffect(() => {
    listGrounds({ data: { q, city } })
      .then(setGrounds)
      .catch(() => setGrounds([]));
  }, [q, city]);

  const cities = ["All", "Bengaluru", "Mumbai", "Chennai", "Hyderabad", "Gurugram", "Pune"];

  return (
    <Page>
      <section className="gz-wrap-wide py-10">
        <p className="gz-kicker">Box cricket</p>
        <h1 className="gz-hero-title mt-3">
          Search a cage.
          <br />
          Book a slot.
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <input
            className="gz-input max-w-sm"
            placeholder="Ground, locality, turf…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                className={`gz-chip ${city === c ? "bg-ink text-paper" : ""}`}
                onClick={() => setCity(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="gz-wrap-wide">
        {!grounds ? <LoadingState label="Loading grounds" /> : null}
        {grounds && grounds.length === 0 ? (
          <EmptyState title="No grounds found" body="Try another city or clear the search." />
        ) : null}
        <div className="grid gap-6">
          {grounds?.map((g) => (
            <article
              key={g.id}
              className="grid overflow-hidden rounded-[22px] border border-line bg-white md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
            >
              <img src={g.image_url} alt={g.name} className="h-56 w-full object-cover md:h-full" />
              <div className="flex flex-col justify-between p-6">
                <div>
                  <p className="gz-kicker">{g.pitch_type}</p>
                  <h2 className="mt-1 font-display text-3xl">{g.name}</h2>
                  <p className="text-sm text-mute">
                    {g.locality}, {g.city} · {g.rating} · {g.review_count} ratings
                  </p>
                  <p className="mt-3 text-ink-soft">{g.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.facilities.split(",").map((f) => (
                      <span key={f} className="gz-chip">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                  <p>
                    <span className="font-display text-3xl tabular-nums">
                      {rupees(g.price_per_hour)}
                    </span>
                    <span className="text-mute"> / hour</span>
                  </p>
                  <Link
                    to="/sports/grounds/$id"
                    params={{ id: g.id }}
                    className="gz-btn gz-btn-primary"
                  >
                    Book now
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gz-wrap-wide mt-16 mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="gz-kicker">Optional 3D</p>
            <h2 className="font-display text-3xl">Inspect a pitch</h2>
          </div>
          <button type="button" className="gz-btn gz-btn-ghost" onClick={() => setShow3d((v) => !v)}>
            {show3d ? "Hide ground" : "Load 3D ground"}
          </button>
        </div>
        {show3d ? (
          <div className="mt-6">
            <Suspense fallback={<LoadingState label="Loading pitch" />}>
              <Ground3D />
            </Suspense>
            <p className="mt-2 text-xs text-mute">Drag to rotate. Scroll to zoom. Lights, nets, pitch, pavilion.</p>
          </div>
        ) : null}
      </section>
    </Page>
  );
}
