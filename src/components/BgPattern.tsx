export function BgPattern() {
  return (
    <div data-testid="bg-pattern" className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-supabase-grid opacity-40" />
      <div className="bg-drift-slow absolute -left-20 top-[-10%] h-[44vh] w-[44vh] rounded-full bg-primary/12 blur-3xl" />
      <div className="bg-drift-reverse absolute bottom-[-15%] right-[-5%] h-[36vh] w-[36vh] rounded-full bg-primary/8 blur-3xl" />
    </div>
  );
}
