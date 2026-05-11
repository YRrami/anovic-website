/* eslint-disable @next/next/no-img-element */

export default function Loading() {
  return (
    <div className="anovic-loader-screen">
      <div className="anovic-loader-card">
        <div className="anovic-loader-logo">
          <img
            src="/logo.png"
            alt="Anovic logo"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="anovic-loader-copy">
          <span>Loading Anovic</span>
          <strong>Building your brand experience...</strong>
        </div>

        <div className="anovic-loader-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
