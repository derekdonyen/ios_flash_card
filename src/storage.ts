import * as SQLite from 'expo-sqlite';
import { addReviewInterval, nowIso, todayRange, localDateKey } from './date';
import { Card, CardType, DailyStats, Deck, DeckSummary, ReviewAction } from './types';

const db = SQLite.openDatabaseSync('memory-cards.db');

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function rowToDeckSummary(row: Record<string, unknown>): DeckSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    category: String(row.category ?? '自訂'),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    cardCount: Number(row.cardCount ?? 0),
    dueCount: Number(row.dueCount ?? 0)
  };
}

function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: String(row.id),
    deckId: String(row.deckId),
    front: String(row.front),
    back: String(row.back),
    type: String(row.type) as CardType,
    enableSpeech: Number(row.enableSpeech) === 1,
    nextReviewAt: String(row.nextReviewAt),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  };
}

export async function initializeDatabase() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '自訂',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      deckId TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      type TEXT NOT NULL,
      enableSpeech INTEGER NOT NULL DEFAULT 0,
      nextReviewAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (deckId) REFERENCES decks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_logs (
      id TEXT PRIMARY KEY NOT NULL,
      cardId TEXT NOT NULL,
      deckId TEXT NOT NULL,
      action TEXT NOT NULL,
      reviewedAt TEXT NOT NULL,
      nextReviewAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cards_deck_due ON cards(deckId, nextReviewAt);
    CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed ON review_logs(reviewedAt);
  `);
}

export async function listDecks(): Promise<DeckSummary[]> {
  const now = nowIso();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `
    SELECT
      decks.*,
      COUNT(cards.id) AS cardCount,
      SUM(CASE WHEN cards.nextReviewAt <= ? THEN 1 ELSE 0 END) AS dueCount
    FROM decks
    LEFT JOIN cards ON cards.deckId = decks.id
    GROUP BY decks.id
    ORDER BY decks.updatedAt DESC
    `,
    [now]
  );
  return rows.map(rowToDeckSummary);
}

export async function createDeck(input: Pick<Deck, 'name' | 'description' | 'category'>) {
  const createdAt = nowIso();
  const deck: Deck = {
    id: id('deck'),
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category.trim() || '自訂',
    createdAt,
    updatedAt: createdAt
  };

  await db.runAsync(
    'INSERT INTO decks (id, name, description, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [deck.id, deck.name, deck.description, deck.category, deck.createdAt, deck.updatedAt]
  );

  return deck;
}

export async function deleteDeck(deckId: string) {
  await db.runAsync('DELETE FROM decks WHERE id = ?', [deckId]);
}

export async function listCards(deckId: string): Promise<Card[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM cards WHERE deckId = ? ORDER BY createdAt DESC',
    [deckId]
  );
  return rows.map(rowToCard);
}

export async function listDueCards(deckId: string, includeAll: boolean): Promise<Card[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    includeAll
      ? 'SELECT * FROM cards WHERE deckId = ? ORDER BY RANDOM()'
      : 'SELECT * FROM cards WHERE deckId = ? AND nextReviewAt <= ? ORDER BY RANDOM()',
    includeAll ? [deckId] : [deckId, nowIso()]
  );
  return rows.map(rowToCard);
}

export async function createCard(input: {
  deckId: string;
  front: string;
  back: string;
  type: CardType;
  enableSpeech: boolean;
}) {
  const createdAt = nowIso();
  const card: Card = {
    id: id('card'),
    deckId: input.deckId,
    front: input.front.trim(),
    back: input.back.trim(),
    type: input.type,
    enableSpeech: input.enableSpeech,
    nextReviewAt: createdAt,
    createdAt,
    updatedAt: createdAt
  };

  await db.runAsync(
    `
    INSERT INTO cards
      (id, deckId, front, back, type, enableSpeech, nextReviewAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      card.id,
      card.deckId,
      card.front,
      card.back,
      card.type,
      card.enableSpeech ? 1 : 0,
      card.nextReviewAt,
      card.createdAt,
      card.updatedAt
    ]
  );
  await touchDeck(card.deckId);
  return card;
}

export async function deleteCard(cardId: string, deckId: string) {
  await db.runAsync('DELETE FROM cards WHERE id = ?', [cardId]);
  await touchDeck(deckId);
}

export async function reviewCard(card: Card, action: ReviewAction) {
  const reviewedAt = nowIso();
  const nextReviewAt = addReviewInterval(action, new Date(reviewedAt));
  await db.runAsync('UPDATE cards SET nextReviewAt = ?, updatedAt = ? WHERE id = ?', [
    nextReviewAt,
    reviewedAt,
    card.id
  ]);
  await db.runAsync(
    'INSERT INTO review_logs (id, cardId, deckId, action, reviewedAt, nextReviewAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id('review'), card.id, card.deckId, action, reviewedAt, nextReviewAt]
  );
  await touchDeck(card.deckId);
  return nextReviewAt;
}

export async function getDailyStats(): Promise<DailyStats> {
  const range = todayRange();
  const reviewRows = await db.getAllAsync<Record<string, unknown>>(
    `
    SELECT action, COUNT(*) AS count
    FROM review_logs
    WHERE reviewedAt >= ? AND reviewedAt < ?
    GROUP BY action
    `,
    [range.start, range.end]
  );
  const added = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT COUNT(*) AS count FROM cards WHERE createdAt >= ? AND createdAt < ?',
    [range.start, range.end]
  );
  const allReviewDays = await db.getAllAsync<Record<string, unknown>>(
    'SELECT reviewedAt FROM review_logs ORDER BY reviewedAt DESC'
  );

  const actionCounts = new Map(reviewRows.map((row) => [String(row.action), Number(row.count)]));

  return {
    reviewedCount: reviewRows.reduce((total, row) => total + Number(row.count), 0),
    addedCount: Number(added?.count ?? 0),
    laterCount: actionCounts.get('later') ?? 0,
    oneDayCount: actionCounts.get('1d') ?? 0,
    threeDayCount: actionCounts.get('3d') ?? 0,
    sevenDayCount: actionCounts.get('7d') ?? 0,
    oneMonthCount: actionCounts.get('1m') ?? 0,
    streakDays: calculateStreak(allReviewDays.map((row) => String(row.reviewedAt)))
  };
}

async function touchDeck(deckId: string) {
  await db.runAsync('UPDATE decks SET updatedAt = ? WHERE id = ?', [nowIso(), deckId]);
}

function calculateStreak(reviewedAtValues: string[]) {
  const days = new Set(reviewedAtValues.map(localDateKey));
  let cursor = new Date();
  let streak = 0;

  while (days.has(localDateKey(cursor.toISOString()))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}
