import type { ButtonHTMLAttributes } from "react";

// The site's ONE button. Two variants, and every genuine control on the page
// uses it — the pizza trigger, § 04's photo triggers, § 05's turn.
//
// WHY IT EXISTS AND WHY IT HAS A RADIUS. Every control on this site used to
// wear the drawing vocabulary: a hollow square, a leader rule and a mono word,
// the same motif the crop marks and the reference plates use. That reads as a
// diagram element, because on this page it IS one — the identical mark is used
// decoratively three feet away. Nobody could tell the three that do something
// from the dozens that do not. A control is a thing that does something when
// activated, and it is allowed to look like one: 4px of radius, a real box, and
// a state you can see. CLAUDE.md § 4 carries the exemption and its limits —
// this is not a licence for cards, plates, images, containers, badges or
// labels, and pill badges stay banned. A badge displays state; a button takes
// action.
//
// No shadow, at any state, ever. The box, the border and the colour are the
// whole of it — nothing here reaches for depth.

export type ButtonVariant = "solid" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
};

export default function Button({ variant, className, type, ...rest }: Props) {
  return (
    <button
      // Explicit, always. A bare <button> inside a form submits it, and this
      // component has no idea what it will be dropped into.
      type={type ?? "button"}
      className={`ui-btn ui-btn--${variant}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}
