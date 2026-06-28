export default function TeamLoading() {
  return <main className="team-platform min-h-screen bg-gray-50" aria-label="Loading workspace">
    <div className="team-shell-grid min-h-screen">
      <aside className="hidden bg-gray-950 p-5 lg:block"><div className="team-skeleton h-9 w-32 bg-white/15" /><div className="mt-10 space-y-3">{Array.from({ length: 8 }, (_, index) => <div key={index} className="team-skeleton h-11 bg-white/10" />)}</div></aside>
      <section className="p-5 lg:p-8"><div className="team-skeleton h-16 w-full" /><div className="mt-6 grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="team-skeleton h-28" />)}</div><div className="team-skeleton mt-5 h-[28rem] w-full" /></section>
    </div>
  </main>;
}
