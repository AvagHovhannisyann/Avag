// BDO wordmark rendered as styled text with the brand's red angle mark.
export default function BdoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-end gap-1.5 select-none" aria-label="BDO">
      <span className="relative inline-block">
        <span
          className={`absolute -left-2 top-0 h-full w-1 bg-bdo-red ${compact ? "" : ""}`}
          style={{ clipPath: "polygon(0 0, 100% 12%, 100% 100%, 0 100%)" }}
        />
        <span
          className={`font-extrabold tracking-tight text-bdo-navy ${
            compact ? "text-xl" : "text-2xl"
          }`}
        >
          BDO
        </span>
      </span>
    </span>
  );
}
