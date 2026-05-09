export function BgPattern() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-drift"
      style={{
        backgroundImage: "radial-gradient(rgba(95,201,178,0.18) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 100%)",
      }}
    />
  );
}
