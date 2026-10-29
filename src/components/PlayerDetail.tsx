import { useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  CalendarDays,
  CircleDollarSign,
  HeartPulse,
  Ruler,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { Player, Team } from "@/lib/types";
import { formatMoney } from "@/lib/game";
import { cn } from "@/utils/cn";
import { Modal, PlayerAvatar, PositionBadge, ProgressBar, Rating } from "./ui";

type Props = {
  player?: Player;
  team?: Team;
  open: boolean;
  onClose: () => void;
  isOwn?: boolean;
  onExtend?: (player: Player) => void;
  onRecover?: (player: Player) => void;
  onToggleTransfer?: (player: Player) => void;
  onOffer?: (player: Player) => void;
};

const ATTRIBUTES: { key: keyof Player; label: string; short: string }[] = [
  { key: "attack", label: "Атака", short: "АТК" },
  { key: "block", label: "Блок", short: "БЛК" },
  { key: "serve", label: "Подача", short: "ПДЧ" },
  { key: "receive", label: "Приём", short: "ПРМ" },
  { key: "defense", label: "Защита", short: "ЗЩТ" },
  { key: "setting", label: "Пас", short: "ПАС" },
];

export function PlayerDetail({
  player,
  team,
  open,
  onClose,
  isOwn = true,
  onExtend,
  onRecover,
  onToggleTransfer,
  onOffer,
}: Props) {
  const [tab, setTab] = useState<"profile" | "stats">("profile");
  if (!player) return null;
  const fitnessColor =
    player.fitness >= 85 ? "bg-pine-700" : player.fitness >= 70 ? "bg-[#D8AE45]" : "bg-clay";
  const condition =
    player.fitness >= 88 ? "Отличная форма" : player.fitness >= 76 ? "Готов к игре" : "Нужен отдых";
  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="relative overflow-hidden border-b border-line bg-pine-950 px-5 pb-5 pt-6 text-white sm:px-6">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 85% 10%, ${team?.colors[0] || "#D9F36B"}, transparent 60%)`,
          }}
        />
        <div className="pointer-events-none absolute -right-12 -bottom-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -bottom-6 h-32 w-32 rounded-full border border-white/10" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Закрыть"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="relative flex items-center gap-4">
          <PlayerAvatar player={player} size={64} className="border-2 border-white/20" />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <PositionBadge code={player.posCode} className="bg-white/10 text-white/80" />
              {player.starter && (
                <span className="chip bg-lime/15 text-lime">
                  <span className="h-1 w-1 rounded-full bg-lime" />
                  Стартовый состав
                </span>
              )}
              {player.listed && <span className="chip bg-clay/20 text-[#FFC2AC]">На трансфере</span>}
            </div>
            <h2 className="font-display text-[20px] font-medium leading-tight tracking-[-0.03em] sm:text-[24px]">
              {player.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-white/55">
              <span className="flex items-center gap-1">
                <span className="text-[12px]">{player.flag}</span>
                {player.country}
              </span>
              <span className="flex items-center gap-1">
                <UserRound className="h-3 w-3" /> {player.age} лет
              </span>
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" /> {player.height} см
              </span>
              <span>#{player.number}</span>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="label text-white/35">Рейтинг</div>
            <div className="number mt-1 text-[34px] font-medium leading-none text-lime">
              {player.overall}
            </div>
            <div className="mt-1 text-[9px] font-semibold text-white/40">
              потенциал {player.potential}
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5 sm:hidden">
          <Rating value={player.overall} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[9px] font-semibold text-white/50">
              <span>Физическая готовность</span>
              <span className="text-white/80">{player.fitness}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-lime" style={{ width: `${player.fitness}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-5 border-b border-line px-5 pt-3 sm:px-6">
        {(
          [
            { id: "profile", label: "Профиль" },
            { id: "stats", label: "Статистика сезона" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "relative pb-2.5 text-[11px] font-extrabold transition-colors",
              tab === item.id ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {item.label}
            {tab === item.id && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-pine-800" />
            )}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <div className="grid gap-5 p-5 sm:grid-cols-[1.25fr_1fr] sm:p-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="label">Навыки игрока</span>
              <span className="flex items-center gap-1 text-[9px] font-semibold text-muted">
                <TrendingUp className="h-3 w-3 text-pine-700" />
                пик формы
              </span>
            </div>
            <div className="space-y-3">
              {ATTRIBUTES.map((attr) => {
                const value = player[attr.key] as number;
                return (
                  <div key={attr.key} className="flex items-center gap-3">
                    <span className="w-[74px] shrink-0 text-[10px] font-bold text-muted">
                      {attr.label}
                    </span>
                    <ProgressBar
                      value={value}
                      height="h-1.5"
                      color={value >= 87 ? "bg-pine-700" : value >= 80 ? "bg-[#789C63]" : "bg-[#B5A772]"}
                    />
                    <span className="number w-6 shrink-0 text-right text-[11px] font-semibold">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-line bg-mist p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="label">Физическое состояние</span>
                <span className="text-[10px] font-bold">{player.fitness}%</span>
              </div>
              <ProgressBar value={player.fitness} height="h-2" color={fitnessColor} />
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-muted">
                <span className="flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5 text-pine-700" />
                  {condition}
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Форма {player.form}/10
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Настрой {player.morale}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-line p-3.5">
              <div className="label mb-2.5">Контракт</div>
              <div className="space-y-2 text-[11px] font-semibold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <CircleDollarSign className="h-3.5 w-3.5" />
                    Зарплата
                  </span>
                  <span>{formatMoney(player.salary)} / сезон</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Срок
                  </span>
                  <span>до конца {2026 + player.contract}</span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="flex items-center gap-1.5 text-muted">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Оценка
                  </span>
                  <span className="text-pine-800">{formatMoney(player.value)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-[#F5F2E9] p-3.5">
              <div className="label mb-1.5">Роль в команде</div>
              <div className="text-[12px] font-extrabold">
                {player.overall >= 88 ? "Ключевой лидер" : player.overall >= 83 ? "Игрок основы" : player.overall >= 78 ? "Ротация" : "Резерв"}
              </div>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-muted">
                {player.posCode === "СВ"
                  ? "Управляет темпом атаки и связью между линиями."
                  : player.posCode === "ДИА"
                    ? "Главный бомбардир команды, решает концовки."
                    : player.posCode === "ДОИ"
                      ? "Работает в приёме и атаке с краёв сетки."
                      : player.posCode === "БЛ"
                        ? "Организует блок и первый темп."
                        : "Держит приём и оборону на задней линии."}
              </p>
            </div>

            {isOwn ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn-ghost justify-center text-[10px]"
                  onClick={() => onExtend?.(player)}
                  disabled={player.contract >= 4}
                >
                  Продлить контракт
                </button>
                <button
                  className="btn-soft justify-center text-[10px]"
                  onClick={() => onRecover?.(player)}
                >
                  Восстановление
                </button>
                <button
                  className={cn(
                    "col-span-2 justify-center text-[10px]",
                    player.listed ? "btn-soft" : "btn-ghost",
                  )}
                  onClick={() => onToggleTransfer?.(player)}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {player.listed ? "Снять с трансфера" : "Выставить на трансфер"}
                </button>
              </div>
            ) : (
              <button
                className="btn-primary w-full justify-center text-[11px]"
                onClick={() => onOffer?.(player)}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Сделать предложение
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="label">Суперлига · {player.stats.matches} матчей</div>
              <div className="mt-1 text-[12px] font-extrabold">Статистика в сезоне 2026/27</div>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-lime text-pine-950">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Очки", player.stats.points],
              ["Сеты", player.stats.sets],
              ["Матчи", player.stats.matches],
              ["Атаки", player.stats.attacks],
              ["Эйсы", player.stats.aces],
              ["Блоки", player.stats.blocks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-mist p-3">
                <div className="label">{label}</div>
                <div className="number mt-1.5 text-[22px] font-medium">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-line p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="label">Результативность</span>
              <span className="text-[10px] font-bold text-muted">
                {player.stats.sets ? (player.stats.points / player.stats.sets).toFixed(1) : "0.0"} очка за сет
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, (player.stats.points / Math.max(1, player.stats.sets * 5)) * 100)}
              height="h-2"
              color="bg-pine-700"
            />
            <p className="mt-2 text-[10px] font-medium leading-relaxed text-muted">
              {player.stats.points > 40
                ? "Один из главных поставщиков очков в команде. Держит высокий темп в концовках."
                : "Полезен в системе ротации: стабильная подача и надёжные действия в защите."}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
