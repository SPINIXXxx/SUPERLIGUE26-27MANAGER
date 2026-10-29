import { useEffect, type ReactNode } from "react";
import { X, ArrowUpRight, CircleCheck } from "lucide-react";
import type { Team, Player, PosCode } from "@/lib/types";
import { POS_STYLE } from "@/lib/data";
import { initials } from "@/lib/game";
import { cn } from "@/utils/cn";

export function VolleyballMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="13.4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 2.8c4.7 4.9 6.3 11.4 4.3 17.6-1.6 4.8-4.5 8-8.1 10.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3.8 11.5c6.1 1.1 11.1 4.4 14.1 9.8 2 3.7 2.5 7.1 2 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M29.1 18.7c-5.3 2.1-10.4 2-15.1-.6-3.2-1.8-5.7-4.3-7.5-7.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Crest({
  team,
  size = 40,
  className = "",
  ring = false,
}: {
  team?: Team;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  if (!team) {
    return (
      <div
        style={{ width: size, height: size, fontSize: size * 0.28 }}
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-white/10 font-display font-bold text-white",
          className,
        )}
      >
        ?
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size * 0.245),
        background: `linear-gradient(135deg, ${team.colors[0]} 0%, ${team.colors[0]} 52%, ${team.colors[1]} 52%, ${team.colors[1]} 100%)`,
        boxShadow: ring ? `0 0 0 3px rgba(255,255,255,0.18)` : undefined,
      }}
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 font-display font-bold tracking-[0.02em] text-white",
        className,
      )}
      title={team.full}
    >
      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
        {team.short}
      </span>
      <span
        className="absolute -right-2 -bottom-2 h-[55%] w-[55%] rounded-full border border-white/25"
        aria-hidden="true"
      />
      <span
        className="absolute top-[18%] -left-1 h-2 w-2 rounded-full bg-white/25"
        aria-hidden="true"
      />
    </div>
  );
}

const AVATAR_PALETTE = [
  ["#DDE9CA", "#365B41"],
  ["#DCE7F3", "#2E5B86"],
  ["#F4E1D3", "#925034"],
  ["#E7E1F2", "#645183"],
  ["#F2E6C8", "#7C6227"],
  ["#D8ECEA", "#2E6863"],
  ["#F3DEDF", "#87474E"],
];

export function PlayerAvatar({
  player,
  size = 38,
  className = "",
}: {
  player: Player;
  size?: number;
  className?: string;
}) {
  const key = player.name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const [bg, fg] = AVATAR_PALETTE[key % AVATAR_PALETTE.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.31),
        background: bg,
        color: fg,
      }}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full font-extrabold",
        className,
      )}
    >
      {initials(player.name)}
      <span className="absolute -right-0.5 -bottom-0.5 rounded-full border-2 border-paper bg-pine-900 px-1 text-[7px] font-extrabold leading-[11px] text-white">
        {player.number}
      </span>
    </div>
  );
}

export function PositionBadge({
  code,
  className = "",
  short = true,
}: {
  code: PosCode;
  className?: string;
  short?: boolean;
}) {
  const labels: Record<PosCode, string> = {
    СВ: "Связующий",
    ДИА: "Диагональный",
    ДОИ: "Доигровщик",
    БЛ: "Блокирующий",
    ЛИБ: "Либеро",
  };
  return (
    <span className={cn("chip whitespace-nowrap", POS_STYLE[code], className)}>
      {short ? code : labels[code]}
    </span>
  );
}

export function Rating({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const tone =
    value >= 89
      ? "bg-lime text-pine-950"
      : value >= 84
        ? "bg-[#E1EDC9] text-[#355229]"
        : value >= 79
          ? "bg-[#F1EDDD] text-[#6D623B]"
          : "bg-[#EFE9E2] text-[#8C705B]";
  return (
    <span
      className={cn(
        "number inline-grid place-items-center rounded-lg font-semibold",
        tone,
        size === "sm" && "h-6 min-w-7 px-1.5 text-[11px]",
        size === "md" && "h-8 min-w-9 px-2 text-[13px]",
        size === "lg" && "h-11 min-w-12 rounded-xl px-2.5 text-lg",
      )}
    >
      {value}
    </span>
  );
}

export function FormBadge({ result }: { result: "В" | "П" | string }) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 place-items-center rounded-[5px] text-[9px] font-extrabold",
        result === "В" ? "bg-pine-800 text-lime" : "bg-[#ECE8DC] text-[#8B7768]",
      )}
    >
      {result}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  color = "bg-pine-800",
  height = "h-2",
  className = "",
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-[#EAE6D9]", height, className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  note,
  icon,
  trend,
  className = "",
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  note?: ReactNode;
  icon?: ReactNode;
  trend?: string;
  className?: string;
}) {
  return (
    <div className={cn("card card-hover p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        {icon ? (
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#EFEDE3] text-pine-800">
            {icon}
          </span>
        ) : trend ? (
          <span className="inline-flex items-center gap-0.5 rounded-md bg-[#EDF4E4] px-1.5 py-0.5 text-[10px] font-bold text-[#4F7041]">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="number text-[26px] font-medium leading-none sm:text-[30px]">{value}</span>
        {suffix && <span className="text-[11px] font-semibold text-muted">{suffix}</span>}
      </div>
      {note && <div className="mt-2 text-[11px] font-medium leading-snug text-muted">{note}</div>}
    </div>
  );
}

export function SectionHead({
  title,
  action,
  description,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[11px] font-medium text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="label mb-2 text-pine-700">{eyebrow}</div>}
        <h1 className="font-display text-[24px] font-medium leading-tight tracking-[-0.035em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[12px] font-medium leading-relaxed text-muted sm:text-[13px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-pine-950/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] border border-line bg-paper shadow-2xl scroll-thin sm:rounded-[24px]",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        {(title || subtitle) && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-6">
            <div>
              {title && <h3 className="text-base font-extrabold tracking-tight">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-[11px] font-medium text-muted">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-[#EFEDE3] hover:text-ink"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}

export type ToastMessage = { id: number; title: string; description?: string; kind?: "success" | "info" | "error" };

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="slide-up pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 bg-pine-950 px-4 py-3 text-white shadow-2xl"
        >
          <span
            className={cn(
              "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
              toast.kind === "error" ? "bg-clay text-white" : "bg-lime text-pine-950",
            )}
          >
            <CircleCheck className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-extrabold leading-snug">{toast.title}</div>
            {toast.description && (
              <div className="mt-0.5 text-[11px] font-medium leading-snug text-white/65">
                {toast.description}
              </div>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Скрыть уведомление"
            className="text-white/40 transition-colors hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function TeamLine({
  team,
  reverse = false,
  size = 32,
  showCity = true,
}: {
  team: Team;
  reverse?: boolean;
  size?: number;
  showCity?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", reverse && "flex-row-reverse text-right")}>
      <Crest team={team} size={size} />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-extrabold leading-tight">{team.name}</div>
        {showCity && (
          <div className="truncate text-[10px] font-medium text-muted">{team.city}</div>
        )}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1 rounded-xl bg-[#EDEADF] p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[9px] font-bold transition-all",
            size === "sm" ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]",
            value === option.value
              ? "bg-paper text-ink shadow-sm"
              : "text-muted hover:text-ink",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function CourtPattern({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 300" className={cn("pointer-events-none", className)} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="30" y="20" width="440" height="260" rx="2" />
        <line x1="250" y1="20" x2="250" y2="280" strokeWidth="2" />
        <rect x="30" y="72" width="198" height="156" />
        <rect x="272" y="72" width="198" height="156" />
        <line x1="30" y1="150" x2="228" y2="150" />
        <line x1="272" y1="150" x2="470" y2="150" />
        <path d="M30 150h198M272 150h198" />
        <circle cx="250" cy="150" r="46" strokeDasharray="3 4" />
      </g>
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#EFEDE3] text-pine-700">
        {icon}
      </div>
      <div className="text-sm font-extrabold">{title}</div>
      {description && <p className="mt-1 max-w-xs text-[11px] font-medium text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
