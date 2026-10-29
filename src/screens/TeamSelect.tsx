import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Crown,
  MapPin,
  Shuffle,
  Star,
  Target,
  Trophy,
  Users,
  Volleyball,
} from "lucide-react";
import type { GameState, Team } from "@/lib/types";
import { TEAMS, TEAM_MAP } from "@/lib/data";
import { formatMoney, getTeamPower, lineupFromStarters } from "@/lib/game";
import { cn } from "@/utils/cn";
import { Crest, PlayerAvatar, ProgressBar, Rating, VolleyballMark } from "@/components/ui";
import heroImage from "@/assets/hero-volley.jpg";

type Props = {
  game: GameState;
  initialClubId?: string;
  initialManager?: string;
  onStart: (clubId: string, manager: string) => void;
};

type Tier = "all" | "elite" | "playoff" | "underdog";

const TIERS: { id: Tier; label: string; hint: string }[] = [
  { id: "all", label: "Все клубы", hint: "16" },
  { id: "elite", label: "Топ-5", hint: "5" },
  { id: "playoff", label: "За плей-офф", hint: "7" },
  { id: "underdog", label: "Аутсайдеры", hint: "4" },
];

export function TeamSelect({ game, initialClubId, initialManager, onStart }: Props) {
  const [clubId, setClubId] = useState(initialClubId || "dynamo");
  const [manager, setManager] = useState(initialManager || "Михаил Белов");
  const [tier, setTier] = useState<Tier>("all");
  const selected = TEAM_MAP[clubId] || TEAMS[0];

  const clubs = useMemo(() => {
    return [...TEAMS]
      .sort((a, b) => b.prestige - a.prestige)
      .filter((club) => {
        if (tier === "elite") return club.prestige >= 88;
        if (tier === "playoff") return club.prestige >= 77 && club.prestige < 88;
        if (tier === "underdog") return club.prestige < 77;
        return true;
      });
  }, [tier]);

  const squad = game.players
    .filter((player) => player.teamId === selected.id)
    .sort((a, b) => b.overall - a.overall);
  const lineup = lineupFromStarters(game.players, selected.id);
  const stars = squad.slice(0, 3);
  const startersCount = Object.values(lineup).filter(Boolean).length;
  const power = getTeamPower(
    game.players,
    selected.id,
    selected.id === game.clubId ? game.tactics : undefined,
  );
  const totalValue = squad.reduce((acc, player) => acc + player.value, 0);
  const avgAge = Math.round(
    (squad.reduce((acc, player) => acc + player.age, 0) / Math.max(1, squad.length)) * 10,
  ) / 10;
  const rank = [...TEAMS].sort((a, b) => b.prestige - a.prestige).findIndex((club) => club.id === selected.id) + 1;

  const randomClub = () => {
    const candidates = TEAMS.filter((club) => club.id !== selected.id);
    setClubId(candidates[Math.floor(Math.random() * candidates.length)].id);
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-[1380px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine-950 text-lime">
              <VolleyballMark className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-[13px] font-semibold leading-none tracking-[-0.04em] text-ink">
                ВОЛЕЙ
              </div>
              <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-muted">
                менеджер · суперлига 26/27
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-muted sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-lime pulse-dot" />
              16 клубов · 30 туров
            </span>
            <a
              href="https://www.championat.com/volleyball/_msuperliga.html"
              target="_blank"
              rel="noreferrer"
              className="hidden text-[9px] font-bold text-muted transition-colors hover:text-pine-800 md:block"
            >
              Данные сезона ↗
            </a>
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden bg-pine-950 text-white">
        <img
          src={heroImage}
          alt="Волейбольный матч Суперлиги"
          className="absolute inset-0 h-full w-full object-cover object-[65%_center] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pine-950 via-pine-950/92 to-pine-950/35" />
        <div className="court-lines pointer-events-none absolute inset-0 opacity-20" />
        <div className="hero-grain relative mx-auto max-w-[1380px] px-4 py-8 sm:px-6 sm:py-11">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="chip border border-white/10 bg-white/[0.07] text-[9px] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime pulsing" />
              Сезон 2026/27 · карьера тренера
            </span>
            <span className="chip border border-white/10 bg-white/[0.07] text-[9px] text-white/55">
              <CalendarDays className="h-2.5 w-2.5" />
              Старт 16 октября 2026
            </span>
          </div>
          <h1 className="max-w-2xl font-display text-[30px] font-medium leading-[1.08] tracking-[-0.045em] sm:text-[46px]">
            Собери команду.
            <br />
            <span className="text-lime">Возьми золото.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[11px] font-medium leading-relaxed text-white/55 sm:text-[13px]">
            Выбери один из 16 клубов РОЛЬФ Суперлиги, настрой состав и тактику,
            работай на трансферном рынке и проведи команду через 30 туров к титулу.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { icon: Users, label: "Реальные составы 2026/27" },
              { icon: Volleyball, label: "Матч-центр с розыгрышами" },
              { icon: Trophy, label: "Суперлига и Кубок России" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-1.5 text-[9px] font-semibold text-white/60 backdrop-blur"
                >
                  <Icon className="h-3 w-3 text-lime" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="label mb-1.5 text-pine-700">Шаг 1 · выберите клуб</div>
            <h2 className="font-display text-[21px] font-medium tracking-[-0.035em] text-ink sm:text-[26px]">
              Кем вы будете руководить?
            </h2>
            <p className="mt-1 text-[10.5px] font-medium text-muted">
              У каждого клуба свой бюджет, амбиции и стартовая сила. Заявки обновлены по таблице переходов сезона-2026/27.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={randomClub} className="btn-ghost text-[10px]">
              <Shuffle className="h-3.5 w-3.5" />
              Случайный клуб
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {TIERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTier(item.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9.5px] font-extrabold transition-colors",
                tier === item.id
                  ? "bg-pine-900 text-lime"
                  : "border border-line bg-paper text-muted hover:text-ink",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[7.5px]",
                  tier === item.id ? "bg-lime text-pine-950" : "bg-[#EFEDE3] text-muted",
                )}
              >
                {item.hint}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {clubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  players={game.players}
                  active={club.id === selected.id}
                  onSelect={() => setClubId(club.id)}
                />
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-line border-dashed px-3 py-2.5 text-[8.5px] font-medium leading-relaxed text-muted">
              <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine-700" />
              Составы и переходы сезона-2026/27: Волков — в «Динамо», Вольвич — в «Зените» СПб,
              Де Чекко — в «Локомотиве», Куркаев — в Казани. Карьеру можно начать только один раз
              за сезон — выбирайте клуб внимательно.
            </p>
          </div>

          <div className="xl:col-span-4">
            <div className="overflow-hidden rounded-[24px] border border-line bg-paper shadow-[0_20px_50px_-36px_rgba(20,46,34,0.45)]">
              <div className="relative overflow-hidden bg-pine-950 p-4 text-white sm:p-5">
                <div
                  className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full opacity-30 blur-2xl"
                  style={{ background: selected.colors[0] }}
                />
                <div className="court-lines pointer-events-none absolute inset-0 opacity-15" />
                <div className="relative mb-3 flex items-start justify-between">
                  <Crest team={selected} size={54} ring />
                  <div className="text-right">
                    <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">
                      Рейтинг клуба
                    </div>
                    <div className="number text-[20px] font-medium leading-none text-lime">
                      {selected.prestige}
                    </div>
                    <div className="mt-0.5 text-[7.5px] font-medium text-white/35">
                      {rank}-е место в лиге по силе
                    </div>
                  </div>
                </div>
                <h3 className="relative font-display text-[20px] font-medium leading-tight tracking-[-0.035em]">
                  {selected.full}
                </h3>
                <div className="relative mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[8.5px] font-semibold text-white/45">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selected.city}
                  </span>
                  <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {selected.arena}
                  </span>
                  <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
                  <span>Осн. {selected.founded}</span>
                </div>
                <div className="relative mt-3 rounded-xl border border-lime/20 bg-lime/[0.08] px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[7.5px] font-extrabold uppercase tracking-wider text-lime/70">
                    <Target className="h-2.5 w-2.5" />
                    Задача совета директоров
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-lime">{selected.objective}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
                {[
                  { label: "Бюджет", value: formatMoney(selected.budget, true) },
                  { label: "Сила", value: power.toFixed(1) },
                  { label: "Заявка", value: `${squad.length}` },
                ].map((item) => (
                  <div key={item.label} className="px-2.5 py-2.5">
                    <div className="text-[7px] font-extrabold uppercase tracking-wider text-muted">
                      {item.label}
                    </div>
                    <div className="number mt-1 text-[13px] font-medium">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="label">Звёзды клуба</span>
                  <span className="text-[8px] font-semibold text-muted">{startersCount}/7 основа</span>
                </div>
                <div className="space-y-1.5">
                  {stars.map((player) => (
                    <div key={player.id} className="flex items-center gap-2">
                      <PlayerAvatar player={player} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[9.5px] font-extrabold">{player.name}</div>
                        <div className="flex items-center gap-1 text-[7.5px] font-medium text-muted">
                          <span>{player.flag}</span>
                          {player.age} лет · {player.pos}
                        </div>
                      </div>
                      <Rating value={player.overall} size="sm" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg bg-[#F5F2E8] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[8px] font-bold">
                    <span className="text-muted">Сила состава</span>
                    <span className="text-pine-800">{Math.round((power / 99) * 100)}%</span>
                  </div>
                  <ProgressBar value={power} max={99} height="h-1.5" color="bg-pine-700" />
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] font-semibold text-muted">
                    <span className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      Ср. возраст {avgAge}
                    </span>
                    <span className="flex items-center gap-1">
                      <CircleDollarSign className="h-2.5 w-2.5" />
                      {formatMoney(totalValue, true)}
                    </span>
                  </div>
                </div>

                <label className="label mt-4 mb-1.5 block">Шаг 2 · имя тренера</label>
                <input
                  value={manager}
                  onChange={(event) => setManager(event.target.value)}
                  maxLength={30}
                  placeholder="Ваше имя"
                  className="input text-[11px]"
                />
                <button
                  onClick={() => onStart(selected.id, manager.trim() || "Михаил Белов")}
                  className="btn-primary mt-3 w-full justify-center text-[11px]"
                >
                  Начать карьеру в {selected.name}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[7.5px] font-medium text-muted">
                  <Check className="h-2.5 w-2.5 text-pine-700" />
                  Автосохранение · 30 туров · Кубок России
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-3 z-30 mt-4 xl:hidden">
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-paper/95 p-2.5 shadow-[0_18px_40px_-22px_rgba(20,46,34,0.6)] backdrop-blur">
            <Crest team={selected} size={34} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-extrabold">{selected.name}</div>
              <div className="text-[8px] font-medium text-muted">
                {formatMoney(selected.budget, true)} · сила {power.toFixed(1)}
              </div>
            </div>
            <button
              onClick={() => onStart(selected.id, manager.trim() || "Михаил Белов")}
              className="btn-primary shrink-0 justify-center px-3 py-2 text-[10px]"
            >
              Начать карьеру
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </main>

      <footer className="mx-auto flex max-w-[1380px] flex-col gap-2 border-t border-line px-4 py-5 text-[8px] font-medium text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>ВОЛЕЙ МЕНЕДЖЕР · сезон 2026/27 · неофициальный игровой проект</span>
        <a
          href="https://www.championat.com/volleyball/_msuperliga.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-bold text-pine-800 hover:text-pine-600"
        >
          Данные и расписание: Чемпионат.com
          <ChevronRight className="h-3 w-3" />
        </a>
      </footer>
    </div>
  );
}

function ClubCard({
  club,
  players,
  active,
  onSelect,
}: {
  club: Team;
  players: GameState["players"];
  active: boolean;
  onSelect: () => void;
}) {
  const roster = players.filter((player) => player.teamId === club.id);
  const avg = roster.length
    ? Math.round(roster.reduce((acc, player) => acc + player.overall, 0) / roster.length)
    : club.prestige - 10;
  const star = [...roster].sort((a, b) => b.overall - a.overall)[0];
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200",
        active
          ? "border-pine-900 bg-pine-900 text-white shadow-[0_14px_32px_-22px_rgba(16,55,39,0.8)]"
          : "border-line bg-paper hover:-translate-y-0.5 hover:border-[#c9c3b0] hover:shadow-md",
      )}
    >
      {club.prestige >= 88 && (
        <Crown
          className={cn(
            "absolute top-2 right-2 h-3 w-3",
            active ? "text-lime" : "text-[#C2A44A]",
          )}
        />
      )}
      {active && <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-lime" />}
      <div className="mb-2 flex items-center gap-2">
        <Crest team={club} size={30} />
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-extrabold leading-tight">{club.name}</div>
          <div
            className={cn(
              "truncate text-[7.5px] font-medium",
              active ? "text-white/40" : "text-muted",
            )}
          >
            {club.city}
          </div>
        </div>
      </div>
      <div className="mb-1.5 flex items-center justify-between text-[8px] font-bold">
        <span className={active ? "text-white/45" : "text-muted"}>Сила {avg}</span>
        <span className={active ? "text-lime" : "text-pine-800"}>
          {formatMoney(club.budget, true)}
        </span>
      </div>
      <ProgressBar
        value={avg}
        max={99}
        height="h-1"
        color={active ? "bg-lime" : "bg-pine-700"}
        className={active ? "bg-white/15" : ""}
      />
      <div
        className={cn(
          "mt-2 flex items-center gap-1 truncate text-[7px] font-semibold",
          active ? "text-white/40" : "text-muted",
        )}
      >
        <Star className="h-2.5 w-2.5 shrink-0" />
        <span className="truncate">{star?.name || "Состав обновляется"}</span>
      </div>
    </button>
  );
}
