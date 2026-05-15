export type CardType = 'english' | 'chinese' | 'phrase' | 'custom';

export type ReviewAction = 'later' | '1d' | '3d' | '7d' | '1m';

export type ReviewSide = 'front' | 'back' | 'random';

export type Deck = {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  type: CardType;
  enableSpeech: boolean;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewLog = {
  id: string;
  cardId: string;
  deckId: string;
  action: ReviewAction;
  reviewedAt: string;
  nextReviewAt: string;
};

export type DeckSummary = Deck & {
  cardCount: number;
  dueCount: number;
};

export type DailyStats = {
  reviewedCount: number;
  addedCount: number;
  laterCount: number;
  oneDayCount: number;
  threeDayCount: number;
  sevenDayCount: number;
  oneMonthCount: number;
  streakDays: number;
};
