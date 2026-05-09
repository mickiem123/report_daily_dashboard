import { motion } from "framer-motion";

function FloatingPaths({ direction }: { direction: 1 | -1 }) {
  const paths = Array.from({ length: 28 }, (_, i) => {
    const offset = i * 6 * direction;
    const startX = -420 + offset;
    const controlX = -300 + offset;
    const endX = 700 + offset;
    const y1 = -220 + i * 8;
    const y2 = 180 - i * 7;
    const y3 = 350 - i * 6;
    const y4 = 860 - i * 7;

    return {
      id: `${direction}-${i}`,
      d: `M${startX} ${y1}C${controlX} ${y1} ${controlX} ${y2} ${150 + offset} ${y3}C${620 + offset} ${460 - i * 5} ${endX} ${y4} ${endX} ${y4}`,
      width: 0.6 + i * 0.035,
      opacity: 0.07 + i * 0.02,
      duration: 20 + i * 0.5,
    };
  });

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-slate-900 dark:text-white"
      viewBox="0 0 696 316"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          strokeOpacity={path.opacity}
          initial={{ pathLength: 0.3, opacity: path.opacity * 0.9 }}
          animate={{
            pathLength: 1,
            opacity: [path.opacity * 0.7, path.opacity, path.opacity * 0.7],
            pathOffset: [0, 1, 0],
          }}
          transition={{
            duration: path.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ))}
    </svg>
  );
}

export function BgPattern() {
  return (
    <div
      data-testid="bg-pattern"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white dark:bg-neutral-950"
      aria-hidden="true"
    >
      <FloatingPaths direction={1} />
      <FloatingPaths direction={-1} />
    </div>
  );
}
