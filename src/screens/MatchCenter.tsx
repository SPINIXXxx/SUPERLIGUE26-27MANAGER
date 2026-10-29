import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Crosshair,
  Pause,
  Play,
  Shield,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { GameState, MatchState, RallyEvent, Team } from "@/lib/types";
import { TEAM_MAP } from "@/lib/data";
import heroImage from "@/assets/hero-volley.jpg";
import {
  callTimeout,
  makeSubstitution,
  matchMvp,
  simulateRally,
  simulateSet,
  simulateToEnd,
} from "@/lib/game";
import { cn } from "@/utils/cn";
import { Crest, PlayerAvatar, ProgressBar, Rating, VolleyballMark } from "@/components/ui";

type Props = {
  initialMatch: MatchState;
  game: GameState;
  team: Team;
  homePower: number;
  awayPower: number;
  onClose: () => void;
  onFinish: (match: MatchState) => void;
};

const EVENT_ICON = {
  ace: Zap,
  block: Shield,
  attack: Crosshair,
  error: AlertCircle,
  set: Trophy,
  timeout: Timer,
  sub: ArrowLeftRight,
  start: Play,
};

function EventIcon({ kind }: { kind: RallyEvent["kind"] }) {
  const Icon = EVENT_ICON[kind] || Sparkles;
  return <Icon className="h-3 w-3" />;
}

export function MatchCenter({
  initialMatch,
  game,
  team,
  homePower,
  awayPower,
  onClose,
  onFinish,
}: Props) {
  const [match, setMatch] = useState<MatchState>(initialMatch);
  const [autoPlay, setAutoPlay] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const home = TEAM_MAP[match.homeId];
  const away = TEAM_MAP[match.awayId];
  const userSide: "home" | "away" = match.homeId === game.clubId ? "home" : "away";
  const userTeamId = game.clubId;
  const opponentId = userSide === "home" ? match.awayId : match.homeId;
  const opponent = TEAM_MAP[opponentId];
  const mvp = match.finished ? matchMvp(match, game.players) : undefined;
  const userWon = match.winnerId === userTeamId;
  const currentTarget = match.setNumber === 5 ? 15 : 25;
  const lastEvent = match.events[match.events.length - 1];
  const squad = game.players.filter((player) => player.teamId === userTeamId);
  const starters = squad.filter((player) => player.starter);
  const matchPerformers = Object.entries(match.playerStats)
    .map(([id, stats]) => ({ player: game.players.find((item) => item.id === id), stats }))
    .filter((item) => item.player)
    .sort((a, b) => b.stats.points - a.stats.points)
    .slice(0, 4);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!autoPlay || match.finished) return;
    const interval = setInterval(() => {
      setMatch((prev) => simulateRally(prev, homePower, awayPower, game.players));
    }, 1150);
    return () => clearInterval(interval);
  }, [autoPlay, match.finished, homePower, awayPower, game.players]);

  useEffect(() => {
    if (match.finished) setAutoPlay(false);
  }, [match.finished]);

  const userTimeout = match.timeouts[userSide];

  const close = () => {
    if (!match.finished) {
      const confirmed = window.confirm(
        "Матч ещё не завершён. Если выйти сейчас, результат не будет засчитан. Выйти?",
      );
      if (!confirmed) return;
    }
    onClose();
  };

  const playRally = () =>
    setMatch((prev) => simulateRally(prev, homePower, awayPower, game.players));
  const playSet = () =>
    setMatch((prev) => simulateSet(prev, homePower, awayPower, game.players));
  const playEnd = () => {
    setAutoPlay(false);
    setMatch((prev) => simulateToEnd(prev, homePower, awayPower, game.players));
  };

  const statRows = [
    { label: "Очки", home: match.stats.home.points, away: match.stats.away.points },
    { label: "Атака", home: match.stats.home.attacks, away: match.stats.away.attacks },
    { label: "Эйсы", home: match.stats.home.aces, away: match.stats.away.aces },
    { label: "Блоки", home: match.stats.home.blocks, away: match.stats.away.blocks },
    { label: "Ошибки", home: match.stats.home.errors, away: match.stats.away.errors },
  ];

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#0A291D] text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0A291D]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-lime text-pine-950">
              <VolleyballMark className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold">Матч-центр</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white/50">
                  {match.competition === "cup" ? "Кубок России" : "Суперлига"}
                </span>
              </div>
              <div className="truncate text-[8px] font-medium text-white/35">
                {home?.name} — {away?.name} · {formatMatchDate(initialMatch)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 sm:flex">
              <span className={cn("h-1.5 w-1.5 rounded-full", match.finished ? "bg-white/40" : "bg-lime pulse-dot")} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/55">
                {match.finished ? "Завершён" : "LIVE"}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.055] px-2 py-1">
              <Users className="h-3 w-3 text-white/40" />
              <span className="number text-[9px] font-semibold text-white/60">
                {match.attendance.toLocaleString("ru-RU")}
              </span>
            </div>
            <button
              onClick={close}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-white/25 hover:text-white"
              aria-label="Закрыть матч-центр"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden border-b border-white/10">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A291D]/40 via-[#0A291D]/85 to-[#0A291D]" />
        <div className="court-lines pointer-events-none absolute inset-0 opacity-15" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-7">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-6">
            <div className={cn("flex flex-col items-center gap-2.5 text-center", userSide !== "home" && "opacity-80")}>
              <div className="relative">
                <Crest team={home} size={64} ring />
                {userSide === "home" && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-lime px-1.5 py-0.5 text-[6px] font-extrabold uppercase tracking-wider text-pine-950">
                    вы
                  </span>
                )}
              </div>
              <div>
                <div className="text-[12px] font-extrabold leading-tight sm:text-[15px]">{home?.name}</div>
                <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/35">
                  {home?.city} · дома
                </div>
                <div className="mt-1.5 flex justify-center gap-1">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1.5 w-4 rounded-full",
                        index < match.sets.home ? "bg-lime" : "bg-white/15",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex min-w-[140px] flex-col items-center pt-1 sm:min-w-[240px]">
              <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-white/35">
                <span className="h-1 w-1 rounded-full bg-white/30" />
                {match.finished ? "Матч завершён · счёт по сетам" : `Сет ${match.setNumber} · до ${currentTarget}`}
                <span className="h-1 w-1 rounded-full bg-white/30" />
              </div>
              <div className="flex items-center gap-3 sm:gap-5">
                <span className="number text-[38px] font-medium leading-none tracking-[-0.05em] text-white sm:text-[54px]">
                  {match.finished ? match.sets.home : match.points.home}
                </span>
                <span className="number text-[18px] font-medium text-white/25">:</span>
                <span className="number text-[38px] font-medium leading-none tracking-[-0.05em] text-white sm:text-[54px]">
                  {match.finished ? match.sets.away : match.points.away}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    match.serving === "home" ? "bg-lime pulse-dot" : "bg-white/20",
                  )}
                />
                <span className="text-[8px] font-semibold text-white/50">
                  Подача: {match.serving === "home" ? home?.name : away?.name}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
                {match.setHistory.map((set, index) => (
                  <span
                    key={index}
                    className="number rounded-md border border-white/10 bg-white/[0.055] px-1.5 py-0.5 text-[8px] font-semibold text-white/55"
                  >
                    {set.home}:{set.away}
                  </span>
                ))}
                {!match.setHistory.length && (
                  <span className="text-[8px] font-medium text-white/25">Матч только начался</span>
                )}
              </div>
            </div>

            <div className={cn("flex flex-col items-center gap-2.5 text-center", userSide !== "away" && "opacity-80")}>
              <div className="relative">
                <Crest team={away} size={64} ring />
                {userSide === "away" && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-lime px-1.5 py-0.5 text-[6px] font-extrabold uppercase tracking-wider text-pine-950">
                    вы
                  </span>
                )}
              </div>
              <div>
                <div className="text-[12px] font-extrabold leading-tight sm:text-[15px]">{away?.name}</div>
                <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/35">
                  {away?.city} · гости
                </div>
                <div className="mt-1.5 flex justify-center gap-1">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-1.5 w-4 rounded-full",
                        index < match.sets.away ? "bg-lime" : "bg-white/15",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {lastEvent && !match.finished && (
            <div className="mx-auto mt-5 flex max-w-xl items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 backdrop-blur">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-lime text-pine-950">
                <EventIcon kind={lastEvent.kind} />
              </span>
              <span className="feed-in min-w-0 flex-1 truncate text-[9.5px] font-semibold text-white/75">
                {lastEvent.text}
              </span>
              <span className="number shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-semibold text-white/50">
                {lastEvent.home}:{lastEvent.away}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-5 pb-32 sm:px-6 sm:pb-36">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.045] backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <div className="text-[11px] font-extrabold">Ход матча</div>
                  <div className="mt-0.5 text-[8px] font-medium text-white/35">
                    Каждый розыгрыш — шанс изменить игру
                  </div>
                </div>
                <button
                  onClick={() => setAutoPlay((value) => !value)}
                  disabled={match.finished}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[8.5px] font-extrabold transition-colors",
                    autoPlay
                      ? "border-lime bg-lime text-pine-950"
                      : "border-white/15 text-white/60 hover:border-lime/50 hover:text-lime",
                  )}
                >
                  {autoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                  {autoPlay ? "Пауза" : "Авто"}
                </button>
              </div>
              <div ref={feedRef} className="max-h-[300px] overflow-y-auto p-2.5 scroll-thin">
                {[...match.events].reverse().slice(0, 16).map((event, index) => {
                  const sideName =
                    event.side === "home" ? home?.name : event.side === "away" ? away?.name : "";
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg px-2 py-2",
                        index === 0 ? "bg-white/[0.055]" : "opacity-70",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md",
                          event.kind === "set"
                            ? "bg-lime text-pine-950"
                            : event.side === "neutral"
                              ? "bg-white/10 text-white/55"
                              : userSide === event.side
                                ? "bg-lime/15 text-lime"
                                : "bg-clay/15 text-[#F2A78E]",
                        )}
                      >
                        <EventIcon kind={event.kind} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[9.5px] font-semibold leading-relaxed text-white/70">
                          {event.text}
                        </div>
                        <div className="mt-0.5 text-[7.5px] font-medium uppercase tracking-wider text-white/25">
                          {event.kind === "start" ? "Начало" : sideName || "Матч"} · сет {event.set}
                        </div>
                      </div>
                      <span className="number shrink-0 text-[8.5px] font-semibold text-white/35">
                        {event.home}:{event.away}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-extrabold">Сравнение команд</div>
                <div className="flex items-center gap-2 text-[7.5px] font-semibold text-white/35">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    {home?.short}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                    {away?.short}
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {statRows.map((row) => {
                  const total = row.home + row.away || 1;
                  return (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-[8.5px] font-semibold">
                        <span className="number w-6 text-left text-white/75">{row.home}</span>
                        <span className="text-white/35">{row.label}</span>
                        <span className="number w-6 text-right text-white/75">{row.away}</span>
                      </div>
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className="h-full rounded-l-full bg-lime transition-all duration-500"
                          style={{ width: `${(row.home / total) * 100}%` }}
                        />
                        <div
                          className="h-full flex-1 rounded-r-full bg-clay/80 transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">
                  Ключевые игроки матча
                </div>
                <span className="text-[7.5px] font-medium text-white/25">
                  по очкам в розыгрышах
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {(matchPerformers.length ? matchPerformers : starters.slice(0, 4).map((player) => ({ player, stats: { points: 0, aces: 0, blocks: 0 } }))).map(
                  (entry) =>
                    entry.player && (
                      <div
                        key={entry.player.id}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2"
                      >
                        <PlayerAvatar player={entry.player} size={27} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[8.5px] font-extrabold text-white/85">
                            {entry.player.name.split(" ")[1] || entry.player.name}
                          </div>
                          <div className="text-[7px] font-medium text-white/35">
                            {entry.stats.points} очк. · {entry.stats.aces} эйс
                          </div>
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-white/35">
                    Ваша команда
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Crest team={team} size={28} />
                    <span className="text-[11px] font-extrabold">{team.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-white/35">
                    Матч
                  </div>
                  <div className="number mt-1 text-[13px] font-semibold text-lime">
                    {match.sets[userSide]}:{match.sets[userSide === "home" ? "away" : "home"]}
                  </div>
                </div>
              </div>
              <div className="mb-1.5 flex items-center justify-between text-[8px] font-semibold text-white/35">
                <span>Готовность состава</span>
                <span className="text-white/65">
                  {Math.round(starters.reduce((acc, player) => acc + player.fitness, 0) / Math.max(1, starters.length))}%
                </span>
              </div>
              <ProgressBar
                value={starters.reduce((acc, player) => acc + player.fitness, 0) / Math.max(1, starters.length)}
                height="h-1.5"
                color="bg-lime"
              />
              <div className="mt-3 flex flex-wrap gap-1">
                {squad.slice(0, 7).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-1 rounded-md bg-white/[0.055] py-1 pr-1.5 pl-1"
                  >
                    <PlayerAvatar player={player} size={18} />
                    <span className="text-[7.5px] font-semibold text-white/60">
                      {player.name.split(" ")[1] || player.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-2.5 text-[8px] font-bold uppercase tracking-wider text-white/35">
                План на игру
              </div>
              <div className="space-y-1.5 text-[9px] font-semibold">
                {[
                  ["Подача", game.tactics.serve],
                  ["Блок", game.tactics.block],
                  ["Темп", game.tactics.tempo],
                  [" Риск", `${game.tactics.risk} / 5`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-white/40">{label}</span>
                    <span className="text-white/75">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-lime/20 bg-lime/[0.07] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-lime text-pine-950">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-extrabold text-lime">Тайм-аут</div>
                  <div className="text-[7.5px] font-medium text-white/35">
                    {userTimeout} из 2 доступно
                  </div>
                </div>
              </div>
              <p className="text-[8.5px] font-medium leading-relaxed text-white/45">
                Возьмите паузу, чтобы переломить ход встречи и дать команде импульс в концовке сета.
              </p>
              <div className="mt-2 flex gap-1.5">
                {[0, 1].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      index < userTimeout ? "bg-lime" : "bg-white/10",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {match.finished ? (
          <div className="slide-up mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.055]">
            <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
              <div>
                <div
                  className={cn(
                    "chip mb-3 text-[9px]",
                    userWon ? "bg-lime text-pine-950" : "bg-clay text-white",
                  )}
                >
                  {userWon ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {userWon ? "Победа" : "Поражение"}
                </div>
                <h2 className="font-display text-[25px] font-medium leading-tight tracking-[-0.04em] sm:text-[30px]">
                  {match.sets.home} : {match.sets.away}
                  <span className="ml-3 text-[13px] font-normal text-white/40">{home?.name} — {away?.name}</span>
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-semibold text-white/40">
                  <span>Сеты: {match.setHistory.map((set) => `${set.home}:${set.away}`).join(" · ")}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-white/35" />
                  <span>{match.attendance.toLocaleString("ru-RU")} зрителей</span>
                </div>
                {mvp && (
                  <div className="mt-4 flex max-w-xs items-center gap-2.5 rounded-xl border border-lime/20 bg-lime/[0.07] p-2.5">
                    <PlayerAvatar player={mvp} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[7.5px] font-bold uppercase tracking-wider text-lime/70">
                        Игрок матча
                      </div>
                      <div className="truncate text-[10px] font-extrabold">{mvp.name}</div>
                    </div>
                    <Rating value={mvp.overall} size="sm" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-end gap-2">
                <button onClick={() => onFinish(match)} className="btn-lime justify-center text-[11px]">
                  Завершить и продолжить
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={close}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-[10px] font-bold text-white/60 transition-colors hover:border-white/30 hover:text-white"
                >
                  Выйти без изменений
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="sticky bottom-0 z-20 mt-4 rounded-t-[22px] border border-white/10 bg-[#0A291D]/95 p-3 backdrop-blur-xl sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={playRally} className="btn-lime flex-1 justify-center text-[11px] sm:flex-none">
                <Play className="h-3.5 w-3.5 fill-current" />
                Розыгрыш
              </button>
              <button
                onClick={playSet}
                className="rounded-xl border border-white/15 px-3.5 py-2.5 text-[10px] font-bold text-white/70 transition-colors hover:border-lime/40 hover:text-lime"
              >
                До конца сета
              </button>
              <button
                onClick={playEnd}
                className="rounded-xl border border-white/15 px-3.5 py-2.5 text-[10px] font-bold text-white/70 transition-colors hover:border-lime/40 hover:text-lime"
              >
                До конца матча
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setMatch((prev) => callTimeout(prev, userSide))}
                  disabled={userTimeout <= 0}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 text-[9px] font-bold text-white/60 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  <Timer className="h-3.5 w-3.5" />
                  Тайм-аут
                </button>
                <button
                  onClick={() => setMatch((prev) => makeSubstitution(prev, game.players, userTeamId))}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 text-[9px] font-bold text-white/60 transition-colors hover:border-white/30 hover:text-white"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Замена
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[7.5px] font-medium text-white/25">
              <span>
                {opponent?.name} · {match.setNumber} сет · до {currentTarget} очков
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <Zap className="h-2.5 w-2.5" />
                Сила {Math.round(userSide === "home" ? homePower : awayPower)} против{" "}
                {Math.round(userSide === "home" ? awayPower : homePower)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMatchDate(match: MatchState) {
  return match.competition === "cup" ? "Кубок России · 2026/27" : "Суперлига · 2026/27";
}
