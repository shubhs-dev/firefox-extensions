// Epoch parsing/formatting. Loaded by background.js and injected into pages before content/overlay.js.
// `var` (not const) because the file may be injected into the same frame more than once.
var EpochConvert = (() => {
  // Unit is inferred from the digit count of the integer part.
  const UNITS = [
    { name: "seconds", maxDigits: 11, exp: 0 },
    { name: "milliseconds", maxDigits: 14, exp: 3 },
    { name: "microseconds", maxDigits: 17, exp: 6 },
    { name: "nanoseconds", maxDigits: 19, exp: 9 },
  ];
  const MAX_MS = 8.64e15; // JS Date range
  const NS_PER_S = 1_000_000_000n;

  // Returns { unit, date, nanos, precision } or null. `nanos` is the sub-second part (0..999999999),
  // `precision` the number of fractional-second digits the input actually carried.
  function parse(text) {
    const cleaned = String(text).trim().replace(/[\s,_]/g, "");
    const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(cleaned);
    if (!match) return null;

    const [, sign, intPart, frac = ""] = match;
    const digits = intPart.replace(/^0+(?=\d)/, "").length;
    const unit = UNITS.find((u) => digits <= u.maxDigits);
    if (!unit) return null;

    const subDigits = 9 - unit.exp;
    const fracDigits = Math.min(frac.length, subDigits);
    let ns = BigInt(intPart) * 10n ** BigInt(subDigits)
      + BigInt(frac.slice(0, fracDigits).padEnd(subDigits, "0") || "0");
    if (sign === "-") ns = -ns;

    let seconds = ns / NS_PER_S;
    let nanos = ns % NS_PER_S;
    if (nanos < 0n) {
      nanos += NS_PER_S;
      seconds -= 1n;
    }

    const ms = Number(seconds) * 1000 + Number(nanos / 1_000_000n);
    if (Math.abs(ms) > MAX_MS) return null;

    return { unit: unit.name, date: new Date(ms), nanos: Number(nanos), precision: unit.exp + fracDigits };
  }

  function fraction({ nanos, precision }) {
    return precision ? "." + String(nanos).padStart(9, "0").slice(0, precision) : "";
  }

  function toUtcIso(parsed) {
    return parsed.date.toISOString().replace(/\.\d{3}Z$/, `${fraction(parsed)}Z`);
  }

  function toLocalIso(parsed) {
    const d = parsed.date;
    const pad = (n, width = 2) => String(n).padStart(width, "0");
    const y = d.getFullYear();
    const year = y >= 0 && y <= 9999 ? pad(y, 4) : (y < 0 ? "-" : "+") + pad(Math.abs(y), 6);
    const offset = -d.getTimezoneOffset();
    const abs = Math.abs(offset);
    const zone = `${offset >= 0 ? "+" : "-"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
    return `${year}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${fraction(parsed)}${zone}`;
  }

  function relative(parsed, now = Date.now()) {
    const diffS = (parsed.date.getTime() - now) / 1000;
    const steps = [
      ["year", 31_536_000], ["month", 2_592_000], ["week", 604_800],
      ["day", 86_400], ["hour", 3_600], ["minute", 60], ["second", 1],
    ];
    const [unit, size] = steps.find(([, s]) => Math.abs(diffS) >= s) ?? ["second", 1];
    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.round(diffS / size), unit);
  }

  function timeZoneName() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return { parse, toUtcIso, toLocalIso, relative, timeZoneName };
})();
