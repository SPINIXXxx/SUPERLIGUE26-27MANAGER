export type ScreenId =
  | "dashboard"
  | "squad"
  | "tactics"
  | "training"
  | "calendar"
  | "league"
  | "cup"
  | "transfers"
  | "club"
  | "finances";

export type PosCode = "СВ" | "ДИА" | "ДОИ" | "БЛ" | "ЛИБ";

export type Pos =
  | "Связующий"
  | "Диагональный"
  | "Доигровщик"
  | "Блокирующий"
  | "Либеро";

export type Team = {
  id: string;
  name: string;
  full: string;
  short: string;
  city: string;
  colors: [string, string];
  prestige: number;
  budget: number;
  arena: string;
  capacity: number;
  founded: number;
  president: string;
  coach: string;
  objective: string;
};

export type PlayerStatLine = {
  matches: number;
  sets: number;
  points: number;
  attacks: number;
  aces: number;
  blocks: number;
  mvp: number;
};

export type Player = {
  id: string;
  name: string;
  teamId: string;
  pos: Pos;
  posCode: PosCode;
  number: number;
  age: number;
  height: number;
  country: string;
  flag: string;
  overall: number;
  potential: number;
  form: number;
  fitness: number;
  morale: number;
  attack: number;
  block: number;
  serve: number;
  receive: number;
  defense: number;
  setting: number;
  salary: number;
  contract: number;
  starter: boolean;
  value: number;
  listed: boolean;
  askingPrice: number;
  stats: PlayerStatLine;
};

export type SetScore = { home: number; away: number };

export type Fixture = {
  id: string;
  round: number;
  date: string;
  homeId: string;
  awayId: string;
  played: boolean;
  homeSets?: number;
  awaySets?: number;
  sets?: SetScore[];
  attendance?: number;
};

export type LineupSlot =
  | "setter"
  | "diagonal"
  | "outside1"
  | "outside2"
  | "middle1"
  | "middle2"
  | "libero";

export type Lineup = Partial<Record<LineupSlot, string>>;

export type Tactics = {
  system: "5-1" | "6-2";
  risk: number;
  serve: "Силовая" | "Планер" | "Тактическая";
  block: "Двойной блок" | "Зонный блок" | "Активный блок";
  tempo: "Быстрый темп" | "Сбалансированный" | "Терпеливый";
  lineup: Lineup;
};

export type TrainingFocus =
  | "Атака"
  | "Блок"
  | "Подача"
  | "Приём"
  | "Физика"
  | "Восстановление";

export type TrainingState = {
  focus: TrainingFocus;
  intensity: 1 | 2 | 3;
  sessions: number;
  sessionsTotal: number;
  log: { id: string; text: string; effect: string }[];
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "match" | "transfer" | "board" | "training";
};

export type NewsItem = {
  id: string;
  date: string;
  tag: string;
  title: string;
  body: string;
};

export type IncomingOffer = {
  id: string;
  playerId: string;
  fromTeamId: string;
  amount: number;
};

export type TransferLog = {
  id: string;
  playerName: string;
  fromTeamId: string;
  toTeamId: string;
  amount: number;
  direction: "in" | "out";
};

export type Facility = {
  id: string;
  name: string;
  description: string;
  level: number;
  max: number;
  baseCost: number;
  effect: string;
};

export type Sponsor = {
  id: string;
  name: string;
  sphere: string;
  amount: number;
  signed: boolean;
  years: number;
};

export type CupMatch = {
  id: string;
  homeId: string;
  awayId: string;
  homeSets?: number;
  awaySets?: number;
  sets?: SetScore[];
  winnerId?: string;
  played: boolean;
};

export type CupRound = {
  id: string;
  name: string;
  matches: CupMatch[];
  done: boolean;
};

export type CupState = {
  rounds: CupRound[];
  champion?: string;
};

export type MatchTeamStats = {
  points: number;
  attacks: number;
  aces: number;
  blocks: number;
  errors: number;
};

export type RallyEvent = {
  id: number;
  kind: "ace" | "block" | "attack" | "error" | "set" | "timeout" | "sub" | "start";
  side: "home" | "away" | "neutral";
  text: string;
  home: number;
  away: number;
  set: number;
};

export type MatchState = {
  fixtureId: string;
  competition: "league" | "cup";
  cupRoundIndex?: number;
  cupMatchIndex?: number;
  homeId: string;
  awayId: string;
  setNumber: number;
  points: { home: number; away: number };
  sets: { home: number; away: number };
  setHistory: SetScore[];
  serving: "home" | "away";
  stats: { home: MatchTeamStats; away: MatchTeamStats };
  playerStats: Record<string, { points: number; aces: number; blocks: number }>;
  events: RallyEvent[];
  finished: boolean;
  winnerId?: string;
  momentum: number;
  homeBoost: number;
  timeouts: { home: number; away: number };
  lastEventId: number;
  attendance: number;
};

export type GameState = {
  version: number;
  season: string;
  clubId: string;
  manager: string;
  budget: number;
  players: Player[];
  fixtures: Fixture[];
  cup: CupState;
  tactics: Tactics;
  training: TrainingState;
  notifications: Notification[];
  news: NewsItem[];
  offers: IncomingOffer[];
  transfers: TransferLog[];
  facilities: Facility[];
  sponsors: Sponsor[];
  boardConfidence: number;
  createdAt: string;
};
