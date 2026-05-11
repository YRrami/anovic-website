/* eslint-disable @next/next/no-img-element */

export default function Loading() {
  return (
    <div className="anovic-loader-screen" aria-label="Loading Anovic">
      <img
        src="/mark.png"
        alt="Anovic loading mark"
        className="anovic-loader-mark"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}