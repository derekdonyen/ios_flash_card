import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DimensionValue,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { isDue } from './src/date';
import {
  createCard,
  createDeck,
  deleteCard,
  deleteDeck,
  getDailyStats,
  initializeDatabase,
  listCards,
  listDecks,
  listDueCards,
  reviewCard
} from './src/storage';
import { Card, CardType, DailyStats, DeckSummary, ReviewAction, ReviewSide } from './src/types';

type Screen = 'home' | 'deck' | 'newDeck' | 'newCard' | 'review' | 'stats';

const cardTypes: Array<{ label: string; value: CardType }> = [
  { label: '英文', value: 'english' },
  { label: '中文', value: 'chinese' },
  { label: '片語', value: 'phrase' },
  { label: '自訂', value: 'custom' }
];

const reviewActions: Array<{ label: string; value: ReviewAction; tone: 'muted' | 'blue' | 'green' }> = [
  { label: '稍後', value: 'later', tone: 'muted' },
  { label: '1日', value: '1d', tone: 'blue' },
  { label: '3日', value: '3d', tone: 'blue' },
  { label: '7日', value: '7d', tone: 'green' },
  { label: '1月', value: '1m', tone: 'green' }
];

const emptyStats: DailyStats = {
  reviewedCount: 0,
  addedCount: 0,
  laterCount: 0,
  oneDayCount: 0,
  threeDayCount: 0,
  sevenDayCount: 0,
  oneMonthCount: 0,
  streakDays: 0
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MemoryCardApp />
    </SafeAreaProvider>
  );
}

function MemoryCardApp() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<DeckSummary | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<DailyStats>(emptyStats);

  const refresh = useCallback(async (deckId: string | null | undefined = selectedDeck?.id) => {
    const nextDecks = await listDecks();
    const nextStats = await getDailyStats();
    setDecks(nextDecks);
    setStats(nextStats);

    if (deckId) {
      const currentDeck = nextDecks.find((deck) => deck.id === deckId) ?? null;
      setSelectedDeck(currentDeck);
      if (currentDeck) {
        setCards(await listCards(currentDeck.id));
      }
    }
  }, [selectedDeck]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        await initializeDatabase();
        const nextDecks = await listDecks();
        const nextStats = await getDailyStats();

        if (mounted) {
          setDecks(nextDecks);
          setStats(nextStats);
          setReady(true);
        }
      } catch (error: unknown) {
        Alert.alert('資料庫初始化失敗', error instanceof Error ? error.message : '請重新啟動 App');
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  const openDeck = async (deck: DeckSummary) => {
    setSelectedDeck(deck);
    setCards(await listCards(deck.id));
    setScreen('deck');
  };

  const goHome = async () => {
    await refresh(null);
    setScreen('home');
  };

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator color="#2563eb" size="large" />
          <Text style={styles.loadingText}>正在準備記憶卡片...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" />
      {screen === 'home' && (
        <HomeScreen
          decks={decks}
          stats={stats}
          onOpenDeck={openDeck}
          onNewDeck={() => setScreen('newDeck')}
          onStats={() => setScreen('stats')}
        />
      )}
      {screen === 'newDeck' && (
        <DeckFormScreen
          onCancel={() => setScreen('home')}
          onSave={async (input) => {
            const deck = await createDeck(input);
            await refresh();
            await openDeck({
              ...deck,
              cardCount: 0,
              dueCount: 0
            });
          }}
        />
      )}
      {screen === 'deck' && selectedDeck && (
        <DeckScreen
          deck={selectedDeck}
          cards={cards}
          onBack={goHome}
          onNewCard={() => setScreen('newCard')}
          onReview={() => setScreen('review')}
          onDeleteDeck={() => {
            Alert.alert('刪除牌組', `確定刪除「${selectedDeck.name}」和裡面的所有卡片嗎？`, [
              { text: '取消', style: 'cancel' },
              {
                text: '刪除',
                style: 'destructive',
                onPress: async () => {
                  await deleteDeck(selectedDeck.id);
                  setSelectedDeck(null);
                  await goHome();
                }
              }
            ]);
          }}
          onDeleteCard={(card) => {
            Alert.alert('刪除卡片', '確定要刪除這張卡片嗎？', [
              { text: '取消', style: 'cancel' },
              {
                text: '刪除',
                style: 'destructive',
                onPress: async () => {
                  await deleteCard(card.id, card.deckId);
                  setCards(await listCards(card.deckId));
                  await refresh(card.deckId);
                }
              }
            ]);
          }}
        />
      )}
      {screen === 'newCard' && selectedDeck && (
        <CardFormScreen
          deck={selectedDeck}
          onCancel={() => setScreen('deck')}
          onSave={async (input) => {
            await createCard({ deckId: selectedDeck.id, ...input });
            setCards(await listCards(selectedDeck.id));
            await refresh();
            setScreen('deck');
          }}
        />
      )}
      {screen === 'review' && selectedDeck && (
        <ReviewScreen
          deck={selectedDeck}
          onBack={async () => {
            setCards(await listCards(selectedDeck.id));
            await refresh();
            setScreen('deck');
          }}
        />
      )}
      {screen === 'stats' && <StatsScreen stats={stats} decks={decks} onBack={goHome} />}
    </SafeAreaView>
  );
}

function HomeScreen({
  decks,
  stats,
  onOpenDeck,
  onNewDeck,
  onStats
}: {
  decks: DeckSummary[];
  stats: DailyStats;
  onOpenDeck: (deck: DeckSummary) => void;
  onNewDeck: () => void;
  onStats: () => void;
}) {
  const dueTotal = decks.reduce((total, deck) => total + deck.dueCount, 0);

  return (
    <ScreenFrame
      title="記憶卡片"
      subtitle="今天到期的卡片和你的牌組都在這裡。"
      rightAction={<IconButton name="stats-chart" label="統計" onPress={onStats} />}
    >
      <View style={styles.summaryGrid}>
        <Metric label="今日待複習" value={dueTotal} />
        <Metric label="今日已完成" value={stats.reviewedCount} />
        <Metric label="連續天數" value={stats.streakDays} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>卡片牌組</Text>
        <Pressable style={styles.primaryButton} onPress={onNewDeck}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>新增</Text>
        </Pressable>
      </View>

      {decks.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="建立第一個牌組"
          body="先建立一個英文、片語或自訂分類的牌組，再開始新增卡片。"
          actionLabel="新增牌組"
          onAction={onNewDeck}
        />
      ) : (
        decks.map((deck) => (
          <Pressable key={deck.id} style={styles.deckRow} onPress={() => onOpenDeck(deck)}>
            <View style={styles.deckRowMain}>
              <Text style={styles.deckTitle}>{deck.name}</Text>
              <Text style={styles.deckMeta}>
                {deck.category} · {deck.cardCount} 張卡片
              </Text>
            </View>
            <View style={styles.duePill}>
              <Text style={styles.duePillNumber}>{deck.dueCount}</Text>
              <Text style={styles.duePillText}>待複習</Text>
            </View>
          </Pressable>
        ))
      )}
    </ScreenFrame>
  );
}

function DeckScreen({
  deck,
  cards,
  onBack,
  onNewCard,
  onReview,
  onDeleteDeck,
  onDeleteCard
}: {
  deck: DeckSummary;
  cards: Card[];
  onBack: () => void;
  onNewCard: () => void;
  onReview: () => void;
  onDeleteDeck: () => void;
  onDeleteCard: (card: Card) => void;
}) {
  return (
    <ScreenFrame
      title={deck.name}
      subtitle={`${deck.category} · ${deck.cardCount} 張卡片 · ${deck.dueCount} 張到期`}
      onBack={onBack}
      rightAction={<IconButton name="trash-outline" label="刪除牌組" danger onPress={onDeleteDeck} />}
    >
      <View style={styles.actionRow}>
        <Pressable style={[styles.primaryButton, styles.flexButton]} onPress={onReview}>
          <Ionicons name="play" size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>開始複習</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, styles.flexButton]} onPress={onNewCard}>
          <Ionicons name="add-circle-outline" size={18} color="#1f2937" />
          <Text style={styles.secondaryButtonText}>新增卡片</Text>
        </Pressable>
      </View>

      {cards.length === 0 ? (
        <EmptyState
          icon="copy-outline"
          title="還沒有卡片"
          body="新增第一張卡片後，就可以開始複習。"
          actionLabel="新增卡片"
          onAction={onNewCard}
        />
      ) : (
        cards.map((card) => (
          <View key={card.id} style={styles.cardPreview}>
            <View style={styles.cardPreviewContent}>
              <Text style={styles.cardPreviewFront}>{card.front}</Text>
              <Text style={styles.cardPreviewBack}>{card.back}</Text>
              <Text style={styles.cardMeta}>{isDue(card.nextReviewAt) ? '現在可複習' : '已排入未來複習'}</Text>
            </View>
            <IconButton name="trash-outline" label="刪除卡片" danger onPress={() => onDeleteCard(card)} />
          </View>
        ))
      )}
    </ScreenFrame>
  );
}

function DeckFormScreen({
  onCancel,
  onSave
}: {
  onCancel: () => void;
  onSave: (input: { name: string; description: string; category: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('英文');
  const canSave = name.trim().length > 0;

  return (
    <ScreenFrame title="新增牌組" subtitle="幫這組記憶卡片取一個容易辨識的名稱。" onBack={onCancel}>
      <Field label="牌組名稱" value={name} onChangeText={setName} placeholder="例如：商務英文片語" />
      <Field label="描述" value={description} onChangeText={setDescription} placeholder="例如：會議、Email、簡報常用句" />
      <Field label="類型" value={category} onChangeText={setCategory} placeholder="英文、日文、面試題..." />
      <Pressable
        disabled={!canSave}
        style={[styles.primaryButton, styles.fullWidthButton, !canSave && styles.disabledButton]}
        onPress={() => onSave({ name, description, category })}
      >
        <Ionicons name="checkmark" size={18} color="#ffffff" />
        <Text style={styles.primaryButtonText}>儲存牌組</Text>
      </Pressable>
    </ScreenFrame>
  );
}

function CardFormScreen({
  deck,
  onCancel,
  onSave
}: {
  deck: DeckSummary;
  onCancel: () => void;
  onSave: (input: { front: string; back: string; type: CardType; enableSpeech: boolean }) => Promise<void>;
}) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [type, setType] = useState<CardType>('english');
  const [enableSpeech, setEnableSpeech] = useState(true);
  const canSave = front.trim().length > 0 && back.trim().length > 0;

  useEffect(() => {
    setEnableSpeech(type === 'english' || type === 'phrase');
  }, [type]);

  return (
    <ScreenFrame title="新增卡片" subtitle={deck.name} onBack={onCancel}>
      <Field label="提示面" value={front} onChangeText={setFront} placeholder="輸入中文、問題或提示" multiline />
      <Field label="答案面" value={back} onChangeText={setBack} placeholder="輸入英文、片語或要記憶的內容" multiline />

      <Text style={styles.fieldLabel}>卡片類型</Text>
      <View style={styles.segmentRow}>
        {cardTypes.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.segmentButton, type === item.value && styles.segmentButtonActive]}
            onPress={() => setType(item.value)}
          >
            <Text style={[styles.segmentText, type === item.value && styles.segmentTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.toggleRow} onPress={() => setEnableSpeech((value) => !value)}>
        <Ionicons
          name={enableSpeech ? 'checkbox' : 'square-outline'}
          size={22}
          color={enableSpeech ? '#2563eb' : '#6b7280'}
        />
        <Text style={styles.toggleText}>答案面啟用英文發音</Text>
      </Pressable>

      <Pressable
        disabled={!canSave}
        style={[styles.primaryButton, styles.fullWidthButton, !canSave && styles.disabledButton]}
        onPress={() => onSave({ front, back, type, enableSpeech })}
      >
        <Ionicons name="checkmark" size={18} color="#ffffff" />
        <Text style={styles.primaryButtonText}>儲存卡片</Text>
      </Pressable>
    </ScreenFrame>
  );
}

function ReviewScreen({ deck, onBack }: { deck: DeckSummary; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ReviewSide>('front');
  const [includeAll, setIncludeAll] = useState(false);
  const [queue, setQueue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = queue[index];

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const nextCards = await listDueCards(deck.id, includeAll);
    setQueue(nextCards);
    setIndex(0);
    setFlipped(false);
    setLoading(false);
  }, [deck.id, includeAll]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const startsWithBack = useMemo(() => {
    if (mode === 'back') return true;
    if (mode === 'random') return Math.random() > 0.5;
    return false;
  }, [mode, current?.id]);

  const visibleText = current ? getVisibleText(current, flipped, startsWithBack) : '';
  const hiddenText = current ? getHiddenText(current, flipped, startsWithBack) : '';
  const canSpeak = Boolean(current?.enableSpeech && (startsWithBack || flipped));

  const finishCard = async (action: ReviewAction) => {
    if (!current) return;
    await reviewCard(current, action);

    if (action === 'later') {
      const nextQueue = [...queue];
      const [moved] = nextQueue.splice(index, 1);
      if (moved) {
        const insertAt = Math.min(nextQueue.length, index + 2 + Math.floor(Math.random() * 3));
        nextQueue.splice(insertAt, 0, moved);
      }
      setQueue(nextQueue);
      setIndex(Math.min(index, Math.max(nextQueue.length - 1, 0)));
    } else {
      const nextIndex = index + 1;
      setIndex(nextIndex);
    }

    setFlipped(false);
  };

  return (
    <ScreenFrame
      title="複習"
      subtitle={`${deck.name} · ${includeAll ? '全部卡片' : '今日到期'}`}
      onBack={onBack}
      rightAction={<IconButton name="refresh" label="重新整理" onPress={loadQueue} />}
    >
      <View style={styles.segmentRow}>
        {[
          { label: '提示先', value: 'front' },
          { label: '答案先', value: 'back' },
          { label: '隨機', value: 'random' }
        ].map((item) => (
          <Pressable
            key={item.value}
            style={[styles.segmentButton, mode === item.value && styles.segmentButtonActive]}
            onPress={() => {
              setMode(item.value as ReviewSide);
              setFlipped(false);
            }}
          >
            <Text style={[styles.segmentText, mode === item.value && styles.segmentTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.toggleRow} onPress={() => setIncludeAll((value) => !value)}>
        <Ionicons name={includeAll ? 'checkbox' : 'square-outline'} size={22} color={includeAll ? '#2563eb' : '#6b7280'} />
        <Text style={styles.toggleText}>複習全部卡片</Text>
      </Pressable>

      {loading ? (
        <View style={styles.centeredPanel}>
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : !current ? (
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="目前沒有待複習卡片"
          body="今天到期的卡片已經完成，也可以切換成複習全部卡片。"
          actionLabel="回到牌組"
          onAction={onBack}
        />
      ) : (
        <>
          <Pressable style={styles.reviewCard} onPress={() => setFlipped((value) => !value)}>
            <Text style={styles.reviewCardLabel}>{flipped ? '已翻面' : '點一下翻面'}</Text>
            <Text style={styles.reviewText}>{visibleText}</Text>
            <Text style={styles.reviewHint}>{hiddenText}</Text>
          </Pressable>

          <View style={styles.reviewTopRow}>
            <Text style={styles.reviewProgress}>
              {Math.min(index + 1, queue.length)} / {queue.length}
            </Text>
            <Pressable
              disabled={!canSpeak}
              style={[styles.speechButton, !canSpeak && styles.disabledSpeechButton]}
              onPress={() => current && Speech.speak(current.back, { language: 'en-US' })}
            >
              <Ionicons name="volume-high-outline" size={18} color={canSpeak ? '#2563eb' : '#9ca3af'} />
              <Text style={[styles.speechText, !canSpeak && styles.disabledSpeechText]}>發音</Text>
            </Pressable>
          </View>

          <View style={styles.reviewActionGrid}>
            {reviewActions.map((action) => (
              <Pressable
                key={action.value}
                style={[styles.reviewActionButton, reviewActionStyle(action.tone)]}
                onPress={() => finishCard(action.value)}
              >
                <Text style={styles.reviewActionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScreenFrame>
  );
}

function StatsScreen({ stats, decks, onBack }: { stats: DailyStats; decks: DeckSummary[]; onBack: () => void }) {
  const dueTotal = decks.reduce((total, deck) => total + deck.dueCount, 0);
  const cardTotal = decks.reduce((total, deck) => total + deck.cardCount, 0);

  return (
    <ScreenFrame title="每日統計" subtitle="追蹤今天的記憶狀況。" onBack={onBack}>
      <View style={styles.summaryGrid}>
        <Metric label="今天複習" value={stats.reviewedCount} />
        <Metric label="今天新增" value={stats.addedCount} />
        <Metric label="連續天數" value={stats.streakDays} />
        <Metric label="總卡片" value={cardTotal} />
        <Metric label="待複習" value={dueTotal} />
        <Metric label="牌組數" value={decks.length} />
      </View>

      <Text style={styles.sectionTitle}>今天的按鈕分布</Text>
      <StatBar label="稍後" value={stats.laterCount} total={Math.max(stats.reviewedCount, 1)} />
      <StatBar label="1日" value={stats.oneDayCount} total={Math.max(stats.reviewedCount, 1)} />
      <StatBar label="3日" value={stats.threeDayCount} total={Math.max(stats.reviewedCount, 1)} />
      <StatBar label="7日" value={stats.sevenDayCount} total={Math.max(stats.reviewedCount, 1)} />
      <StatBar label="1月" value={stats.oneMonthCount} total={Math.max(stats.reviewedCount, 1)} />
    </ScreenFrame>
  );
}

function ScreenFrame({
  title,
  subtitle,
  children,
  onBack,
  rightAction
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}) {
  return (
    <View style={styles.frame}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && <IconButton name="chevron-back" label="返回" onPress={onBack} />}
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightAction}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width: DimensionValue = `${Math.round((value / total) * 100)}%`;
  return (
    <View style={styles.statBarRow}>
      <View style={styles.statBarHeader}>
        <Text style={styles.statBarLabel}>{label}</Text>
        <Text style={styles.statBarValue}>{value}</Text>
      </View>
      <View style={styles.statBarTrack}>
        <View style={[styles.statBarFill, { width }]} />
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={36} color="#2563eb" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      <Pressable style={styles.primaryButton} onPress={onAction}>
        <Text style={styles.primaryButtonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function IconButton({
  name,
  label,
  onPress,
  danger = false
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable accessibilityLabel={label} style={styles.iconButton} onPress={onPress}>
      <Ionicons name={name} size={22} color={danger ? '#dc2626' : '#1f2937'} />
    </Pressable>
  );
}

function getVisibleText(card: Card, flipped: boolean, startsWithBack: boolean) {
  if (startsWithBack) {
    return flipped ? card.front : card.back;
  }
  return flipped ? card.back : card.front;
}

function getHiddenText(card: Card, flipped: boolean, startsWithBack: boolean) {
  if (flipped) return startsWithBack ? '提示面' : '答案面';
  return startsWithBack ? '目前顯示答案面' : '目前顯示提示面';
}

function reviewActionStyle(tone: 'muted' | 'blue' | 'green') {
  if (tone === 'blue') return styles.reviewAction_blue;
  if (tone === 'green') return styles.reviewAction_green;
  return styles.reviewAction_muted;
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  frame: {
    flex: 1
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
    fontSize: 15
  },
  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff'
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerTextBlock: {
    flex: 1
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 19
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 16
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#eef2f7'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  metric: {
    minWidth: '30%',
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb'
  },
  metricValue: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800'
  },
  metricLabel: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 13
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800'
  },
  primaryButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  secondaryButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db'
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700'
  },
  fullWidthButton: {
    width: '100%',
    marginTop: 6
  },
  disabledButton: {
    opacity: 0.45
  },
  flexButton: {
    flex: 1
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  deckRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb'
  },
  deckRowMain: {
    flex: 1
  },
  deckTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800'
  },
  deckMeta: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 13
  },
  duePill: {
    minWidth: 72,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#eff6ff'
  },
  duePillNumber: {
    color: '#1d4ed8',
    fontSize: 20,
    fontWeight: '800'
  },
  duePillText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700'
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb'
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  emptyBody: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center'
  },
  field: {
    gap: 8
  },
  fieldLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700'
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  textArea: {
    minHeight: 118,
    textAlignVertical: 'top'
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db'
  },
  segmentButtonActive: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937'
  },
  segmentText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '700'
  },
  segmentTextActive: {
    color: '#ffffff'
  },
  toggleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  toggleText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '700'
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb'
  },
  cardPreviewContent: {
    flex: 1,
    gap: 6
  },
  cardPreviewFront: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800'
  },
  cardPreviewBack: {
    color: '#4b5563',
    fontSize: 15
  },
  cardMeta: {
    color: '#6b7280',
    fontSize: 12
  },
  reviewCard: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 22,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  reviewCardLabel: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800'
  },
  reviewText: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 37,
    textAlign: 'center'
  },
  reviewHint: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700'
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  reviewProgress: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '800'
  },
  speechButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eff6ff'
  },
  speechText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '800'
  },
  disabledSpeechButton: {
    backgroundColor: '#f3f4f6'
  },
  disabledSpeechText: {
    color: '#9ca3af'
  },
  reviewActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  reviewActionButton: {
    minWidth: '30%',
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  reviewAction_muted: {
    backgroundColor: '#f3f4f6'
  },
  reviewAction_blue: {
    backgroundColor: '#dbeafe'
  },
  reviewAction_green: {
    backgroundColor: '#dcfce7'
  },
  reviewActionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800'
  },
  centeredPanel: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statBarRow: {
    gap: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb'
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statBarLabel: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '800'
  },
  statBarValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800'
  },
  statBarTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#e5e7eb'
  },
  statBarFill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#2563eb'
  }
});
