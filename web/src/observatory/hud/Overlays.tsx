// Lab, Turing and About open over the dimmed, still-turning planet.
import { useEffect } from "react";
import { ProofLab } from "../lab/ProofLab";
import { TuringArena } from "../lab/TuringArena";
import { Rankings } from "../lab/Rankings";
import { useObs } from "../store";

export function Overlays() {
  const view = useObs((s) => s.view);
  useEffect(() => {
    if (view !== "lab" && view !== "turing" && view !== "about" && view !== "rankings") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (window.location.hash = "/");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);
  if (view === "lab") return <ProofLab />;
  if (view === "turing") return <TuringArena />;
  if (view === "about") return <About />;
  if (view === "rankings") return <Rankings />;
  return null;
}

function About() {
  // the Proof Lab links here with #/about?go=method: open at the detailed method
  useEffect(() => {
    if (!window.location.hash.includes("go=method")) return;
    const id = window.setTimeout(() => document.getElementById("method")?.scrollIntoView({ block: "start" }), 350);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <section className="about glass" aria-label="About Calember">
      <a className="icon-btn arena-x" href="#/" aria-label="Back to the globe">
        ✕
      </a>
      <p className="kicker">About</p>
      <h1>Calember: the fire memory that outlives its satellites.</h1>
      <p>
        NASA's Terra and Aqua satellites have counted active fires with MODIS since 2000 and end science operations in 2027. The sharper VIIRS sensors (since 2012) count several times
        more fires, so the two records cannot be compared directly. Calember translates VIIRS into <b>hotspots (MODIS-equivalent)</b>: what MODIS Terra + Aqua would have counted at their
        original overpass times. The result is one record from November 2000 to now, for any place on Earth.
      </p>
      <h2>The method in four steps</h2>
      <ol className="limits">
        <li>
          <b>Clean and grid.</b> Every MODIS and VIIRS detection from NASA FIRMS, minus gas flares, volcanoes and industry, on one hexagon grid (≈ 253 km²) per month.
        </li>
        <li>
          <b>Learn on the overlap.</b> In 2012–2019 both sensors flew; a machine-learning model learns, from what VIIRS saw in a cell, around it and before it, what MODIS counted.
        </li>
        <li>
          <b>Translate.</b> Every VIIRS month becomes hotspots (MODIS-equivalent) with a 90 % range; months with satellite data losses are gap-filled and flagged.
        </li>
        <li>
          <b>Prove.</b> Scores come only from regions held out of training and from 2020, sealed in advance. The <a href="#/lab">Proof Lab</a> shows them.
        </li>
      </ol>
      <h2>How the record is built, month by month</h2>
      <ul className="limits">
        <li>2000-11 → 2002-06: Terra only, scaled to Terra + Aqua.</li>
        <li>2002-07 → 2011-12: MODIS Terra + Aqua, as measured.</li>
        <li>2012-01 → 2019-12: MODIS blended with the VIIRS translation.</li>
        <li>2020-01 → now: VIIRS translated to MODIS-equivalent (MODIS has drifted).</li>
        <li>Latest months: near-real-time NOAA-20 / NOAA-21, marked provisional.</li>
      </ul>
      <h2 id="method">How the harmonization works, in detail</h2>
      <p>
        This is exactly what the code in our repository does, step by step. Every number comes from our validation files; the <a href="#/lab">Proof Lab</a> shows the
        results.
      </p>

      <h3>
        <span>0</span> The target
      </h3>
      <p>
        For every H3 resolution-5 hexagon (≈ 253 km², 571,982 land cells) and every calendar month: the number of cleaned detections that <b>MODIS Collection 6.1 Terra + Aqua</b> would
        have reported (confidence ≥ 30, type 0 &ldquo;presumed vegetation fire&rdquo;, static sources masked) at their <b>original, pre-drift overpass times</b>, with complete data on
        every day. We call this unit <b>hotspots (MODIS-equivalent)</b>. The goal: a record in which the sensor of origin can no longer be detected.
      </p>

      <h3>
        <span>1</span> Data
      </h3>
      <ul className="limits">
        <li>NASA FIRMS yearly archives (standard processing): MODIS C6.1 2000–2025, VIIRS 375 m Suomi NPP 2012–2025, NOAA-20 2018–2025.</li>
        <li>NASA FIRMS area API for 2026 and for NOAA-21 (from March 2023), standard and near-real-time.</li>
        <li>657.8 million detections in total, checked by file size, CRC, headers and day coverage (no duplicate days). Biomes: RESOLVE Ecoregions 2017. Borders: Natural Earth.</li>
      </ul>

      <h3>
        <span>2</span> Clean
      </h3>
      <ul className="limits">
        <li>MODIS: confidence ≥ 30 and type 0. VIIRS: confidence nominal or high, and type 0. Satellite codes are normalized; an unknown code stops the build.</li>
        <li>
          <b>Static-source mask</b> on a ≈ 5 km² grid (H3 resolution 7; 54,013 cells masked). A cell is masked if Suomi NPP sees it in ≥ 50 % of the 144 months of 2013–2024 and in ≥ 8
          different years, or if any product has ≥ 3 type-1/2 (volcano, other static source) detections there.
        </li>
        <li>
          Why it matters: VIIRS collection 2 labels some gas flares as type 0 (vegetation fire). The mask removes 60–76 % of detections in flaring regions (Persian Gulf,
          Khanty-Mansiysk, Algeria) and under 2 % in farm and savanna regions (Punjab, Amazon, northern Australia).
        </li>
      </ul>

      <h3>
        <span>3</span> Describe every cell-month
      </h3>
      <p>Each detection goes to its hexagon. For each satellite, cell and month we compute:</p>
      <ul className="limits">
        <li>detections (day and night), fire radiative power (sum, median, 90th percentile, maximum), mean pixel size, share of weak fires (&lt; 5 MW), distinct fire days;</li>
        <li>
          <b>fire-cell-passes</b>: distinct satellite × 5 km² cell × date × 10-minute slot. It separates &ldquo;more fires&rdquo; from &ldquo;the same fire seen as several small
          pixels&rdquo;. Detections ÷ fire-cell-passes gives the multiplicity.
        </li>
      </ul>

      <h3>
        <span>4</span> Learn the translation on the overlap years (2012–2019)
      </h3>
      <p>
        Aqua MODIS and Suomi NPP VIIRS cross the equator minutes apart in the early afternoon, so for the same fires both answers are known. The models learn MODIS&rsquo;s count from what
        VIIRS saw.
      </p>
      <div className="m-scroll">
        <table className="m-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Predicts</th>
              <th>How</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>Aqua model</b>
              </td>
              <td>Aqua MODIS count of a cell-month</td>
              <td>
                LightGBM gradient-boosted trees, Tweedie objective (variance power 1.2), learning rate 0.05, 63 leaves, ≥ 50 rows per leaf, 80 % feature and row sampling, L2 = 1.0,
                1,400 rounds, seed 2026
              </td>
            </tr>
            <tr>
              <td>
                <b>Terra model</b>
              </td>
              <td>Terra MODIS count of a cell-month</td>
              <td>The same settings, 1,500 rounds. Calember = Aqua prediction + Terra prediction.</td>
            </tr>
            <tr>
              <td>
                <b>Zero model</b>
              </td>
              <td>MODIS count where Suomi NPP saw nothing that month</td>
              <td>A rate per biome × (any VIIRS fire in the 6 neighbouring cells) × (regional activity bin), shrunk toward pooled rates (k = 200)</td>
            </tr>
            <tr>
              <td>
                <b>Early-years scaling</b>
              </td>
              <td>Terra + Aqua for Nov 2000 – Jun 2002 (Aqua not yet flying)</td>
              <td>A factor per biome × month × day/night, learned from 2003–2011 when both flew</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="limits">
        <li>
          <b>Training rows:</b> cell-months where Suomi NPP saw fire. We select on the input only; selecting on &ldquo;any sensor saw fire&rdquo; would leak the answer into training.
        </li>
        <li>
          <b>Inputs</b> (all from VIIRS or from the training period): the cell&rsquo;s VIIRS statistics above and its multiplicity; VIIRS detections and fire-cell-passes in the 6
          surrounding cells; the cell&rsquo;s VIIRS count in the previous and next month; the surrounding region this month (H3 resolution 3, ≈ 12,000 km²: total VIIRS, detections per
          pass, FRP per detection); latitude, month (as sine and cosine) and biome.
        </li>
        <li>
          <b>The cell&rsquo;s own history</b>, computed leave-one-year-out so a row never sees its own year: <code>hist_ratio = (Y + 20·G) / (S + 20)</code>, the cell&rsquo;s MODIS total Y
          over its VIIRS total S in the other training years, shrunk toward the global ratio G; plus the cell&rsquo;s mean yearly VIIRS and MODIS counts (log).
        </li>
        <li>
          <b>Physics as a rule:</b> monotone constraints, so the prediction can only rise when VIIRS sees more (detections, day count, night count, fire-cell-passes, FRP sum, fire days).
        </li>
        <li>
          <b>Tuning</b> used an inner split only (training folds up to 2016, validation 2017), never the test sets.
        </li>
      </ul>

      <h3>
        <span>5</span> Uncertainty
      </h3>
      <ul className="limits">
        <li>
          <b>90 % ranges:</b> cross-fitted split-conformal prediction on <code>|log((y+1)/(p+1))|</code>, calibrated separately for nine levels of the prediction (edges 0.3, 1, 3, 10,
          30, 100, 300, 1,000, 10,000). Range: <code>[(p+1)·e^−q − 1, (p+1)·e^q − 1]</code>.
        </li>
        <li>
          <b>Full distribution</b> (for the Sensor Turing test and simulations): a zero-inflated negative binomial with the model&rsquo;s mean and an overdispersion per prediction level,
          cross-fitted over region groups.
        </li>
        <li>Area totals add a random part (√Σ sd²) and a systematic part that is correlated within each biome.</li>
      </ul>

      <h3>
        <span>6</span> Assemble one record
      </h3>
      <ul className="limits">
        <li>
          <b>2000-11 → 2002-06</b>: Terra only, scaled to Terra + Aqua (step 4).
        </li>
        <li>
          <b>2002-07 → 2011-12</b>: MODIS Terra + Aqua as measured.
        </li>
        <li>
          <b>2012 → 2019</b>: inverse-variance blend of MODIS and the cross-fitted model (every region predicted by a model that never saw it).
        </li>
        <li>
          <b>2020-01 → 2026-07</b>: the model on VIIRS. MODIS has drifted (Aqua&rsquo;s overpass moved from 13:33 to 14:47 local time, Terra&rsquo;s from 10:34 to 09:22), so it no
          longer measures the same thing.
        </li>
        <li>
          <b>2026-08 → now</b>: the same model on NOAA-20 (Suomi NPP fire production ended on 2 November 2026); provisional.
        </li>
      </ul>

      <h3>
        <span>7</span> Repair satellite data losses
      </h3>
      <p>
        A sensor-day counts as lost when its global count falls below half of its centred 61-day median. Lost MODIS days are filled from the paired satellite (its detections × a biome
        ratio from days when both were complete). Model inputs are scaled by 1 / (1 − lost share). In months where Suomi NPP lost ≥ 5 % and NOAA-20 at most half of that, NOAA-20 (÷ 0.985)
        replaces it. On 36 simulated outages this brings the bias from −14.6 % to +0.1 % (KGE 0.996). Filled months are flagged in the data.
      </p>

      <h3>
        <span>8</span> Validate on data the model never saw
      </h3>
      <ul className="limits">
        <li>
          <b>Spatial folds:</b> five folds of whole H3 resolution-2 regions, so the model is always scored on places it never trained on.
        </li>
        <li>
          <b>Development test:</b> train on the other folds in 2012–2017, score the held-out fold in 2018–2019. KGE (1 = perfect): <b>0.9913</b>, against 0.9633 for a biome × month ×
          day/night look-up table (state-of-the-art style, as in GFED5-NRT) and 0.9445 for one global ratio.
        </li>
        <li>
          <b>Sealed confirmation test,</b> written down in advance and run once: train on 2012–2019, predict 2020. KGE <b>0.9684</b> (look-up table 0.9538). Without Aqua&rsquo;s Aug 2020
          data loss, when the reference itself had a hole: 0.9894 (look-up table 0.9750).
        </li>
        <li>
          <b>Other tests:</b> the 2012 jump falls from 399.5 % (raw) to 4.0 %, as small as the 1.7–2.6 % found on placebo dates; a classifier tells Calember from real MODIS 55.1 % of the
          time (raw VIIRS 77.4 %; 50 % is a coin flip); 90 % ranges contain the truth 90.0 % of the time.
        </li>
        <li>
          <b>The score:</b> Kling–Gupta efficiency of monthly totals at province, country and biome level; the headline is their mean. Run-to-run noise is ±0.0005.
        </li>
      </ul>

      <h2>Data and credits</h2>
      <p>
        Fire detections: NASA FIRMS (MODIS Collection 6.1; VIIRS 375 m S-NPP, NOAA-20, NOAA-21). Night Earth: NASA Earth Observatory Black Marble 2016. Boundaries: Natural Earth. Biomes:
        RESOLVE Ecoregions 2017 (CC-BY 4.0). No NASA logos are used; this is not an official NASA product.
      </p>
      <p className="team-line">
        <b>Team Calember:</b> Sidant Chaturbedi · Sandesh Singh · Shashwat Waiba
      </p>
      <h2>Getting around</h2>
      <p>
        Search with <kbd>/</kbd>, open a place, then walk its seven stations with <kbd>1</kbd>–<kbd>7</kbd>. Press <kbd>?</kbd> for every keyboard shortcut.
      </p>
      <p className="ctl-row">
        <a className="btn-ghost" href="./">Watch the story</a>
        <button type="button" className="btn-ghost" onClick={() => useObs.getState().set({ shortcutsOpen: true })}>
          Keyboard shortcuts
        </button>
      </p>
    </section>
  );
}
