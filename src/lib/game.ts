import {
  INITIAL_FACILITIES,
  INITIAL_NEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SPONSORS,
  INITIAL_TRAINING,
  SEASON,
  TEAMS,
  TEAM_MAP,
  assignDefaultStarters,
  createPlayers,
} from "./data";
import type {
  CupRound,
  CupState,
  Fixture,
  GameState,
  Lineup,
  LineupSlot,
  MatchState,
  Player,
  Pos,
  SetScore,
  Tactics,
  Team,
} from "./types";

export const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

export const round1 = (n: number) => Math.round(n * 10) / 10;

export const getSquad = (players: Player[], teamId: string) =>
  players.filter((p) => p.teamId === teamId);

export const getPlayerById = (players: Player[], id?: string) =>
  players.find((p) => p.id === id);

export function formatMoney(value: number, short = false) {
  const n = value.toLocaleString("ru-RU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  });
  return short ? `${n} млн` : `${n} млн ₽`;
}

export function formatDate(iso: string, withYear = false) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function formatDateShort(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function initialsThree(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3);
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const iso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function generateFixtures(): Fixture[] {
  const ids = TEAMS.map((team) => team.id);
  const n = ids.length;
  let order = [...ids];
  const rounds: Fixture[] = [];
  const start = new Date(2026, 9, 16);
  for (let roundIndex = 0; roundIndex < n - 1; roundIndex += 1) {
    const date = iso(addDays(start, roundIndex * 7));
    for (let i = 0; i < n / 2; i += 1) {
      let home = order[i];
      let away = order[n - 1 - i];
      if ((roundIndex + i) % 2 === 1) {
        [home, away] = [away, home];
      }
      rounds.push({
        id: `r${roundIndex + 1}-${i}`,
        round: roundIndex + 1,
        date,
        homeId: home,
        awayId: away,
        played: false,
      });
    }
    order = [order[0], order[n - 1], ...order.slice(1, n - 1)];
  }
  // Второй круг — обратные матчи
  const firstCircle = [...rounds];
  firstCircle.forEach((fixture) => {
    const round = fixture.round + (n - 1);
    const date = iso(addDays(start, (round - 1) * 7));
    rounds.push({
      id: `r${round}-${fixture.id.split("-")[1]}`,
      round,
      date,
      homeId: fixture.awayId,
      awayId: fixture.homeId,
      played: false,
    });
  });
  return rounds.sort((a, b) => a.round - b.round);
}

export function createCup(clubId: string): CupState {
  const top = [...TEAMS]
    .filter((team) => team.id !== clubId)
    .sort((a, b) => b.prestige - a.prestige)
    .slice(0, 7)
    .map((team) => team.id);
  const pool = [clubId, ...top];
  const pairings = [
    [pool[0], pool[7]],
    [pool[3], pool[4]],
    [pool[1], pool[6]],
    [pool[2], pool[5]],
  ];
  const matches = pairings.map(([homeId, awayId], index) => ({
    id: `cup-qf-${index}`,
    homeId,
    awayId,
    played: false,
  }));
  return {
    rounds: [
      { id: "qf", name: "1/4 финала", matches, done: false },
      { id: "sf", name: "1/2 финала", matches: [], done: false },
      { id: "final", name: "Финал", matches: [], done: false },
    ],
  };
}

export const ROLE_TO_POS: Record<LineupSlot, Pos> = {
  setter: "Связующий",
  diagonal: "Диагональный",
  outside1: "Доигровщик",
  outside2: "Доигровщик",
  middle1: "Блокирующий",
  middle2: "Блокирующий",
  libero: "Либеро",
};

export const SLOT_LABEL: Record<LineupSlot, string> = {
  setter: "Связующий",
  diagonal: "Диагональный",
  outside1: "Доигровщик",
  outside2: "Доигровщик",
  middle1: "Блокирующий",
  middle2: "Блокирующий",
  libero: "Либеро",
};

export function lineupFromStarters(players: Player[], clubId: string): Lineup {
  const squad = getSquad(players, clubId).filter((p) => p.teamId === clubId);
  const pick = (slot: LineupSlot, used: Set<string>, preferred?: string) => {
    if (preferred) {
      const found = squad.find((p) => p.id === preferred && !used.has(p.id));
      if (found) return found;
    }
    const pool = squad
      .filter(
        (p) =>
          p.pos === ROLE_TO_POS[slot] &&
          !used.has(p.id) &&
          p.teamId === clubId &&
          p.listed !== true,
      )
      .sort((a, b) => b.overall - a.overall);
    return pool[0] || squad.filter((p) => !used.has(p.id)).sort((a, b) => b.overall - a.overall)[0];
  };
  const used = new Set<string>();
  const result: Lineup = {};
  const slots: LineupSlot[] = [
    "setter",
    "diagonal",
    "outside1",
    "outside2",
    "middle1",
    "middle2",
    "libero",
  ];
  slots.forEach((slot) => {
    const player = pick(slot, used);
    if (player) {
      result[slot] = player.id;
      used.add(player.id);
    }
  });
  return result;
}

export function getLineupPlayers(
  players: Player[],
  tactics: Tactics,
  clubId: string,
): { slot: LineupSlot; label: string; player?: Player }[] {
  const squad = players.filter((p) => p.teamId === clubId);
  const used = new Set<string>();
  const slots: LineupSlot[] = [
    "setter",
    "diagonal",
    "outside1",
    "outside2",
    "middle1",
    "middle2",
    "libero",
  ];
  return slots.map((slot) => {
    let player = squad.find(
      (p) => p.id === tactics.lineup[slot] && !used.has(p.id),
    );
    if (!player) {
      player = squad
        .filter((p) => p.pos === ROLE_TO_POS[slot] && !used.has(p.id))
        .sort((a, b) => b.overall - a.overall)[0];
    }
    if (!player) {
      player = squad.filter((p) => !used.has(p.id)).sort((a, b) => b.overall - a.overall)[0];
    }
    if (player) used.add(player.id);
    return { slot, label: SLOT_LABEL[slot], player };
  });
}

export function getStarters(players: Player[], teamId: string): Player[] {
  const squad = getSquad(players, teamId);
  const starters = squad.filter((p) => p.starter && !p.listed);
  if (starters.length >= 6) return starters;
  return assignDefaultStarters(players)
    .filter((p) => p.teamId === teamId)
    .filter((p) => p.starter);
}

export function getTeamPower(
  players: Player[],
  teamId: string,
  tactics?: Tactics,
): number {
  const squad = getSquad(players, teamId).filter((p) => p.listed !== true);
  if (!squad.length) return 72;
  let selected: Player[];
  if (tactics && teamId && tactics.lineup) {
    selected = getLineupPlayers(players, tactics, teamId)
      .map((slot) => slot.player)
      .filter(Boolean) as Player[];
  } else {
    selected = getStarters(players, teamId);
  }
  const byPos = (pos: Pos) =>
    selected.filter((p) => p.pos === pos).sort((a, b) => b.overall - a.overall);
  const setter = byPos("Связующий")[0] || selected[0];
  const diagonal = byPos("Диагональный")[0] || selected[1] || selected[0];
  const outs = byPos("Доигровщик");
  const middles = byPos("Блокирующий");
  const libero = byPos("Либеро")[0] || selected[selected.length - 1];
  const out1 = outs[0] || selected[2] || selected[0];
  const out2 = outs[1] || selected[3] || outs[0] || selected[0];
  const mid1 = middles[0] || selected[4] || selected[0];
  const mid2 = middles[1] || selected[5] || middles[0] || selected[0];
  if (![setter, diagonal, out1, out2, mid1, mid2, libero].every(Boolean)) {
    return squad.reduce((acc, p) => acc + p.overall, 0) / squad.length;
  }
  const rating = (p: Player) => p.overall * 0.62 + p.form * 0.8 + p.fitness * 0.06 + p.morale * 0.03;
  const setterPower = setter.overall * 0.45 + setter.setting * 0.55;
  const diagPower = diagonal.overall * 0.4 + diagonal.attack * 0.6;
  const outPower = (p: Player) => p.overall * 0.45 + p.attack * 0.3 + p.receive * 0.25;
  const midPower = (p: Player) => p.overall * 0.45 + p.block * 0.35 + p.attack * 0.2;
  const libPower = libero.overall * 0.4 + libero.receive * 0.4 + libero.defense * 0.2;
  let power =
    setterPower * 0.15 +
    diagPower * 0.2 +
    outPower(out1) * 0.14 +
    outPower(out2) * 0.14 +
    midPower(mid1) * 0.12 +
    midPower(mid2) * 0.12 +
    libPower * 0.11 +
    rating(setter) * 0.02;
  const avgFitness = selected.reduce((a, p) => a + p.fitness, 0) / selected.length;
  const avgMorale = selected.reduce((a, p) => a + p.morale, 0) / selected.length;
  power *= 0.91 + (avgFitness / 100) * 0.06 + (avgMorale / 100) * 0.03;
  if (tactics) {
    const serveMod = tactics.serve === "Силовая" ? 0.55 : tactics.serve === "Планер" ? 0.2 : 0.1;
    const blockMod =
      tactics.block === "Активный блок" ? 0.6 : tactics.block === "Двойной блок" ? 0.35 : 0.2;
    const tempoMod = tactics.tempo === "Быстрый темп" ? 0.45 : tactics.tempo === "Сбалансированный" ? 0.2 : 0;
    const riskMod = (tactics.risk - 3) * 0.28;
    power += serveMod + blockMod + tempoMod + riskMod;
  }
  return round1(power);
}

export function tacticRatings(players: Player[], tactics: Tactics, clubId: string) {
  const slots = getLineupPlayers(players, tactics, clubId);
  const active = slots.map((s) => s.player).filter(Boolean) as Player[];
  const average = (fn: (p: Player) => number) =>
    Math.round(active.reduce((acc, p) => acc + fn(p), 0) / Math.max(1, active.length));
  return [
    { key: "attack", label: "Атака", value: average((p) => p.attack) + Math.round((tactics.risk - 3) * 1.5) },
    { key: "block", label: "Блок", value: average((p) => p.block) + (tactics.block === "Активный блок" ? 3 : 0) },
    { key: "serve", label: "Подача", value: average((p) => p.serve) + (tactics.serve === "Силовая" ? 2 : 0) },
    { key: "receive", label: "Приём", value: average((p) => p.receive) },
    { key: "team", label: "Баланс", value: Math.round((getTeamPower(players, clubId, tactics) - 65) * 3) },
  ];
}

export function getTable(teams: Team[], fixtures: Fixture[]) {
  const rows = teams.map((team) => {
    let played = 0;
    let wins = 0;
    let losses = 0;
    let points = 0;
    let setsFor = 0;
    let setsAgainst = 0;
    const form: ("В" | "П")[] = [];
    fixtures
      .filter(
        (f) =>
          f.played &&
          (f.homeId === team.id || f.awayId === team.id),
      )
      .sort((a, b) => a.round - b.round)
      .forEach((fixture) => {
        const isHome = fixture.homeId === team.id;
        const own = (isHome ? fixture.homeSets : fixture.awaySets) ?? 0;
        const opp = (isHome ? fixture.awaySets : fixture.homeSets) ?? 0;
        played += 1;
        setsFor += own;
        setsAgainst += opp;
        if (own > opp) {
          wins += 1;
          points += opp === 2 ? 2 : 3;
          form.push("В");
        } else {
          losses += 1;
          points += own === 2 ? 1 : 0;
          form.push("П");
        }
      });
    return {
      team,
      played,
      wins,
      losses,
      points,
      setsFor,
      setsAgainst,
      setRatio: setsAgainst === 0 ? setsFor : setsFor / setsAgainst,
      form: form.slice(-5),
    };
  });
  return rows
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.wins - a.wins ||
        b.setRatio - a.setRatio ||
        b.setsFor - a.setsFor ||
        a.team.name.localeCompare(b.team.name),
    )
    .map((row, index) => ({ ...row, place: index + 1 }));
}

export function createSets(loserSets: number, winnerIsHome: boolean): SetScore[] {
  const base: SetScore[] =
    loserSets === 0
      ? [
          { home: 25, away: 19 },
          { home: 25, away: 21 },
          { home: 25, away: 17 },
        ]
      : loserSets === 1
        ? [
            { home: 25, away: 20 },
            { home: 23, away: 25 },
            { home: 25, away: 18 },
            { home: 25, away: 16 },
          ]
        : [
            { home: 25, away: 21 },
            { home: 22, away: 25 },
            { home: 25, away: 19 },
            { home: 23, away: 25 },
            { home: 15, away: 12 },
          ];
  return base.map((set) =>
    winnerIsHome ? set : { home: set.away, away: set.home },
  );
}

export type QuickResult = {
  homeSets: number;
  awaySets: number;
  sets: SetScore[];
};

export function quickSim(homeId: string, awayId: string, players: Player[]): QuickResult {
  const homePower = getTeamPower(players, homeId) + 1.6;
  const awayPower = getTeamPower(players, awayId);
  const pHome = 1 / (1 + Math.exp(-(homePower - awayPower) / 8.6));
  let homeSets = 0;
  let awaySets = 0;
  const sets: SetScore[] = [];
  while (homeSets < 3 && awaySets < 3) {
    const decider = homeSets + awaySets === 4;
    const target = decider ? 15 : 25;
    const homeWins = Math.random() < pHome;
    const loser = Math.max(
      decider ? 7 : 14,
      Math.min(target - 2, Math.round(target * 0.66 + Math.random() * target * 0.25)),
    );
    sets.push(
      homeWins
        ? { home: target, away: loser }
        : { home: loser, away: target },
    );
    if (homeWins) homeSets += 1;
    else awaySets += 1;
  }
  return { homeSets, awaySets, sets };
}

export function addQuickStats(
  players: Player[],
  teamId: string,
  setsWon: number,
  setsLost: number,
  isWinner: boolean,
): Player[] {
  const starters = getStarters(players, teamId).filter((p) => p.pos !== "Либеро");
  const allSelection = starters.length ? starters : getSquad(players, teamId).slice(0, 6);
  if (!allSelection.length) return players;
  const totalSets = setsWon + setsLost;
  const totalPoints = Math.round(totalSets * (isWinner ? 24 : 19) + Math.random() * 5);
  const weights = allSelection.map((p) => {
    if (p.pos === "Диагональный") return 2.5;
    if (p.pos === "Доигровщик") return 2.05;
    if (p.pos === "Блокирующий") return 1.2;
    if (p.pos === "Связующий") return 0.45;
    return 0.2;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const updated = players.map((p) => {
    const index = allSelection.findIndex((s) => s.id === p.id);
    if (index === -1) return p;
    const share = weights[index] / totalWeight;
    const points = Math.round(totalPoints * share);
    const aces = p.pos === "Диагональный" || p.pos === "Доигровщик" ? 1 + (index % 2) : index % 2;
    const blocks =
      p.pos === "Блокирующий"
        ? Math.round(totalSets * 0.85 + Math.random() * 2)
        : Math.round(totalSets * 0.2);
    return {
      ...p,
      fitness: clamp(p.fitness - (2 + Math.round(Math.random() * 3)), 40, 100),
      form: clamp(
        (isWinner ? p.form + 1 : p.form - 1),
        3,
        10,
      ),
      morale: clamp(p.morale + (isWinner ? 2 : -3), 40, 100),
      stats: {
        ...p.stats,
        matches: p.stats.matches + 1,
        sets: p.stats.sets + totalSets,
        points: p.stats.points + points,
        attacks: p.stats.attacks + Math.round(points * 1.7),
        aces: p.stats.aces + aces,
        blocks: p.stats.blocks + blocks,
      },
    };
  });
  return updated;
}

function initialUserScore(round: number, isHome: boolean) {
  const oppositeSets = round === 1 ? 1 : round === 2 ? 0 : 2;
  return createSets(oppositeSets, isHome);
}

export function createGame(clubId: string, manager = "Михаил Белов"): GameState {
  let players = createPlayers();
  let fixtures = generateFixtures();
  fixtures = fixtures.map((fixture) => {
    if (fixture.round > 3) return fixture;
    const userMatch =
      fixture.homeId === clubId || fixture.awayId === clubId;
    if (userMatch) {
      const userIsHome = fixture.homeId === clubId;
      const sets = initialUserScore(fixture.round, userIsHome);
      const opponentSets = fixture.round === 1 ? 1 : fixture.round === 2 ? 0 : 2;
      const homeSets = userIsHome ? 3 : opponentSets;
      const awaySets = userIsHome ? opponentSets : 3;
      players = addQuickStats(players, fixture.homeId, homeSets, awaySets, homeSets > awaySets);
      players = addQuickStats(players, fixture.awayId, awaySets, homeSets, awaySets > homeSets);
      return {
        ...fixture,
        played: true,
        homeSets,
        awaySets,
        sets,
        attendance: 2800 + ((fixture.round * 377) % 1800),
      };
    }
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
    return {
      ...fixture,
      played: true,
      homeSets: result.homeSets,
      awaySets: result.awaySets,
      sets: result.sets,
      attendance: 1200 + ((fixture.round * 433) % 3600),
    };
  });

  const offerPool = getSquad(players, clubId)
    .filter((p) => p.overall < 86 && p.overall > 76)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  const suitors = ["zenit-spb", "kazan", "belogorie", "loko"].filter(
    (id) => id !== clubId,
  );
  const offers = offerPool.map((player, index) => ({
    id: `offer-${index}`,
    playerId: player.id,
    fromTeamId: suitors[index % suitors.length],
    amount: round1(player.value * (0.82 + index * 0.06)),
  }));

  const tactics: Tactics = {
    system: "5-1",
    risk: 3,
    serve: "Силовая",
    block: "Двойной блок",
    tempo: "Быстрый темп",
    lineup: lineupFromStarters(players, clubId),
  };

  return {
    version: 1,
    season: SEASON,
    clubId,
    manager,
    budget: TEAM_MAP[clubId]?.budget || 300,
    players: assignDefaultStarters(players),
    fixtures,
    cup: createCup(clubId),
    tactics,
    training: { ...INITIAL_TRAINING, log: [...INITIAL_TRAINING.log] },
    notifications: INITIAL_NOTIFICATIONS.map((n) => ({ ...n })),
    news: [...INITIAL_NEWS],
    offers,
    transfers: [],
    facilities: INITIAL_FACILITIES.map((f) => ({ ...f })),
    sponsors: INITIAL_SPONSORS.map((s) => ({ ...s })),
    boardConfidence: 82,
    createdAt: new Date().toISOString(),
  };
}

export function nextFixtureFor(fixtures: Fixture[], clubId: string): Fixture | undefined {
  return fixtures
    .filter(
      (fixture) =>
        !fixture.played &&
        (fixture.homeId === clubId || fixture.awayId === clubId),
    )
    .sort((a, b) => a.round - b.round)[0];
}

export function lastResultsFor(fixtures: Fixture[], clubId: string, limit = 5): Fixture[] {
  return fixtures
    .filter(
      (f) =>
        f.played && (f.homeId === clubId || f.awayId === clubId),
    )
    .sort((a, b) => b.round - a.round)
    .slice(0, limit);
}

export function currentRoundFor(fixtures: Fixture[], clubId: string) {
  return nextFixtureFor(fixtures, clubId)?.round || Math.max(...fixtures.map((f) => f.round));
}

export function resultForClub(fixture: Fixture, clubId: string) {
  const isHome = fixture.homeId === clubId;
  const own = (isHome ? fixture.homeSets : fixture.awaySets) ?? 0;
  const opp = (isHome ? fixture.awaySets : fixture.homeSets) ?? 0;
  return { own, opp, won: own > opp, isHome };
}

export function recentForm(fixtures: Fixture[], clubId: string, limit = 5) {
  return lastResultsFor(fixtures, clubId, limit)
    .reverse()
    .map((fixture) => (resultForClub(fixture, clubId).won ? "В" : "П"));
}

export function createMatchState(
  fixture: Fixture,
  competition: "league" | "cup" = "league",
  cupRoundIndex?: number,
  cupMatchIndex?: number,
): MatchState {
  return {
    fixtureId: fixture.id,
    competition,
    cupRoundIndex,
    cupMatchIndex,
    homeId: fixture.homeId,
    awayId: fixture.awayId,
    setNumber: 1,
    points: { home: 0, away: 0 },
    sets: { home: 0, away: 0 },
    setHistory: [],
    serving: Math.random() > 0.5 ? "home" : "away",
    stats: {
      home: { points: 0, attacks: 0, aces: 0, blocks: 0, errors: 0 },
      away: { points: 0, attacks: 0, aces: 0, blocks: 0, errors: 0 },
    },
    playerStats: {},
    events: [
      {
        id: 1,
        kind: "start",
        side: "neutral",
        text: `Матч начался. Подача у «${TEAM_MAP[Math.random() > 0.5 ? fixture.homeId : fixture.awayId].name}».`,
        home: 0,
        away: 0,
        set: 1,
      },
    ],
    finished: false,
    momentum: 0,
    homeBoost: 0,
    timeouts: { home: 2, away: 2 },
    lastEventId: 1,
    attendance: 2400 + Math.round(Math.random() * 2500),
  };
}

const randOf = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

function activeCourt(players: Player[], teamId: string) {
  const starters = getStarters(players, teamId);
  const court = starters.filter((p) => p.pos !== "Либеро");
  return court.length >= 4 ? court : getSquad(players, teamId).slice(0, 6);
}

function attackerFor(players: Player[], teamId: string) {
  const court = activeCourt(players, teamId);
  const pool = court.flatMap((p) => {
    const weight = p.pos === "Диагональный" ? 4 : p.pos === "Доигровщик" ? 3 : p.pos === "Блокирующий" ? 2 : 1;
    return Array.from({ length: weight }, () => p);
  });
  return randOf(pool) || court[0];
}

function blockerFor(players: Player[], teamId: string) {
  const court = activeCourt(players, teamId);
  return randOf(court.filter((p) => p.pos === "Блокирующий")) || court[0];
}

function serverFor(players: Player[], teamId: string) {
  const court = activeCourt(players, teamId);
  return [...court].sort((a, b) => b.serve - a.serve)[0];
}

function receiverFor(players: Player[], teamId: string) {
  const court = activeCourt(players, teamId);
  return randOf(court.filter((p) => p.pos === "Доигровщик" || p.pos === "Либеро")) || court[0];
}

function setWin(
  state: MatchState,
  side: "home" | "away",
): MatchState {
  const homeName = TEAM_MAP[state.homeId].name;
  const awayName = TEAM_MAP[state.awayId].name;
  const setScore = { ...state.points };
  const sets = { ...state.sets };
  sets[side] += 1;
  const event: MatchState["events"][number] = {
    id: state.lastEventId + 1,
    kind: "set",
    side,
    text: `Сет завершён · ${setScore.home}:${setScore.away}. ${side === "home" ? homeName : awayName} впереди.`,
    home: setScore.home,
    away: setScore.away,
    set: state.setNumber,
  };
  const matchFinished = sets.home === 3 || sets.away === 3;
  if (matchFinished) {
    const winnerId = sets.home === 3 ? state.homeId : state.awayId;
    event.text = `Матч завершён! «${TEAM_MAP[winnerId].name}» побеждает со счётом ${sets.home}:${sets.away}.`;
  }
  return {
    ...state,
    sets,
    setHistory: [...state.setHistory, setScore],
    setNumber: state.setNumber + 1,
    points: { home: 0, away: 0 },
    serving: side,
    events: [...state.events, event].slice(-60),
    lastEventId: event.id,
    finished: matchFinished,
    winnerId: matchFinished ? (sets.home === 3 ? state.homeId : state.awayId) : undefined,
    momentum: 0,
  };
}

export function simulateRally(
  state: MatchState,
  homePower: number,
  awayPower: number,
  players: Player[],
): MatchState {
  if (state.finished) return state;
  const servingBonus = state.serving === "home" ? 1.5 : -1.5;
  const homeChance =
    1 / (1 + Math.exp(-(homePower - awayPower + servingBonus + state.momentum + state.homeBoost) / 28));
  const scoringSide: "home" | "away" = Math.random() < homeChance ? "home" : "away";
  const concedingSide: "home" | "away" = scoringSide === "home" ? "away" : "home";
  const scoringTeam = scoringSide === "home" ? state.homeId : state.awayId;
  const concedingTeam = concedingSide === "home" ? state.homeId : state.awayId;
  const roll = Math.random();
  const nextStats = {
    home: { ...state.stats.home },
    away: { ...state.stats.away },
  };
  const playerStats = { ...state.playerStats };
  let text = "";
  let kind: "ace" | "block" | "attack" | "error" = "attack";
  let mvpPlayerId: string | undefined;
  const bump = (id: string, key: "points" | "aces" | "blocks", amount: number) => {
    playerStats[id] = {
      points: playerStats[id]?.points || 0,
      aces: playerStats[id]?.aces || 0,
      blocks: playerStats[id]?.blocks || 0,
    };
    playerStats[id][key] += amount;
  };
  if (roll < 0.08) {
    kind = "ace";
    const server = serverFor(players, scoringTeam);
    text = `Эйс! ${server.name} подаёт навылет`;
    mvpPlayerId = server?.id;
    nextStats[scoringSide].aces += 1;
    nextStats[scoringSide].points += 1;
  } else if (roll < 0.24) {
    kind = "block";
    const blocker = blockerFor(players, scoringTeam);
    text = `Блок! ${blocker?.name || "Стенка"} закрывает атаку`;
    mvpPlayerId = blocker?.id;
    nextStats[scoringSide].blocks += 1;
    nextStats[scoringSide].points += 1;
  } else if (roll < 0.46) {
    kind = "error";
    const receiver = receiverFor(players, concedingTeam);
    text = `Ошибка соперника — не справился(ась) с приёмом ${receiver?.name || ""}`.trim();
    nextStats[scoringSide].points += 1;
    nextStats[scoringSide].errors += 0;
    nextStats[concedingSide].errors += 1;
  } else {
    kind = "attack";
    const attacker = attackerFor(players, scoringTeam);
    text = `Атака в площадку — ${attacker?.name || "нападающий"}`;
    mvpPlayerId = attacker?.id;
    nextStats[scoringSide].attacks += 1;
    nextStats[scoringSide].points += 1;
  }
  if (mvpPlayerId) bump(mvpPlayerId, "points", 1);
  if (kind === "ace" && mvpPlayerId) bump(mvpPlayerId, "aces", 1);
  if (kind === "block" && mvpPlayerId) bump(mvpPlayerId, "blocks", 1);
  const points = { ...state.points };
  points[scoringSide] += 1;
  const event: MatchState["events"][number] = {
    id: state.lastEventId + 1,
    kind,
    side: scoringSide,
    text,
    home: points.home,
    away: points.away,
    set: state.setNumber,
  };
  let next: MatchState = {
    ...state,
    points,
    serving: scoringSide,
    stats: nextStats,
    playerStats,
    events: [...state.events, event].slice(-60),
    lastEventId: event.id,
    momentum: state.momentum * 0.72,
    homeBoost: state.homeBoost * 0.9,
    finished: nextStats.home.points + nextStats.away.points === 0 && false,
  };
  next = { ...next, finished: false };
  const target = state.setNumber === 5 ? 15 : 25;
  if (
    points[scoringSide] >= target &&
    points[scoringSide] - points[concedingSide] >= 2
  ) {
    next = setWin(next, scoringSide);
  }
  return next;
}

export function simulateSet(
  state: MatchState,
  homePower: number,
  awayPower: number,
  players: Player[],
): MatchState {
  let next = state;
  const startingSet = state.setNumber;
  let guard = 0;
  while (!next.finished && next.setNumber === startingSet && guard < 250) {
    next = simulateRally(next, homePower, awayPower, players);
    guard += 1;
  }
  return next;
}

export function simulateToEnd(
  state: MatchState,
  homePower: number,
  awayPower: number,
  players: Player[],
): MatchState {
  let next = state;
  let guard = 0;
  while (!next.finished && guard < 1500) {
    next = simulateRally(next, homePower, awayPower, players);
    guard += 1;
  }
  return next;
}

export function callTimeout(state: MatchState, side: "home" | "away" = "home"): MatchState {
  if (state.finished || state.timeouts[side] <= 0) return state;
  const teamName = side === "home" ? TEAM_MAP[state.homeId].name : TEAM_MAP[state.awayId].name;
  const event: MatchState["events"][number] = {
    id: state.lastEventId + 1,
    kind: "timeout",
    side,
    text: `Тайм-аут · ${teamName}. Штаб настраивает команду на концовку`,
    home: state.points.home,
    away: state.points.away,
    set: state.setNumber,
  };
  return {
    ...state,
    timeouts: { ...state.timeouts, [side]: state.timeouts[side] - 1 },
    momentum: state.momentum + (side === "home" ? 3.2 : -3.2),
    events: [...state.events, event].slice(-60),
    lastEventId: event.id,
  };
}

export function makeSubstitution(state: MatchState, players: Player[], teamId: string): MatchState {
  if (state.finished) return state;
  const squad = getSquad(players, teamId);
  const bench = squad
    .filter((p) => !p.starter && !p.listed && p.pos !== "Либеро")
    .sort((a, b) => b.overall - a.overall);
  const incoming = bench[0];
  if (!incoming) return state;
  const event: MatchState["events"][number] = {
    id: state.lastEventId + 1,
    kind: "sub",
    side: teamId === state.homeId ? "home" : "away",
    text: `Замена · на площадку выходит ${incoming.name} (#${incoming.number})`,
    home: state.points.home,
    away: state.points.away,
    set: state.setNumber,
  };
  return {
    ...state,
    homeBoost: state.homeBoost + (teamId === state.homeId ? 1.4 : 0),
    momentum: state.momentum + (teamId === state.homeId ? 1.5 : -1.5),
    events: [...state.events, event].slice(-60),
    lastEventId: event.id,
  };
}

export function matchMvp(state: MatchState, players: Player[]): Player | undefined {
  const featuredTeamId = state.winnerId || state.homeId;
  const entries = Object.entries(state.playerStats)
    .filter(([id]) => players.find((p) => p.id === id)?.teamId === featuredTeamId)
    .sort(([, a], [, b]) => b.points - a.points);
  if (entries[0]) {
    return players.find((p) => p.id === entries[0][0]);
  }
  return getStarters(players, featuredTeamId).sort((a, b) => b.overall - a.overall)[0];
}

export function applyFinishedMatch(
  players: Player[],
  teamId: string,
  state: MatchState,
): Player[] {
  const setsTotal = state.setHistory.length;
  const won = state.winnerId === teamId;
  return players.map((p) => {
    if (p.teamId !== teamId) return p;
    if (!p.starter) return p;
    const personal = state.playerStats[p.id];
    const basePoints =
      personal?.points ||
      Math.round(
        (p.pos === "Диагональный" ? 3 : p.pos === "Доигровщик" ? 2 : p.pos === "Блокирующий" ? 1 : 0) *
          setsTotal *
          (0.9 + Math.random() * 0.2),
      );
    const aces = personal?.aces || (p.pos === "Либеро" ? 0 : Math.round(Math.random() * 2));
    const blocks = personal?.blocks || (p.pos === "Блокирующий" ? Math.round(Math.random() * 3) : 0);
    return {
      ...p,
      fitness: clamp(p.fitness - (2 + Math.round(setsTotal * 0.6)), 30, 100),
      form: clamp(won ? p.form + 1 : p.form - 1, 3, 10),
      morale: clamp(p.morale + (won ? 3 : -4), 35, 100),
      stats: {
        ...p.stats,
        matches: p.stats.matches + 1,
        sets: p.stats.sets + setsTotal,
        points: p.stats.points + Math.round(basePoints),
        attacks: p.stats.attacks + Math.round(basePoints * 1.65),
        aces: p.stats.aces + aces,
        blocks: p.stats.blocks + blocks,
      },
    };
  });
}

export const userWonLast = (game: GameState) => {
  const last = lastResultsFor(game.fixtures, game.clubId, 1)[0];
  return last ? resultForClub(last, game.clubId).won : false;
};

export function topScorers(players: Player[], limit = 8) {
  return [...players]
    .filter((p) => p.teamId !== "free")
    .sort((a, b) => b.stats.points - a.stats.points)
    .slice(0, limit);
}

export function getCupRoundToPlay(cup: CupState): CupRound | undefined {
  return cup.rounds.find((round) => !round.done);
}

export function simulateCupMatch(
  cup: CupState,
  roundIndex: number,
  matchIndex: number,
  players: Player[],
): CupState {
  const rounds = cup.rounds.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) }));
  const match = rounds[roundIndex]?.matches[matchIndex];
  if (!match || match.played) return cup;
  const result = quickSim(match.homeId, match.awayId, players);
  match.homeSets = result.homeSets;
  match.awaySets = result.awaySets;
  match.sets = result.sets;
  match.winnerId = result.homeSets > result.awaySets ? match.homeId : match.awayId;
  match.played = true;
  rounds[roundIndex].done = rounds[roundIndex].matches.every((m) => m.played);
  return buildNextCupRound({ ...cup, rounds });
}

export function buildNextCupRound(cup: CupState): CupState {
  const rounds = cup.rounds.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) }));
  for (let i = 0; i < rounds.length - 1; i += 1) {
    const round = rounds[i];
    if (!round.done) break;
    const next = rounds[i + 1];
    if (next.matches.length > 0 || !round.matches.length) continue;
    const winners = round.matches.map((m) => m.winnerId).filter(Boolean) as string[];
    if (winners.length !== round.matches.length) break;
    next.matches = winners
      .reduce<{ homeId: string; awayId: string }[]>((acc, id, index) => {
        if (index % 2 === 0) acc.push({ homeId: id, awayId: "" });
        else acc[acc.length - 1].awayId = id;
        return acc;
      }, [])
      .map((pair, index) => ({
        id: `cup-${next.id}-${index}`,
        homeId: pair.homeId,
        awayId: pair.awayId,
        played: false,
      }));
    next.done = false;
    rounds[i + 1] = next;
  }
  const finalRound = rounds[rounds.length - 1];
  const champion = finalRound.done
    ? finalRound.matches[0]?.winnerId
    : cup.champion;
  return { ...cup, rounds, champion };
}

export function cupCurrentRound(cup: CupState) {
  return cup.rounds.find((round) => !round.done && round.matches.length > 0);
}

export function cupUserMatch(cup: CupState, clubId: string) {
  const roundIndex = cup.rounds.findIndex((round) => !round.done && round.matches.length > 0);
  if (roundIndex < 0) return undefined;
  const matchIndex = cup.rounds[roundIndex].matches.findIndex(
    (match) => !match.played && (match.homeId === clubId || match.awayId === clubId),
  );
  if (matchIndex < 0) return undefined;
  return { roundIndex, matchIndex, match: cup.rounds[roundIndex].matches[matchIndex] };
}

export function userLeaguePosition(game: GameState) {
  const table = getTable(TEAMS, game.fixtures);
  return table.find((row) => row.team.id === game.clubId) || table[0];
}

export function overallSquadRating(players: Player[], clubId: string) {
  const squad = getSquad(players, clubId);
  return squad.length
    ? round1(squad.reduce((acc, p) => acc + p.overall, 0) / squad.length)
    : 0;
}

export function payroll(players: Player[], clubId: string) {
  return round1(
    getSquad(players, clubId).reduce((acc, p) => acc + p.salary, 0),
  );
}

export function fixtureFor(
  homeId: string,
  awayId: string,
  round: number,
  id: string,
  date: string,
): Fixture {
  return {
    id,
    round,
    date,
    homeId,
    awayId,
    played: false,
  };
}
