import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Check,
  CircleDollarSign,
  Filter,
  Handshake,
  Info,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";
import type { GameState, IncomingOffer, Player, Pos, Team } from "@/lib/types";
import { TEAM_MAP } from "@/lib/data";
import { formatMoney, getTable, payroll } from "@/lib/game";
import { TEAMS } from "@/lib/data";
import { cn } from "@/utils/cn";
import {
  Crest,
  EmptyState,
  Modal,
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
  onOpenPlayer: (player: Player) => void;
  onSubmitOffer: (player: Player, amount: number) => void;
  onToggleList: (player: Player) => void;
  onAcceptOffer: (offer: IncomingOffer) => void;
  onRejectOffer: (offer: IncomingOffer) => void;
};

const FILTERS: { id: Pos | "all"; label: string }[] = [
  { id: "all", label: "Все позиции" },
  { id: "Связующий", label: "Связующие" },
  { id: "Диагональный", label: "Диагональные" },
  { id: "Доигровщик", label: "Доигровщики" },
  { id: "Блокирующий", label: "Блокирующие" },
  { id: "Либеро", label: "Либеро" },
];

export function Transfers({
  game,
  team,
  onOpenPlayer,
  onSubmitOffer,
  onToggleList,
  onAcceptOffer,
  onRejectOffer,
}: Props) {
  const [tab, setTab] = useState<"market" | "squad" | "offers">("market");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Pos | "all">("all");
  const [offerPlayer, setOfferPlayer] = useState<Player | null>(null);
  const [offerAmount, setOfferAmount] = useState(0);
  const squad = game.players.filter((player) => player.teamId === game.clubId);
  const ownValues = squad.reduce((acc, player) => acc + player.value, 0);
  const incomingCount = game.offers.length;

  const market = useMemo(
    () =>
      game.players
        .filter(
          (player) =>
            player.teamId !== game.clubId &&
            player.teamId !== "free" &&
            player.listed,
        )
        .sort((a, b) => b.overall - a.overall),
    [game.players, game.clubId],
  );
  const freeAgents = game.players.filter((player) => player.teamId === "free");

  const filtered = market.filter(
    (player) =>
      (filter === "all" || player.pos === filter) &&
      (!query || player.name.toLowerCase().includes(query.toLowerCase())),
  );

  const featured = market[0];

  const openOffer = (player: Player) => {
    setOfferPlayer(player);
    setOfferAmount(player.askingPrice);
  };

  const table = getTable(TEAMS, game.fixtures);
  const own = table.find((row) => row.team.id === game.clubId);

  return (
    <div>
      <PageHeader
        eyebrow="Селекция · трансферное окно открыто"
        title="Трансферы"
        description="Укрепляйте состав, продавайте игроков и реагируйте на предложения клубов. Бюджет — общий на трансферы и развитие инфраструктуры."
        actions={
          <>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pine-700 pulse-dot" />
              <span className="text-[9px] font-bold text-muted">
                Окно до 15 февраля 2027
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-xl bg-pine-900 px-3 py-2 text-white sm:flex">
              <CircleDollarSign className="h-3.5 w-3.5 text-lime" />
              <div>
                <div className="text-[7px] font-bold uppercase tracking-wider text-white/35">
                  Доступно
                </div>
                <div className="number text-[10px] font-semibold leading-tight text-lime">
                  {formatMoney(game.budget, true)}
                </div>
              </div>
            </div>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Трансферный бюджет"
          value={formatMoney(game.budget, true)}
          icon={<Banknote className="h-3.5 w-3.5" />}
          note="Доступно для сделок"
        />
        <StatCard
          label="Стоимость состава"
          value={formatMoney(ownValues, true)}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          note={`${squad.length} игроков в заявке`}
        />
        <StatCard
          label="Фонд зарплат"
          value={formatMoney(payroll(game.players, game.clubId), true)}
          icon={<Handshake className="h-3.5 w-3.5" />}
          note={`${((payroll(game.players, game.clubId) / Math.max(1, game.budget)) * 100).toFixed(0)}% бюджета`}
        />
        <StatCard
          label="Входящие предложения"
          value={incomingCount}
          suffix="шт."
          icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
          note={incomingCount ? "Требуют решения тренера" : "Новых предложений нет"}
        />
      </div>

      <div className="mb-4 flex overflow-x-auto rounded-xl border border-line bg-paper p-1 scroll-thin">
        {(
          [
            { id: "market", label: "Трансферный рынок", count: market.length },
            { id: "squad", label: "Моя команда", count: squad.length },
            { id: "offers", label: "Предложения", count: incomingCount },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[10px] font-extrabold transition-colors",
              tab === item.id ? "bg-pine-900 text-lime" : "text-muted hover:text-ink",
            )}
          >
            {item.label}
            <span
              className={cn(
                "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[8px]",
                tab === item.id ? "bg-lime text-pine-950" : "bg-[#EFEDE3] text-muted",
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "market" && (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            {featured && (
              <div className="relative overflow-hidden rounded-[22px] bg-pine-950 p-4 text-white sm:p-5">
                <div className="court-lines pointer-events-none absolute inset-0 opacity-15" />
                <div className="pointer-events-none absolute -top-16 -right-14 h-48 w-48 rounded-full border border-lime/20" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-start gap-3.5">
                    <PlayerAvatar player={featured} size={54} className="border-2 border-lime/40" />
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="chip bg-lime/15 text-[8px] text-lime">
                          <Sparkles className="h-2.5 w-2.5" />
                          Игрок недели на рынке
                        </span>
                        <PositionBadge
                          code={featured.posCode}
                          className="bg-white/10 text-white/70"
                        />
                      </div>
                      <button
                        onClick={() => onOpenPlayer(featured)}
                        className="truncate font-display text-[18px] font-medium tracking-[-0.03em] hover:text-lime"
                      >
                        {featured.name}
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-white/45">
                        <span className="flex items-center gap-1.5">
                          <Crest team={TEAM_MAP[featured.teamId]} size={16} />
                          {TEAM_MAP[featured.teamId]?.name}
                        </span>
                        <span>{featured.age} лет · {featured.height} см</span>
                        <span className="text-lime">Рейтинг {featured.overall}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="text-left sm:text-right">
                      <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">
                        Запрашивают
                      </div>
                      <div className="number mt-0.5 text-[20px] font-medium text-lime">
                        {formatMoney(featured.askingPrice, true)}
                      </div>
                      <div className="mt-0.5 text-[8px] font-medium text-white/35">
                        {featured.contract} года контракта
                      </div>
                    </div>
                    <button
                      onClick={() => openOffer(featured)}
                      disabled={featured.askingPrice > game.budget}
                      className={cn(
                        "shrink-0 text-[10px]",
                        featured.askingPrice > game.budget ? "btn-soft opacity-40" : "btn-lime",
                      )}
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      Предложение
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card overflow-hidden">
              <div className="border-b border-line p-4 sm:p-5">
                <SectionHead
                  title="Доступные игроки"
                  description={`${filtered.length} игроков из клубов Суперлиги`}
                  action={<span className="chip bg-[#F2EFE4] text-[9px] text-muted">{formatMoney(game.budget, true)}</span>}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <div className="hide-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
                    {FILTERS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setFilter(item.id)}
                        className={cn(
                          "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold transition-colors",
                          filter === item.id
                            ? "bg-pine-900 text-white"
                            : "bg-[#F0EDE3] text-muted hover:text-ink",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-[170px]">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Имя игрока"
                      className="input py-2 pl-8 text-[11px]"
                    />
                  </div>
                </div>
              </div>
              <div className="hidden grid-cols-[1.7fr_0.7fr_0.6fr_0.8fr_0.8fr] gap-2 border-b border-line bg-[#F5F2E8] px-4 py-2 text-[8px] font-extrabold uppercase tracking-wider text-muted sm:grid">
                <span>Игрок</span>
                <span className="text-center">Клуб</span>
                <span className="text-center">Рейтинг</span>
                <span className="text-right">Стоимость</span>
                <span className="text-right">Действие</span>
              </div>
              <div className="divide-y divide-line/70">
                {filtered.map((player) => {
                  const club = TEAM_MAP[player.teamId];
                  return (
                    <div
                      key={player.id}
                      className="grid grid-cols-[1.7fr_0.7fr_0.6fr_0.8fr_0.8fr] items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[#F6F3EA] max-sm:grid-cols-[1fr_auto_auto]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <PlayerAvatar player={player} size={33} />
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenPlayer(player)}
                            className="flex items-center gap-1 truncate text-[10.5px] font-extrabold hover:text-pine-700"
                          >
                            {player.name}
                            <span className="text-[9px]">{player.flag}</span>
                          </button>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <PositionBadge code={player.posCode} className="px-1.5 py-0.5 text-[7px]" />
                            <span className="text-[8px] font-semibold text-muted">
                              {player.age} лет · {player.stats.points} очков
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 max-sm:hidden">
                        <Crest team={club} size={19} />
                        <span className="hidden truncate text-[8.5px] font-bold text-muted lg:block">
                          {club?.short}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <Rating value={player.overall} size="sm" />
                      </div>
                      <div className="text-right max-sm:col-span-1">
                        <div className="number text-[10px] font-semibold">
                          {formatMoney(player.askingPrice, true)}
                        </div>
                        <div className="text-[7.5px] font-medium text-muted">
                          база {formatMoney(player.value, true)}
                        </div>
                      </div>
                      <div className="flex justify-end max-sm:col-span-1">
                        <button
                          onClick={() => openOffer(player)}
                          className="rounded-lg border border-line p-1.5 text-pine-800 transition-colors hover:border-pine-700 hover:bg-lime"
                          aria-label={`Предложение по ${player.name}`}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!filtered.length && (
                  <EmptyState
                    icon={<Filter className="h-5 w-5" />}
                    title="Нет подходящих игроков"
                    description="Измените фильтр или поисковый запрос."
                  />
                )}
              </div>
              <div className="flex items-center justify-between border-t border-line bg-[#F7F4EB] px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-[8.5px] font-semibold text-muted">
                  <ShieldCheck className="h-3 w-3" />
                  Все сделки проверяются юридическим отделом клуба
                </span>
                <span className="text-[8.5px] font-bold text-pine-800">
                  Рынок обновлён сегодня
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div className="relative overflow-hidden rounded-[22px] bg-pine-900 p-4 text-white sm:p-5">
              <div className="pointer-events-none absolute -right-8 -bottom-8 h-28 w-28 rounded-full border border-white/10" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-[0.17em] text-lime/75">
                    Ваш бюджет
                  </div>
                  <div className="number mt-1.5 text-[24px] font-medium leading-none">
                    {formatMoney(game.budget, true)}
                  </div>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime text-pine-950">
                  <CircleDollarSign className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[8px] font-semibold text-white/40">
                <span>Позиция в лиге</span>
                <span className="text-white/80">{own?.place}-е место · {own?.points} очк.</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-lime"
                  style={{ width: `${Math.min(100, (game.budget / (TEAM_MAP[game.clubId]?.budget || 400)) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1 text-[8px] font-medium text-white/35">
                <Info className="h-3 w-3" />
                Бюджет сезона: {formatMoney(TEAM_MAP[game.clubId]?.budget || 0, true)}
              </div>
            </div>

            <div className="card p-4 sm:p-5">
              <SectionHead
                title="Рекомендации скаутов"
                description="На основе нужд команды"
                action={<Sparkles className="h-4 w-4 text-[#A7BB5A]" />}
              />
              <div className="mt-3 space-y-2">
                {market.slice(0, 3).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 rounded-lg border border-line p-2"
                  >
                    <PlayerAvatar player={player} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[9.5px] font-extrabold">{player.name}</div>
                      <div className="text-[7.5px] font-medium text-muted">
                        {player.pos} · {TEAM_MAP[player.teamId]?.name}
                      </div>
                    </div>
                    <Rating value={player.overall} size="sm" />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[8.5px] font-medium leading-relaxed text-muted">
                Штаб отмечает: команде полезен ещё один блокирующий с высоким приёмом и
                потенциалом выше 88.
              </p>
            </div>

            <div className="card p-4 sm:p-5">
              <SectionHead
                title="Свободные агенты"
                description="Без компенсации за переход"
                action={<UserPlus className="h-4 w-4 text-pine-700" />}
              />
              <div className="mt-3 space-y-2">
                {freeAgents.map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <PlayerAvatar player={player} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[9px] font-bold">{player.name}</div>
                      <div className="text-[7.5px] font-medium text-muted">
                        {player.posCode} · {player.overall}
                      </div>
                    </div>
                    <button
                      onClick={() => openOffer(player)}
                      className="rounded-md border border-line px-2 py-1 text-[8px] font-extrabold text-pine-800 hover:border-pine-700 hover:bg-lime"
                    >
                      Подписать
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "squad" && (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="card overflow-hidden xl:col-span-9">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
              <SectionHead
                title="Игроки клуба"
                description="Выставьте игрока на трансфер или снимите с продажи"
              />
              <span className="chip bg-mist text-[9px] text-pine-800">
                {squad.filter((player) => player.listed).length} на трансфере
              </span>
            </div>
            <div className="hidden grid-cols-[1.5fr_0.8fr_0.7fr_0.6fr_0.9fr_0.7fr] gap-2 border-b border-line bg-[#F5F2E8] px-4 py-2 text-[8px] font-extrabold uppercase tracking-wider text-muted sm:grid">
              <span>Игрок</span>
              <span className="text-center">Позиция</span>
              <span className="text-center">Рейтинг</span>
              <span className="text-center">Возраст</span>
              <span className="text-right">Контракт</span>
              <span className="text-right">Статус</span>
            </div>
            <div className="divide-y divide-line/70">
              {[...squad]
                .sort((a, b) => b.overall - a.overall)
                .map((player) => (
                  <div
                    key={player.id}
                    className="grid grid-cols-[1.5fr_0.8fr_0.7fr_0.6fr_0.9fr_0.7fr] items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[#F5F3EA] max-sm:grid-cols-[1fr_auto]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <PlayerAvatar player={player} size={32} />
                      <div className="min-w-0">
                        <button
                          onClick={() => onOpenPlayer(player)}
                          className="truncate text-[10.5px] font-extrabold hover:text-pine-700"
                        >
                          {player.name}
                        </button>
                        <div className="mt-0.5 text-[8px] font-semibold text-muted">
                          {player.flag} · {formatMoney(player.salary, true)} в год
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center max-sm:hidden">
                      <PositionBadge code={player.posCode} className="px-1.5 py-0.5 text-[7px]" />
                    </div>
                    <div className="flex justify-center max-sm:hidden">
                      <Rating value={player.overall} size="sm" />
                    </div>
                    <div className="text-center max-sm:hidden">
                      <span className="number text-[10px] font-medium">{player.age}</span>
                    </div>
                    <div className="text-right max-sm:hidden">
                      <div className="text-[9.5px] font-bold">до {2026 + player.contract}</div>
                      <div className="text-[7.5px] font-medium text-muted">
                        выкуп {formatMoney(player.askingPrice, true)}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      {player.listed && (
                        <span className="chip hidden bg-[#F5E7E0] text-[7px] text-[#9A5D45] sm:inline-flex">
                          На рынке
                        </span>
                      )}
                      <button
                        onClick={() => onToggleList(player)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[8px] font-extrabold transition-colors",
                          player.listed
                            ? "border-clay/30 bg-[#FBEEE9] text-[#9A5D45] hover:bg-[#f6e2d8]"
                            : "border-line text-pine-800 hover:border-pine-700 hover:bg-lime",
                        )}
                      >
                        {player.listed ? "Снять" : "Выставить"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="space-y-4 xl:col-span-3">
            <div className="card p-4 sm:p-5">
              <SectionHead title="Баланс сделок" description="Текущее окно" />
              <div className="mt-3 space-y-2">
                {game.transfers.length ? (
                  game.transfers.slice(0, 5).map((transfer) => (
                    <div key={transfer.id} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-md text-[9px] font-extrabold",
                          transfer.direction === "in"
                            ? "bg-[#EAF2E1] text-[#4F7041]"
                            : "bg-[#F5E7E0] text-[#9A5D45]",
                        )}
                      >
                        {transfer.direction === "in" ? "+" : "−"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[9px] font-bold">{transfer.playerName}</div>
                        <div className="text-[7.5px] font-medium text-muted">
                          {transfer.direction === "in" ? "Пришёл" : "Ушёл"} ·{" "}
                          {formatMoney(transfer.amount, true)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-mist p-3 text-[9px] font-medium leading-relaxed text-muted">
                    В этом окне сделок пока не было. Усильте проблемную позицию или продайте
                    игрока, не проходящего в состав.
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[22px] border border-dashed border-line p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold text-pine-800">
                <Info className="h-3.5 w-3.5" />
                Как проходит сделка
              </div>
              <p className="text-[9px] font-medium leading-relaxed text-muted">
                Предложение должно покрывать запрос клуба. При успешной сделке игрок сразу
                присоединяется к команде, а стоимость вычитается из бюджета. Выставляйте своих
                игроков — предложения появятся в разделе «Предложения».
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "offers" && (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="card overflow-hidden xl:col-span-8">
            <div className="border-b border-line p-4 sm:p-5">
              <SectionHead
                title="Входящие предложения"
                description="Клубы заинтересованы в игроках вашей команды"
                action={<span className="chip bg-mist text-[9px] text-pine-800">{incomingCount} активных</span>}
              />
            </div>
            {game.offers.length ? (
              <div className="divide-y divide-line/70">
                {game.offers.map((offer) => {
                  const player = game.players.find((item) => item.id === offer.playerId);
                  const from = TEAM_MAP[offer.fromTeamId];
                  if (!player) return null;
                  return (
                    <div
                      key={offer.id}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-[#F7F4EA] sm:flex-row sm:items-center"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <PlayerAvatar player={player} size={40} />
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenPlayer(player)}
                            className="truncate text-[11.5px] font-extrabold hover:text-pine-700"
                          >
                            {player.name}
                          </button>
                          <div className="mt-1 flex items-center gap-1.5 text-[8.5px] font-semibold text-muted">
                            <Crest team={from} size={15} />
                            {from?.name}
                            <span className="h-0.5 w-0.5 rounded-full bg-muted" />
                            Предложение
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="text-right">
                          <div className="number text-[15px] font-semibold text-pine-800">
                            {formatMoney(offer.amount, true)}
                          </div>
                          <div className="text-[7.5px] font-medium text-muted">
                            оценка {formatMoney(player.value, true)}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onAcceptOffer(offer)}
                            className="flex items-center gap-1 rounded-lg bg-pine-900 px-2.5 py-1.5 text-[8.5px] font-extrabold text-lime hover:bg-pine-800"
                          >
                            <Check className="h-3 w-3" />
                            Принять
                          </button>
                          <button
                            onClick={() => onRejectOffer(offer)}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-clay/30 hover:text-clay"
                            aria-label="Отклонить"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Handshake className="h-5 w-5" />}
                title="Предложений пока нет"
                description="Выставите игроков на трансфер или подождите — клубы вернутся с предложениями после матчей."
                action={
                  <button onClick={() => setTab("squad")} className="btn-ghost btn-xs text-[9px]">
                    Моя команда
                  </button>
                }
              />
            )}
          </div>
          <div className="space-y-4 xl:col-span-4">
            <div className="relative overflow-hidden rounded-[22px] bg-pine-950 p-4 text-white sm:p-5">
              <div className="pointer-events-none absolute -right-6 -bottom-8 h-24 w-24 rounded-full border border-white/10" />
              <BadgeCheck className="mb-2 h-5 w-5 text-lime" />
              <div className="text-[12px] font-extrabold">Совет директоров</div>
              <p className="mt-1.5 text-[9px] font-medium leading-relaxed text-white/50">
                Продажа ключевых игроков может повлиять на доверие совета. Оценивайте баланс
                состава перед каждой сделкой.
              </p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[8px] font-semibold text-white/40">
                  <span>Доверие</span>
                  <span className="text-lime">{game.boardConfidence}%</span>
                </div>
                <ProgressBar value={game.boardConfidence} height="h-1.5" color="bg-lime" />
              </div>
            </div>
            <div className="card p-4">
              <SectionHead title="Ценные активы" description="Игроки с высокой оценкой" />
              <div className="mt-3 space-y-2">
                {[...squad]
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 4)
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => onOpenPlayer(player)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <PlayerAvatar player={player} size={26} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[9px] font-bold">{player.name}</div>
                        <div className="text-[7.5px] font-medium text-muted">{player.posCode}</div>
                      </div>
                      <span className="number text-[9px] font-semibold">
                        {formatMoney(player.value, true)}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!offerPlayer}
        onClose={() => setOfferPlayer(null)}
        title={offerPlayer ? `Предложение: ${offerPlayer.name}` : "Предложение"}
        subtitle={
          offerPlayer
            ? `${TEAM_MAP[offerPlayer.teamId]?.name || "Свободный агент"} · ${offerPlayer.pos}`
            : undefined
        }
      >
        {offerPlayer && (
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-mist p-3">
              <PlayerAvatar player={offerPlayer} size={42} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-extrabold">{offerPlayer.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[9px] font-semibold text-muted">
                  {offerPlayer.age} лет · рейтинг {offerPlayer.overall} · потенциал{" "}
                  {offerPlayer.potential}
                </div>
              </div>
              <Rating value={offerPlayer.overall} size="lg" />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label">Запрос клуба</span>
              <span className="number text-[12px] font-semibold">
                {formatMoney(offerPlayer.askingPrice)}
              </span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="label">Ваш бюджет</span>
              <span className="number text-[12px] font-semibold text-pine-800">
                {formatMoney(game.budget)}
              </span>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="label mb-2">Сумма предложения</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOfferAmount((amount) => Math.max(1, Math.round(amount - 2.5)))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
                  aria-label="Уменьшить"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={offerAmount}
                    min={1}
                    step={0.5}
                    onChange={(event) => setOfferAmount(Number(event.target.value) || 0)}
                    className="input number text-center text-[16px] font-semibold"
                  />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[9px] font-bold text-muted">
                    млн ₽
                  </span>
                </div>
                <button
                  onClick={() => setOfferAmount((amount) => Math.round(amount + 2.5))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
                  aria-label="Увеличить"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex gap-1">
                  {[0.9, 1, 1.1].map((multiplier) => (
                    <button
                      key={multiplier}
                      onClick={() =>
                        setOfferAmount(Math.round(offerPlayer.askingPrice * multiplier * 10) / 10)
                      }
                      className="rounded-md bg-[#F0EDE3] px-2 py-1 text-[8px] font-extrabold text-muted hover:text-ink"
                    >
                      {Math.round(multiplier * 100)}%
                    </button>
                  ))}
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[8.5px] font-bold",
                    offerAmount >= offerPlayer.askingPrice ? "text-pine-700" : "text-clay",
                  )}
                >
                  {offerAmount >= offerPlayer.askingPrice ? (
                    <>
                      <Check className="h-3 w-3" /> Клуб готов принять
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" /> Недостаточно — возможен отказ
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#F5F2E8] p-2.5 text-[8.5px] font-medium leading-relaxed text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Если предложение будет принято, игрок сразу присоединится к {team.name}. Остаток
              бюджета:{" "}
              <span className="font-bold text-ink">
                {formatMoney(Math.max(0, game.budget - offerAmount), true)}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setOfferPlayer(null)} className="btn-ghost flex-1 justify-center text-[10px]">
                Отмена
              </button>
              <button
                onClick={() => {
                  onSubmitOffer(offerPlayer, offerAmount);
                  setOfferPlayer(null);
                }}
                disabled={offerAmount > game.budget || offerAmount <= 0}
                className="btn-primary flex-1 justify-center text-[10px] disabled:opacity-40"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Отправить предложение
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
