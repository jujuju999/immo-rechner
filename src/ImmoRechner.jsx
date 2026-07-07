import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Palette: "Grundbuch" — cool ledger tones, emerald = gains, rust = losses, gold = tax
const C = {
  bg: "#F5F7F5",
  panel: "#FFFFFF",
  ink: "#17282B",
  sub: "#5B6B6E",
  line: "#DCE3E0",
  emerald: "#0E7C66",
  emeraldSoft: "#E3F0EB",
  rust: "#B4472E",
  rustSoft: "#F6E7E1",
  gold: "#B08928",
  goldSoft: "#F3ECD8",
};

const euro = (n) =>
  isFinite(n) ? Math.round(n).toLocaleString("de-DE") + " €" : "–";
const pct = (n) =>
  isFinite(n) ? n.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %" : "–";

function Field({ label, value, set, min, max, step, unit, hint }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <div className="flex items-baseline justify-between mb-1">
        <label style={{ color: C.ink, fontSize: 13, fontWeight: 600 }}>{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            step={step}
            onChange={(e) => set(parseFloat(e.target.value) || 0)}
            style={{
              width: 90, textAlign: "right",
              fontFamily: "ui-monospace, Menlo, monospace", fontSize: 14,
              color: C.ink, background: C.bg, border: `1px solid ${C.line}`,
              borderRadius: 6, padding: "3px 8px",
            }}
          />
          <span style={{ color: C.sub, fontSize: 12, width: 24 }}>{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: C.emerald }} />
      {hint && <div style={{ color: C.sub, fontSize: 11, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Metric({ label, value, hint, tone }) {
  const map = {
    good: [C.emerald, C.emeraldSoft], bad: [C.rust, C.rustSoft],
    gold: [C.gold, C.goldSoft],
  };
  const [color, bg] = map[tone] || [C.ink, C.bg];
  return (
    <div style={{ background: bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ color: C.sub, fontSize: 12, fontWeight: 600 }}>{label}</div>
      <div style={{ color, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 23, fontWeight: 700, lineHeight: 1.15, marginTop: 2 }}>
        {value}
      </div>
      {hint && <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Bar({ label, value, amount, max, tone }) {
  const color = tone === "bad" ? C.rust : tone === "gold" ? C.gold : tone === "grey" ? C.sub : C.emerald;
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="flex justify-between" style={{ fontSize: 12, color: C.sub, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: C.ink }}>{amount}</span>
      </div>
      <div style={{ background: C.line, borderRadius: 6, height: 11 }}>
        <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color, height: 11, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function ImmoRechner() {
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [nebenPct, setNebenPct] = useState(10.5);
  const [ek, setEk] = useState(60000);
  const [zins, setZins] = useState(3.8);
  const [tilgung, setTilgung] = useState(2.0);
  const [miete, setMiete] = useState(1100);
  const [kosten, setKosten] = useState(150);
  const [wertPct, setWertPct] = useState(1.5);
  const [halte, setHalte] = useState(10);
  const [steuersatz, setSteuersatz] = useState(30);
  const [gebaeude, setGebaeude] = useState(80);
  const [afaSatz, setAfaSatz] = useState(2);
  const [zeigErklaerung, setZeigErklaerung] = useState(false);

  const r = useMemo(() => {
    const neben = kaufpreis * (nebenPct / 100);
    const gesamt = kaufpreis + neben;
    const darlehen = Math.max(0, gesamt - ek);
    const jahresMiete = miete * 12;
    const jahresKosten = kosten * 12;
    const reinertrag = jahresMiete - jahresKosten;

    const brutto = (jahresMiete / kaufpreis) * 100;
    const netto = (reinertrag / gesamt) * 100;

    const annuitaet = darlehen * ((zins + tilgung) / 100);
    const zinsJ1 = darlehen * (zins / 100);
    const cashflowMon = miete - kosten - annuitaet / 12;

    const objektRendite = (reinertrag / gesamt) * 100;
    const ekRendite = ek > 0 ? ((reinertrag - zinsJ1) / ek) * 100 : 0;

    // Steuer
    const afaBasis = gesamt * (gebaeude / 100);
    const afaJahr = afaBasis * (afaSatz / 100);
    const steuerErgebnisJ1 = jahresMiete - jahresKosten - zinsJ1 - afaJahr;
    const steuerJ1 = steuerErgebnisJ1 * (steuersatz / 100); // + = zahlen, - = Erstattung
    const cashflowNachSteuerMon = cashflowMon - steuerJ1 / 12;

    // Jahresweise Projektion mit Steuer
    const rows = [];
    let rest = darlehen, wert = kaufpreis, cum = 0;
    const maxJ = Math.max(35, halte);
    rows.push({ jahr: 0, Restschuld: Math.round(rest), Getilgt: 0 });
    for (let j = 1; j <= maxJ; j++) {
      wert = wert * (1 + wertPct / 100);
      let z = 0, pay = 0;
      if (rest > 0) {
        z = rest * (zins / 100);
        const t = Math.min(rest, annuitaet - z);
        pay = z + t;
        rest = Math.max(0, rest - t);
      }
      const cfVor = jahresMiete - jahresKosten - pay;
      const stErg = jahresMiete - jahresKosten - z - afaJahr;
      const steuer = stErg * (steuersatz / 100);
      cum += cfVor - steuer;
      rows.push({ jahr: j, Restschuld: Math.round(rest), Getilgt: Math.round(darlehen - rest), wert, cum });
    }

    const at = rows.find((x) => x.jahr === halte) || rows[rows.length - 1];
    const objektwert = at.wert || kaufpreis;
    const restN = at.Restschuld;
    const kumCF = at.cum || 0;
    const endvermoegen = objektwert - restN + kumCF;
    const gewinn = endvermoegen - ek;
    const renditePa = ek > 0 && endvermoegen > 0 ? (Math.pow(endvermoegen / ek, 1 / halte) - 1) * 100 : 0;
    const wertzuwachs = objektwert - kaufpreis;
    const schuldenAbbau = darlehen - restN;

    return {
      neben, gesamt, darlehen, brutto, netto, annuitaet, cashflowMon, objektRendite, ekRendite,
      afaJahr, zinsJ1, steuerErgebnisJ1, steuerJ1, cashflowNachSteuerMon,
      rows, objektwert, restN, kumCF, endvermoegen, gewinn, renditePa, wertzuwachs, schuldenAbbau,
    };
  }, [kaufpreis, nebenPct, ek, zins, tilgung, miete, kosten, wertPct, halte, steuersatz, gebaeude, afaSatz]);

  // Erklärung in Worten – liest die aktuell berechneten Werte und erzählt sie nach.
  const erklaerung = useMemo(() => {
    const cfMon = r.cashflowMon;
    const cfNach = r.cashflowNachSteuerMon;
    const spart = r.steuerJ1 < 0;
    const hebelGut = r.ekRendite >= r.objektRendite;
    const items = [];

    items.push({
      h: "Was du kaufst",
      t: `Bei einem Kaufpreis von ${euro(kaufpreis)} zahlst du inklusive ${pct(nebenPct)} Kaufnebenkosten (${euro(r.neben)}) insgesamt ${euro(r.gesamt)}. Davon bringst du ${euro(ek)} Eigenkapital selbst mit, die übrigen ${euro(r.darlehen)} finanzierst du über einen Kredit.`,
    });

    items.push({
      h: "Was die Wohnung abwirft",
      t: `Die Kaltmiete bringt ${euro(miete * 12)} im Jahr – das sind ${pct(r.brutto)} Bruttomietrendite auf den Kaufpreis. Nach laufenden Kosten und bezogen auf die Gesamtinvestition inkl. Nebenkosten bleiben ${pct(r.netto)} Nettomietrendite.`,
    });

    const cfSatz =
      cfMon >= 0
        ? `Nach Kreditrate und Kosten bleiben dir vor Steuer rund ${euro(cfMon)} pro Monat übrig.`
        : `Nach Kreditrate und Kosten musst du vor Steuer jeden Monat rund ${euro(Math.abs(cfMon))} draufzahlen.`;
    const steuerSatz = spart
      ? `Die Steuer hilft dir hier: durch AfA (${euro(r.afaJahr)}/Jahr) und absetzbare Zinsen entsteht auf dem Papier ein Verlust, der dir ${euro(Math.abs(r.steuerJ1))} im Jahr zurückbringt. Damit liegt der Cashflow nach Steuer bei ${euro(cfNach)} pro Monat.`
      : `Auf den steuerlichen Überschuss zahlst du ${euro(r.steuerJ1)} Steuern im Jahr, wodurch der Cashflow nach Steuer bei ${euro(cfNach)} pro Monat liegt.`;
    items.push({ h: "Was am Monatsende übrig ist", t: `${cfSatz} ${steuerSatz}` });

    items.push({
      h: "Der Hebel",
      t: hebelGut
        ? `Deine Objektrendite (${pct(r.objektRendite)}) liegt über den Finanzierungskosten, dadurch hebelt der Kredit deine Eigenkapitalrendite auf ${pct(r.ekRendite)} nach oben – mehr, als wenn du alles bar bezahlt hättest.`
        : `Deine Objektrendite (${pct(r.objektRendite)}) liegt unter den Finanzierungskosten. Der Kredit arbeitet dadurch gegen dich und drückt die Eigenkapitalrendite auf ${pct(r.ekRendite)}.`,
    });

    items.push({
      h: `Vermögen nach ${halte} Jahren`,
      t: `Aus ${euro(ek)} Eigenkapital wird ein Endvermögen von ${euro(r.endvermoegen)} – ein Gewinn von ${euro(r.gewinn)} bzw. ${pct(r.renditePa)} pro Jahr. Er speist sich aus Wertsteigerung (${euro(r.wertzuwachs)}) und Schuldenabbau durch Tilgung (${euro(r.schuldenAbbau)}); Cashflow (${euro(r.kumCF)}) und die einmaligen Nebenkosten (−${euro(r.neben)}) rechnest du gegen.${halte >= 10 ? " Nach 10 Jahren ist ein Verkaufsgewinn zudem steuerfrei." : ` Noch ${10 - halte} Jahre, dann wäre ein Verkaufsgewinn steuerfrei.`}`,
    });

    return items;
  }, [r, kaufpreis, nebenPct, ek, miete, halte]);

  const cfGood = r.cashflowMon >= 0;
  const cfnGood = r.cashflowNachSteuerMon >= 0;
  const hebelGood = r.ekRendite >= r.objektRendite;
  const spart = r.steuerJ1 < 0; // negativer steuerbetrag = Erstattung
  const maxBar = Math.max(r.objektRendite, r.ekRendite, 0.1);
  const maxSrc = Math.max(r.wertzuwachs, r.schuldenAbbau, Math.abs(r.kumCF), r.neben, 1);
  const chartRows = r.rows.filter((x) => x.jahr <= Math.max(halte + 2, 20));

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: "ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif", padding: 20, borderRadius: 14 }}>
      <div className="mb-5">
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: C.emerald, fontWeight: 700 }}>Immobilien-Rechner</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 4px" }}>Rendite, Steuer &amp; Vermögensaufbau</h1>
        <p style={{ color: C.sub, fontSize: 13, maxWidth: 640 }}>
          Zieh an den Reglern. Achte besonders auf <b>Cashflow nach Steuer</b> – die AfA senkt
          deine Steuer, obwohl kein Geld abfließt.
        </p>
        <button
          type="button"
          onClick={() => setZeigErklaerung((v) => !v)}
          style={{
            marginTop: 10, cursor: "pointer",
            background: zeigErklaerung ? C.panel : C.emerald,
            color: zeigErklaerung ? C.emerald : "#fff",
            border: `1px solid ${C.emerald}`, borderRadius: 8,
            padding: "8px 14px", fontSize: 13, fontWeight: 700,
          }}
        >
          {zeigErklaerung ? "Erklärung ausblenden" : "Erklär mir das Ergebnis"}
        </button>
      </div>

      {zeigErklaerung && (
        <div style={{ background: C.emeraldSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Dein Ergebnis in Worten</div>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 12 }}>Aktualisiert sich live, wenn du an den Reglern ziehst.</div>
          {erklaerung.map((e) => (
            <div key={e.h} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.emerald, marginBottom: 2 }}>{e.h}</div>
              <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>{e.t}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* INPUTS */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <Field label="Kaufpreis" value={kaufpreis} set={setKaufpreis} min={50000} max={1000000} step={5000} unit="€" />
          <Field label="Kaufnebenkosten" value={nebenPct} set={setNebenPct} min={5} max={15} step={0.1} unit="%" hint="Grunderwerbst. + Notar + ggf. Makler" />
          <Field label="Eigenkapital" value={ek} set={setEk} min={0} max={kaufpreis} step={5000} unit="€" />
          <Field label="Sollzins p.a." value={zins} set={setZins} min={1} max={8} step={0.1} unit="%" />
          <Field label="Anf. Tilgung p.a." value={tilgung} set={setTilgung} min={1} max={5} step={0.5} unit="%" />
          <Field label="Kaltmiete / Monat" value={miete} set={setMiete} min={200} max={5000} step={50} unit="€" />
          <Field label="Nicht uml. Kosten / Mon." value={kosten} set={setKosten} min={0} max={800} step={10} unit="€" hint="Verwaltung, Instandhaltung" />
          <Field label="Wertsteigerung p.a." value={wertPct} set={setWertPct} min={0} max={5} step={0.5} unit="%" />
          <Field label="Haltedauer" value={halte} set={setHalte} min={1} max={30} step={1} unit="J" hint="ab 10 J. Verkaufsgewinn steuerfrei" />

          <div style={{ borderTop: `1px solid ${C.line}`, margin: "14px 0 12px", paddingTop: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Steuer</span>
          </div>
          <Field label="Grenzsteuersatz" value={steuersatz} set={setSteuersatz} min={0} max={45} step={1} unit="%" hint="dein persönlicher Satz (0–45 %)" />
          <Field label="Gebäudeanteil" value={gebaeude} set={setGebaeude} min={50} max={95} step={1} unit="%" hint="nur Gebäude ist abschreibbar, nicht der Boden" />
          <Field label="AfA-Satz" value={afaSatz} set={setAfaSatz} min={2} max={3} step={0.5} unit="%" hint="2 % Bestand · 3 % Neubau ab 2023 · 2,5 % vor 1925" />
        </div>

        {/* OUTPUTS */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Bruttomietrendite" value={pct(r.brutto)} hint="Miete ÷ Kaufpreis" />
            <Metric label="Nettomietrendite" value={pct(r.netto)} hint="nach Kosten & Nebenkosten" />
            <Metric label="Cashflow / Mon. (vor Steuer)" value={euro(r.cashflowMon)} tone={cfGood ? "good" : "bad"} hint="Miete − Kosten − Rate" />
            <Metric label="Cashflow / Mon. (nach Steuer)" value={euro(r.cashflowNachSteuerMon)} tone={cfnGood ? "good" : "bad"} hint="inkl. Steuerwirkung" />
          </div>

          {/* HEBEL */}
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
            <div className="flex items-baseline justify-between mb-3">
              <span style={{ fontSize: 13, fontWeight: 700 }}>Der Hebel (Jahr 1)</span>
              <span style={{ fontSize: 11, color: C.sub }}>Objekt- vs. Eigenkapitalrendite</span>
            </div>
            <Bar label="Objektrendite (unhebelt)" value={r.objektRendite} amount={pct(r.objektRendite)} max={maxBar} tone="grey" />
            <Bar label="Eigenkapitalrendite (gehebelt)" value={Math.max(0, r.ekRendite)} amount={pct(r.ekRendite)} max={maxBar} tone={hebelGood ? "good" : "bad"} />
            <div style={{ fontSize: 11, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
              {hebelGood ? "Objektrendite über dem Zins → der Kredit hebelt deine Rendite nach oben." : "Zins über der Objektrendite → der Hebel arbeitet gegen dich."}
            </div>
          </div>
        </div>
      </div>

      {/* STEUER & AfA */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginTop: 20 }}>
        <div className="flex items-baseline justify-between mb-4">
          <span style={{ fontSize: 15, fontWeight: 800 }}>Steuer &amp; AfA (Jahr 1)</span>
          <span style={{ fontSize: 11, color: C.sub }}>Papierverlust senkt echte Steuer</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Metric label="AfA / Jahr" value={euro(r.afaJahr)} tone="gold" hint={`${pct(afaSatz)} auf ${pct(gebaeude)} Gebäude`} />
          <Metric label="Absetzbare Zinsen" value={euro(r.zinsJ1)} hint="Tilgung zählt NICHT" />
          <Metric label="Steuerliches Ergebnis" value={euro(r.steuerErgebnisJ1)} tone={r.steuerErgebnisJ1 < 0 ? "good" : undefined} hint={r.steuerErgebnisJ1 < 0 ? "Verlust → senkt Steuer" : "Gewinn → wird versteuert"} />
          <Metric label={spart ? "Steuer­ersparnis / Jahr" : "Steuer / Jahr"} value={euro(Math.abs(r.steuerJ1))} tone={spart ? "good" : "bad"} hint={spart ? "Finanzamt zahlt zurück" : "an das Finanzamt"} />
        </div>
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.5 }}>
          {spart
            ? "Zinsen + AfA sind höher als die Miete → auf dem Papier Verlust. Den verrechnest du mit deinem übrigen Einkommen und bekommst Steuern zurück."
            : "Miete übersteigt Zinsen + AfA → du versteuerst den Überschuss zu deinem Grenzsteuersatz."}
        </div>
      </div>

      {/* VERMÖGEN */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginTop: 16 }}>
        <div className="flex items-baseline justify-between mb-4">
          <span style={{ fontSize: 15, fontWeight: 800 }}>Vermögen nach {halte} Jahren</span>
          <span style={{ fontSize: 11, color: halte >= 10 ? C.emerald : C.sub, fontWeight: halte >= 10 ? 700 : 400 }}>
            {halte >= 10 ? "✓ Verkaufsgewinn steuerfrei" : `noch ${10 - halte} J. bis steuerfrei`}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Metric label="Gewinn gesamt" value={euro(r.gewinn)} tone={r.gewinn >= 0 ? "good" : "bad"} hint={`aus ${euro(ek)} Eigenkapital`} />
          <Metric label="Rendite p.a." value={pct(r.renditePa)} tone={r.renditePa >= 0 ? "good" : "bad"} hint="auf dein Eigenkapital" />
          <Metric label="Endvermögen" value={euro(r.endvermoegen)} hint={`Objektwert ${euro(r.objektwert)}`} />
        </div>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, marginBottom: 8 }}>Woher kommt der Gewinn?</div>
        <Bar label="Wertsteigerung" value={r.wertzuwachs} amount={euro(r.wertzuwachs)} max={maxSrc} tone="good" />
        <Bar label="Schuldenabbau durch Tilgung" value={r.schuldenAbbau} amount={euro(r.schuldenAbbau)} max={maxSrc} tone="good" />
        <Bar label="Kumulierter Cashflow (nach Steuer)" value={Math.max(0, r.kumCF)} amount={euro(r.kumCF)} max={maxSrc} tone={r.kumCF >= 0 ? "gold" : "bad"} />
        <Bar label="− Kaufnebenkosten (einmalig)" value={r.neben} amount={"−" + euro(r.neben)} max={maxSrc} tone="bad" />
      </div>

      {/* TILGUNGSVERLAUF */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Tilgungsverlauf</div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 12 }}>Restschuld sinkt, dein getilgter Anteil wächst.</div>
        <div style={{ width: "100%", height: 230 }}>
          <ResponsiveContainer>
            <AreaChart data={chartRows} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="gRest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.rust} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.rust} stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="gTil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.emerald} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.emerald} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="jahr" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.sub }} tickLine={false} width={48} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
              <Tooltip formatter={(v) => euro(v)} labelFormatter={(l) => "Jahr " + l} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.line}` }} />
              <Area type="monotone" dataKey="Restschuld" stroke={C.rust} fill="url(#gRest)" strokeWidth={2} />
              <Area type="monotone" dataKey="Getilgt" stroke={C.emerald} fill="url(#gTil)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p style={{ fontSize: 11, color: C.sub, marginTop: 14, lineHeight: 1.5 }}>
        Vereinfachtes Modell: lineare AfA, Verlustverrechnung mit übrigem Einkommen zum
        Grenzsteuersatz, Darlehen = Kaufpreis + Nebenkosten − Eigenkapital. Ohne Zinsänderung
        nach der Zinsbindung, Mietausfall, Verkaufskosten oder Sonderabschreibungen. Lern- und
        Überschlagswerkzeug – ich bin kein Steuerberater, für echte Käufe zählt die individuelle Beratung.
      </p>
    </div>
  );
}
