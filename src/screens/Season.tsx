import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Info,
  MapPin,
  Play,
  Shield,
  Sparkles,
  Trophy,
  Tv,
  Users,
} from "lucide-react";
import type { CupMatch, Fixture, GameState, Player, ScreenId, Team } from "@/lib/types";
import { TEAMS, TEAM_MAP } from "@/lib/data";
import {
  currentRoundFor,
  cupCurrentRound,
  formatDate,
  formatDateShort,
  getTable,
  nextFixtureFor,
  recentForm,
  resultForClub,
  topScorers,
} from "@/lib/game";
import { cn } from "@/utils/cn";
import {
  Crest,
  FormBadge,
  PageHeader,
  PlayerAvatar,
  PositionBadge,
  ProgressBar,
  SectionHead,
  StatCard,
  TeamLine,
} from "@/components/ui";

type Base = { game: GameState; team: Team };

/* ---------------------------------- Calendar --------------------------------- */

export function CalendarScreen({
  game,
  team,
  onStartMatch,
  onSimulateSeason,
}: Base & {
  onStartMatch: (fixture: Fixture) => void;
  onSimulateSeason: () => void;
}) {
  const next = nextFixtureFor(game.fixtures, game.clubId);
  const currentRound = currentRoundFor(game.fixtures, game.clubId);
  const [selected, setSelected] = useState(currentRound);
  const fixtures = game.fixtures.filter((fixture) => fixture.round === selected);
  const roundDate = fixtures[0]?.date;
  const selectedIsNext = next?.round === selected;
  const form = recentForm(game.fixtures, game.clubId, 5);
  const table = getTable(TEAMS, game.fixtures);
  const ownRow = table.find((row) => row.team.id === game.clubId);
  const upcoming = game.fixtures
    .filter(
      (fixture) =>
        !fixture.played &&
        (fixture.homeId === game.clubId || fixture.awayId === game.clubId),
    )
    .sort((a, b) => a.round - b.round)
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        eyebrow="Сезон 2026/27 · регулярный чемпионат"
        title="Календарь матчей"
        description={
          next
            ? "30 туров, 16 клубов и два круга. Результаты остальных матчей тура обновляются после вашей игры."
            : "Все 240 матчей регулярного чемпионата сыграны. Итоговая таблица и статистика сезона доступны в разделе «Таблица»."
        }
        actions={
          <>
            <div className="hidden items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 sm:flex">
              <CalendarDays className="h-3.5 w-3.5 text-pine-700" />
              <span className="text-[10px] font-bold">
                {next ? `${next.round}-й тур · ${formatDate(next.date)}` : "Сезон завершён"}
              </span>
            </div>
            {next ? (
              <button onClick={() => onStartMatch(next)} className="btn-primary text-[11px]">
                <Play className="h-3.5 w-3.5 fill-current" />
                Играть
              </button>
            ) : null}
            {game.fixtures.some((fixture) => !fixture.played) && (
              <button onClick={onSimulateSeason} className="btn-ghost text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-pine-700" />
                Симулировать остаток
              </button>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Турнирная позиция"
          value={ownRow?.place || "—"}
          suffix="из 16"
          note={`${ownRow?.wins} побед · ${ownRow?.losses} поражений`}
        />
        <StatCard
          label="Очки"
          value={ownRow?.points || 0}
          note={`${ownRow?.setsFor}:${ownRow?.setsAgainst} по сетам`}
        />
        <StatCard
          label="Форма"
          value={form.filter((result) => result === "В").length}
          suffix="побед в 5"
          note={
            <span className="flex gap-1">
              {form.map((result, index) => (
                <FormBadge key={`${result}-${index}`} result={result} />
              ))}
            </span>
          }
        />
        <StatCard
          label="До конца регулярки"
          value={Math.max(0, 30 - (ownRow?.played || 0))}
          suffix="матчей"
          note={`${game.fixtures.filter((f) => f.played).length} из 240 сыграно`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-4 pt-4 sm:px-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="label mb-1">Регулярный чемпионат</div>
                  <div className="text-[14px] font-extrabold">
                    {selected}-й тур
                    <span className="ml-2 text-[10px] font-semibold text-muted">
                      {roundDate ? formatDate(roundDate) : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelected((round) => Math.max(1, round - 1))}
                    disabled={selected === 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted transition-colors hover:text-ink disabled:opacity-30"
                    aria-label="Предыдущий тур"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setSelected((round) => Math.min(30, round + 1))}
                    disabled={selected === 30}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted transition-colors hover:text-ink disabled:opacity-30"
                    aria-label="Следующий тур"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="hide-scrollbar -mx-1 flex gap-1 overflow-x-auto pb-3">
                {Array.from({ length: 30 }).map((_, index) => {
                  const round = index + 1;
                  const roundFixtures = game.fixtures.filter((fixture) => fixture.round === round);
                  const played = roundFixtures.every((fixture) => fixture.played);
                  const isNext = round === currentRound;
                  return (
                    <button
                      key={round}
                      onClick={() => setSelected(round)}
                      className={cn(
                        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold transition-all",
                        selected === round
                          ? "bg-pine-900 text-lime"
                          : played
                            ? "bg-[#EFEDE3] text-muted hover:text-ink"
                            : "border border-line text-muted/55 hover:border-pine-700/40 hover:text-ink",
                      )}
                    >
                      {round}
                      {isNext && selected !== round && (
                        <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-clay" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-line/70">
              {fixtures.map((fixture) => {
                const home = TEAM_MAP[fixture.homeId];
                const away = TEAM_MAP[fixture.awayId];
                const userMatch = fixture.homeId === game.clubId || fixture.awayId === game.clubId;
                const isHome = fixture.homeId === game.clubId;
                const result = userMatch ? resultForClub(fixture, game.clubId) : undefined;
                return (
                  <div
                    key={fixture.id}
                    className={cn(
                      "relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 transition-colors sm:grid-cols-[1fr_80px_1fr] sm:gap-3 sm:px-5",
                      userMatch ? "bg-[#F4F6E9]" : "hover:bg-[#F7F4EB]",
                    )}
                  >
                    {userMatch && <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-lime" />}
                    <div className="flex min-w-0 justify-end">
                      <TeamLine team={home} reverse size={30} showCity={false} />
                    </div>
                    <div className="flex flex-col items-center">
                      {fixture.played ? (
                        <>
                          <div className="number rounded-lg bg-pine-950 px-2 py-1 text-[13px] font-semibold text-white">
                            {fixture.homeSets} : {fixture.awaySets}
                          </div>
                          <div className="mt-1 flex gap-0.5">
                            {fixture.sets?.map((set, index) => (
                              <span
                                key={index}
                                className={cn(
                                  "number text-[7px] font-semibold",
                                  set.home > set.away ? "text-pine-800" : "text-muted/50",
                                )}
                              >
                                {set.home}:{set.away}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="number rounded-lg border border-line bg-white/60 px-2 py-1 text-[11px] font-semibold text-muted">
                            19:00
                          </div>
                          <span className="mt-1 text-[7px] font-semibold uppercase tracking-wider text-muted/60">
                            МСК
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex min-w-0">
                      <TeamLine team={away} size={30} showCity={false} />
                    </div>
                    {userMatch && !fixture.played && next?.id === fixture.id && (
                      <div className="col-span-3 flex items-center justify-between gap-2 rounded-lg border border-lime/60 bg-lime/15 px-2.5 py-1.5 sm:absolute sm:top-1/2 sm:right-4 sm:col-span-1 sm:-translate-y-1/2 sm:border-0 sm:bg-transparent">
                        <span className="text-[8.5px] font-extrabold text-pine-800">
                          {isHome ? "Домашний матч" : "В гостях"}
                        </span>
                        <button
                          onClick={() => onStartMatch(fixture)}
                          className="flex items-center gap-1 rounded-md bg-pine-900 px-2 py-1 text-[8.5px] font-extrabold text-lime hover:bg-pine-800 sm:hidden"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" /> Играть
                        </button>
                      </div>
                    )}
                    {userMatch && fixture.played && (
                      <div className="col-span-3 flex justify-center sm:col-span-1 sm:absolute sm:top-1/2 sm:right-4 sm:block sm:-translate-y-1/2">
                        <span
                          className={cn(
                            "chip text-[8px] font-extrabold",
                            result?.won
                              ? "bg-[#E9F3DC] text-[#4B713A]"
                              : "bg-[#F5E7E0] text-[#A16149]",
                          )}
                        >
                          {result?.won ? "Победа" : "Поражение"} · {result?.own}:{result?.opp}
                        </span>
                      </div>
                    )}
                    {!userMatch && (
                      <div className="col-span-3 flex justify-center gap-2 sm:hidden">
                        <span className="text-[7.5px] font-semibold text-muted">
                          {fixture.played ? "Матч завершён" : "Матч тура"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-line bg-[#F7F4EB] px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-[8.5px] font-semibold text-muted">
                <Tv className="h-3 w-3" />
                Все матчи тура доступны в матч-центре
              </span>
              {next && selectedIsNext && (
                <button
                  onClick={() => onStartMatch(next)}
                  className="flex items-center gap-1 text-[9px] font-extrabold text-pine-800 hover:text-pine-600"
                >
                  {selected}-й тур · играть
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {next && selectedIsNext && (
            <div className="relative overflow-hidden rounded-[22px] bg-pine-950 p-4 text-white sm:p-5">
              <div className="court-lines pointer-events-none absolute inset-0 opacity-15" />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <Crest team={team} size={44} ring />
                  <div>
                    <div className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-lime/70">
                      Следующий матч
                    </div>
                    <div className="mt-1 text-[13px] font-extrabold">
                      {team.name} — {TEAM_MAP[next.homeId === game.clubId ? next.awayId : next.homeId].name}
                    </div>
                    <div className="mt-0.5 text-[9px] font-medium text-white/45">
                      {formatDate(next.date)} · {next.homeId === game.clubId ? "дома" : "в гостях"} · 19:00 МСК
                    </div>
                  </div>
                </div>
                <button onClick={() => onStartMatch(next)} className="btn-lime text-[11px]">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Выйти на площадку
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="card p-4 sm:p-5">
            <SectionHead title="Ближайшие матчи" description="Ваш путь в календаре" />
            <div className="mt-3.5 space-y-2">
              {upcoming.map((fixture, index) => {
                const rivalId = fixture.homeId === game.clubId ? fixture.awayId : fixture.homeId;
                const rival = TEAM_MAP[rivalId];
                return (
                  <div
                    key={fixture.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border p-2.5",
                      index === 0 ? "border-pine-800/25 bg-[#F3F5E9]" : "border-line",
                    )}
                  >
                    <Crest team={rival} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10.5px] font-extrabold">{rival.name}</div>
                      <div className="text-[8px] font-medium text-muted">
                        {fixture.round} тур · {formatDateShort(fixture.date)} ·{" "}
                        {fixture.homeId === game.clubId ? "дома" : "в гостях"}
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="chip bg-lime text-[7.5px] text-pine-950">Далее</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-4 py-4 sm:px-5">
              <SectionHead
                title="Топ-6 лиги"
                description={`${team.name} — ${ownRow?.place}-е место`}
              />
            </div>
            <div className="divide-y divide-line/60 px-2 py-1.5">
              {table.slice(0, 6).map((row) => (
                <div
                  key={row.team.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-2",
                    row.team.id === game.clubId && "bg-[#F0F5E3]",
                  )}
                >
                  <span className="number w-4 text-[9px] font-semibold text-muted">{row.place}</span>
                  <Crest team={row.team} size={21} />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-bold">{row.team.name}</span>
                  <div className="flex gap-0.5">
                    {row.form.map((result, index) => (
                      <FormBadge key={`${result}-${index}`} result={result} />
                    ))}
                  </div>
                  <span className="number w-5 text-right text-[10px] font-semibold">{row.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-line border-dashed p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-extrabold text-pine-800">
              <Info className="h-3.5 w-3.5" />
              Формат сезона-2026/27
            </div>
            <p className="text-[9px] font-medium leading-relaxed text-muted">
              16 клубов проводят двухкруговой турнир. Первые четыре команды выходят в 1/4 финала
              напрямую, клубы с 5-го по 12-е место играют квалификационный раунд.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- League ---------------------------------- */

export function LeagueScreen({
  game,
  team,
  onOpenPlayer,
}: Base & { onOpenPlayer: (player: Player) => void; setScreen: (s: ScreenId) => void }) {
  const [tab, setTab] = useState<"table" | "stats">("table");
  const [stat, setStat] = useState<"points" | "blocks" | "aces">("points");
  const table = getTable(TEAMS, game.fixtures);
  const own = table.find((row) => row.team.id === game.clubId);
  const scorers = topScorers(game.players, 30);
  const rankings = useMemo(
    () =>
      [...game.players]
        .filter((player) => player.teamId !== "free")
        .sort((a, b) => b.stats[stat] - a.stats[stat])
        .slice(0, 10),
    [game.players, stat],
  );
  const statLabels = { points: "Очки", blocks: "Блоки", aces: "Эйсы" };

  return (
    <div>
      <PageHeader
        eyebrow="Суперлига 2026/27 · 16 клубов"
        title="Турнирная таблица"
        description="Плотная борьба за первое место и путёвки в плей-офф. Таблица обновляется после каждого матча."
        actions={
          <div className="inline-flex rounded-xl border border-line bg-paper p-1">
            {(
              [
                { id: "table", label: "Таблица" },
                { id: "stats", label: "Статистика" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition-colors",
                  tab === item.id ? "bg-pine-900 text-lime" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Действующий чемпион"
          value="Динамо"
          suffix="Москва"
          icon={<Trophy className="h-3.5 w-3.5" />}
          note="Победитель Суперлиги 2025/26"
        />
        <StatCard
          label="Ваша позиция"
          value={own?.place || "—"}
          suffix="из 16"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          note={`${own?.wins} побед · ${own?.points} очков`}
        />
        <StatCard
          label="Разница сетов"
          value={own ? `${own.setsFor}–${own.setsAgainst}` : "—"}
          icon={<ArrowUpRight className="h-3.5 w-3.5" />}
          note={`Соотношение ${own?.setRatio.toFixed(2) || "0.00"}`}
        />
        <StatCard
          label="Лучший бомбардир"
          value={scorers[0]?.stats.points || 0}
          suffix="очков"
          icon={<Users className="h-3.5 w-3.5" />}
          note={scorers[0]?.name || "—"}
        />
      </div>

      {tab === "table" ? (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="card overflow-hidden xl:col-span-9">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <SectionHead title="Положение команд" description="Обновлено после последнего тура" />
              <div className="flex items-center gap-3 text-[8px] font-semibold text-muted">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-pine-700" /> 1/4 финала
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C4A54A]" /> Квалификация
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C1B9AA]" /> Вне плей-офф
                </span>
              </div>
            </div>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-[#F5F2E8] text-[8px] font-extrabold uppercase tracking-[0.1em] text-muted">
                    <th className="py-2 pl-4 font-extrabold">#</th>
                    <th className="py-2 font-extrabold">Клуб</th>
                    <th className="w-9 py-2 text-center font-extrabold">И</th>
                    <th className="w-9 py-2 text-center font-extrabold">В</th>
                    <th className="w-9 py-2 text-center font-extrabold">П</th>
                    <th className="w-14 py-2 text-center font-extrabold">С/П</th>
                    <th className="w-12 py-2 text-center font-extrabold">±</th>
                    <th className="w-10 py-2 text-center font-extrabold">О</th>
                    <th className="w-24 py-2 pr-4 text-right font-extrabold">Форма</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row) => (
                    <tr
                      key={row.team.id}
                      className={cn(
                        "group border-b border-line/70 transition-colors last:border-0 hover:bg-[#F7F4EB]",
                        row.team.id === game.clubId && "bg-[#F1F6E4] hover:bg-[#EDF3DD]",
                      )}
                    >
                      <td className="py-2.5 pl-4">
                        <span className="relative flex items-center gap-1.5">
                          <span
                            className={cn(
                              "absolute -left-4 h-4 w-[3px] rounded-r",
                              row.place <= 4
                                ? "bg-pine-700"
                                : row.place <= 12
                                  ? "bg-[#C4A54A]"
                                  : "bg-transparent",
                            )}
                          />
                          <span
                            className={cn(
                              "number text-[10px] font-semibold",
                              row.place <= 4 ? "text-pine-800" : "text-muted",
                            )}
                          >
                            {row.place}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Crest team={row.team} size={24} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10.5px] font-extrabold">{row.team.name}</span>
                              {row.team.id === game.clubId && (
                                <span className="rounded bg-lime px-1 py-0.5 text-[6.5px] font-extrabold text-pine-950">
                                  ВЫ
                                </span>
                              )}
                            </div>
                            <div className="text-[7.5px] font-medium text-muted">{row.team.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="number text-center text-[10px] font-medium text-muted">{row.played}</td>
                      <td className="number text-center text-[10px] font-semibold">{row.wins}</td>
                      <td className="number text-center text-[10px] font-medium text-muted">{row.losses}</td>
                      <td className="number text-center text-[10px] font-medium">
                        {row.setsFor}/{row.setsAgainst}
                      </td>
                      <td
                        className={cn(
                          "number text-center text-[10px] font-semibold",
                          row.setsFor - row.setsAgainst > 0
                            ? "text-pine-700"
                            : "text-muted",
                        )}
                      >
                        {row.setsFor - row.setsAgainst > 0 ? "+" : ""}
                        {row.setsFor - row.setsAgainst}
                      </td>
                      <td className="number text-center">
                        <span className="inline-grid h-5 min-w-5 place-items-center rounded-md bg-pine-900 px-1 text-[10px] font-semibold text-lime">
                          {row.points}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex justify-end gap-0.5">
                          {row.form.length ? (
                            row.form.map((result, index) => (
                              <FormBadge key={`${result}-${index}`} result={result} />
                            ))
                          ) : (
                            <span className="text-[8px] text-muted">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#F7F4EB] px-4 py-2.5">
              <span className="text-[8.5px] font-semibold text-muted">
                Победа 3:0 / 3:1 — 3 очка · 3:2 — 2 очка · поражение 2:3 — 1 очко
              </span>
              <span className="flex items-center gap-1.5 text-[8.5px] font-bold text-pine-800">
                <CircleDot className="h-3 w-3" />
                Плей-офф: топ-12
              </span>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <div className="relative overflow-hidden rounded-[22px] bg-pine-950 p-4 text-white">
              <div className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full border border-white/10" />
              <div className="label text-white/35">Гонка за титул</div>
              <div className="mt-2 flex items-center gap-3">
                <Crest team={team} size={40} ring />
                <div>
                  <div className="number text-[24px] font-medium leading-none text-lime">
                    {own?.place}
                    <span className="text-[11px] text-white/30"> / 16</span>
                  </div>
                  <div className="mt-0.5 text-[9px] font-medium text-white/45">
                    {own?.points} очков в {own?.played} матчах
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[8px] font-semibold text-white/40">
                  <span>Путь к плей-офф</span>
                  <span className="text-lime">топ-12</span>
                </div>
                <ProgressBar
                  value={own?.played || 0}
                  max={30}
                  height="h-1.5"
                  color="bg-lime"
                />
                <div className="mt-1 text-[8px] font-medium text-white/35">
                  {own?.played} из 30 туров пройдено
                </div>
              </div>
            </div>

            <div className="card p-4">
              <SectionHead title="Лучшие бомбардиры" description="Суперлига 2026/27" />
              <div className="mt-3 space-y-2">
                {scorers.slice(0, 5).map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => onOpenPlayer(player)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <span className="number w-3 text-[9px] font-semibold text-muted">{index + 1}</span>
                    <PlayerAvatar player={player} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[9.5px] font-extrabold">{player.name}</div>
                      <div className="text-[7.5px] font-medium text-muted">
                        {TEAM_MAP[player.teamId]?.name}
                      </div>
                    </div>
                    <span className="number text-[10px] font-semibold text-pine-800">
                      {player.stats.points}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setTab("stats")}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[#F2EFE4] py-2 text-[9px] font-extrabold text-pine-800 transition-colors hover:bg-[#EAE6D9]"
              >
                Вся статистика
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="card p-4">
              <div className="label mb-2">Борьба за первое место</div>
              <div className="space-y-2">
                {table.slice(0, 3).map((row, index) => (
                  <div key={row.team.id} className="flex items-center gap-2">
                    <span className="number w-3 text-[9px] font-semibold text-muted">
                      {index + 1}
                    </span>
                    <Crest team={row.team} size={20} />
                    <span className="min-w-0 flex-1 truncate text-[9px] font-bold">{row.team.name}</span>
                    <span className="number text-[9px] font-semibold">{row.points} очк.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="card overflow-hidden xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <SectionHead
                title={`Лучшие по показателю «${statLabels[stat]}»`}
                description="Статистика регулярного чемпионата"
              />
              <div className="flex rounded-lg bg-[#F0EDE3] p-0.5">
                {(
                  [
                    { id: "points", label: "Очки" },
                    { id: "blocks", label: "Блоки" },
                    { id: "aces", label: "Эйсы" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStat(item.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[9px] font-extrabold transition-colors",
                      stat === item.id ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-line/70">
              {rankings.map((player, index) => (
                <button
                  key={player.id}
                  onClick={() => onOpenPlayer(player)}
                  className="grid w-full grid-cols-[22px_1.5fr_1fr_60px] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[#F5F3EA]"
                >
                  <span
                    className={cn(
                      "number text-[11px] font-semibold",
                      index < 3 ? "text-pine-800" : "text-muted",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    <PlayerAvatar player={player} size={30} />
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-extrabold">{player.name}</div>
                      <div className="flex items-center gap-1 text-[8px] font-medium text-muted">
                        <Crest team={TEAM_MAP[player.teamId]} size={13} />
                        {TEAM_MAP[player.teamId]?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PositionBadge code={player.posCode} className="px-1.5 py-0.5 text-[7px]" />
                    <span className="hidden text-[8px] font-medium text-muted sm:block">
                      {player.stats.matches} матчей
                    </span>
                  </div>
                  <span className="number text-right text-[15px] font-medium text-pine-800">
                    {player.stats[stat]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4 xl:col-span-4">
            <div className="card p-4 sm:p-5">
              <SectionHead title="Ваши лидеры" description="Игроки клуба в топе лиги" />
              <div className="mt-3 space-y-2">
                {game.players
                  .filter((player) => player.teamId === game.clubId)
                  .sort((a, b) => b.stats[stat] - a.stats[stat])
                  .slice(0, 4)
                  .map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => onOpenPlayer(player)}
                      className="flex w-full items-center gap-2.5 rounded-lg border border-line p-2 text-left transition-colors hover:border-[#cfc9b7]"
                    >
                      <span className="number w-3 text-[9px] font-semibold text-muted">
                        {index + 1}
                      </span>
                      <PlayerAvatar player={player} size={28} />
                      <span className="min-w-0 flex-1 truncate text-[10px] font-bold">
                        {player.name}
                      </span>
                      <span className="number text-[11px] font-semibold text-pine-800">
                        {player.stats[stat]}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[22px] bg-lime p-4 text-pine-950">
              <div className="pointer-events-none absolute -right-6 -bottom-8 h-24 w-24 rounded-full border border-pine-950/15" />
              <div className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-pine-950/55">
                Цель клуба
              </div>
              <div className="mt-1.5 font-display text-[18px] font-medium leading-tight tracking-[-0.03em]">
                Золото Суперлиги
              </div>
              <p className="mt-1.5 text-[9px] font-semibold leading-relaxed text-pine-950/60">
                {team.objective}. Совет директоров оценивает старт сезона на {game.boardConfidence}%.
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <ProgressBar
                  value={game.boardConfidence}
                  height="h-1.5"
                  color="bg-pine-900"
                  className="bg-pine-950/15"
                />
                <span className="number text-[10px] font-semibold">{game.boardConfidence}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------- Cup ------------------------------------ */

export function CupScreen({
  game,
  onStartCupMatch,
  onSimulateCupRound,
}: Base & {
  onStartCupMatch: (roundIndex: number, matchIndex: number) => void;
  onSimulateCupRound: (roundIndex: number) => void;
}) {
  const cup = game.cup;
  const current = cupCurrentRound(cup);
  const currentIndex = cup.rounds.findIndex((round) => round.id === current?.id);
  const userStillInCup = cup.rounds.some(
    (round) =>
      !round.done &&
      round.matches.some(
        (match) => match.homeId === game.clubId || match.awayId === game.clubId,
      ),
  );
  const userPlayed = cup.rounds.some((round) =>
    round.matches.some(
      (match) =>
        match.played && (match.homeId === game.clubId || match.awayId === game.clubId),
    ),
  );
  const champion = cup.champion ? TEAM_MAP[cup.champion] : undefined;
  const stageInfo: Record<string, { label: string; prize: string; date: string }> = {
    qf: { label: "1/4 финала", prize: "12 млн ₽", date: "18 ноября" },
    sf: { label: "1/2 финала", prize: "15 млн ₽", date: "23 декабря" },
    final: { label: "Финал", prize: "Кубок России", date: "28 января" },
  };

  const renderMatch = (match: CupMatch, roundIndex: number, matchIndex: number) => {
    const home = TEAM_MAP[match.homeId];
    const away = TEAM_MAP[match.awayId];
    const isUser = match.homeId === game.clubId || match.awayId === game.clubId;
    const isCurrentRound = currentIndex === roundIndex;
    const userCanPlay = isUser && !match.played && isCurrentRound;
    return (
      <div
        key={match.id}
        className={cn(
          "relative overflow-hidden rounded-xl border p-2.5 transition-all",
          isUser ? "border-pine-700/40 bg-[#F4F6E9]" : "border-line bg-paper",
          isCurrentRound && !match.played && "shadow-sm",
        )}
      >
        {isUser && <span className="absolute top-0 bottom-0 left-0 w-[2.5px] bg-lime" />}
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[7px] font-extrabold uppercase tracking-wider text-muted">
            {match.played ? "Матч завершён" : "Матч тура"}
          </span>
          {isUser && <span className="chip bg-lime px-1.5 py-0 text-[6.5px] text-pine-950">Вы</span>}
        </div>
        <div className="space-y-1.5">
          {[
            { team: home, score: match.homeSets, winner: match.winnerId === match.homeId },
            { team: away, score: match.awaySets, winner: match.winnerId === match.awayId },
          ].map(({ team: side, score, winner }) =>
            side ? (
              <div key={side.id} className="flex items-center gap-2">
                <Crest team={side} size={20} />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[9.5px] font-bold",
                    match.played && !winner && "text-muted",
                  )}
                >
                  {side.name}
                </span>
                <span
                  className={cn(
                    "number min-w-4 text-right text-[11px] font-semibold",
                    winner ? "text-pine-800" : "text-muted/60",
                  )}
                >
                  {match.played ? score : "—"}
                </span>
              </div>
            ) : (
              <div key="tbd" className="flex h-5 items-center gap-2 text-[9px] font-medium text-muted/60">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#EFEDE3] text-[8px]">
                  ?
                </span>
                Ожидает соперника
              </div>
            ),
          )}
        </div>
        {userCanPlay && (
          <button
            onClick={() => onStartCupMatch(roundIndex, matchIndex)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-pine-900 py-1.5 text-[8.5px] font-extrabold text-lime transition-colors hover:bg-pine-800"
          >
            <Play className="h-2.5 w-2.5 fill-current" />
            Играть матч
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Кубок России · сезон 2026/27"
        title="Кубок России"
        description="Плей-офф на выбывание. Один неудачный матч — и сезон в Кубке завершён. Победитель получает трофей и призовые."
        actions={
          current && (
            <button onClick={() => onSimulateCupRound(currentIndex)} className="btn-ghost text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-pine-700" />
              Симулировать пары
            </button>
          )
        }
      />

      <div className="relative mb-4 overflow-hidden rounded-[24px] bg-pine-950 p-5 text-white sm:p-6">
        <div className="court-lines pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute top-1/2 right-10 h-40 w-40 -translate-y-1/2 rounded-full border border-lime/20" />
        <div className="pointer-events-none absolute top-1/2 right-20 hidden h-28 w-28 -translate-y-1/2 place-items-center rounded-full bg-lime/10 text-lime sm:grid">
          <Trophy className="h-12 w-12" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="chip bg-lime/15 text-lime">
                <Trophy className="h-3 w-3" />
                {champion ? `Победитель: ${champion.name}` : current ? current.name : "Турнир завершён"}
              </span>
              {!userStillInCup && userPlayed && (
                <span className="chip bg-white/10 text-white/65">Вы выбыли из Кубка</span>
              )}
            </div>
            <h2 className="font-display text-[22px] font-medium leading-tight tracking-[-0.04em] sm:text-[28px]">
              {champion ? "Кубок отправляется в музей" : "Восемь клубов. Один трофей."}
            </h2>
            <p className="mt-1.5 max-w-lg text-[10px] font-medium leading-relaxed text-white/50 sm:text-[11px]">
              {champion
                ? `${champion.name} становится обладателем Кубка России сезона 2026/27.`
                : "1/4 финала — 18 ноября. Матчи на выбывание, победитель определяется по количеству выигранных сетов."}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">Стадия</div>
              <div className="mt-1 text-[11px] font-extrabold">
                {champion ? "Завершён" : current?.name || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">Призовые</div>
              <div className="mt-1 text-[11px] font-extrabold text-lime">
                {current ? stageInfo[current.id]?.prize : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cup.rounds.map((round, roundIndex) => {
          const isActive = currentIndex === roundIndex;
          const info = stageInfo[round.id];
          return (
            <div
              key={round.id}
              className={cn(
                "card overflow-hidden",
                isActive && "border-pine-700/30 ring-1 ring-lime/40",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between border-b border-line px-4 py-3",
                  isActive ? "bg-[#F2F5E7]" : "bg-[#F7F4EB]",
                )}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold">{round.name}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-pine-700 pulse-dot" />
                    )}
                  </div>
                  <div className="mt-0.5 text-[8px] font-medium text-muted">{info?.date}</div>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-paper text-pine-800">
                  {round.done ? <Shield className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
                </span>
              </div>
              <div className="space-y-2 p-3">
                {round.matches.length ? (
                  round.matches.map((match, matchIndex) => renderMatch(match, roundIndex, matchIndex))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-8 text-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F0EDE3] text-muted">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <div className="mt-2 text-[10px] font-extrabold">Ожидает победителей</div>
                    <div className="mt-0.5 max-w-[150px] text-[8px] font-medium leading-relaxed text-muted">
                      Пары стадии определятся после завершения предыдущего раунда
                    </div>
                  </div>
                )}
              </div>
              {round.matches.length > 0 && !round.done && (
                <button
                  onClick={() => onSimulateCupRound(roundIndex)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-line bg-[#F7F4EB] py-2 text-[8.5px] font-extrabold text-pine-800 transition-colors hover:bg-[#F0EDE3]"
                >
                  <Sparkles className="h-3 w-3" />
                  Симулировать остальные пары
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="card flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F0EDE3] text-pine-800">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10.5px] font-extrabold">Ваше участие</div>
            <p className="mt-1 text-[9px] font-medium leading-relaxed text-muted">
              {champion && !userStillInCup
                ? "Кубок России завершён. В следующем сезоне команда снова поборется за трофей."
                : userPlayed
                  ? userStillInCup
                    ? "Команда продолжает борьбу за трофей. Настройте состав перед кубковым матчем."
                    : "К сожалению, команда завершила выступление в Кубке России."
                  : "Кубковый путь начинается с 1/4 финала. Управляйте командой в решающих матчах."}
            </p>
          </div>
        </div>
        <div className="card flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime text-pine-950">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10.5px] font-extrabold">Призовой фонд</div>
            <p className="mt-1 text-[9px] font-medium leading-relaxed text-muted">
              Победитель получает 20 млн ₽ и место в истории клуба. Призовые зачисляются в трансферный бюджет.
            </p>
          </div>
        </div>
        <div className="card flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F0EDE3] text-pine-800">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10.5px] font-extrabold">Финал четырёх</div>
            <p className="mt-1 text-[9px] font-medium leading-relaxed text-muted">
              Решающие матчи Кубка России пройдут в Новосибирске с 25 по 31 января 2027 года.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
