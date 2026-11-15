// The Proof Lab: why the harmonized record can be trusted, as seven animated exhibits. Every number comes from
// validation_report.json, drift.json, regimes.json or story_extras.json. The full method is in the README.
import { useEffect, useMemo, useRef, useState } from "react";
import { MONTHS_SHORT, fmt } from "../../app/format";
import type { Drift, FireRegime, ValidationReport } from "../../app/types";
import { statics } from "../../app/api";
import { REGIME_COLORS, loadDrift, loadRegimes } from "../data";
import { hhmm } from "../sats/satData";
import { useObs } from "../store";
import { Reel } from "../hud/kinetic";

type Extras = { globe_dive: { date: string; modis_in_state: number; viirs_in_state: number }; sensor_day: { date: string; modis_aqua: number; viirs_snpp: number } };

/** Plays its children's animation once it scrolls into view. */
function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

const EXHIBITS = [
  { id: "pixels", n: "01", t: "One fire, many pixels" },
  { id: "skill", n: "02", t: "Held-out skill" },
  { id: "seam", n: "03", t: "The 2012 seam" },
  { id: "machine", n: "04", t: "Can a machine tell?" },
  { id: "drift", n: "05", t: "Drifting satellites" },
  { id: "honest", n: "06", t: "Honest limits" },
  { id: "regimes", n: "07", t: "Fire regimes of Earth" },
];

export function ProofLab() {
  const [v, setV] = useState<ValidationReport | null>(null);
  const [d, setD] = useState<Drift | null>(null);
  const [regimes, setRegimes] = useState<FireRegime[] | null>(null);
  const [ex, setEx] = useState<Extras | null>(null);
  const [active, setActive] = useState("pixels");
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    statics.validation().then(setV, () => undefined);
    loadDrift().then(setD, () => undefined);
    loadRegimes().then((r) => setRegimes(r.list), () => undefined);
    fetch(`${import.meta.env.BASE_URL}static/story/story_extras.json`).then((r) => r.json()).then(setEx, () => undefined);
  }, []);
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (es) => {
        const top = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace("ex-", ""));
      },
      { root, threshold: 0.4 },
    );
    root.querySelectorAll(".exhibit").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [v, d, regimes, ex]);
  return (
    <section className="lab glass" aria-label="Proof Lab">
      <nav className="lab-nav" aria-label="Exhibits">
        <p className="kicker">Proof Lab</p>
        {EXHIBITS.map((e) => (
          <a key={e.id} href={`#ex-${e.id}`} className={active === e.id ? "on" : ""} onClick={(ev) => { ev.preventDefault(); document.getElementById(`ex-${e.id}`)?.scrollIntoView({ behavior: "smooth" }); }}>
            <span>{e.n}</span>
            {e.t}
          </a>
        ))}
        <a className="lab-close" href="#/">
          ← back to the globe
        </a>
      </nav>
      <div className="lab-scroll" ref={scroller}>
        <header className="lab-hero">
          <p className="kicker">Can 2005 and 2025 really be compared?</p>
          <h1>Seven pieces of evidence that the sensor of origin no longer matters.</h1>
          <p className="muted">Tested on regions and years the model never saw. The full method is described in the project README.</p>
        </header>
        <Pixels ex={ex} />
        {v && <Skill v={v} />}
        {v && <Seam v={v} />}
        {v && <Machine v={v} />}
        {d && <DriftClock d={d} />}
        {v && <Honest v={v} />}
        {regimes && <Regimes list={regimes} />}
        <p className="fine lab-foot">Data: NASA FIRMS (MODIS C6.1, VIIRS 375 m). Numbers: validation_report.json, drift.json, regimes.json.</p>
      </div>
    </section>
  );
}

function Exhibit({ id, n, title, lead, children }: { id: string; n: string; title: string; lead: string; children: React.ReactNode }) {
  const { ref, seen } = useSeen<HTMLElement>();
  return (
    <article id={`ex-${id}`} ref={ref} className={`exhibit ${seen ? "seen" : ""}`} aria-labelledby={`h-${id}`}>
      <p className="kicker">Exhibit {n}</p>
      <h2 id={`h-${id}`}>{title}</h2>
      <p className="ex-lead">{lead}</p>
      {children}
    </article>
  );
}

// 01 · pixels (illustration + one real day)
function Pixels({ ex }: { ex: Extras | null }) {
  const cells = useMemo(() => {
    // a fire front crossing a 3 km × 3 km patch (illustration): VIIRS pixels that see it
    const out: Array<{ x: number; y: number; on: boolean; d: number }> = [];
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const cx = i + 0.5, cy = j + 0.5;
        const front = Math.abs(cy - (2.2 + cx * 0.55)) < 1.15 && cx > 1 && cx < 7.4;
        out.push({ x: i, y: j, on: front, d: (i + j) * 40 });
      }
    return out;
  }, []);
  const ratio = ex ? ex.globe_dive.viirs_in_state / ex.globe_dive.modis_in_state : null;
  return (
    <Exhibit id="pixels" n="01" title="One fire, many pixels" lead="VIIRS pixels are 375 m; MODIS pixels are 1 km, about seven times larger. One fire lights several VIIRS pixels, and VIIRS also sees small fires MODIS misses. Raw counts measure the eye as much as the fire.">
      <div className="ex-row">
        <svg viewBox="0 0 300 300" className="px-ill" role="img" aria-label="Illustration: a fire front lights many small VIIRS pixels but only a few large MODIS pixels">
          <rect width="300" height="300" fill="#0a0f1a" />
          {cells.map((c, i) => (
            <rect key={i} x={c.x * 37.5 + 1} y={c.y * 37.5 + 1} width={35.5} height={35.5} className={`vx ${c.on ? "on" : ""}`} style={{ transitionDelay: `${c.d}ms` }} />
          ))}
          <path d="M40 120 Q120 150 160 190 T280 260" className="front" />
          {[0, 1, 2].map((i) => [0, 1, 2].map((j) => <rect key={`${i}${j}`} x={i * 100 + 2} y={j * 100 + 2} width={96} height={96} className={`mx ${(i === 0 && j === 1) || (i === 1 && j === 1) || (i === 1 && j === 2) || (i === 2 && j === 2) ? "on" : ""}`} />))}
          <text x="10" y="292" className="ill-tag">illustration · 3 km × 3 km</text>
        </svg>
        <div className="ex-facts">
          <div className="fact">
            <span className="fk">VIIRS pixels lit</span>
            <span className="fv viirs">{cells.filter((c) => c.on).length}</span>
          </div>
          <div className="fact">
            <span className="fk">MODIS pixels lit</span>
            <span className="fv modis">4</span>
          </div>
          {ex && (
            <div className="real-day">
              <p className="kicker">One real day · {ex.globe_dive.date}, Punjab + Haryana</p>
              <p>
                <b className="modis">{fmt(ex.globe_dive.modis_in_state)}</b> Aqua MODIS vs <b className="viirs">{fmt(ex.globe_dive.viirs_in_state)}</b> S-NPP VIIRS detections, minutes apart:{" "}
                <b>{ratio?.toFixed(1)}×</b>. Worldwide on {ex.sensor_day.date}: {fmt(ex.sensor_day.modis_aqua)} vs {fmt(ex.sensor_day.viirs_snpp)}.
              </p>
            </div>
          )}
        </div>
      </div>
    </Exhibit>
  );
}

// 02 · skill
function Skill({ v }: { v: ValidationReport }) {
  const rows = (["H0", "H0b", "H1"] as const).map((k) => ({ k, name: v.skill.level_names[k] ?? k, b2: v.skill.primary[k]?.primary_kge ?? 0, b3: (v.holdout_2020.levels as Record<string, { primary_kge: number }>)[k]?.primary_kge ?? 0 }));
  const ex = v.holdout_2020.excluding_aqua_outage as Record<string, { primary?: number } | string | undefined>;
  const pick = (k: string) => {
    const e = ex?.[k];
    return typeof e === "object" && typeof e.primary === "number" ? e.primary : undefined;
  };
  const exH1 = pick("H1"), exH0b = pick("H0b");
  const lo = 0.9, hi = 1.0;
  const w = (x: number) => `${Math.max(2, ((x - lo) / (hi - lo)) * 100)}%`;
  return (
    <Exhibit id="skill" n="02" title="Held-out skill" lead={`Score: Kling-Gupta efficiency (1 = perfect) of monthly counts, on regions and years the model never trained on. ${v.skill.test}.`}>
      <div className="skill">
        <div className="skill-axis">
          <span>0.90</span>
          <span>0.95</span>
          <span>1.00</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.k} className={`skill-row ${r.k === "H1" ? "hero" : ""}`}>
            <span className="sk-name">{r.k === "H1" ? "Calember" : r.name}</span>
            <div className="sk-bars">
              <span className="sk-bar b2" style={{ ["--w" as string]: w(r.b2), transitionDelay: `${i * 180}ms` }}>
                <i>
                  <Reel value={r.b2.toFixed(4)} delay={i * 180} />
                </i>
              </span>
              <span className="sk-bar b3" style={{ ["--w" as string]: w(r.b3), transitionDelay: `${300 + i * 180}ms` }}>
                <i>{r.b3.toFixed(4)}</i>
              </span>
            </div>
          </div>
        ))}
        {exH1 !== undefined && (
          <p className="skill-alt">
            Sealed 2020 without Aqua&rsquo;s Aug 2020 data loss: <b>{exH1.toFixed(4)}</b>
            {exH0b !== undefined && <i> · ratio table {exH0b.toFixed(4)}</i>}
          </p>
        )}
        <p className="legend-line">
          <span className="sw b2" /> unseen regions and years (2018–19) <span className="sw b3" /> sealed 2020 test, run once
        </p>
        <p className="method-link">
          <a href="#/about?go=method">How we did it: the full harmonization method, step by step →</a>
        </p>
        <p className="fine">Axis starts at 0.90 (broken axis). The headline 2020 score keeps Aqua's Aug 2020 data loss in; the second number removes those months after the fact: {String((v.holdout_2020.excluding_aqua_outage as { note: string }).note)}.</p>
      </div>
    </Exhibit>
  );
}

// 03 · seam
function Seam({ v }: { v: ValidationReport }) {
  const s = v.seam_summary;
  const rows = [
    { k: "raw_sum", label: "Raw sensors summed", v: s["2012-01|raw_sum"]?.median_abs_artifact_pp },
    { k: "H0", label: "One global ratio", v: s["2012-01|H0"]?.median_abs_artifact_pp },
    { k: "harmonized", label: "Calember", v: s["2012-01|harmonized"]?.median_abs_artifact_pp },
  ].filter((r) => r.v !== undefined) as Array<{ k: string; label: string; v: number }>;
  const max = Math.log10(Math.max(...rows.map((r) => r.v)) * 1.2);
  const placebo = Object.entries(v.seam_summary)
    .filter(([k]) => !k.startsWith("2012") && k.endsWith("|harmonized"))
    .map(([k, x]) => ({ date: k.split("|")[0], v: x.median_abs_artifact_pp }));
  return (
    <Exhibit id="seam" n="03" title="The 2012 seam disappears" lead={`When VIIRS joined in January 2012, raw counts jumped. Median step at the seam across ${rows[0] ? s["2012-01|raw_sum"].n_units : 15} regions (percentage points, log scale):`}>
      <div className="seam">
        {rows.map((r, i) => (
          <div key={r.k} className={`seam-row ${r.k}`}>
            <span className="sm-label">{r.label}</span>
            <span className="sm-bar" style={{ ["--w" as string]: `${Math.max(3, (Math.log10(Math.max(1, r.v)) / max) * 100)}%`, transitionDelay: `${i * 250}ms` }} />
            <span className="sm-v">{r.v.toFixed(r.v < 10 ? 1 : 0)} pp</span>
          </div>
        ))}
        <p className="legend-line">
          Placebo dates (no sensor change) for Calember: {placebo.map((p) => `${p.date} ${p.v.toFixed(1)} pp`).join(" · ")}. Calember's real seam is as small as a fake one.
        </p>
      </div>
    </Exhibit>
  );
}

// 04 · machine Turing test
function Machine({ v }: { v: ValidationReport }) {
  const t = v.turing as Record<string, { accuracy: number }>;
  const marks = [
    { k: "raw", label: "Raw VIIRS", v: t.raw?.accuracy },
    { k: "sota", label: "Ratio table", v: t.sota_style_H0b?.accuracy },
    { k: "ember", label: "Calember", v: t.harmonized?.accuracy },
    { k: "b3", label: "Calember, sealed 2020", v: t.holdout_2020?.accuracy },
  ].filter((m) => typeof m.v === "number") as Array<{ k: string; label: string; v: number }>;
  const ang = (acc: number) => -90 + ((acc - 0.5) / 0.5) * 180; // 50 % → left, 100 % → right
  const [i, setI] = useState(2);
  const sel = marks[Math.min(i, marks.length - 1)];
  return (
    <Exhibit id="machine" n="04" title="Can a machine tell them apart?" lead="A classifier sees 24-month series from held-out provinces and guesses which one is real MODIS. 50 % means it cannot tell.">
      <div className="ex-row">
        <svg viewBox="-110 -110 220 130" className="gauge" role="img" aria-label={`Machine accuracy: ${marks.map((m) => `${m.label} ${Math.round(m.v * 100)} %`).join(", ")}`}>
          <path d="M-90 0 A90 90 0 0 1 90 0" className="g-track" />
          <path d="M-90 0 A90 90 0 0 1 -63.6 -63.6" className="g-zone" />
          {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((a) => {
            const r = (ang(a) * Math.PI) / 180;
            return (
              <g key={a}>
                <line x1={Math.sin(r) * 82} y1={-Math.cos(r) * 82} x2={Math.sin(r) * 92} y2={-Math.cos(r) * 92} className="g-tick" />
                <text x={Math.sin(r) * 102} y={-Math.cos(r) * 102 + 3} className="g-lbl" textAnchor="middle">
                  {Math.round(a * 100)}
                </text>
              </g>
            );
          })}
          <g className="needle" style={{ transform: `rotate(${ang(sel.v)}deg)` }}>
            <line x1="0" y1="0" x2="0" y2="-80" />
            <circle r="5" />
          </g>
          <text x="0" y="-26" textAnchor="middle" className="g-big">
            {Math.round(sel.v * 100)} %
          </text>
          <text x="-88" y="14" className="g-lbl" textAnchor="start">
            coin flip
          </text>
          <text x="88" y="14" className="g-lbl" textAnchor="end">
            always right
          </text>
        </svg>
        <div className="machine-list" role="radiogroup" aria-label="Which series">
          {marks.map((m, k) => (
            <button key={m.k} type="button" role="radio" aria-checked={k === i} className={k === i ? "on" : ""} onClick={() => setI(k)}>
              <span>{m.label}</span>
              <b>{Math.round(m.v * 100)} %</b>
            </button>
          ))}
          <a className="btn-hot" href="#/turing">
            Try it yourself →
          </a>
        </div>
      </div>
    </Exhibit>
  );
}

// 05 · drift clock
function DriftClock({ d }: { d: Drift }) {
  const series = useMemo(() => {
    const by: Record<string, Array<{ y: number; h: number }>> = {};
    for (const o of d.overpass) {
      if (o.n < 2000 || (o.satellite !== "AQUA" && o.satellite !== "TERRA")) continue;
      (by[o.satellite] ??= []).push({ y: Number(o.month.slice(0, 4)) + (Number(o.month.slice(5, 7)) - 0.5) / 12, h: o.median_local_hour });
    }
    return by;
  }, [d]);
  const years = useMemo(() => [...new Set(d.overpass.map((o) => Number(o.month.slice(0, 4))))].sort(), [d]);
  const [yr, setYr] = useState(years[years.length - 1] ?? 2026);
  const [play, setPlay] = useState(false);
  const { ref, seen } = useSeen<HTMLDivElement>();
  useEffect(() => {
    if (seen && !play) setPlay(true);
  }, [seen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!play) return;
    let y = years[0];
    setYr(y);
    const id = window.setInterval(() => {
      y += 1;
      if (y > years[years.length - 1]) {
        window.clearInterval(id);
        setPlay(false);
        return;
      }
      setYr(y);
    }, 260);
    return () => window.clearInterval(id);
  }, [play, years]);
  const at = (sat: string) => {
    const s = series[sat] ?? [];
    const pts = s.filter((p) => Math.floor(p.y) === yr).map((p) => p.h).sort((a, b) => a - b);
    return pts.length ? pts[Math.floor(pts.length / 2)] : null;
  };
  const hand = (h: number | null, len: number, cls: string, label: string) => {
    if (h === null) return null;
    const a = ((h - 6) / 12) * 180 - 90; // 06:00 left → 18:00 right on a half dial
    return (
      <g className={`hand ${cls}`} style={{ transform: `rotate(${a}deg)` }}>
        <line x1="0" y1="0" x2="0" y2={-len} />
        <text x="0" y={-len - 8} textAnchor="middle" style={{ transform: `rotate(${-a}deg)`, transformOrigin: `0px ${-len - 11}px` }}>
          {label} {hhmm(h)}
        </text>
      </g>
    );
  };
  const yRatio = d.yearly.find((r) => r.year === yr);
  return (
    <Exhibit id="drift" n="05" title="Drifting satellites, measured from the fires" lead={d.summary}>
      <div className="ex-row" ref={ref}>
        <svg viewBox="-120 -118 240 150" className="clock" role="img" aria-label={`Measured local overpass time in ${yr}: Terra ${hhmm(at("TERRA") ?? 0)}, Aqua ${hhmm(at("AQUA") ?? 0)}`}>
          <path d="M-100 0 A100 100 0 0 1 100 0" className="c-face" />
          {Array.from({ length: 13 }, (_, k) => {
            const a = ((k * 15 - 90) * Math.PI) / 180;
            return (
              <g key={k}>
                <line x1={Math.sin(a + Math.PI / 2) * -94} y1={-Math.cos(a + Math.PI / 2) * -94} x2={Math.sin(a + Math.PI / 2) * -100} y2={-Math.cos(a + Math.PI / 2) * -100} className="g-tick" />
              </g>
            );
          })}
          <text x="-104" y="12" className="g-lbl">06:00</text>
          <text x="0" y="-104" className="g-lbl" textAnchor="middle">12:00</text>
          <text x="104" y="12" className="g-lbl" textAnchor="end">18:00</text>
          {hand(at("TERRA"), 72, "terra", "Terra")}
          {hand(at("AQUA"), 88, "aqua", "Aqua")}
          <text x="0" y="30" textAnchor="middle" className="g-big">{yr}</text>
        </svg>
        <div className="ex-facts">
          <label className="year-slider">
            <span>Year {yr}</span>
            <input type="range" min={years[0]} max={years[years.length - 1]} value={yr} onChange={(e) => setYr(Number(e.target.value))} />
          </label>
          <button type="button" className="btn-ghost" onClick={() => setPlay(true)}>
            ▶ Replay the drift
          </button>
          {yRatio && (
            <p className="st-note">
              In {yr}, the real (drifting) MODIS record counted <b>{Math.round(yRatio.observed_over_ember * 100)} %</b> of what pre-drift MODIS would have (Calember). Calember uses VIIRS from 2020, so it is not
              pulled down by the drift.
            </p>
          )}
          {d.case_punjab && <p className="fine">{d.case_punjab.summary}</p>}
        </div>
      </div>
    </Exhibit>
  );
}

// 06 · honesty
function Honest({ v }: { v: ValidationReport }) {
  const ca = v.calendar_agreement.H1;
  return (
    <Exhibit id="honest" n="06" title="Honest limits" lead="What we claim, how well the uncertainty is calibrated, and where Calember is weakest.">
      <div className="honest-grid">
        <div className="fact big">
          <span className="fk">90 % ranges that contain the truth</span>
          <span className="fv">{Math.round((v.coverage90.admin1 ?? 0) * 100)} %</span>
          <span className="fine">provinces; {Math.round((v.coverage90.country ?? 0) * 100)} % countries (target 90 %)</span>
        </div>
        {ca && (
          <div className="fact big">
            <span className="fk">calendar colour agrees with real MODIS</span>
            <span className="fv">{Math.round(ca.within_one * 100)} %</span>
            <span className="fine">
              within one category ({Math.round(ca.exact * 100)} % exact, κ {ca.kappa.toFixed(2)})
            </span>
          </div>
        )}
      </div>
      <ul className="limits">
        {v.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </Exhibit>
  );
}

// 07 · regimes
function Regimes({ list }: { list: FireRegime[] }) {
  const set = useObs((s) => s.set);
  return (
    <Exhibit id="regimes" n="07" title="Fire regimes of Earth" lead={`${list.length} regimes: places grouped by when and how they burn. Petals are months (January at the top).`}>
      <div className="regime-grid">
        {list.map((r) => (
          <div key={r.regime_id} className="regime-card" style={{ ["--rc" as string]: REGIME_COLORS[(r.regime_id - 1) % REGIME_COLORS.length] }}>
            <svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">
              <circle cx="30" cy="30" r="27" fill="none" stroke="rgba(160,185,230,0.15)" />
              <path
                d={
                  r.shape12
                    .map((x, i) => {
                      const a = ((i + 0.5) / 12) * Math.PI * 2;
                      const rr = 3 + 24 * Math.sqrt(x / Math.max(...r.shape12));
                      return `${i ? "L" : "M"}${(30 + Math.sin(a) * rr).toFixed(1)},${(30 - Math.cos(a) * rr).toFixed(1)}`;
                    })
                    .join("") + "Z"
                }
                fill="var(--rc)"
                fillOpacity="0.45"
                stroke="var(--rc)"
              />
            </svg>
            <div>
              <b>{r.name}</b>
              <span className="muted small">{fmt(r.n_units)} places · e.g. {[...new Set(r.example_names ?? [])].slice(0, 2).join("; ")}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-hot"
        onClick={() => {
          set({ layer: "regimes" });
          window.location.hash = "/";
        }}
      >
        Show the regimes on the globe →
      </button>
      <p className="fine">Peak months: {MONTHS_SHORT.join(" · ")} run clockwise.</p>
    </Exhibit>
  );
}
