import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  Brain,
  Check,
  Crosshair,
  Dumbbell,
  Flame,
  Hand,
  HeartPulse,
  Play,
  Shield,
  Sparkles,
  Timer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import type { GameState, Player, Team, TrainingFocus } from "@/lib/types";
import { STAFF } from "@/lib/data";
import { payroll } from "@/lib/game";
import { cn } from "@/utils/cn";
import {
  PageHeader,
  PlayerAvatar,
  ProgressBar,
  Rating,
  SectionHead,
  StatCard,
} from "@/components/ui";

type Props = {
  game: GameState;
  team: Team;
  onTrain: (focus: TrainingFocus, intensity: 1 | 2 | 3) => void;
  onRecover: () => void;
  onOpenPlayer: (player: Player) => void;
};

const FOCUS: {
  key: TrainingFocus;
  label: string;
  icon: typeof Crosshair;
  description: string;
  effect: string;
  color: string;
}[] = [
  {
    key: "Атака",
    label: "Атака",
    icon: Crosshair,
    description: "Работа на сетке, завершение атак и игра в концовках.",
    effect: "Атака +1",
    color: "bg-[#F9E9E0] text-[#B65332]",
  },
  {
    key: "Блок",
    label: "Блок",
    icon: Shield,
    description: "Двойной блок, чтение связующего и страховка.",
    effect: "Блок +1",
    color: "bg-[#EAF0E4] text-[#507545]",
  },
  {
    key: "Подача",
    label: "Подача",
    icon: Wind,
    description: "Силовая и тактическая подача в зоны соперника.",
    effect: "Подача +1",
    color: "bg-[#F5EEDB] text-[#95732E]",
  },
  {
    key: "Приём",
    label: "Приём",
    icon: Hand,
    description: "Приём подачи, доводка и выход из сложных мячей.",
    effect: "Приём +1",
    color: "bg-[#E6EFF5] text-[#416F8B]",
  },
  {
    key: "Физика",
    label: "Физика",
    icon: Dumbbell,
    description: "Силовой блок, прыжковая выносливость и скорость.",
    effect: "Форма +1",
    color: "bg-[#EEE9F6] text-[#725A92]",
  },
  {
    key: "Восстановление",
    label: "Восстановление",
    icon: HeartPulse,
    description: "Восстановительные процедуры, бассейн и массаж.",
    effect: "Готовность +6",
    color: "bg-[#E8F2E9] text-[#3F7350]",
  },
];

export function Training({ game, team, onTrain, onRecover, onOpenPlayer }: Props) {
  const [focus, setFocus] = useState<TrainingFocus>(game.training.focus);
  const [intensity, setIntensity] = useState<1 | 2 | 3>(game.training.intensity);
  const squad = game.players.filter((player) => player.teamId === game.clubId);
  const sortedByLoad = [...squad].sort((a, b) => a.fitness - b.fitness);
  const avgFitness = Math.round(
    squad.reduce((acc, player) => acc + player.fitness, 0) / Math.max(1, squad.length),
  );
  const tired = squad.filter((player) => player.fitness < 76).length;
  const selected = FOCUS.find((item) => item.key === focus) || FOCUS[0];
  const noSessions = game.training.sessions <= 0;

  const sessions = game.training.sessions;

  return (
    <div>
      <PageHeader
        eyebrow={`Подготовка · ${team.name}`}
        title="Тренировочный процесс"
        description="Планируйте недельный микроцикл, распределяйте нагрузку и следите за готовностью игроков к следующему туру."
        actions={
          <button
            onClick={() => onTrain(focus, intensity)}
            disabled={noSessions}
            className={cn("text-[11px]", noSessions ? "btn-soft" : "btn-primary")}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {noSessions ? "Сессий больше нет" : "Начать тренировку"}
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Сессий на неделе"
          value={sessions}
          suffix={`из ${game.training.sessionsTotal}`}
          icon={<CalendarIcon />}
          note="Новая неделя начнётся после матча"
        />
        <StatCard
          label="Средняя готовность"
          value={`${avgFitness}%`}
          icon={<Activity className="h-3.5 w-3.5" />}
          note={avgFitness >= 86 ? "Команда в хорошем тонусе" : "Требуется восстановление"}
        />
        <StatCard
          label="Игроки на нагрузке"
          value={tired}
          suffix="чел."
          icon={<Flame className="h-3.5 w-3.5" />}
          note={tired > 2 ? "Есть риск перегрузки" : "Всё под контролем"}
        />
        <StatCard
          label="Прирост за неделю"
          value={`+${Math.max(1, Math.round(sessions * intensity * 0.7))}`}
          suffix="балла"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          note="Прогноз по текущему плану"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Фокус микроцикла"
              description="Выберите направление главной тренировки"
              action={
                <span className="chip bg-mist text-[9px] text-pine-800">
                  Сила плана: {intensity === 3 ? "высокая" : intensity === 2 ? "средняя" : "щадящая"}
                </span>
              }
            />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FOCUS.map((item) => {
                const Icon = item.icon;
                const active = focus === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setFocus(item.key)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-pine-900 bg-pine-900 text-white shadow-[0_10px_28px_-18px_rgba(16,55,39,0.9)]"
                        : "border-line bg-paper hover:-translate-y-0.5 hover:border-[#ccc5b2]",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg",
                          active ? "bg-lime text-pine-950" : item.color,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {active && <Check className="h-4 w-4 text-lime" />}
                    </div>
                    <div className={cn("text-[11.5px] font-extrabold", active && "text-white")}>
                      {item.label}
                    </div>
                    <p
                      className={cn(
                        "mt-1 hidden text-[8.5px] font-medium leading-relaxed sm:block",
                        active ? "text-white/45" : "text-muted",
                      )}
                    >
                      {item.description}
                    </p>
                    <div
                      className={cn(
                        "mt-2 inline-flex rounded-md px-1.5 py-0.5 text-[8px] font-extrabold",
                        active ? "bg-lime/15 text-lime" : "bg-[#F0EDE3] text-muted",
                      )}
                    >
                      {item.effect}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-line bg-[#F6F3E9] p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="label">Интенсивность нагрузки</span>
                <span className="text-[9px] font-bold text-pine-800">
                  {intensity === 1 ? "Восстановительная" : intensity === 2 ? "Рабочая" : "Ударная"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 1, label: "Низкая", desc: "Мало усталости" },
                    { value: 2, label: "Средняя", desc: "Оптимальный баланс" },
                    { value: 3, label: "Высокая", desc: "Максимальный прирост" },
                  ] as { value: 1 | 2 | 3; label: string; desc: string }[]
                ).map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setIntensity(level.value)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-left transition-colors",
                      intensity === level.value
                        ? "border-pine-800 bg-paper"
                        : "border-transparent hover:bg-white/60",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((bar) => (
                          <span
                            key={bar}
                            className={cn(
                              "w-1 rounded-full",
                              bar <= level.value
                                ? intensity === level.value
                                  ? "bg-pine-700"
                                  : "bg-muted/40"
                                : "bg-sand",
                              bar === 1 ? "h-2" : bar === 2 ? "h-3" : "h-4",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-extrabold">{level.label}</span>
                    </div>
                    <div className="mt-1 text-[7.5px] font-medium text-muted">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-pine-950 px-3.5 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lime text-pine-950">
                  <Zap className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-extrabold">
                    {selected.label} · {intensity === 3 ? "ударная" : intensity === 2 ? "рабочая" : "лёгкая"} сессия
                  </div>
                  <div className="mt-0.5 text-[8.5px] font-medium text-white/45">
                    {intensity === 3
                      ? "Риск усталости выше — следите за восстановлением"
                      : "Тренировка даст прирост ключевого навыка у группы игроков"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onTrain(focus, intensity)}
                disabled={noSessions}
                className={cn(
                  "shrink-0 text-[10px]",
                  noSessions ? "rounded-xl bg-white/10 px-3 py-2 text-white/35" : "btn-lime",
                )}
              >
                Провести сессию
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
              <SectionHead title="Нагрузка состава" description="Игроки, которым нужен особый контроль" />
              <button onClick={onRecover} disabled={noSessions} className="btn-ghost btn-xs text-[9px]">
                <BatteryCharging className="h-3 w-3" />
                День восстановления
              </button>
            </div>
            <div className="hidden grid-cols-[1.5fr_0.6fr_0.9fr_0.6fr] gap-2 border-b border-line bg-[#F5F2E8] px-4 py-2 text-[8px] font-extrabold uppercase tracking-wider text-muted sm:grid">
              <span>Игрок</span>
              <span className="text-center">Форма</span>
              <span>Готовность</span>
              <span className="text-right">Нагрузка</span>
            </div>
            <div className="divide-y divide-line/70">
              {sortedByLoad.slice(0, 7).map((player) => {
                const load = 100 - player.fitness;
                return (
                  <button
                    key={player.id}
                    onClick={() => onOpenPlayer(player)}
                    className="grid w-full grid-cols-[1.5fr_0.6fr_0.9fr_0.6fr] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[#F5F3EA]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <PlayerAvatar player={player} size={30} />
                      <div className="min-w-0">
                        <div className="truncate text-[10.5px] font-extrabold">{player.name}</div>
                        <div className="text-[8px] font-semibold text-muted">
                          {player.posCode} · {player.stats.matches} матчей
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Rating value={player.overall} size="sm" />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[8.5px] font-semibold">
                        <span className={player.fitness < 75 ? "text-clay" : "text-muted"}>
                          {player.fitness}%
                        </span>
                        <span className="text-muted/60">{load}% нагрузка</span>
                      </div>
                      <ProgressBar
                        value={player.fitness}
                        height="h-1.5"
                        color={
                          player.fitness >= 86
                            ? "bg-pine-700"
                            : player.fitness >= 74
                              ? "bg-[#D5B24F]"
                              : "bg-clay"
                        }
                      />
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "chip justify-end text-[8px]",
                          load < 16
                            ? "bg-[#EAF2E1] text-[#4F7041]"
                            : load < 28
                              ? "bg-[#F5EEDB] text-[#8C6E2B]"
                              : "bg-[#F8E7E0] text-[#9A5D45]",
                        )}
                      >
                        {load < 16 ? "Норма" : load < 28 ? "Средняя" : "Высокая"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-line bg-[#F7F4EB] px-4 py-2.5">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-muted">
                Медицинский центр · уровень {game.facilities.find((f) => f.id === "medical")?.level || 6}
              </span>
              <span className="text-[8.5px] font-semibold text-muted">
                Восстановление +{4 + (game.facilities.find((f) => f.id === "medical")?.level || 6)}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <div className="relative overflow-hidden rounded-[22px] bg-pine-950 p-4 text-white sm:p-5">
            <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full border border-white/10" />
            <div className="relative mb-4 flex items-start justify-between">
              <div>
                <div className="text-[8px] font-extrabold uppercase tracking-[0.17em] text-lime/80">
                  Недельный цикл
                </div>
                <div className="mt-1 text-[14px] font-extrabold">До матча {sessions > 1 ? `${sessions} дня` : sessions === 1 ? "день" : "старт"}</div>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-pine-950">
                <Timer className="h-4 w-4" />
              </span>
            </div>
            <div className="relative mb-2 flex items-center justify-between text-[9px] font-semibold text-white/50">
              <span>Сессии недели</span>
              <span className="text-lime">{sessions} / {game.training.sessionsTotal}</span>
            </div>
            <ProgressBar value={sessions} max={game.training.sessionsTotal} height="h-2" color="bg-lime" />
            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-2.5">
                <div className="text-[8px] font-bold uppercase tracking-wider text-white/35">Фокус</div>
                <div className="mt-1 text-[11px] font-extrabold text-white">{selected.label}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-2.5">
                <div className="text-[8px] font-bold uppercase tracking-wider text-white/35">Интенсивность</div>
                <div className="mt-1 text-[11px] font-extrabold text-lime">
                  {intensity === 1 ? "Низкая" : intensity === 2 ? "Средняя" : "Высокая"}
                </div>
              </div>
            </div>
            <button
              onClick={() => onTrain(focus, intensity)}
              disabled={noSessions}
              className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-2.5 text-[10.5px] font-extrabold text-pine-950 transition-colors hover:bg-[#e7f98f] disabled:bg-white/10 disabled:text-white/30"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {noSessions ? "Сессии завершены" : `Начать: ${focus}`}
            </button>
            <button
              onClick={onRecover}
              disabled={noSessions}
              className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2 text-[9.5px] font-bold text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-35"
            >
              <BatteryCharging className="h-3.5 w-3.5" />
              Восстановление всей команды
            </button>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead
              title="Тренерский штаб"
              description="Кто помогает команде"
              action={<Brain className="h-4 w-4 text-pine-700" />}
            />
            <div className="mt-3.5 space-y-2">
              {STAFF.slice(0, 4).map((member) => (
                <div key={member.name} className="flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[9px] font-extrabold text-white"
                    style={{ background: member.color }}
                  >
                    {member.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-extrabold">{member.name}</div>
                    <div className="text-[8px] font-medium text-muted">{member.role}</div>
                  </div>
                  <span className="number rounded-md bg-[#F0EDE3] px-1.5 py-0.5 text-[9px] font-semibold">
                    {member.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <SectionHead title="Дневник штаба" description="Последние записи" />
            <div className="mt-3 space-y-2.5">
              {game.training.log.slice(0, 4).map((item, index) => (
                <div key={item.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1 h-1.5 w-1.5 rounded-full",
                        index === 0 ? "bg-lime" : "bg-sand",
                      )}
                    />
                    {index < game.training.log.slice(0, 4).length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-line" />
                    )}
                  </div>
                  <div className="pb-1">
                    <div className="text-[9.5px] font-bold leading-snug">{item.text}</div>
                    <div className="mt-0.5 text-[8px] font-medium text-muted">{item.effect}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#F5F2E8] px-2.5 py-2 text-[8.5px] font-semibold text-muted">
              <Sparkles className="h-3 w-3 shrink-0 text-[#A7BB5A]" />
              Фонд зарплат: {payroll(game.players, game.clubId).toFixed(1)} млн ₽
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return <CalendarMini />;
}

function CalendarMini() {
  return (
    <div className="relative h-3.5 w-3.5">
      <div className="absolute inset-x-0 bottom-0 top-1 rounded-[2px] border border-current" />
      <div className="absolute inset-x-0 top-1 h-px bg-current" />
      <div className="absolute bottom-1 left-1 h-1 w-1 rounded-sm bg-current" />
      <div className="absolute right-1 bottom-1 h-1 w-1 rounded-sm bg-current" />
    </div>
  );
}
