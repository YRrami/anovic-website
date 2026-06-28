export default function CrmLoading() {
  return <main className="crm-platform min-h-screen p-6"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-8 w-56 rounded-lg bg-gray-200" /><div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="h-32 rounded-lg bg-white" key={index} />)}</div><div className="mt-6 h-96 rounded-lg bg-white" /></div></main>;
}
