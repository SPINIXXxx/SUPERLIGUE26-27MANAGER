import { useEffect, useState } from "react";
import type {
  Fixture,
  GameState,
  IncomingOffer,
  MatchState,
  Notification,
  Player,
  ScreenId,
  Tactics,
  TrainingFocus,
} from "@/lib/types";
import {
  DEFAULT_CLUB_ID,
  TEAMS,
  TEAM_MAP,
} from "@/lib/data";
import {
  addQuickStats,
  applyFinishedMatch,
  buildNextCupRound,
  clamp,
  createGame,
  createMatchState,
  formatMoney,
  getTeamPower,
  lineupFromStarters,
  quickSim,
  round1,
  simulateCupMatch,
} from "@/lib/game";
import { Shell } from "@/components/Shell";
import { Toasts, type ToastMessage } from "@/components/ui";
import { PlayerDetail } from "@/components/PlayerDetail";
import { TeamSelect } from "@/screens/TeamSelect";
import { Dashboard } from "@/screens/Dashboard";
import { Squad } from "@/screens/Squad";
import { TacticsScreen } from "@/screens/Tactics";
import { Training } from "@/screens/Training";
import { CalendarScreen, CupScreen, LeagueScreen } from "@/screens/Season";
import { Transfers } from "@/screens/Transfers";
import { ClubScreen, FinancesScreen } from "@/screens/Club";
import { MatchCenter } from "@/screens/MatchCenter";

const STORAGE_KEY = "volley-manager-superliga-2627-v2";

type ActiveMatch = {
  match: MatchState;
  homePower: number;
  awayPower: number;
};

function hasStoredGame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as GameState;
    return !!(
      parsed &&
      parsed.version === 1 &&
      parsed.clubId &&
      Array.isArray(parsed.players) &&
      parsed.players.length > 100 &&
      Array.isArray(parsed.fixtures) &&
      parsed.fixtures.length > 100 &&
      parsed.tactics
    );
  } catch {
    return false;
  }
}

function hydrateGame(): GameState {
  if (typeof window === "undefined") return createGame(DEFAULT_CLUB_ID);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createGame(DEFAULT_CLUB_ID);
    const parsed = JSON.parse(raw) as GameState;
    if (
      parsed &&
      parsed.version === 1 &&
      parsed.clubId &&
      Array.isArray(parsed.players) &&
      parsed.players.length > 100 &&
      Array.isArray(parsed.fixtures) &&
      parsed.fixtures.length > 100 &&
      parsed.cup &&
      parsed.tactics
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupted saves
  }
  return createGame(DEFAULT_CLUB_ID);
}

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

function addNotification(
  game: GameState,
  title: string,
  body: string,
  kind: Notification["kind"],
): GameState {
  return {
    ...game,
    notifications: [
      {
        id: makeId("note"),
        title,
        body,
        time: "Только что",
        read: false,
        kind,
      },
      ...game.notifications,
    ].slice(0, 22),
  };
}

function addNews(game: GameState, tag: string, title: string, body: string): GameState {
  return {
    ...game,
    news: [
      {
        id: makeId("news"),
        date: "Сегодня",
        tag,
        title,
        body,
      },
      ...game.news,
    ].slice(0, 8),
  };
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => hydrateGame());
  const [started, setStarted] = useState<boolean>(() => hasStoredGame());
  const [screen, setScreen] = useState<ScreenId>("dashboard");
  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!started) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      // storage may be unavailable
    }
  }, [game, started]);

  const team = TEAM_MAP[game.clubId] || TEAMS[0];
  const selectedPlayer = game.players.find((player) => player.id === selectedPlayerId);

  const notify = (
    title: string,
    description?: string,
    kind: ToastMessage["kind"] = "success",
  ) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, title, description, kind }].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4800);
  };

  const navigate = (target: ScreenId) => {
    setScreen(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startMatch = (fixture: Fixture) => {
    if (fixture.played) return;
    const homePower =
      getTeamPower(
        game.players,
        fixture.homeId,
        fixture.homeId === game.clubId ? game.tactics : undefined,
      ) + 1.8;
    const awayPower = getTeamPower(
      game.players,
      fixture.awayId,
      fixture.awayId === game.clubId ? game.tactics : undefined,
    );
    setActiveMatch({
      match: createMatchState(fixture, "league"),
      homePower,
      awayPower,
    });
  };

  const startCupMatch = (roundIndex: number, matchIndex: number) => {
    const cupMatch = game.cup.rounds[roundIndex]?.matches[matchIndex];
    if (!cupMatch || !cupMatch.homeId || !cupMatch.awayId) {
      notify("Матч недоступен", "Соперник ещё не определён.", "error");
      return;
    }
    const fixture: Fixture = {
      id: cupMatch.id,
      round: 0,
      date: "2026-11-18",
      homeId: cupMatch.homeId,
      awayId: cupMatch.awayId,
      played: false,
    };
    const homePower =
      getTeamPower(
        game.players,
        cupMatch.homeId,
        cupMatch.homeId === game.clubId ? game.tactics : undefined,
      ) + 1.8;
    const awayPower = getTeamPower(
      game.players,
      cupMatch.awayId,
      cupMatch.awayId === game.clubId ? game.tactics : undefined,
    );
    setActiveMatch({
      match: createMatchState(fixture, "cup", roundIndex, matchIndex),
      homePower,
      awayPower,
    });
  };

  const finishMatch = (match: MatchState) => {
    const won = match.winnerId === game.clubId;
    const opponentId = match.homeId === game.clubId ? match.awayId : match.homeId;
    const opponent = TEAM_MAP[opponentId];
    const score = `${match.sets.home}:${match.sets.away}`;

    if (match.competition === "league") {
      setGame((prev) => {
        const fixture = prev.fixtures.find((item) => item.id === match.fixtureId);
        if (!fixture || fixture.played) return prev;
        let players = applyFinishedMatch(prev.players, match.homeId, match);
        players = applyFinishedMatch(players, match.awayId, match);
        let fixtures = prev.fixtures.map((item) =>
          item.id === match.fixtureId
            ? {
                ...item,
                played: true,
                homeSets: match.sets.home,
                awaySets: match.sets.away,
                sets: match.setHistory,
                attendance: match.attendance,
              }
            : item,
        );
        fixtures = fixtures.map((item) => {
          if (item.round !== fixture.round || item.played) return item;
          const result = quickSim(item.homeId, item.awayId, players);
          players = addQuickStats(
            players,
            item.homeId,
            result.homeSets,
            result.awaySets,
            result.homeSets > result.awaySets,
          );
          players = addQuickStats(
            players,
            item.awayId,
            result.awaySets,
            result.homeSets,
            result.awaySets > result.homeSets,
          );
          return {
            ...item,
            played: true,
            homeSets: result.homeSets,
            awaySets: result.awaySets,
            sets: result.sets,
            attendance: 1400 + ((item.round * 317) % 2800),
          };
        });
        const income = (fixture.homeId === prev.clubId ? 2.6 : 0) + (won ? 1.4 : 0.5);
        const updated: GameState = {
          ...prev,
          fixtures,
          players,
          budget: round1(prev.budget + income),
          boardConfidence: clamp(prev.boardConfidence + (won ? 3 : -4), 20, 100),
          training: {
            ...prev.training,
            sessions: prev.training.sessionsTotal,
            log: [
              {
                id: makeId("log"),
                text: `${team.name} — ${opponent?.name || "соперник"}`,
                effect: `${won ? "Победа" : "Поражение"} ${score} · сессии восстановлены`,
              },
              ...prev.training.log,
            ].slice(0, 8),
          },
        };
        const withNews = addNews(
          updated,
          "Матч",
          `${team.name} ${won ? "обыгрывает" : "уступает"} ${opponent?.name || "сопернику"}`,
          `${won ? "Уверенная игра" : "Непростой матч"} в ${fixture.round}-м туре завершилась со счётом ${score} по сетам.`,
        );
        return addNotification(
          withNews,
          won ? "Победа в туре" : "Поражение в туре",
          `${team.name} — ${opponent?.name}: ${score}. Бюджет пополнен на ${formatMoney(income, true)}.`,
          "match",
        );
      });
      setScreen("dashboard");
      notify(
        won ? "Матч выигран!" : "Матч завершён",
        `${team.name} ${score} ${opponent?.name}. Результат добавлен в таблицу.`,
        won ? "success" : "info",
      );
    } else {
      setGame((prev) => {
        let cup = prev.cup;
        const roundIndex = match.cupRoundIndex ?? 0;
        const matchIndex = match.cupMatchIndex ?? 0;
        const round = cup.rounds[roundIndex];
        if (!round) return prev;
        round.matches.forEach((item, index) => {
          if (index !== matchIndex && !item.played && item.homeId && item.awayId) {
            cup = simulateCupMatch(cup, roundIndex, index, prev.players);
          }
        });
        let players = applyFinishedMatch(prev.players, match.homeId, match);
        players = applyFinishedMatch(players, match.awayId, match);
        const rounds = cup.rounds.map((item) => ({
          ...item,
          matches: item.matches.map((cupMatch) => ({ ...cupMatch })),
        }));
        const target = rounds[roundIndex]?.matches[matchIndex];
        if (target && !target.played) {
          target.homeSets = match.sets.home;
          target.awaySets = match.sets.away;
          target.sets = match.setHistory;
          target.winnerId = match.winnerId;
          target.played = true;
          rounds[roundIndex].done = rounds[roundIndex].matches.every((item) => item.played);
        }
        cup = buildNextCupRound({ ...cup, rounds });
        const cupWon = cup.champion === prev.clubId;
        const prize = cupWon
          ? 20
          : cup.champion && cup.champion !== prev.cup.champion
            ? 0
            : won
              ? 2.4
              : 0.9;
        const updated: GameState = {
          ...prev,
          cup,
          players,
          budget: round1(prev.budget + prize),
          boardConfidence: clamp(prev.boardConfidence + (won ? 3 : -2) + (cupWon ? 6 : 0), 20, 100),
          training: {
            ...prev.training,
            sessions: prev.training.sessionsTotal,
            log: [
              {
                id: makeId("log"),
                text: `Кубок России · ${round.name}`,
                effect: `${won ? "Победа" : "Поражение"} ${score} · сессии восстановлены`,
              },
              ...prev.training.log,
            ].slice(0, 8),
          },
        };
        return addNotification(
          addNews(
            updated,
            "Кубок",
            cupWon
              ? `${team.name} — обладатель Кубка России!`
              : `${team.name} ${won ? "проходит дальше" : "покидает Кубок"}`,
            `Кубковый матч против ${opponent?.name || "соперника"} завершён со счётом ${score}.`,
          ),
          cupWon ? "Кубок России наш!" : "Кубок России",
          cupWon ? "Команда завоевала трофей и 20 млн ₽ призовых." : `Результат: ${score}.`,
          "match",
        );
      });
      setScreen("cup");
      notify(won ? "Кубковая победа!" : "Кубковый матч завершён", `${score} · ${opponent?.name}`);
    }
    setActiveMatch(null);
  };

  const handleSaveTactics = (tactics: Tactics) => {
    setGame((prev) => {
      const lineupIds = new Set(Object.values(tactics.lineup).filter(Boolean) as string[]);
      return {
        ...prev,
        tactics,
        players: prev.players.map((player) =>
          player.teamId === prev.clubId
            ? { ...player, starter: lineupIds.has(player.id) }
            : player,
        ),
        boardConfidence: clamp(prev.boardConfidence + (prev.tactics.risk !== tactics.risk ? 1 : 0), 20, 100),
      };
    });
    notify("Тактический план сохранён", "Изменения учтены в силе команды на матч.");
  };

  const handleAutoLineup = () => {
    if (!game) return;
    const lineup = lineupFromStarters(game.players, game.clubId);
    handleSaveTactics({ ...game.tactics, lineup });
    notify("Автосостав сформирован", "На площадке — сильнейшая семёрка по рейтингу.");
  };

  const handleTrain = (focus: TrainingFocus, intensity: 1 | 2 | 3) => {
    if (game.training.sessions <= 0) {
      notify("Тренировочные сессии закончились", "Новая неделя начнётся после матча.", "error");
      return;
    }
    const attribute =
      focus === "Атака"
        ? "attack"
        : focus === "Блок"
          ? "block"
          : focus === "Подача"
            ? "serve"
            : focus === "Приём"
              ? "receive"
              : focus === "Физика"
                ? "form"
                : null;
    const medicalLevel = game.facilities.find((facility) => facility.id === "medical")?.level || 6;
    let improved = 0;
    setGame((prev) => {
      const players = prev.players.map((player) => {
        if (player.teamId !== prev.clubId) return player;
        if (focus === "Восстановление") {
          return {
            ...player,
            fitness: clamp(player.fitness + 6 + Math.round(medicalLevel * 0.5), 0, 100),
          };
        }
        const gainChance = 0.34 + intensity * 0.12;
        const fatigue = 1 + intensity * 2;
        if (Math.random() > gainChance) {
          return { ...player, fitness: clamp(player.fitness - fatigue, 30, 100) };
        }
        improved += 1;
        if (attribute === "form") {
          return {
            ...player,
            form: clamp(player.form + 1, 1, 10),
            fitness: clamp(player.fitness - fatigue + 1, 30, 100),
          };
        }
        if (attribute) {
          return {
            ...player,
            [attribute]: clamp((player[attribute] as number) + 1, 40, 99),
            fitness: clamp(player.fitness - fatigue, 30, 100),
          };
        }
        return player;
      });
      return {
        ...prev,
        players,
        training: {
          ...prev.training,
          focus,
          intensity,
          sessions: Math.max(0, prev.training.sessions - 1),
          log: [
            {
              id: makeId("log"),
              text: `${focus} · ${intensity === 3 ? "ударная" : intensity === 2 ? "рабочая" : "лёгкая"} сессия`,
              effect:
                focus === "Восстановление"
                  ? "Команда восстановила силы"
                  : `${improved} игроков прибавили в навыке`,
            },
            ...prev.training.log,
          ].slice(0, 10),
        },
      };
    });
    notify(
      focus === "Восстановление" ? "День восстановления проведён" : "Тренировка завершена",
      focus === "Восстановление"
        ? "Готовность состава повышена."
        : `${intensity === 3 ? "Ударная" : intensity === 2 ? "Рабочая" : "Лёгкая"} сессия · ${focus}. Осталось сессий: ${Math.max(0, game.training.sessions - 1)}.`,
    );
  };

  const handleRecover = () => {
    if (game.training.sessions <= 0) {
      notify("Сессии недели завершены", "Проведите матч, чтобы начать новый цикл.", "error");
      return;
    }
    const medicalLevel = game.facilities.find((facility) => facility.id === "medical")?.level || 6;
    setGame((prev) => ({
      ...prev,
      players: prev.players.map((player) =>
        player.teamId === prev.clubId
          ? { ...player, fitness: clamp(player.fitness + 6 + medicalLevel, 0, 100) }
          : player,
      ),
      training: {
        ...prev.training,
        sessions: Math.max(0, prev.training.sessions - 1),
        log: [
          {
            id: makeId("log"),
            text: "Комплексное восстановление",
            effect: `Готовность +${6 + medicalLevel}%`,
          },
          ...prev.training.log,
        ].slice(0, 10),
      },
    }));
    notify("Восстановление проведено", `Готовность команды выросла на ${6 + medicalLevel}%.`);
  };

  const handleExtend = (player: Player) => {
    if (player.contract >= 4) {
      notify("Контракт уже максимальный", "Можно продлить не более чем на четыре года.", "error");
      return;
    }
    if (game.budget < 2.5) {
      notify("Недостаточно средств", "Для продления нужно 2,5 млн ₽.", "error");
      return;
    }
    setGame((prev) => ({
      ...prev,
      budget: round1(prev.budget - 2.5),
      players: prev.players.map((item) =>
        item.id === player.id
          ? {
              ...item,
              contract: Math.min(4, item.contract + 2),
              salary: round1(item.salary * 1.08),
              morale: clamp(item.morale + 6, 0, 100),
            }
          : item,
      ),
    }));
    notify("Контракт продлён", `${player.name} остаётся в клубе. Агентская комиссия — 2,5 млн ₽.`);
  };

  const handleRecoverPlayer = (player: Player) => {
    if (game.budget < 1.2) {
      notify("Недостаточно средств", "Восстановление стоит 1,2 млн ₽.", "error");
      return;
    }
    setGame((prev) => ({
      ...prev,
      budget: round1(prev.budget - 1.2),
      players: prev.players.map((item) =>
        item.id === player.id
          ? { ...item, fitness: clamp(item.fitness + 26, 0, 100), morale: clamp(item.morale + 4, 0, 100) }
          : item,
      ),
    }));
    notify("Восстановление проведено", `${player.name}: +26% физической готовности.`);
  };

  const handleToggleList = (player: Player) => {
    if (player.teamId !== game.clubId) return;
    const listing = !player.listed;
    if (listing && game.players.filter((item) => item.teamId === game.clubId).length <= 12) {
      notify("Слишком короткая заявка", "В команде должно остаться не менее 12 игроков.", "error");
      return;
    }
    const suitors = TEAMS.filter(
      (item) => item.id !== game.clubId && item.id !== "mgtu",
    );
    const transferSuitors = listing
      ? [...suitors].sort(() => Math.random() - 0.5).slice(0, 2)
      : [];
    setGame((prev) => {
      let players = prev.players.map((item) =>
        item.id === player.id
          ? { ...item, listed: listing, starter: listing ? false : item.starter }
          : item,
      );
      let tactics = prev.tactics;
      if (listing) {
        tactics = { ...prev.tactics, lineup: lineupFromStarters(players, prev.clubId) };
        const ids = new Set(Object.values(tactics.lineup).filter(Boolean) as string[]);
        players = players.map((item) =>
          item.teamId === prev.clubId ? { ...item, starter: ids.has(item.id) } : item,
        );
      }
      const newOffers = listing
        ? [
            ...prev.offers,
            ...transferSuitors.map((suitor) => ({
              id: makeId("offer"),
              playerId: player.id,
              fromTeamId: suitor.id,
              amount: round1(player.value * (0.84 + Math.random() * 0.2)),
            })),
          ]
        : prev.offers.filter((offer) => offer.playerId !== player.id);
      return { ...prev, players, tactics, offers: newOffers };
    });
    if (listing) {
      notify(
        "Игрок выставлен на трансфер",
        `${transferSuitors.length} клубов уже интересуются игроком. Предложения — во вкладке «Предложения».`,
      );
    } else {
      notify("Игрок снят с трансфера", "Все входящие предложения отменены.");
    }
  };

  const handleSubmitOffer = (player: Player, amount: number) => {
    if (amount > game.budget) {
      notify("Недостаточно бюджета", "Сумма превышает доступные средства.", "error");
      return;
    }
    if (amount < player.askingPrice) {
      notify(
        "Предложение отклонено",
        `${TEAM_MAP[player.teamId]?.name || "Клуб"} хочет не менее ${formatMoney(player.askingPrice)}.`,
        "error",
      );
      return;
    }
    if (game.players.filter((item) => item.teamId === game.clubId).length >= 16) {
      notify("Заявка заполнена", "Максимум 16 игроков в заявке на сезон.", "error");
      return;
    }
    setGame((prev) => {
      const players = prev.players.map((item) =>
        item.id === player.id
          ? { ...item, teamId: prev.clubId, listed: false, starter: false, morale: 88 }
          : item,
      );
      const updated: GameState = {
        ...prev,
        players,
        budget: round1(prev.budget - amount),
        offers: prev.offers.filter((offer) => offer.playerId !== player.id),
        transfers: [
          {
            id: makeId("transfer"),
            playerName: player.name,
            fromTeamId: player.teamId,
            toTeamId: prev.clubId,
            amount,
            direction: "in",
          },
          ...prev.transfers,
        ],
      };
      return addNotification(
        addNews(
          updated,
          "Трансфер",
          `${player.name} — игрок ${team.name}`,
          `${player.pos} ${player.flag ? `${player.country} · ` : ""}перешёл в клуб за ${formatMoney(amount)}.`,
        ),
        "Новый игрок",
        `${player.name} присоединился к команде. Сделка: ${formatMoney(amount)}.`,
        "transfer",
      );
    });
    setSelectedPlayerId(null);
    notify("Трансфер завершён", `${player.name} присоединился к ${team.name}.`);
  };

  const handleAcceptOffer = (offer: IncomingOffer) => {
    const player = game.players.find((item) => item.id === offer.playerId);
    if (!player || player.teamId !== game.clubId) return;
    if (game.players.filter((item) => item.teamId === game.clubId).length <= 12) {
      notify("Нельзя продать игрока", "В заявке должно остаться минимум 12 игроков.", "error");
      return;
    }
    const fromTeam = TEAM_MAP[offer.fromTeamId];
    setGame((prev) => {
      let players = prev.players.map((item) =>
        item.id === player.id
          ? { ...item, teamId: offer.fromTeamId, starter: false, listed: false }
          : item,
      );
      const suitorsLeft = prev.offers.filter((item) => item.playerId !== player.id);
      let tactics = prev.tactics;
      if (Object.values(prev.tactics.lineup).includes(player.id)) {
        tactics = { ...prev.tactics, lineup: lineupFromStarters(players, prev.clubId) };
      }
      const ids = new Set(Object.values(tactics.lineup).filter(Boolean) as string[]);
      players = players.map((item) =>
        item.teamId === prev.clubId ? { ...item, starter: ids.has(item.id) } : item,
      );
      const updated: GameState = {
        ...prev,
        players,
        tactics,
        budget: round1(prev.budget + offer.amount),
        offers: suitorsLeft,
        transfers: [
          {
            id: makeId("transfer"),
            playerName: player.name,
            fromTeamId: prev.clubId,
            toTeamId: offer.fromTeamId,
            amount: offer.amount,
            direction: "out",
          },
          ...prev.transfers,
        ],
      };
      return addNotification(
        addNews(
          updated,
          "Трансфер",
          `${player.name} перешёл в ${fromTeam?.name}`,
          `Сумма сделки — ${formatMoney(offer.amount)}. Средства доступны для усиления состава.`,
        ),
        "Игрок продан",
        `${player.name} → ${fromTeam?.name}. Получено ${formatMoney(offer.amount)}.`,
        "transfer",
      );
    });
    notify("Сделка завершена", `${player.name} перешёл в ${fromTeam?.name}.`);
  };

  const handleRejectOffer = (offer: IncomingOffer) => {
    setGame((prev) => ({
      ...prev,
      offers: prev.offers.filter((item) => item.id !== offer.id),
    }));
    notify("Предложение отклонено");
  };

  const handleUpgrade = (facilityId: string) => {
    const facility = game.facilities.find((item) => item.id === facilityId);
    if (!facility) return;
    const cost = Math.round(facility.baseCost + facility.level * 4.5);
    if (facility.level >= facility.max) {
      notify("Максимальный уровень", `${facility.name} уже развита до предела.`, "error");
      return;
    }
    if (cost > game.budget) {
      notify("Недостаточно средств", `Улучшение стоит ${formatMoney(cost)}.`, "error");
      return;
    }
    setGame((prev) => ({
      ...prev,
      budget: round1(prev.budget - cost),
      facilities: prev.facilities.map((item) =>
        item.id === facilityId ? { ...item, level: item.level + 1 } : item,
      ),
    }));
    notify("Инфраструктура улучшена", `${facility.name} — уровень ${facility.level + 1}.`);
  };

  const handleSignSponsor = (sponsorId: string) => {
    const sponsor = game.sponsors.find((item) => item.id === sponsorId);
    if (!sponsor) return;
    if (sponsor.signed) {
      notify("Контракт уже активен", `${sponsor.name} сотрудничает с клубом.`, "error");
      return;
    }
    const bonus = round1(sponsor.amount * 0.6);
    setGame((prev) => ({
      ...prev,
      budget: round1(prev.budget + bonus),
      sponsors: prev.sponsors.map((item) =>
        item.id === sponsorId ? { ...item, signed: true } : item,
      ),
    }));
    notify("Спонсорский контракт подписан", `${sponsor.name} · подписной бонус ${formatMoney(bonus)}.`);
  };

  const handleSimulateCupRound = (roundIndex: number) => {
    setGame((prev) => {
      let cup = prev.cup;
      const round = cup.rounds[roundIndex];
      if (!round) return prev;
      round.matches.forEach((cupMatch, index) => {
        const involvesUser =
          cupMatch.homeId === prev.clubId || cupMatch.awayId === prev.clubId;
        if (!cupMatch.played && cupMatch.homeId && cupMatch.awayId && !involvesUser) {
          cup = simulateCupMatch(cup, roundIndex, index, prev.players);
        }
      });
      const championBonus =
        cup.champion && cup.champion !== prev.cup.champion ? 20 : 0;
      return { ...prev, cup, budget: round1(prev.budget + championBonus) };
    });
    notify("Раунд симулирован", "Матчи без участия вашей команды завершены.");
  };

  const handleSimulateSeason = () => {
    const remaining = game.fixtures.filter((fixture) => !fixture.played);
    if (!remaining.length) {
      notify("Сезон уже завершён", "Все матчи сыграны. Начните новую кампанию.", "error");
      return;
    }
    const confirmed = window.confirm(
      `Симулировать оставшиеся ${remaining.length} матчей сезона? Ваша команда проведёт их автоматически.`,
    );
    if (!confirmed) return;
    setGame((prev) => {
      let players = [...prev.players];
      let fixtures = [...prev.fixtures];
      let budget = prev.budget;
      remaining
        .sort((a, b) => a.round - b.round)
        .forEach((fixture) => {
          if (fixture.played) return;
          const result = quickSim(fixture.homeId, fixture.awayId, players);
          players = addQuickStats(
            players,
            fixture.homeId,
            result.homeSets,
            result.awaySets,
            result.homeSets > result.awaySets,
          );
          players = addQuickStats(
            players,
            fixture.awayId,
            result.awaySets,
            result.homeSets,
            result.awaySets > result.homeSets,
          );
          if (fixture.homeId === prev.clubId) budget += 2.2;
          if (
            (fixture.homeId === prev.clubId || fixture.awayId === prev.clubId) &&
            (result.homeSets > result.awaySets) === (fixture.homeId === prev.clubId)
          ) {
            budget += 1.2;
          }
          fixtures = fixtures.map((item) =>
            item.id === fixture.id
              ? {
                  ...item,
                  played: true,
                  homeSets: result.homeSets,
                  awaySets: result.awaySets,
                  sets: result.sets,
                  attendance: 1500 + ((fixture.round * 411) % 3000),
                }
              : item,
          );
        });
      players = players.map((player) => ({
        ...player,
        fitness: clamp(player.fitness + 30, 60, 100),
      }));
      let updated: GameState = {
        ...prev,
        fixtures,
        players,
        budget: round1(budget),
        training: { ...prev.training, sessions: prev.training.sessionsTotal },
      };
      updated = addNews(
        updated,
        "Сезон",
        "Регулярный чемпионат завершён",
        "Все 240 матчей Суперлиги сыграны. Итоговая таблица сформирована, лучшие игроки определены.",
      );
      return addNotification(
        updated,
        "Сезон завершён",
        "Регулярный чемпионат подошёл к концу. В таблице — итоговые места команд.",
        "match",
      );
    });
    setScreen("league");
    notify("Сезон смоделирован", "Сыграны все оставшиеся матчи. Проверьте итоговую таблицу.");
  };

  const openClubSelection = () => {
    const confirmed = window.confirm(
      "Открыть выбор клуба? Текущий прогресс сезона будет заменён новой карьерой.",
    );
    if (!confirmed) return;
    setStarted(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setActiveMatch(null);
    setSelectedPlayerId(null);
    setScreen("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!started) {
    return (
      <TeamSelect
        game={game}
        initialClubId={game.clubId}
        initialManager={game.manager}
        onStart={(clubId, manager) => {
          const fresh = createGame(clubId, manager);
          setGame(fresh);
          setStarted(true);
          setScreen("dashboard");
          notify("Карьера начата", `Вы возглавили ${TEAM_MAP[clubId].full}. Удачи в сезоне!`);
        }}
      />
    );
  }

  const screenContent = (() => {
    switch (screen) {
      case "squad":
        return (
          <Squad
            game={game}
            team={team}
            setScreen={navigate}
            onOpenPlayer={(player) => setSelectedPlayerId(player.id)}
            onAutoLineup={handleAutoLineup}
          />
        );
      case "tactics":
        return (
          <TacticsScreen
            game={game}
            team={team}
            onSave={handleSaveTactics}
            onOpenPlayer={(player) => setSelectedPlayerId(player.id)}
          />
        );
      case "training":
        return (
          <Training
            game={game}
            team={team}
            onTrain={handleTrain}
            onRecover={handleRecover}
            onOpenPlayer={(player) => setSelectedPlayerId(player.id)}
          />
        );
      case "calendar":
        return (
          <CalendarScreen
            game={game}
            team={team}
            onStartMatch={startMatch}
            onSimulateSeason={handleSimulateSeason}
          />
        );
      case "league":
        return (
          <LeagueScreen
            game={game}
            team={team}
            setScreen={navigate}
            onOpenPlayer={(player) => setSelectedPlayerId(player.id)}
          />
        );
      case "cup":
        return (
          <CupScreen
            game={game}
            team={team}
            onStartCupMatch={startCupMatch}
            onSimulateCupRound={handleSimulateCupRound}
          />
        );
      case "transfers":
        return (
          <Transfers
            game={game}
            team={team}
            onOpenPlayer={(player) => setSelectedPlayerId(player.id)}
            onSubmitOffer={handleSubmitOffer}
            onToggleList={handleToggleList}
            onAcceptOffer={handleAcceptOffer}
            onRejectOffer={handleRejectOffer}
          />
        );
      case "club":
        return (
          <ClubScreen
            game={game}
            team={team}
            onUpgrade={handleUpgrade}
            onSignSponsor={handleSignSponsor}
            onNewGame={openClubSelection}
          />
        );
      case "finances":
        return (
          <FinancesScreen game={game} team={team} onSignSponsor={handleSignSponsor} />
        );
      default:
        return (
          <Dashboard
            game={game}
            team={team}
            setScreen={navigate}
            onStartMatch={startMatch}
            onOpenPlayer={(player) => setSelectedPlayerId(player.id)}
          />
        );
    }
  })();

  return (
    <>
      <Shell
        screen={screen}
        setScreen={navigate}
        game={game}
        team={team}
        notifications={game.notifications}
        onMarkAllRead={() =>
          setGame((prev) => ({
            ...prev,
            notifications: prev.notifications.map((item) => ({ ...item, read: true })),
          }))
        }
        onNewGame={openClubSelection}
        onStartNextMatch={startMatch}
      >
        {screenContent}
      </Shell>

      {activeMatch && (
        <MatchCenter
          initialMatch={activeMatch.match}
          game={game}
          team={team}
          homePower={activeMatch.homePower}
          awayPower={activeMatch.awayPower}
          onClose={() => setActiveMatch(null)}
          onFinish={finishMatch}
        />
      )}

      <PlayerDetail
        player={selectedPlayer}
        team={selectedPlayer ? TEAM_MAP[selectedPlayer.teamId] : undefined}
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayerId(null)}
        isOwn={selectedPlayer?.teamId === game.clubId}
        onExtend={handleExtend}
        onRecover={handleRecoverPlayer}
        onToggleTransfer={handleToggleList}
        onOffer={() => {
          setSelectedPlayerId(null);
          navigate("transfers");
          notify("Трансферный рынок", "Выберите игрока и отправьте предложение клубу.");
        }}
      />

      <Toasts
        toasts={toasts}
        onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
      />
    </>
  );
}
