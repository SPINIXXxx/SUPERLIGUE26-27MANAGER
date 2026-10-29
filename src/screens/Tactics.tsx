import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  CircleHelp,
  Info,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";
import type { GameState, LineupSlot, Player, Team, Tactics, Tactics as TacticsType } from "@/lib/types";
import { TEAM_MAP } from "@/lib/data";
import {
  ROLE_TO_POS,
  SLOT_LABEL,
  getLineupPlayers,
  getTeamPower,
  lineupFromStarters,
  nextFixtureFor,
  tacticRatings,
} from "@/lib/game";
import { cn } from "@/utils/cn";
import {
  Crest,
  Modal,
  PageHeader,
  PlayerAvatar,
  ProgressBar,
  Rating,
  SectionHead,
} from "@/components/ui";

type Props = {
  game: GameState;
  team: Team;
  onSave: (tactics: TacticsType) => void;
  onOpenPlayer: (player: Player) => void;
};

const COURTS: Record<string, LineupSlot[]> = {
  front: ["outside1", "middle1", "setter"],
  back: ["outside2", "middle2", "diagonal"],
};

export function TacticsScreen({ game, team, onSave, onOpenPlayer }: Props) {
  const [local, setLocal] = useState<Tactics>(game.tactics);
  const [selecting, setSelecting] = useState<LineupSlot | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setLocal(game.tactics);
  }, [game.tactics]);

  useEffect(() => {
    if (!savedFlash) return;
    const timer = setTimeout(() => setSavedFlash(false), 1800);
    return () => clearTimeout(timer);
  }, [savedFlash]);

  const slots = getLineupPlayers(game.players, local, game.clubId);
  const ratings = tacticRatings(game.players, local, game.clubId);
  const filledSlots = slots.filter((slot) => slot.player);
  const averageRating = Math.round(
    filledSlots.reduce((acc, slot) => acc + (slot.player?.overall || 0), 0) /
      Math.max(1, filledSlots.length),
  );
  const power = getTeamPower(game.players, game.clubId, local);
  const next = nextFixtureFor(game.fixtures, game.clubId);
  const opponent = next ? TEAM_MAP[next.homeId === game.clubId ? next.awayId : next.homeId] : undefined;
  const opponentPlayers = opponent
    ? game.players.filter((player) => player.teamId === opponent.id).sort((a, b) => b.overall - a.overall)
    : [];
  const opponentWeakness = opponent
    ? [...game.players.filter((p) => p.teamId === opponent.id && p.starter && p.pos !== "Либеро")].sort(
        (a, b) => a.receive - b.receive,
      )[0]
    : undefined;
  const changed = JSON.stringify(local) !== JSON.stringify(game.tactics);

  const setLineupSlot = (slot: LineupSlot, playerId: string) => {
    setLocal((tactics) => {
      const lineup = { ...tactics.lineup };
      Object.keys(lineup).forEach((key) => {
        if (lineup[key as LineupSlot] === playerId) {
          delete lineup[key as LineupSlot];
        }
      });
      lineup[slot] = playerId;
      return { ...tactics, lineup };
    });
    setSelecting(null);
  };

  const autoLineup = () => {
    const lineup = lineupFromStarters(game.players, game.clubId);
    setLocal((tactics) => ({ ...tactics, lineup }));
  };

  const selectable = selecting
    ? game.players
        .filter((player) => player.teamId === game.clubId && player.pos === ROLE_TO_POS[selecting])
        .sort((a, b) => b.overall - a.overall)
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="Команда · игровая модель"
        title="Тактика и стартовый состав"
        description="Соберите стартовую семёрку, выберите систему и настройте стиль игры. Тактические решения влияют на силу команды в каждом розыгрыше."
        actions={
          <>
            <button onClick={() => setLocal(game.tactics)} className="btn-ghost text-[11px]" disabled={!changed}>
              <RotateCcw className="h-3.5 w-3.5" />
              Сбросить
            </button>
            <button
              onClick={() => {
                onSave(local);
                setSavedFlash(true);
              }}
              className={cn("text-[11px]", changed ? "btn-primary" : "btn-soft")}
              disabled={!changed}
            >
              {savedFlash ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {savedFlash ? "Сохранено" : "Сохранить план"}
            </button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-pine-900 text-lime">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[12px] font-extrabold">Расстановка 5-1</div>
                  <div className="text-[9px] font-medium text-muted">
                    {team.name} · базовый план на матч
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip border border-line bg-mist text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-pine-700" />
                  Сила {power.toFixed(1)}
                </span>
                <button onClick={autoLineup} className="btn-soft btn-xs text-[9px]">
                  <Wand2 className="h-3 w-3" />
                  Авторасстановка
                </button>
              </div>
            </div>

            <div className="bg-[#F5F2E8] p-3 sm:p-4">
              <div className="relative overflow-hidden rounded-[18px] border border-pine-950/10 bg-[#1B5A43] p-3 shadow-inner sm:p-5">
                <svg
                  viewBox="0 0 600 380"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full text-white/15"
                  aria-hidden="true"
                >
                  <rect x="20" y="25" width="560" height="330" fill="none" stroke="currentColor" />
                  <line x1="20" y1="25" x2="580" y2="25" stroke="currentColor" strokeWidth="3" />
                  <line
                    x1="20"
                    y1="105"
                    x2="580"
                    y2="105"
                    stroke="currentColor"
                    strokeDasharray="7 6"
                  />
                  <line
                    x1="300"
                    y1="25"
                    x2="300"
                    y2="355"
                    stroke="currentColor"
                    opacity="0.35"
                  />
                  <line x1="20" y1="220" x2="580" y2="220" stroke="currentColor" opacity="0.3" />
                  <circle cx="300" cy="190" r="68" fill="none" stroke="currentColor" opacity="0.25" />
                </svg>
                <div className="relative mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/70">
                    <span className="h-1 w-1 rounded-full bg-lime" />
                    сетка
                  </span>
                  <span className="rounded-full bg-pine-950/30 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-white/45">
                    атака слева → направо
                  </span>
                </div>

                <div className="relative mb-7 grid grid-cols-3 gap-2 sm:mb-10 sm:gap-4">
                  {COURTS.front.map((slot) => (
                    <CourtPlayer
                      key={slot}
                      slot={slot}
                      label={SLOT_LABEL[slot]}
                      player={slots.find((item) => item.slot === slot)?.player}
                      onSelect={() => setSelecting(slot)}
                      onOpen={onOpenPlayer}
                    />
                  ))}
                </div>
                <div className="relative grid grid-cols-3 gap-2 sm:gap-4">
                  {COURTS.back.map((slot) => (
                    <CourtPlayer
                      key={slot}
                      slot={slot}
                      label={SLOT_LABEL[slot]}
                      player={slots.find((item) => item.slot === slot)?.player}
                      onSelect={() => setSelecting(slot)}
                      onOpen={onOpenPlayer}
                    />
                  ))}
                </div>

                <div className="relative mt-4 flex items-center justify-between gap-2 rounded-xl border border-lime/25 bg-lime/10 p-2 pl-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-lime text-[8px] font-extrabold text-pine-950">
                      ЛИБ
                    </span>
                    {slots.find((item) => item.slot === "libero")?.player ? (
                      <button
                        onClick={() => {
                          const player = slots.find((item) => item.slot === "libero")?.player;
                          if (player) onOpenPlayer(player);
                        }}
                        className="min-w-0 text-left"
                      >
                        <div className="text-[8px] font-bold uppercase tracking-wider text-lime/60">
                          Либеро · на площадке
                        </div>
                        <div className="truncate text-[10.5px] font-extrabold text-white">
                          {slots.find((item) => item.slot === "libero")?.player?.name}
                        </div>
                      </button>
                    ) : (
                      <span className="text-[10px] text-white/60">Не выбран</span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelecting("libero")}
                    className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-[9px] font-bold text-white/70 transition-colors hover:border-lime/50 hover:text-lime"
                  >
                    Сменить
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 text-[9px] font-semibold text-muted">
                  <Info className="h-3 w-3" />
                  Нажмите на игрока, чтобы открыть профиль, или на значок смены
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-muted">Средний рейтинг основы</span>
                  <span className="number rounded-md bg-pine-900 px-1.5 py-0.5 text-[10px] font-semibold text-lime">
                    {averageRating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-4 sm:p-5">
              <SectionHead title="Игровой баланс" description="Сильные стороны текущего плана" />
              <div className="mt-4 space-y-3.5">
                {ratings.map((item) => (
                  <div key={item.key}>
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                      <span>{item.label}</span>
                      <span className="number font-semibold text-muted">{item.value}</span>
                    </div>
                    <ProgressBar
                      value={Math.min(item.value, 100)}
                      height="h-1.5"
                      color={
                        item.key === "attack"
                          ? "bg-clay"
                          : item.key === "block"
                            ? "bg-pine-700"
                            : item.key === "serve"
                              ? "bg-[#C5A946]"
                              : item.key === "receive"
                                ? "bg-[#6B8EA1]"
                                : "bg-lime"
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F5F2E8] p-3">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A7BB5A]" />
                <p className="text-[9.5px] font-medium leading-relaxed text-muted">
                  {local.risk >= 4
                    ? "Высокий риск усиливает атаку и подачу, но повышает количество собственных ошибок."
                    : "Сбалансированный риск даёт команде стабильность в приёме и концовках."}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[22px] border border-line bg-pine-950 p-4 text-white sm:p-5">
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full border border-white/10" />
              <div className="relative mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-lime/80">
                    Скаутский отчёт
                  </div>
                  <div className="mt-1 text-[13px] font-extrabold">
                    {next ? `${next.round}-й тур · ${opponent?.name}` : "Сезон завершён"}
                  </div>
                </div>
                {opponent && <Crest team={opponent} size={36} />}
              </div>
              {opponent ? (
                <>
                  <div className="relative mb-3 rounded-xl border border-white/10 bg-white/[0.055] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] font-semibold text-white/40">
                        СИЛА СОПЕРНИКА
                      </span>
                      <span className="number text-[13px] font-semibold text-white">
                        {getTeamPower(game.players, opponent.id).toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-clay"
                        style={{
                          width: `${Math.min(100, getTeamPower(game.players, opponent.id))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="relative mb-2 text-[9.5px] font-semibold leading-relaxed text-white/65">
                    Ключевые игроки: {opponentPlayers.slice(0, 3).map((p) => p.name).join(", ")}.
                  </p>
                  <p className="relative text-[9.5px] font-medium leading-relaxed text-white/45">
                    {opponentWeakness
                      ? `Слабое место в приёме — ${opponentWeakness.name} (${opponentWeakness.receive}). Рекомендуем ${local.serve === "Силовая" ? "точечную силовую подачу" : "подачу в зону 5"} на его позицию.`
                      : "Изучите расстановку соперника и настройте подачу."}
                  </p>
                </>
              ) : (
                <p className="relative text-[10px] font-medium text-white/50">
                  Завершите сезон, чтобы открыть новый цикл подготовки.
                </p>
              )}
              <div className="relative mt-4 flex items-center gap-2 rounded-lg bg-lime/10 px-2.5 py-2">
                <Zap className="h-3.5 w-3.5 text-lime" />
                <span className="text-[9px] font-semibold text-lime/90">
                  {local.serve} · {local.block.toLowerCase()} · {local.tempo.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="card p-4 sm:p-5">
            <SectionHead title="Система игры" description="Структура связки и нападающих" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  {
                    value: "5-1",
                    title: "5-1",
                    desc: "Один связующий на все шесть зон",
                  },
                  {
                    value: "6-2",
                    title: "6-2",
                    desc: "Два связующих на передней линии",
                  },
                ] as { value: Tactics["system"]; title: string; desc: string }[]
              ).map((system) => (
                <button
                  key={system.value}
                  onClick={() => setLocal((tactics) => ({ ...tactics, system: system.value }))}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    local.system === system.value
                      ? "border-pine-900 bg-pine-900 text-white"
                      : "border-line bg-paper text-ink hover:border-[#c9c3b0]",
                  )}
                >
                  <div className="number text-[16px] font-medium">{system.title}</div>
                  <div
                    className={cn(
                      "mt-1 text-[8.5px] font-semibold leading-relaxed",
                      local.system === system.value ? "text-white/50" : "text-muted",
                    )}
                  >
                    {system.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead title="Установки на матч" description="Стиль игры и приоритеты" />
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="label">Подача</span>
                  <span className="chip bg-mist text-[9px] text-pine-800">{local.serve}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(["Силовая", "Планер", "Тактическая"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setLocal((tactics) => ({ ...tactics, serve: option }))}
                      className={cn(
                        "rounded-lg border px-1.5 py-2 text-[9px] font-bold transition-colors",
                        local.serve === option
                          ? "border-pine-800 bg-pine-800 text-lime"
                          : "border-line text-muted hover:border-pine-700/40 hover:text-ink",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="label">Блок</span>
                  <span className="chip bg-mist text-[9px] text-pine-800">{local.block}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(["Двойной блок", "Зонный блок", "Активный блок"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setLocal((tactics) => ({ ...tactics, block: option }))}
                      className={cn(
                        "rounded-lg border px-1 py-2 text-[8.5px] font-bold transition-colors",
                        local.block === option
                          ? "border-pine-800 bg-pine-800 text-lime"
                          : "border-line text-muted hover:border-pine-700/40 hover:text-ink",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="label">Темп</span>
                  <span className="chip bg-mist text-[9px] text-pine-800">{local.tempo}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(["Быстрый темп", "Сбалансированный", "Терпеливый"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setLocal((tactics) => ({ ...tactics, tempo: option }))}
                      className={cn(
                        "rounded-lg border px-1 py-2 text-[8px] font-bold transition-colors",
                        local.tempo === option
                          ? "border-pine-800 bg-pine-800 text-lime"
                          : "border-line text-muted hover:border-pine-700/40 hover:text-ink",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label">Риск в атаке</span>
                  <span className="chip bg-mist text-[9px] text-pine-800">{local.risk} / 5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setLocal((tactics) => ({ ...tactics, risk: value }))}
                      className={cn(
                        "h-7 flex-1 rounded-md text-[9px] font-extrabold transition-all",
                        local.risk >= value
                          ? value >= 4
                            ? "bg-clay text-white"
                            : "bg-pine-800 text-lime"
                          : "bg-[#EDEADF] text-muted/60",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[8px] font-semibold text-muted/70">
                  <span>Контроль</span>
                  <span>Максимальная агрессия</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSave(local);
                setSavedFlash(true);
              }}
              disabled={!changed}
              className={cn("mt-4 w-full text-[11px]", changed ? "btn-primary" : "btn-soft")}
            >
              <Save className="h-3.5 w-3.5" />
              {changed ? "Применить план" : "План сохранён"}
            </button>
          </div>

          <div className="rounded-[22px] border border-line border-dashed p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F0EDE3] text-pine-800">
                <CircleHelp className="h-3.5 w-3.5" />
              </span>
              <div className="text-[10px] font-extrabold">Как это работает</div>
            </div>
            <p className="mt-2 text-[9px] font-medium leading-relaxed text-muted">
              Атакующие игроки приносят очки в атаке, блокирующие — в защите на сетке, либеро
              стабилизирует приём. Риск и темп влияют на розыгрыш каждого очка в матч-центре.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={!!selecting}
        onClose={() => setSelecting(null)}
        title={selecting ? `Выбрать: ${SLOT_LABEL[selecting]}` : "Выбор игрока"}
        subtitle="Только игроки вашей команды на подходящую позицию"
      >
        <div className="p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-mist px-3 py-2 text-[9px] font-medium text-muted">
            <Shield className="h-3.5 w-3.5 shrink-0 text-pine-700" />
            Игрок с более высоким рейтингом не всегда лучше: учитывайте форму и готовность.
          </div>
          <div className="space-y-1">
            {selectable.map((player) => {
              const active = selecting && local.lineup[selecting] === player.id;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[#F4F1E7]"
                >
                  <PlayerAvatar player={player} size={34} />
                  <button onClick={() => onOpenPlayer(player)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[11px] font-extrabold">{player.name}</span>
                      {player.starter && (
                        <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[8.5px] font-semibold text-muted">
                      <span>Форма {player.form}/10</span>
                      <span>Готовность {player.fitness}%</span>
                    </div>
                  </button>
                  <div className="hidden w-20 sm:block">
                    <ProgressBar
                      value={player.fitness}
                      height="h-1"
                      color={player.fitness >= 85 ? "bg-pine-700" : "bg-[#D5B24F]"}
                    />
                  </div>
                  <Rating value={player.overall} size="sm" />
                  <button
                    onClick={() => setLineupSlot(selecting as LineupSlot, player.id)}
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors",
                      active
                        ? "bg-pine-900 text-lime"
                        : "border border-line text-muted hover:border-pine-700 hover:text-pine-800",
                    )}
                    aria-label={`Выбрать ${player.name}`}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#F5F2E8] px-3 py-2 text-[8.5px] font-semibold text-muted">
            <TrendingUp className="h-3 w-3" />
            В заявке {game.players.filter((p) => p.teamId === game.clubId).length} игроков, на позиции — {selectable.length}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CourtPlayer({
  label,
  player,
  onSelect,
  onOpen,
}: {
  slot: LineupSlot;
  label: string;
  player?: Player;
  onSelect: () => void;
  onOpen: (player: Player) => void;
}) {
  return (
    <div className="group relative min-w-0 rounded-xl border border-white/15 bg-pine-950/40 p-1.5 backdrop-blur-[2px] transition-colors hover:border-lime/50 sm:p-2.5">
      <div className="mb-1 flex items-center justify-between gap-1 px-0.5">
        <span className="truncate text-[6.5px] font-extrabold uppercase tracking-[0.08em] text-white/40 sm:text-[7.5px]">
          {label}
        </span>
        <button
          onClick={onSelect}
          className="grid h-4 w-4 shrink-0 place-items-center rounded bg-white/10 text-[9px] font-bold text-white/60 transition-colors hover:bg-lime hover:text-pine-950 sm:h-5 sm:w-5"
          aria-label={`Сменить ${label}`}
        >
          +
        </button>
      </div>
      {player ? (
        <div className="flex items-center gap-1.5">
          <button onClick={() => onOpen(player)} className="shrink-0">
            <PlayerAvatar player={player} size={26} />
          </button>
          <button onClick={() => onOpen(player)} className="min-w-0 flex-1 text-left">
            <div className="truncate text-[8px] font-extrabold leading-tight text-white sm:text-[9.5px]">
              {player.name.split(" ")[1] || player.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="truncate text-[6.5px] font-medium text-white/40 sm:text-[7.5px]">
                {player.name.split(" ")[0]}
              </span>
              <span className="number ml-auto rounded bg-lime/90 px-1 text-[6.5px] font-semibold text-pine-950 sm:text-[8px]">
                {player.overall}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <button
          onClick={onSelect}
          className="flex w-full items-center gap-1.5 py-1 text-[8px] font-semibold text-white/40"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-white/25 text-[12px]">
            +
          </span>
          Выбрать
        </button>
      )}
    </div>
  );
}
