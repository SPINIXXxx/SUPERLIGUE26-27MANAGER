import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  Flame,
  Newspaper,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import type { Fixture, GameState, Player, ScreenId, Team } from "@/lib/types";
import { TEAMS, TEAM_MAP } from "@/lib/data";
import heroImage from "@/assets/hero-volley.jpg";
import {
  currentRoundFor,
  formatDate,
  formatMoney,
  getTable,
  getTeamPower,
  lastResultsFor,
  nextFixtureFor,
  overallSquadRating,
  recentForm,
  resultForClub,
} from "@/lib/game";
import { cn } from "@/utils/cn";
import {
  Crest,
  FormBadge,
  PlayerAvatar,
  PositionBadge,
  ProgressBar,
  Rating,
  SectionHead,
  StatCard,
} from "@/components/ui";

type Props = {
  game: GameState;
  team: Team;
  setScreen: (screen: ScreenId) => void;
  onStartMatch: (fixture: Fixture) => void;
  onOpenPlayer: (player: Player) => void;
};

const TASKS = [
  { id: "lineup", label: "Проверить стартовую шестёрку", to: "tactics" as ScreenId, note: "Тактика" },
  { id: "training", label: "Провести тренировочную сессию", to: "training" as ScreenId, note: "Тренировки" },
  { id: "market", label: "Изучить трансферный рынок", to: "transfers" as ScreenId, note: "Трансферы" },
  { id: "contract", label: "Продлить контракт лидера", to: "squad" as ScreenId, note: "Состав" },
];

export function Dashboard({ game, team, setScreen, onStartMatch, onOpenPlayer }: Props) {
  const next = nextFixtureFor(game.fixtures, game.clubId);
  const opponent = next ? TEAM_MAP[next.homeId === game.clubId ? next.awayId : next.homeId] : undefined;
  const isHome = next ? next.homeId === game.clubId : false;
  const table = getTable(TEAMS, game.fixtures);
  const row = table.find((item) => item.team.id === game.clubId) || table[0];
  const form = recentForm(game.fixtures, game.clubId, 5);
  const results = lastResultsFor(game.fixtures, game.clubId, 3);
  const squad = game.players.filter((player) => player.teamId === game.clubId);
  const leaders = [...squad]
    .sort((a, b) => b.stats.points - a.stats.points)
    .slice(0, 3);
  const mvp = leaders[0];
  const squadRating = overallSquadRating(game.players, game.clubId);
  const round = currentRoundFor(game.fixtures, game.clubId);
  const homeTeam = next ? TEAM_MAP[next.homeId] : undefined;
  const awayTeam = next ? TEAM_MAP[next.awayId] : undefined;
  const userPower = next
    ? getTeamPower(game.players, game.clubId, game.tactics) + (isHome ? 1.8 : 0)
    : 0;
  const rivalPower = next
    ? getTeamPower(game.players, isHome ? next.awayId : next.homeId) + (isHome ? 0 : 1.8)
    : 0;
  const chance = next
    ? Math.round((1 / (1 + Math.exp(-(userPower - rivalPower) / 28))) * 100)
    : 50;
  const homeChance = next ? (isHome ? chance : 100 - chance) : 50;
  const marketCount = game.players.filter(
    (player) => player.teamId !== game.clubId && player.listed,
  ).length;
  const squadDepth = new Set(
    game.players
      .filter((player) => player.teamId === game.clubId && player.pos !== "Либеро")
      .map((player) => player.pos),
  ).size;
  const rivals = table.find((item) => item.team.id === opponent?.id);
  const formWins = form.filter((result) => result === "В").length;
  const initialTasks = [
    game.players.filter((player) => player.teamId === game.clubId && player.starter).length === 7,
    game.training.sessions < game.training.sessionsTotal,
    game.offers.length === 0,
    [...game.players].filter((player) => player.teamId === game.clubId).every((player) => player.contract > 1),
  ];
  const [completed, setCompleted] = useState<string[]>(
    TASKS.filter((_, index) => initialTasks[index]).map((task) => task.id),
  );
  const toggleTask = (id: string) =>
    setCompleted((current) =>
      current.includes(id) ? current.filter((task) => task !== id) : [...current, id],
    );

  const avgFitness = Math.round(
    squad.reduce((acc, player) => acc + player.fitness, 0) / Math.max(1, squad.length),
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label mb-1.5 text-pine-700">{team.full} · сезон {game.season}</div>
          <h1 className="font-display text-[25px] font-medium leading-tight tracking-[-0.035em] sm:text-[32px]">
            Добро пожаловать, {game.manager.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[12px] font-medium text-muted">
            {next
              ? `Команда готовится к ${round}-му туру Суперлиги. Все решения — за вами.`
              : `Регулярный чемпионат завершён. ${team.name} финиширует на ${row.place}-м месте.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScreen("tactics")} className="btn-ghost text-[11px]">
            <ClipboardList className="h-3.5 w-3.5" />
            План на игру
          </button>
          {next && (
            <button onClick={() => onStartMatch(next)} className="btn-primary text-[11px]">
              <Play className="h-3.5 w-3.5 fill-current" />
              Играть матч
            </button>
          )}
        </div>
      </div>

      <section className="hero-grain relative mb-5 overflow-hidden rounded-[26px] bg-pine-950 text-white">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Матч по волейболу"
            className="h-full w-full object-cover object-[62%_center] opacity-[0.62]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pine-950 via-pine-950/90 to-pine-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-950/80 via-transparent to-transparent" />
          <div className="court-lines absolute inset-0 opacity-30" />
        </div>
        <div className="relative grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_330px] lg:gap-8 lg:p-8">
          <div className="flex max-w-xl flex-col justify-center">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="chip border border-white/10 bg-white/[0.08] text-lime">
                <span className="h-1.5 w-1.5 rounded-full bg-lime pulse-dot" />
                {round}-й тур · {next ? formatDate(next.date) : "сезон завершён"}
              </span>
              <span className="chip border border-white/10 bg-white/[0.06] text-white/65">
                {next ? (isHome ? "Домашний матч" : "Матч в гостях") : "Сезон завершён"}
              </span>
            </div>
            <h2 className="font-display text-[27px] font-medium leading-[1.1] tracking-[-0.045em] sm:text-[38px]">
              {next ? (isHome ? "Домашняя площадка." : "Выездная проверка.") : "Регулярка позади."}
              <br />
              <span className="text-lime">{opponent ? `${opponent.name}.` : "Время итогов."}</span>
            </h2>
            <p className="mt-3 max-w-md text-[11.5px] font-medium leading-relaxed text-white/58 sm:text-[12.5px]">
              {next
                ? `${rivals?.wins || 0} побед и ${rivals?.points || 0} очков у соперника. ${chance >= 55 ? "Шансы на победу высоки — сыграйте агрессивно." : chance >= 42 ? "Равная пара — исход решат концовки сетов." : "Соперник опасен: сделайте ставку на приём и точечную подачу."}`
                : "Регулярный чемпионат позади. Подведите итоги и начните новый сезон в другом клубе."}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {next && (
                <button onClick={() => onStartMatch(next)} className="btn-lime text-[11px]">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Выйти на площадку
                </button>
              )}
              <button
                onClick={() => setScreen("calendar")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-[11px] font-bold text-white/85 transition-colors hover:border-white/30 hover:bg-white/10"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Календарь
              </button>
            </div>
            <div className="mt-6 grid max-w-md grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <div>
                <div className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/35">
                  Место
                </div>
                <div className="number mt-1 text-[18px] font-medium text-white">
                  {row.place}
                  <span className="ml-0.5 text-[10px] font-medium text-white/35">/ 16</span>
                </div>
              </div>
              <div>
                <div className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/35">
                  Очков
                </div>
                <div className="number mt-1 text-[18px] font-medium text-white">
                  {row.points} <span className="text-[10px] text-white/35">в {row.played}</span>
                </div>
              </div>
              <div>
                <div className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/35">
                  Готовность
                </div>
                <div className="number mt-1 text-[18px] font-medium text-white">{avgFitness}%</div>
              </div>
            </div>
          </div>

          {next && opponent ? (
            <div className="relative self-center rounded-[20px] border border-white/15 bg-white/[0.085] p-4 backdrop-blur-md sm:p-4.5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-white/40">
                  Следующий матч
                </span>
                <span className="flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[8px] font-bold text-lime">
                  <span className="h-1 w-1 rounded-full bg-lime" />
                  Суперлига
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  <Crest team={homeTeam} size={50} ring />
                  <div>
                    <div className="text-[11px] font-extrabold leading-tight">{homeTeam?.name}</div>
                    <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/35">
                      хозяева
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="number text-[19px] font-medium leading-none text-white/85">VS</div>
                  <div className="mt-1.5 text-[9px] font-semibold text-white/40">19:00 МСК</div>
                </div>
                <div className="flex flex-1 flex-col items-center gap-2 text-center">
                  <Crest team={awayTeam} size={50} />
                  <div>
                    <div className="text-[11px] font-extrabold leading-tight">{awayTeam?.name}</div>
                    <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/35">
                      гости
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-pine-950/40 p-2.5">
                <div className="mb-1.5 flex items-center justify-between text-[8.5px] font-semibold text-white/45">
                  <span>ШАНСЫ НА ПОБЕДУ</span>
                  <span className="text-lime">{isHome ? chance : 100 - chance}%</span>
                </div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-l-full bg-lime" style={{ width: `${homeChance}%` }} />
                  <div className="h-full flex-1 rounded-r-full bg-clay/80" />
                </div>
                <div className="mt-1.5 flex justify-between text-[8px] font-semibold text-white/35">
                  <span>{homeTeam?.short} · {homeChance}%</span>
                  <span>{awayTeam?.short} · {100 - homeChance}%</span>
                </div>
              </div>
              <button
                onClick={() => setScreen("squad")}
                className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1 text-[9.5px] font-bold text-white/55 transition-colors hover:text-white"
              >
                <span>Состав и готовность команды</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="self-center rounded-[20px] border border-white/15 bg-white/[0.08] p-5 backdrop-blur">
              <Trophy className="mb-2 h-6 w-6 text-lime" />
              <div className="text-[13px] font-extrabold">Сезон завершён</div>
              <div className="mt-1 text-[10px] font-medium text-white/50">
                Начните новую кампанию и выберите другой клуб.
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="Позиция в лиге"
          value={row.place}
          suffix="из 16"
          icon={<Trophy className="h-3.5 w-3.5" />}
          note={`${row.wins} побед · ${row.setsFor} выигранных сетов`}
        />
        <StatCard
          label="Форма команды"
          value={`${row.wins}/${row.played}`}
          suffix="побед"
          icon={<Flame className="h-3.5 w-3.5" />}
          note={
            <span className="flex items-center gap-1.5">
              {form.map((result, index) => (
                <FormBadge key={`${result}-${index}`} result={result} />
              ))}
              <span className="ml-0.5">{formWins} побед в {form.length} матчах</span>
            </span>
          }
        />
        <StatCard
          label="Рейтинг состава"
          value={squadRating.toFixed(1)}
          suffix="средний"
          icon={<Users className="h-3.5 w-3.5" />}
          note={`${squadDepth} позиции укомплектованы · ${squad.length} игроков`}
        />
        <StatCard
          label="Трансферный бюджет"
          value={formatMoney(game.budget, true)}
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          note={`${squad.length} игроков · ${Math.round(avgFitness)}% готовность`}
        />
      </div>

      {!next && (
        <div className="mb-4 flex flex-col gap-3 rounded-[22px] border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime text-pine-950">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <div className="label text-pine-700">Сезон {game.season} завершён</div>
              <div className="mt-1 text-[14px] font-extrabold">
                {team.name} — {row.place}-е место · {row.points} очков
              </div>
              <div className="mt-1 text-[10px] font-medium text-muted">
                Победитель регулярки: {table[0]?.team.full}. Лучший бомбардир команды: {leaders[0]?.name || "—"} ({leaders[0]?.stats.points || 0} очков).
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button onClick={() => setScreen("calendar")} className="btn-ghost justify-center text-[10px]">
              Итоги сезона
            </button>
            <button onClick={() => setScreen("club")} className="btn-primary justify-center text-[10px]">
              Новый сезон
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Результаты команды"
              description={`Последние матчи · ${row.points} очков в ${row.played} турах`}
              action={
                <button
                  onClick={() => setScreen("calendar")}
                  className="flex items-center gap-1 text-[10px] font-extrabold text-pine-800 hover:text-pine-600"
                >
                  Все матчи
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              }
            />
            <div className="mt-3 divide-y divide-line/70">
              {results.length ? (
                results.map((fixture) => {
                  const { own, opp, won, isHome: home } = resultForClub(fixture, game.clubId);
                  const rivalId = home ? fixture.awayId : fixture.homeId;
                  const rival = TEAM_MAP[rivalId];
                  return (
                    <div
                      key={fixture.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[9px] font-extrabold",
                          won ? "bg-[#E9F3DC] text-[#4B713A]" : "bg-[#F5E7E0] text-[#A16149]",
                        )}
                      >
                        {won ? "В" : "П"}
                      </span>
                      <div className="hidden w-12 shrink-0 text-[9px] font-semibold text-muted sm:block">
                        {formatDate(fixture.date).replace(" 2026", "")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted">
                            {home ? "Дома" : "В гостях"}
                          </span>
                          <span className="h-0.5 w-0.5 rounded-full bg-muted/50" />
                          <span className="truncate text-[11px] font-extrabold">{rival.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[9px] font-semibold text-muted">
                            {fixture.round} тур
                          </span>
                          <span className="text-[8px] font-medium text-muted/50">
                            {formationLabel(fixture, game.clubId)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className="number hidden text-[10px] font-semibold tracking-[0.02em] text-muted/70 lg:block">
                          {fixture.sets
                            ?.slice(0, 5)
                            .map((set) => {
                              const ownSet = home ? set.home : set.away;
                              const opponentSet = home ? set.away : set.home;
                              return `${ownSet}:${opponentSet}`;
                            })
                            .join("  ")}
                        </span>
                        <span className="number min-w-[38px] rounded-lg bg-[#ECEAE0] px-2 py-1 text-center text-[13px] font-semibold">
                          {own}:{opp}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-[11px] font-medium text-muted">
                  Матчи ещё не проводились
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-4 sm:p-5">
              <SectionHead
                title="Лидеры команды"
                description="По набранным очкам"
                action={
                  <button
                    onClick={() => setScreen("squad")}
                    className="text-[10px] font-extrabold text-pine-800 hover:text-pine-600"
                  >
                    Состав
                  </button>
                }
              />
              <div className="mt-4 space-y-3.5">
                {leaders.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => onOpenPlayer(player)}
                    className="group flex w-full items-center gap-3 text-left"
                  >
                    <span className="number w-4 shrink-0 text-[11px] font-semibold text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <PlayerAvatar player={player} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-extrabold group-hover:text-pine-700">
                          {player.name}
                        </span>
                        <span className="number shrink-0 text-[11px] font-semibold text-pine-800">
                          {player.stats.points}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <PositionBadge code={player.posCode} className="px-1.5 py-0.5 text-[8px]" />
                        <ProgressBar
                          value={player.stats.points}
                          max={Math.max(40, leaders[0]?.stats.points || 1)}
                          height="h-1"
                          color={index === 0 ? "bg-lime" : "bg-[#B9C4AA]"}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F4F2E8] px-3 py-2 text-[9px] font-semibold text-muted">
                <TrendingUp className="h-3 w-3 text-pine-700" />
                Средняя результативность {Math.round((leaders.reduce((acc, p) => acc + p.stats.points, 0) / Math.max(1, leaders.length)) * 10) / 10} очка
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-line px-4 py-4 sm:px-5">
                <SectionHead
                  title="Суперлига 26/27"
                  description="Положение в турнирной таблице"
                  action={
                    <button
                      onClick={() => setScreen("league")}
                      className="flex items-center gap-0.5 text-[10px] font-extrabold text-pine-800 hover:text-pine-600"
                    >
                      Полная
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  }
                />
              </div>
              <div className="px-3 py-2 sm:px-4">
                <div className="grid grid-cols-[24px_1fr_28px_30px] gap-2 border-b border-line/60 pb-1.5 text-[8px] font-extrabold uppercase tracking-wider text-muted/70">
                  <span>#</span>
                  <span>Клуб</span>
                  <span className="text-center">И</span>
                  <span className="text-right">О</span>
                </div>
                {table.slice(0, 5).map((item) => (
                  <div
                    key={item.team.id}
                    className={cn(
                      "grid grid-cols-[24px_1fr_28px_30px] items-center gap-2 rounded-lg px-1.5 py-[7px]",
                      item.team.id === game.clubId && "bg-[#F0F5E3]",
                    )}
                  >
                    <span
                      className={cn(
                        "number text-[10px] font-semibold",
                        item.place <= 4 ? "text-pine-800" : "text-muted",
                      )}
                    >
                      {item.place}
                    </span>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Crest team={item.team} size={19} />
                      <span className="truncate text-[10.5px] font-bold">{item.team.name}</span>
                    </div>
                    <span className="number text-center text-[10px] font-medium text-muted">
                      {item.played}
                    </span>
                    <span className="number text-right text-[11px] font-semibold">{item.points}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-line bg-[#F6F3EA] px-4 py-2.5">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-muted">
                  Топ-4 — напрямую в 1/4
                </span>
                <div className="flex items-center gap-1">
                  {form.slice(-3).map((r, i) => (
                    <FormBadge key={`${r}-${i}`} result={r} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="relative overflow-hidden rounded-[22px] bg-pine-900 p-4 text-white sm:p-5">
            <div className="pointer-events-none absolute -top-14 -right-12 h-40 w-40 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -top-5 -right-3 h-24 w-24 rounded-full border border-white/10" />
            <div className="relative mb-3 flex items-start justify-between">
              <div>
                <div className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-lime/80">
                  План недели
                </div>
                <div className="mt-1 text-[13px] font-extrabold">Подготовка к туру</div>
              </div>
              <span className="number text-[22px] font-medium text-lime">
                {completed.length}
                <span className="text-[11px] text-white/30">/{TASKS.length}</span>
              </span>
            </div>
            <div className="relative mb-3.5">
              <ProgressBar
                value={completed.length}
                max={TASKS.length}
                height="h-1.5"
                color="bg-lime"
              />
            </div>
            <div className="relative space-y-0.5">
              {TASKS.map((task) => {
                const done = completed.includes(task.id);
                return (
                  <div
                    key={task.id}
                    className="group flex items-center gap-2.5 rounded-lg px-1 py-2 transition-colors hover:bg-white/[0.06]"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "grid h-4.5 w-4.5 shrink-0 place-items-center rounded-[5px] border transition-colors",
                        done
                          ? "border-lime bg-lime text-pine-950"
                          : "border-white/25 text-transparent hover:border-lime/60",
                      )}
                      aria-label={done ? "Отметить невыполненным" : "Отметить выполненным"}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-[10.5px] font-semibold",
                        done ? "text-white/35 line-through" : "text-white/75",
                      )}
                    >
                      {task.label}
                    </span>
                    <button
                      onClick={() => setScreen(task.to)}
                      className="shrink-0 text-[8px] font-bold uppercase tracking-wider text-white/25 transition-colors group-hover:text-lime"
                    >
                      {task.note}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setScreen("training")}
              className="relative mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] py-2 text-[10px] font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Target className="h-3.5 w-3.5 text-lime" />
              Перейти к тренировкам
            </button>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Игрок недели"
              description="Выбор тренерского штаба"
              action={<Sparkles className="h-4 w-4 text-[#A7BB5A]" />}
            />
            {mvp && (
              <button
                onClick={() => onOpenPlayer(mvp)}
                className="mt-3.5 flex w-full items-center gap-3 rounded-xl bg-[#F3F5E8] p-3 text-left transition-colors hover:bg-[#EDF0DE]"
              >
                <PlayerAvatar player={mvp} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-extrabold">{mvp.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <PositionBadge code={mvp.posCode} className="px-1.5 py-0.5 text-[8px]" />
                    <span className="text-[9px] font-semibold text-muted">
                      {mvp.stats.points} очков
                    </span>
                  </div>
                </div>
                <Rating value={mvp.overall} size="md" />
              </button>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line p-2.5">
                <div className="label text-[8px]">Готовность</div>
                <div className="number mt-1 text-[16px] font-medium">{avgFitness}%</div>
              </div>
              <div className="rounded-lg border border-line p-2.5">
                <div className="label text-[8px]">Травмы</div>
                <div className="number mt-1 text-[16px] font-medium text-pine-700">0</div>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Новости клуба"
              action={
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#F0EDE3] text-pine-800">
                  <Newspaper className="h-3.5 w-3.5" />
                </div>
              }
            />
            <div className="mt-3 space-y-3">
              {game.news.slice(0, 3).map((item) => (
                <div key={item.id} className="group flex gap-2.5">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sand group-hover:bg-lime" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-pine-700">
                        {item.tag}
                      </span>
                      <span className="text-[8px] font-medium text-muted/60">{item.date}</span>
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[10.5px] font-bold leading-snug">
                      {item.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => setScreen("tactics")}
          className="card card-hover group flex items-center gap-3 p-4 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine-900 text-lime">
            <ClipboardList className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-extrabold">Тактика на матч</span>
            <span className="block text-[9px] font-medium text-muted">Система {game.tactics.system} · риск {game.tactics.risk}/5</span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => setScreen("transfers")}
          className="card card-hover group flex items-center gap-3 p-4 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-pine-950">
            <Users className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-extrabold">Усилить состав</span>
            <span className="block text-[9px] font-medium text-muted">На рынке {marketCount} доступных игроков</span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => setScreen("finances")}
          className="card card-hover group flex items-center gap-3 p-4 text-left"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EFEBDE] text-pine-800">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-extrabold">Стабильность клуба</span>
            <span className="block text-[9px] font-medium text-muted">Совет директоров: {game.boardConfidence}% доверия</span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

function formationLabel(fixture: Fixture, clubId: string) {
  const isHome = fixture.homeId === clubId;
  const sets = fixture.sets || [];
  if (!sets.length) return "";
  const wins = sets.filter((s) => (isHome ? s.home > s.away : s.away > s.home)).length;
  return `${wins} сет${wins === 1 ? "" : wins < 5 ? "а" : "ов"} в свою копилку`;
}
