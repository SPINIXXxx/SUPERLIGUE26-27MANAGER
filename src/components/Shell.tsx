import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Home,
  LayoutGrid,
  ListOrdered,
  Menu,
  Settings2,
  Trophy,
  Users,
  Wallet,
  X,
  Play,
  Sparkles,
} from "lucide-react";
import type { Fixture, GameState, Notification, ScreenId, Team } from "@/lib/types";
import { TEAM_MAP } from "@/lib/data";
import { formatDate, formatMoney, initials, nextFixtureFor } from "@/lib/game";
import { cn } from "@/utils/cn";
import { Crest, VolleyballMark } from "./ui";

const NAV_GROUPS: {
  label: string;
  items: { id: ScreenId; label: string; icon: typeof Home; badge?: "offers" }[];
}[] = [
  {
    label: "Команда",
    items: [
      { id: "dashboard", label: "Обзор", icon: LayoutGrid },
      { id: "squad", label: "Состав", icon: Users },
      { id: "tactics", label: "Тактика", icon: ClipboardList },
      { id: "training", label: "Тренировки", icon: Dumbbell },
    ],
  },
  {
    label: "Сезон",
    items: [
      { id: "calendar", label: "Календарь", icon: CalendarDays },
      { id: "league", label: "Таблица", icon: ListOrdered },
      { id: "cup", label: "Кубок России", icon: Trophy },
    ],
  },
  {
    label: "Клуб",
    items: [
      { id: "transfers", label: "Трансферы", icon: ArrowLeftRight, badge: "offers" },
      { id: "club", label: "Клуб", icon: Building2 },
      { id: "finances", label: "Финансы", icon: Wallet },
    ],
  },
];

const PAGE_TITLES: Record<ScreenId, string> = {
  dashboard: "Обзор клуба",
  squad: "Состав команды",
  tactics: "Тактика",
  training: "Тренировки",
  calendar: "Календарь",
  league: "Суперлига",
  cup: "Кубок России",
  transfers: "Трансферы",
  club: "Клуб",
  finances: "Финансы",
};

type ShellProps = {
  screen: ScreenId;
  setScreen: (screen: ScreenId) => void;
  game: GameState;
  team: Team;
  children: ReactNode;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onNewGame: () => void;
  onStartNextMatch: (fixture: Fixture) => void;
};

export function Shell({
  screen,
  setScreen,
  game,
  team,
  children,
  notifications,
  onMarkAllRead,
  onNewGame,
  onStartNextMatch,
}: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const nextFixture = nextFixtureFor(game.fixtures, game.clubId);
  const opponentId = nextFixture
    ? nextFixture.homeId === game.clubId
      ? nextFixture.awayId
      : nextFixture.homeId
    : undefined;
  const opponent = opponentId ? TEAM_MAP[opponentId] : undefined;
  const unread = notifications.filter((n) => !n.read).length;

  const go = (target: ScreenId) => {
    setScreen(target);
    setMobileOpen(false);
    setNotifOpen(false);
  };

  const nav = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[76px] shrink-0 items-center justify-between px-5">
        <button onClick={() => go("dashboard")} className="flex items-center gap-2.5 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-pine-950">
            <VolleyballMark className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-[14px] font-semibold leading-none tracking-[-0.04em] text-white">
              ВОЛЕЙ
            </span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
              менеджер
            </span>
          </span>
        </button>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-5 mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-lime pulse-dot" />
          <span className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-white/70">
            Суперлига
          </span>
        </div>
        <span className="font-display text-[10px] font-medium text-lime">{game.season}</span>
      </div>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4 scroll-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 px-3 text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-white/30">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = screen === item.id;
                const Icon = item.icon;
                const offers = item.badge === "offers" ? game.offers.length : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-[11px] px-3 py-[9px] text-left text-[12px] font-semibold transition-all",
                      active
                        ? "bg-lime text-pine-950 shadow-[0_4px_16px_-8px_rgba(217,243,107,0.6)]"
                        : "text-white/65 hover:bg-white/[0.07] hover:text-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[16px] w-[16px] shrink-0",
                        active ? "text-pine-900" : "text-white/40 group-hover:text-lime/90",
                      )}
                      strokeWidth={active ? 2.4 : 1.9}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {offers > 0 && (
                      <span
                        className={cn(
                          "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-extrabold",
                          active ? "bg-pine-900 text-lime" : "bg-clay text-white",
                        )}
                      >
                        {offers}
                      </span>
                    )}
                    {active && !offers && (
                      <ChevronRight className="h-3 w-3 text-pine-900/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-3 pb-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
          <div className="absolute -right-5 -bottom-7 h-20 w-20 rounded-full border border-white/10" />
          <div className="mb-2 flex items-center gap-1.5 text-white/45">
            <Sparkles className="h-3 w-3" />
            <span className="text-[8.5px] font-extrabold uppercase tracking-[0.16em]">
              {nextFixture ? `Следующий матч · ${nextFixture.round} тур` : "Сезон завершён"}
            </span>
          </div>
          {opponent && nextFixture ? (
            <>
              <div className="mb-2.5 flex items-center gap-2.5">
                <Crest team={opponent} size={31} />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-extrabold leading-tight text-white">
                    {nextFixture.homeId === game.clubId ? "Дома" : "В гостях"}
                  </div>
                  <div className="text-[10px] font-medium text-white/45">
                    {opponent.name} · {formatDate(nextFixture.date)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onStartNextMatch(nextFixture)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-lime py-2 text-[10px] font-extrabold text-pine-950 transition-colors hover:bg-[#e6f98c]"
              >
                <Play className="h-3 w-3 fill-pine-950" />
                Выйти на площадку
              </button>
            </>
          ) : (
            <div className="text-[11px] leading-relaxed text-white/55">
              Все матчи регулярного чемпионата позади. Проверьте таблицу и итоги сезона.
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 px-3 py-3">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div>
            <div className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-white/35">
              Трансферный бюджет
            </div>
            <div className="number mt-1 text-[15px] font-medium text-lime">
              {formatMoney(game.budget, true)}
            </div>
          </div>
          <button
            onClick={() => go("finances")}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-lime/30 hover:text-lime"
            aria-label="Финансы"
          >
            <Wallet className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setManagerOpen((open) => !open)}
            className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-white/[0.06]"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E7E1D1] text-[10px] font-extrabold text-pine-900">
              {initials(game.manager)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-extrabold leading-tight text-white">
                {game.manager}
              </span>
              <span className="mt-0.5 block truncate text-[9px] font-medium text-white/40">
                Главный тренер · {team.name}
              </span>
            </span>
            <Settings2 className="h-3.5 w-3.5 text-white/35" />
          </button>
          {managerOpen && (
            <div className="pop-in absolute right-0 bottom-[calc(100%+6px)] left-0 z-20 overflow-hidden rounded-xl border border-white/10 bg-pine-900 p-1 shadow-2xl">
              <button
                onClick={() => {
                  setManagerOpen(false);
                  onNewGame();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-white/75 hover:bg-white/10 hover:text-white"
              >
                <Building2 className="h-3.5 w-3.5" />
                Новый сезон / клуб
              </button>
              <button
                onClick={() => {
                  setManagerOpen(false);
                  go("club");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold text-white/75 hover:bg-white/10 hover:text-white"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Управление клубом
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] bg-pine-950 lg:block">
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-pine-950/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="slide-up absolute inset-y-0 left-0 w-[280px] bg-pine-950">{nav}</aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-40 border-b border-line/85 bg-cream/90 backdrop-blur-xl">
          <div className="flex h-[62px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-paper text-ink lg:hidden"
                aria-label="Открыть меню"
              >
                <Menu className="h-4 w-4" />
              </button>
              <Crest team={team} size={32} ring className="hidden sm:grid" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[12px] font-extrabold leading-tight">
                    {team.full}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-muted/50 sm:block" />
                  <span className="hidden text-[10px] font-semibold text-muted sm:block">
                    {PAGE_TITLES[screen]}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
                  <span className="h-1 w-1 rounded-full bg-pine-700" />
                  Суперлига · сезон {game.season}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5 md:flex">
                <span className="label text-[8px]">Тур</span>
                <span className="number text-[12px] font-semibold">
                  {nextFixture?.round || 30}
                </span>
                <span className="text-[9px] font-medium text-muted">из 30</span>
              </div>
              <button
                onClick={() => go("finances")}
                className="hidden items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-left transition-colors hover:border-pine-700/40 sm:flex"
              >
                <Wallet className="h-3.5 w-3.5 text-pine-700" />
                <div>
                  <div className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-muted">
                    Бюджет
                  </div>
                  <div className="number text-[11px] font-semibold leading-tight">
                    {formatMoney(game.budget, true)}
                  </div>
                </div>
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((open) => !open);
                    if (!notifOpen) onMarkAllRead();
                  }}
                  className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-paper text-ink transition-colors hover:border-pine-700/40"
                  aria-label="Уведомления"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[8px] font-extrabold text-white">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setNotifOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="pop-in absolute right-0 z-20 mt-2 w-[320px] overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl sm:w-[360px]">
                      <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <div>
                          <div className="text-[12px] font-extrabold">Уведомления</div>
                          <div className="text-[9px] font-medium text-muted">
                            {notifications.length} события клуба
                          </div>
                        </div>
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-lime text-pine-950">
                          <Bell className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="max-h-[340px] overflow-y-auto scroll-thin">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-start gap-2.5 border-b border-line/70 px-4 py-3 last:border-0"
                          >
                            <span
                              className={cn(
                                "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                                n.kind === "transfer"
                                  ? "bg-clay"
                                  : n.kind === "board"
                                    ? "bg-pine-700"
                                    : "bg-[#C7A53D]",
                              )}
                            />
                            <div>
                              <div className="text-[11px] font-extrabold leading-snug">{n.title}</div>
                              <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-muted">
                                {n.body}
                              </p>
                              <div className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-muted/70">
                                {n.time}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => go("club")}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-line bg-[#F5F2E9] py-2.5 text-[10px] font-extrabold text-pine-800 hover:bg-[#EEEAE0]"
                      >
                        Перейти в центр клуба
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={onNewGame}
                title="Начать новый сезон"
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-white/50"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-pine-900 text-[10px] font-extrabold text-lime">
                  {initials(game.manager)}
                </span>
                <ChevronDown className="hidden h-3 w-3 text-muted sm:block" />
              </button>
            </div>
          </div>
        </header>

        <main className="page-enter mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>

        <footer className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-line/70 px-4 py-5 text-[9px] font-medium text-muted/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            ВОЛЕЙ МЕНЕДЖЕР · {game.season} · Данные клубов и составов обновлены перед стартом сезона
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-lime" />
            Составы: 16 клубов, 200+ игроков · сохранение включено
          </span>
        </footer>
      </div>
    </div>
  );
}
