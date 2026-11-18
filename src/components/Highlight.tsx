// Puts key words (left, right, zero, udhaar, number line...) in highlighted boxes.
import { Fragment } from "react";
import { RichText } from "./Bits";

const KEY_WORDS = [
  "number line",
  "बाएँ",
  "दाएँ",
  "उधार",
  "udhaar",
  "left",
  "right",
  "debt",
  "plus",
  "minus",
  "basement",
  "Ground floor",
  "छोटा",
  "बड़ा",
  "smaller",
  "greater",
  "less",
];

// English words need word boundaries ("less" must not match inside "lesson"); Devanagari words do not.
const RE = new RegExp(
  `(${KEY_WORDS.map((w) => (/^[a-z ]+$/i.test(w) ? `\\b${w}\\b` : w)).join("|")})`,
  "gi",
);

export function Highlight({ text }: { text: string }) {
  const parts = text.split(RE);
  return (
    <>
      {parts.map((p, i) =>
        KEY_WORDS.some((w) => w.toLowerCase() === p.toLowerCase()) ? (
          <span key={i} className="kw">
            {p}
          </span>
        ) : (
          <Fragment key={i}>
            <RichText text={p} />
          </Fragment>
        ),
      )}
    </>
  );
}
