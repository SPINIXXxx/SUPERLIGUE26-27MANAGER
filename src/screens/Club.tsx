import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Handshake,
  Landmark,
  MapPin,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { GameState, Team } from "@/lib/types";
import { STAFF, TEAM_MAP } from "@/lib/data";
import { formatMoney, getTable, payroll } from "@/lib/game";
import { cn } from "@/utils/cn";
import {
  Crest,
  PageHeader,
  ProgressBar,
  SectionHead,
  StatCard,
} from "@/components/ui";

type ClubProps = {
  game: GameState;
  team: Team;
  onUpgrade: (facilityId: string) => void;
  onSignSponsor: (sponsorId: string) => void;
  onNewGame: () => void;
};

const HONOURS: Record<string, { titles: string; years: string; cups: string }> = {
  dynamo: { titles: "5", years: "2026 · 2008 · 2006 · 2005 · 2001", cups: "4" },
  kazan: { titles: "12", years: "2023 · 2022 · 2021 · 2018 · 2017", cups: "7" },
  loko: { titles: "1", years: "2020", cups: "2" },
  "zenit-spb": { titles: "2", years: "2019 · 2021", cups: "1" },
  belogorie: { titles: "8", years: "2013 · 2014 · 2010 · 2005 · 2003", cups: "9" },
  kuzbass: { titles: "2", years: "2019 · 2020", cups: "1" },
};

export function ClubScreen({ game, team, onUpgrade, onSignSponsor, onNewGame }: ClubProps) {
  const squad = game.players.filter((player) => player.teamId === game.clubId);
  const table = getTable(
    game.players.length ? Object.values(TEAM_MAP) : [],
    game.fixtures,
  );
  const own = table.find((row) => row.team.id === game.clubId);
  const honour = HONOURS[team.id] || {
    titles: "1",
    years: "2026",
    cups: "0",
  };
  const avgAge = Math.round(
    squad.reduce((acc, player) => acc + player.age, 0) / Math.max(1, squad.length),
  );
  const salary = payroll(game.players, game.clubId);

  return (
    <div>
      <PageHeader
        eyebrow="Клуб · структура и развитие"
        title="Управление клубом"
        description="Развивайте инфраструктуру, работайте со штабом и поддерживайте доверие совета директоров. Сильный клуб — сильная команда."
        actions={
          <>
            <button onClick={onNewGame} className="btn-ghost text-[11px]">
              <RefreshCcw className="h-3.5 w-3.5" />
              Новый сезон
            </button>
            <button onClick={() => onUpgrade("training")} className="btn-primary text-[11px]">
              <TrendingUp className="h-3.5 w-3.5" />
              Развивать базу
            </button>
          </>
        }
      />

      <div className="relative mb-4 overflow-hidden rounded-[26px] bg-pine-950 p-5 text-white sm:p-7">
        <div
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-25 blur-2xl"
          style={{ background: team.colors[0] }}
        />
        <div className="court-lines pointer-events-none absolute inset-0 opacity-15" />
        <div className="pointer-events-none absolute right-8 bottom-0 hidden h-full items-end opacity-[0.08] sm:flex">
          <Crest team={team} size={240} />
        </div>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Crest team={team} size={72} ring />
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="chip border border-white/10 bg-white/[0.08] text-[9px] text-white/65">
                  <MapPin className="h-2.5 w-2.5" />
                  {team.city}
                </span>
                <span className="chip border border-white/10 bg-white/[0.08] text-[9px] text-white/65">
                  Основан в {team.founded}
                </span>
                <span className="chip bg-lime/15 text-[9px] text-lime">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Суперлига
                </span>
              </div>
              <h2 className="font-display text-[22px] font-medium leading-tight tracking-[-0.04em] sm:text-[30px]">
                {team.full}
              </h2>
              <p className="mt-1.5 max-w-lg text-[10px] font-medium leading-relaxed text-white/45 sm:text-[11px]">
                {team.objective}. Главный тренер — {team.coach}. Клубная арена: {team.arena}.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5 text-center">
              <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">
                Место
              </div>
              <div className="number mt-1 text-[20px] font-medium text-lime">{own?.place || "—"}</div>
              <div className="text-[7.5px] font-medium text-white/35">из 16</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5 text-center">
              <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">
                Доверие
              </div>
              <div className="number mt-1 text-[20px] font-medium text-lime">
                {game.boardConfidence}%
              </div>
              <div className="text-[7.5px] font-medium text-white/35">совет</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5 text-center">
              <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">
                Состав
              </div>
              <div className="number mt-1 text-[20px] font-medium text-lime">{squad.length}</div>
              <div className="text-[7.5px] font-medium text-white/35">{avgAge} лет ср.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Трансферный бюджет"
          value={formatMoney(game.budget, true)}
          icon={<Wallet className="h-3.5 w-3.5" />}
          note="Свободные средства клуба"
        />
        <StatCard
          label="Фонд зарплат"
          value={formatMoney(salary, true)}
          icon={<Banknote className="h-3.5 w-3.5" />}
          note={`${squad.length} контрактов в заявке`}
        />
        <StatCard
          label="Домашняя арена"
          value={team.capacity.toLocaleString("ru-RU")}
          suffix="мест"
          icon={<Building2 className="h-3.5 w-3.5" />}
          note={team.arena}
        />
        <StatCard
          label="Титулы Суперлиги"
          value={honour.titles}
          suffix="золото"
          icon={<Trophy className="h-3.5 w-3.5" />}
          note={`Кубок России: ${honour.cups} раз`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Инфраструктура клуба"
              description="Инвестируйте в развитие и получайте бонусы к тренировкам и восстановлению"
              action={
                <span className="chip bg-mist text-[9px] text-pine-800">
                  <Landmark className="h-3 w-3" />
                  {game.facilities.reduce((acc, facility) => acc + facility.level, 0)} / 50
                </span>
              }
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {game.facilities.map((facility) => {
                const cost = Math.round(facility.baseCost + facility.level * 4.5);
                const maxed = facility.level >= facility.max;
                return (
                  <div
                    key={facility.id}
                    className="rounded-xl border border-line bg-white/50 p-3 transition-colors hover:border-[#d0c9b6]"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F0EDE3] text-pine-800">
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="text-[10px] font-extrabold">{facility.name}</div>
                          <div className="text-[7.5px] font-medium text-muted">
                            {facility.description}
                          </div>
                        </div>
                      </div>
                      <span className="number rounded-md bg-pine-900 px-1.5 py-0.5 text-[9px] font-semibold text-lime">
                        {facility.level}/{facility.max}
                      </span>
                    </div>
                    <div className="mb-2 flex gap-0.5">
                      {Array.from({ length: facility.max }).map((_, index) => (
                        <span
                          key={index}
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            index < facility.level ? "bg-pine-700" : "bg-[#E7E3D6]",
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-semibold text-muted">{facility.effect}</span>
                      <button
                        onClick={() => onUpgrade(facility.id)}
                        disabled={maxed || cost > game.budget}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[8px] font-extrabold transition-colors",
                          maxed
                            ? "border-line text-muted/50"
                            : cost > game.budget
                              ? "border-line text-muted/50"
                              : "border-pine-800/30 text-pine-800 hover:bg-lime",
                        )}
                      >
                        {maxed ? "Максимум" : `Улучшить · ${cost} млн`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Тренерский штаб"
              description="Специалисты, которые работают с командой ежедневно"
              action={<UserCog className="h-4 w-4 text-pine-700" />}
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {STAFF.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center gap-2.5 rounded-xl border border-line p-2.5"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-extrabold text-white"
                    style={{ background: member.color }}
                  >
                    {member.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-extrabold">{member.name}</div>
                    <div className="text-[8px] font-medium text-muted">{member.role}</div>
                  </div>
                  <div className="text-right">
                    <span className="number rounded-md bg-[#F0EDE3] px-1.5 py-0.5 text-[9px] font-semibold">
                      {member.rating}
                    </span>
                    <div className="mt-1 text-[7px] font-semibold text-pine-700">Контракт</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-4 sm:p-5">
              <SectionHead title="История клуба" description="Гордость и традиции" />
              <div className="mt-3 space-y-2.5">
                {[
                  { year: "Титулы", label: `Чемпион России · ${honour.titles}`, icon: Trophy },
                  { year: "Годы", label: honour.years, icon: Star },
                  { year: "Кубок", label: `Обладатель Кубка России · ${honour.cups}`, icon: Sparkles },
                  {
                    year: "Арена",
                    label: `${team.arena} · ${team.capacity.toLocaleString("ru-RU")} мест`,
                    icon: MapPin,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.year} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#F0EDE3] text-pine-800">
                        <Icon className="h-3 w-3" />
                      </span>
                      <div>
                        <div className="text-[8px] font-extrabold uppercase tracking-wider text-muted">
                          {item.year}
                        </div>
                        <div className="mt-0.5 text-[10px] font-semibold">{item.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-4 sm:p-5">
              <SectionHead
                title="Совет директоров"
                description="Оценка вашей работы"
                action={
                  <span className="chip bg-[#EAF2E1] text-[8px] text-[#4F7041]">
                    {game.boardConfidence >= 80 ? "Довольны" : "Наблюдают"}
                  </span>
                }
              />
              <div className="mt-4">
                <div className="mb-1.5 flex items-end justify-between">
                  <span className="text-[9px] font-semibold text-muted">Доверие тренеру</span>
                  <span className="number text-[16px] font-medium text-pine-800">
                    {game.boardConfidence}%
                  </span>
                </div>
                <ProgressBar value={game.boardConfidence} height="h-2" color="bg-pine-700" />
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: "Результаты команды", value: Math.min(100, (own?.points || 0) * 7 + 40), icon: TrendingUp },
                  { label: "Развитие инфраструктуры", value: 72, icon: Landmark },
                  { label: "Финансовая дисциплина", value: 84, icon: CircleDollarSign },
                  { label: "Работа с молодёжью", value: 68, icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-[8.5px] font-semibold">
                        <span className="flex items-center gap-1.5 text-muted">
                          <Icon className="h-3 w-3" />
                          {item.label}
                        </span>
                        <span>{item.value}%</span>
                      </div>
                      <ProgressBar
                        value={item.value}
                        height="h-1"
                        color={item.value >= 75 ? "bg-pine-700" : "bg-[#C7AE58]"}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg bg-[#F5F2E8] px-2.5 py-2 text-[8.5px] font-medium leading-relaxed text-muted">
                <span className="font-extrabold text-ink">Задача сезона:</span> {team.objective.toLowerCase()}.
                Укрепляйте позиции в топ-4, чтобы сохранить полное доверие.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="relative overflow-hidden rounded-[22px] bg-pine-900 p-4 text-white sm:p-5">
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full border border-white/10" />
            <div className="relative mb-3 flex items-center justify-between">
              <div>
                <div className="text-[8px] font-bold uppercase tracking-[0.17em] text-lime/75">
                  Партнёрство
                </div>
                <div className="mt-1 text-[13px] font-extrabold">Спонсоры клуба</div>
              </div>
              <Handshake className="h-5 w-5 text-lime" />
            </div>
            <div className="relative space-y-2">
              {game.sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-extrabold">{sponsor.name}</div>
                    <div className="text-[7.5px] font-medium text-white/40">{sponsor.sphere}</div>
                  </div>
                  <div className="text-right">
                    <div className="number text-[10px] font-semibold text-lime">
                      {formatMoney(sponsor.amount, true)}
                    </div>
                    <div className="text-[7px] font-medium text-white/35">
                      {sponsor.years} года
                    </div>
                  </div>
                  {sponsor.signed ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-lime text-pine-950">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <button
                      onClick={() => onSignSponsor(sponsor.id)}
                      className="rounded-md border border-white/20 px-1.5 py-1 text-[7.5px] font-extrabold text-white/65 hover:border-lime/60 hover:text-lime"
                    >
                      Подписать
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="relative mt-3 flex items-center justify-between rounded-lg bg-white/[0.06] px-2.5 py-2">
              <span className="text-[8px] font-semibold text-white/40">Доход от партнёров</span>
              <span className="number text-[10px] font-semibold text-lime">
                {formatMoney(
                  game.sponsors.filter((sponsor) => sponsor.signed).reduce((acc, s) => acc + s.amount, 0),
                  true,
                )}
              </span>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead title="Новый сезон" description="Сменить клуб или начать заново" />
            <p className="mt-2 text-[9px] font-medium leading-relaxed text-muted">
              Хотите попробовать другой клуб Суперлиги? Начните новую кампанию — прогресс текущего
              сезона будет сохранён до следующего запуска.
            </p>
            <button onClick={onNewGame} className="btn-ghost mt-3 w-full justify-center text-[10px]">
              <RefreshCcw className="h-3.5 w-3.5" />
              Выбрать новый клуб
            </button>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-mist px-2.5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pine-700" />
              <span className="text-[8px] font-semibold text-muted">
                Автосохранение включено · {game.season}
              </span>
            </div>
          </div>

          <div className="rounded-[22px] border border-line border-dashed p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold text-pine-800">
              <Settings2 className="h-3.5 w-3.5" />
              Клубная философия
            </div>
            <p className="text-[9px] font-medium leading-relaxed text-muted">
              «{team.name}» делает ставку на баланс опытных лидеров и молодых воспитанников.
              Развитие академии снижает стоимость селекции в долгосрочной перспективе.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinancesScreen({
  game,
  team,
  onSignSponsor,
}: {
  game: GameState;
  team: Team;
  onSignSponsor: (sponsorId: string) => void;
}) {
  const starterBudget = TEAM_MAP[game.clubId]?.budget || game.budget;
  const salary = payroll(game.players, game.clubId);
  const sponsorIncome = game.sponsors
    .filter((sponsor) => sponsor.signed)
    .reduce((acc, sponsor) => acc + sponsor.amount, 0);
  const homeMatches = game.fixtures.filter(
    (fixture) => fixture.played && fixture.homeId === game.clubId,
  ).length;
  const matchday = Math.round(homeMatches * 2.4 * 10) / 10;
  const transferSpend = game.transfers
    .filter((transfer) => transfer.direction === "in")
    .reduce((acc, transfer) => acc + transfer.amount, 0);
  const transferGain = game.transfers
    .filter((transfer) => transfer.direction === "out")
    .reduce((acc, transfer) => acc + transfer.amount, 0);
  const totalIncome = sponsorIncome + matchday + transferGain;
  const totalExpense = salary + transferSpend;
  const balance = Math.round((totalIncome - totalExpense) * 10) / 10;
  const months = ["Окт", "Ноя", "Дек", "Янв", "Фев", "Мар", "Апр", "Май"];
  const incomeSeries = [38, 44, 52, 47, 41, 46, 55, 62];
  const expenseSeries = [31, 35, 41, 38, 33, 37, 42, 44];
  const maxValue = Math.max(...incomeSeries, ...expenseSeries);

  return (
    <div>
      <PageHeader
        eyebrow="Клуб · финансовый департамент"
        title="Финансы клуба"
        description="Контролируйте бюджет, доходы от партнёров и матчей, а также расходы на зарплаты и селекцию. Финансовая устойчивость влияет на доверие совета."
        actions={
          <>
            <span className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-[9px] font-bold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-pine-700" />
              Сезон {game.season}
            </span>
            <button onClick={() => onSignSponsor("sp4")} className="btn-ghost text-[11px]">
              <Handshake className="h-3.5 w-3.5" />
              Партнёры
            </button>
          </>
        }
      />

      <div className="relative mb-4 overflow-hidden rounded-[24px] bg-pine-950 p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-lime/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.17em] text-lime/70">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Трансферный бюджет · доступно сейчас
            </div>
            <div className="number text-[34px] font-medium leading-none tracking-[-0.04em] text-lime sm:text-[42px]">
              {formatMoney(game.budget)}
            </div>
            <p className="mt-2 text-[9.5px] font-medium leading-relaxed text-white/45">
              {team.full} · бюджет сезона {formatMoney(starterBudget)} · потрачено{" "}
              {formatMoney(Math.max(0, starterBudget - game.budget))}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Доходы", value: formatMoney(totalIncome, true), highlight: true },
              { label: "Расходы", value: formatMoney(totalExpense, true) },
              {
                label: "Баланс",
                value: `${balance >= 0 ? "+" : ""}${formatMoney(balance, true)}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2"
              >
                <div className="text-[7px] font-bold uppercase tracking-wider text-white/35">
                  {item.label}
                </div>
                <div
                  className={cn(
                    "number mt-1 text-[12px] font-semibold",
                    item.highlight ? "text-lime" : "text-white",
                  )}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-4">
          <div className="mb-1 flex items-center justify-between text-[8px] font-semibold text-white/35">
            <span>Использование бюджета сезона</span>
            <span>{Math.min(100, Math.round(((starterBudget - game.budget) / starterBudget) * 100))}%</span>
          </div>
          <ProgressBar
            value={starterBudget - game.budget}
            max={starterBudget}
            height="h-1.5"
            color="bg-lime"
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Фонд зарплат"
          value={formatMoney(salary, true)}
          icon={<Banknote className="h-3.5 w-3.5" />}
          note={`${((salary / Math.max(1, starterBudget)) * 100).toFixed(0)}% бюджета сезона`}
        />
        <StatCard
          label="Доход от спонсоров"
          value={formatMoney(sponsorIncome, true)}
          icon={<Handshake className="h-3.5 w-3.5" />}
          note={`${game.sponsors.filter((sponsor) => sponsor.signed).length} активных контракта`}
        />
        <StatCard
          label="Доход от домашних матчей"
          value={formatMoney(matchday, true)}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          note={`${homeMatches} домашних игры в сезоне`}
        />
        <StatCard
          label="Трансферный баланс"
          value={`${transferGain - transferSpend >= 0 ? "+" : ""}${formatMoney(transferGain - transferSpend, true)}`}
          icon={transferGain - transferSpend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          note={`${game.transfers.length} сделок в окне`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Движение средств"
              description="Доходы и расходы по месяцам сезона, млн ₽"
              action={
                <div className="flex items-center gap-3 text-[8px] font-semibold text-muted">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-pine-800" /> Доходы
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D9C9A0]" /> Расходы
                  </span>
                </div>
              }
            />
            <div className="mt-5 flex h-[170px] items-end gap-2 border-b border-line pb-1 sm:gap-3">
              {months.map((month, index) => (
                <div key={month} className="group flex h-full flex-1 flex-col justify-end gap-1">
                  <div className="flex h-full items-end justify-center gap-0.5 sm:gap-1">
                    <div
                      className="w-2.5 rounded-t-sm bg-pine-800 transition-all group-hover:bg-pine-700 sm:w-3.5"
                      style={{ height: `${(incomeSeries[index] / maxValue) * 100}%` }}
                      title={`Доходы ${incomeSeries[index]} млн`}
                    />
                    <div
                      className="w-2.5 rounded-t-sm bg-[#D9C9A0] transition-all group-hover:bg-[#cdb986] sm:w-3.5"
                      style={{ height: `${(expenseSeries[index] / maxValue) * 100}%` }}
                      title={`Расходы ${expenseSeries[index]} млн`}
                    />
                  </div>
                  <span className="text-center text-[7.5px] font-bold text-muted">{month}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[8.5px] font-medium text-muted">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#A7BB5A]" />
                Прогноз до конца сезона: положительный
              </span>
              <span className="font-bold text-pine-800">
                {formatMoney(salary + transferSpend, true)} расходов
              </span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-4 sm:p-5">
              <SectionHead title="Структура расходов" description="Основные статьи бюджета" />
              <span className="chip bg-mist text-[9px] text-pine-800">
                <Wallet className="h-3 w-3" />
                {formatMoney(salary, true)}
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <div className="space-y-3.5">
                {[
                  { label: "Зарплаты игроков", value: salary, color: "bg-pine-800", share: 0.68 },
                  { label: "Тренерский штаб", value: Math.round(salary * 0.16), color: "bg-[#C5B37C]", share: 0.16 },
                  { label: "Организация матчей", value: Math.round(salary * 0.1), color: "bg-[#9BA77E]", share: 0.1 },
                  { label: "Академия и резерв", value: Math.round(salary * 0.06), color: "bg-[#D9C9A0]", share: 0.06 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-[9px] font-bold">
                      <span>{item.label}</span>
                      <span className="number font-semibold text-muted">{formatMoney(item.value, true)}</span>
                    </div>
                    <ProgressBar value={item.share * 100} height="h-1.5" color={item.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-4 sm:p-5">
              <SectionHead title="Последние операции" description="Движение средств клуба" />
              <CalendarDays className="h-4 w-4 text-pine-700" />
            </div>
            <div className="divide-y divide-line/70">
              {game.transfers.length ? (
                game.transfers.slice(0, 6).map((transfer) => (
                  <div key={transfer.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg",
                        transfer.direction === "in"
                          ? "bg-[#F6E8E1] text-[#9A5D45]"
                          : "bg-[#EAF2E1] text-[#4F7041]",
                      )}
                    >
                      {transfer.direction === "in" ? (
                        <TrendingDown className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-bold">
                        {transfer.direction === "in" ? "Покупка" : "Продажа"}: {transfer.playerName}
                      </div>
                      <div className="text-[8px] font-medium text-muted">
                        {TEAM_MAP[transfer.fromTeamId]?.name || "Свободный агент"} →{" "}
                        {TEAM_MAP[transfer.toTeamId]?.name || "Свободный агент"}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "number text-[10px] font-semibold",
                        transfer.direction === "in" ? "text-clay" : "text-pine-700",
                      )}
                    >
                      {transfer.direction === "in" ? "−" : "+"}
                      {formatMoney(transfer.amount, true)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-[10px] font-medium text-muted">
                  Пока нет финансовых операций. Подпишите спонсора или совершите трансфер.
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F0EDE3] text-pine-800">
                  <Users className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold">Зарплатная ведомость</div>
                  <div className="text-[8px] font-medium text-muted">
                    {game.players.filter((p) => p.teamId === game.clubId).length} контракта · сезон 2026/27
                  </div>
                </div>
                <span className="number text-[10px] font-semibold text-clay">
                  −{formatMoney(salary, true)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="card p-4 sm:p-5">
            <SectionHead title="Партнёрские предложения" description="Подпишите контракт и получите доход" />
            <div className="mt-3 space-y-2">
              {game.sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className={cn(
                    "rounded-xl border p-2.5",
                    sponsor.signed ? "border-pine-700/20 bg-[#F3F5E9]" : "border-line bg-white/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-extrabold">{sponsor.name}</div>
                      <div className="text-[7.5px] font-medium text-muted">{sponsor.sphere}</div>
                    </div>
                    <div className="text-right">
                      <div className="number text-[10px] font-semibold text-pine-800">
                        {formatMoney(sponsor.amount, true)}
                      </div>
                      <div className="text-[7px] font-medium text-muted">за сезон</div>
                    </div>
                  </div>
                  {sponsor.signed ? (
                    <div className="mt-2 flex items-center gap-1 text-[8px] font-bold text-pine-700">
                      <Check className="h-3 w-3" />
                      Контракт активен · {sponsor.years} года
                    </div>
                  ) : (
                    <button
                      onClick={() => onSignSponsor(sponsor.id)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-pine-900 py-1.5 text-[8px] font-extrabold text-lime hover:bg-pine-800"
                    >
                      Подписать контракт
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[22px] bg-lime p-4 text-pine-950">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-28 w-28 rounded-full border border-pine-950/15" />
            <div className="relative mb-1.5 flex items-center justify-between">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-pine-950/55">
                Рекомендация CFO
              </div>
              <Sparkles className="h-4 w-4 text-pine-950/40" />
            </div>
            <div className="relative font-display text-[16px] font-medium leading-tight tracking-[-0.03em]">
              {game.budget > salary * 0.7 ? "Бюджет сбалансирован" : "Сократите фонд зарплат"}
            </div>
            <p className="relative mt-1.5 text-[9px] font-semibold leading-relaxed text-pine-950/60">
              {game.budget > salary * 0.7
                ? "Можно рассмотреть точечное усиление состава. Держите резерв не менее 20% бюджета."
                : "Расходы на зарплаты растут. Продажа игрока ротации поможет разгрузить ведомость."}
            </p>
            <div className="relative mt-3 flex items-center gap-2 rounded-lg bg-pine-950 px-2.5 py-2 text-white">
              <CircleDollarSign className="h-3.5 w-3.5 text-lime" />
              <span className="text-[8.5px] font-bold">Доступно: {formatMoney(game.budget, true)}</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-line border-dashed p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold text-pine-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Финансовый fair play
            </div>
            <p className="text-[9px] font-medium leading-relaxed text-muted">
              Клуб проходит проверку лиги: зарплатная ведомость не превышает лимит, все контракты
              зарегистрированы. Штрафов нет.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[8px] font-bold text-pine-700">
              <Check className="h-3 w-3" />
              Проверка пройдена
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
