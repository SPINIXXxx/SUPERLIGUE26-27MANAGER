import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  CircleDollarSign,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import type { GameState, Player, Pos, ScreenId, Team } from "@/lib/types";
import { formatMoney, getLineupPlayers, overallSquadRating, payroll } from "@/lib/game";
import { cn } from "@/utils/cn";
import {
  PageHeader,
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
  onOpenPlayer: (player: Player) => void;
  onAutoLineup: () => void;
  onSetStarter?: (player: Player) => void;
};

const FILTERS: { id: Pos | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "Связующий", label: "Связующие" },
  { id: "Диагональный", label: "Диагональные" },
  { id: "Доигровщик", label: "Доигровщики" },
  { id: "Блокирующий", label: "Блокирующие" },
  { id: "Либеро", label: "Либеро" },
];

export function Squad({ game, team, setScreen, onOpenPlayer, onAutoLineup }: Props) {
  const [filter, setFilter] = useState<Pos | "all">("all");
  const [query, setQuery] = useState("");
  const [startersOnly, setStartersOnly] = useState(false);
  const [sort, setSort] = useState<"overall" | "points" | "age" | "name">("overall");
  const squad = game.players.filter((player) => player.teamId === game.clubId);
  const lineup = getLineupPlayers(game.players, game.tactics, game.clubId);
  const rating = overallSquadRating(game.players, game.clubId);
  const totalSalary = payroll(game.players, game.clubId);
  const averageAge =
    Math.round((squad.reduce((acc, player) => acc + player.age, 0) / Math.max(1, squad.length)) * 10) / 10;
  const foreign = squad.filter((player) => player.country !== "Россия");
  const expiring = squad.filter((player) => player.contract <= 1);

  const filtered = useMemo(() => {
    const list = squad.filter((player) => {
      if (filter !== "all" && player.pos !== filter) return false;
      if (startersOnly && !player.starter) return false;
      if (query && !player.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "age") return a.age - b.age;
      if (sort === "points") return b.stats.points - a.stats.points;
      return b.overall - a.overall;
    });
  }, [squad, filter, query, sort, startersOnly]);

  const ageGroups = [
    {
      label: "до 23",
      value: squad.filter((p) => p.age < 23).length,
      color: "bg-[#B8C988]",
    },
    {
      label: "23–28",
      value: squad.filter((p) => p.age >= 23 && p.age <= 28).length,
      color: "bg-pine-700",
    },
    {
      label: "29+",
      value: squad.filter((p) => p.age >= 29).length,
      color: "bg-[#C7B78E]",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Команда · Суперлига 26/27"
        title="Состав команды"
        description="Управляйте ротацией, следите за формой игроков и принимайте кадровые решения. Нажмите на игрока, чтобы открыть подробный профиль."
        actions={
          <>
            <button onClick={onAutoLineup} className="btn-ghost text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-pine-700" />
              Автосостав
            </button>
            <button onClick={() => setScreen("tactics")} className="btn-primary text-[11px]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Тактика
            </button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Игроков в заявке"
          value={squad.length}
          suffix="чел."
          icon={<Users className="h-3.5 w-3.5" />}
          note={`${squad.filter((p) => p.starter).length} в стартовой обойме`}
        />
        <StatCard
          label="Средний рейтинг"
          value={rating.toFixed(1)}
          suffix="/ 99"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          note={`Средний возраст — ${averageAge} лет`}
        />
        <StatCard
          label="Фонд зарплат"
          value={formatMoney(totalSalary, true)}
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          note={`${((totalSalary / game.budget) * 100).toFixed(1)}% от трансферного бюджета`}
        />
        <StatCard
          label="Легионеры"
          value={foreign.length}
          suffix="игрока"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          note={foreign.length ? foreign.map((p) => p.flag).join(" ") : "Только россияне"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="card overflow-hidden xl:col-span-8">
          <div className="border-b border-line p-4 sm:p-5">
            <SectionHead
              title="Заявка на сезон"
              description={`${filtered.length} игроков · сортировка по ${sort === "overall" ? "рейтингу" : sort === "points" ? "очкам" : sort === "age" ? "возрасту" : "имени"}`}
              action={
                <button
                  onClick={() => setStartersOnly((value) => !value)}
                  className={cn(
                    "chip border transition-colors",
                    startersOnly
                      ? "border-pine-800 bg-pine-900 text-lime"
                      : "border-line bg-paper text-muted hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      startersOnly ? "bg-lime" : "bg-muted/40",
                    )}
                  />
                  Только основа
                </button>
              }
            />
            <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="hide-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[9.5px] font-extrabold transition-colors",
                      filter === item.id
                        ? "bg-pine-900 text-white"
                        : "bg-[#F0EDE3] text-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-[180px]">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Найти игрока"
                  className="input py-2 pl-8 text-[11px]"
                />
              </div>
              <div className="relative hidden shrink-0 sm:block">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  className="appearance-none rounded-lg border border-line bg-paper py-2 pr-7 pl-2.5 text-[10px] font-bold text-muted outline-none hover:text-ink"
                  aria-label="Сортировка"
                >
                  <option value="overall">По рейтингу</option>
                  <option value="points">По очкам</option>
                  <option value="age">По возрасту</option>
                  <option value="name">По имени</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-muted" />
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-[1.7fr_0.65fr_0.65fr_0.8fr_0.8fr_0.7fr] gap-2 border-b border-line/80 bg-[#F5F2E8] px-4 py-2 text-[8px] font-extrabold uppercase tracking-[0.12em] text-muted/80 sm:grid">
            <span>Игрок</span>
            <span className="text-center">Рейтинг</span>
            <span className="text-center">Форма</span>
            <span className="text-center">Готовность</span>
            <span className="text-center">Сезон</span>
            <span className="text-right">Контракт</span>
          </div>

          <div className="divide-y divide-line/70">
            {filtered.length ? (
              filtered.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onOpenPlayer(player)}
                  className="group grid w-full grid-cols-[1.7fr_0.65fr_0.65fr_0.8fr_0.8fr_0.7fr] items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#F5F3EA] max-sm:grid-cols-[1fr_auto]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="number hidden w-4 shrink-0 text-[10px] font-semibold text-muted/60 sm:block">
                      {player.number}
                    </span>
                    <div className="relative shrink-0">
                      <PlayerAvatar player={player} size={36} />
                      {player.starter && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-paper bg-pine-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[11.5px] font-extrabold transition-colors group-hover:text-pine-700">
                          {player.name}
                        </span>
                        <span className="text-[10px]">{player.flag}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <PositionBadge code={player.posCode} className="px-1.5 py-0.5 text-[7.5px]" />
                        <span className="text-[8.5px] font-semibold text-muted">
                          {player.age} лет · {player.height} см
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden justify-center sm:flex">
                    <Rating value={player.overall} size="md" />
                  </div>
                  <div className="hidden flex-col items-center gap-1 sm:flex">
                    <span className="number text-[11px] font-semibold">{player.form}.0</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span
                          key={index}
                          className={cn(
                            "h-1 w-1 rounded-full",
                            index < Math.round(player.form / 2) ? "bg-pine-700" : "bg-sand",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="hidden flex-col items-center gap-1 sm:flex">
                    <span
                      className={cn(
                        "number text-[10px] font-semibold",
                        player.fitness < 75 ? "text-clay" : "text-ink",
                      )}
                    >
                      {player.fitness}%
                    </span>
                    <ProgressBar
                      value={player.fitness}
                      height="h-1"
                      color={player.fitness >= 85 ? "bg-pine-700" : player.fitness >= 73 ? "bg-[#D5B24F]" : "bg-clay"}
                      className="w-12"
                    />
                  </div>
                  <div className="hidden text-center sm:block">
                    <div className="number text-[11px] font-semibold">{player.stats.points}</div>
                    <div className="text-[8px] font-semibold text-muted">очков</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-[10px] font-bold">
                      {2026 + player.contract}
                    </div>
                    <div className="text-[8px] font-semibold text-muted">
                      {formatMoney(player.salary, true)}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 sm:hidden">
                    <Rating value={player.overall} size="sm" />
                    <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <div className="text-[12px] font-extrabold">Игроки не найдены</div>
                <p className="mt-1 text-[10px] font-medium text-muted">
                  Попробуйте изменить фильтр или поисковый запрос.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-line bg-[#F7F4EB] px-4 py-2.5">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-muted">
              Суперлига · заявка {squad.length}/16
            </span>
            <button
              onClick={() => setScreen("transfers")}
              className="flex items-center gap-1 text-[9px] font-extrabold text-pine-800 hover:text-pine-600"
            >
              <UserPlus className="h-3 w-3" />
              Усилить состав
            </button>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Стартовая семёрка"
              description="Текущий план на игру"
              action={
                <button
                  onClick={() => setScreen("tactics")}
                  className="text-[9px] font-extrabold text-pine-800 hover:text-pine-600"
                >
                  Изменить
                </button>
              }
            />
            <div className="mt-3.5 space-y-1">
              {lineup.map(({ slot, label, player }) => (
                <button
                  key={slot}
                  onClick={() => player && onOpenPlayer(player)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-[#F3F0E6]"
                >
                  <span className="w-[70px] shrink-0 text-[8px] font-extrabold uppercase tracking-[0.07em] text-muted">
                    {label}
                  </span>
                  {player ? (
                    <>
                      <PlayerAvatar player={player} size={25} />
                      <span className="min-w-0 flex-1 truncate text-[10px] font-bold">
                        {player.name}
                      </span>
                      <Rating value={player.overall} size="sm" />
                    </>
                  ) : (
                    <span className="text-[9px] text-muted">Не выбран</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead title="Глубина состава" description="Средний рейтинг по линиям" />
            <div className="mt-3.5 space-y-3">
              {(["Связующий", "Диагональный", "Доигровщик", "Блокирующий", "Либеро"] as Pos[]).map(
                (pos) => {
                  const group = squad.filter((player) => player.pos === pos);
                  const avg = group.length
                    ? Math.round(group.reduce((acc, p) => acc + p.overall, 0) / group.length)
                    : 0;
                  return (
                    <div key={pos} className="flex items-center gap-2.5">
                      <span className="w-[76px] shrink-0 text-[9px] font-bold text-muted">
                        {pos === "Доигровщик" ? "Доигровщики" : `${pos}ы`}
                      </span>
                      <ProgressBar
                        value={avg}
                        max={100}
                        height="h-1.5"
                        color={avg >= 85 ? "bg-pine-700" : avg >= 80 ? "bg-[#A9B878]" : "bg-[#D4BE8A]"}
                      />
                      <span className="number w-6 shrink-0 text-right text-[10px] font-semibold">
                        {avg}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-mist p-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-lime text-pine-950">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="text-[9px] font-extrabold">Сбалансированная заявка</div>
                <div className="mt-0.5 text-[8px] font-medium text-muted">
                  Все позиции укомплектованы
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Кадровые вопросы"
              description={`${expiring.length} контракта истекают`}
              action={
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#F0EDE3] text-pine-800">
                  <Users className="h-3.5 w-3.5" />
                </div>
              }
            />
            <div className="mt-3 space-y-2">
              {expiring.length ? (
                expiring.slice(0, 4).map((player) => (
                  <button
                    key={player.id}
                    onClick={() => onOpenPlayer(player)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-white/50 px-2.5 py-2 text-left transition-colors hover:border-[#cfc9b7]"
                  >
                    <PlayerAvatar player={player} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-extrabold">{player.name}</div>
                      <div className="text-[8px] font-medium text-muted">
                        до 30 июня {2026 + player.contract}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-bold text-clay">Продлить</span>
                      <ArrowRight className="h-3 w-3 text-muted" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-[10px] font-medium text-muted">Все контракты в порядке.</div>
              )}
            </div>
            <div className="mt-3 rounded-lg bg-[#F5F2E8] px-2.5 py-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-muted">
                  Возрастная структура
                </span>
              </div>
              <div className="flex gap-1">
                {ageGroups.map((group) => (
                  <div key={group.label} className="flex-1">
                    <div className={cn("h-1.5 rounded-full", group.color)} />
                    <div className="mt-1 flex items-center justify-between text-[7.5px] font-semibold text-muted">
                      <span>{group.label}</span>
                      <span>{group.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line border-dashed px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pine-700" />
        <p className="text-[9.5px] font-medium leading-relaxed text-muted">
          Заявки обновлены по данным Суперлиги-2026/27 и таблице переходов. Текущий клуб:{" "}
          <span className="font-bold text-ink">{team.full}</span>. Рейтинг игрока — интегральная
          оценка навыков, формы и опыта; она учитывается в симуляции матчей.
          <a
            href="https://www.championat.com/volleyball/_msuperliga.html"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-pine-800 underline decoration-dotted underline-offset-2"
          >
            Источник данных
          </a>
        </p>
      </div>
    </div>
  );
}
