# Plan — Agentica AI Chat

## Cel

Streaming chat UI podłączony do OpenAI-compatible API.
- Model: `unsloth/Qwen3.5-9B`
- Base URL: `https://llm-test-api.projects.agentica.studio`
- Endpoint: `POST /v1/chat/completions` z `stream: true` (SSE)
- Architektura: direct frontend call (API key w kliencie — akceptowalne dla assignmentu)

---

## Fazy

### Faza 1 — Fundament (shadcn + typy + struktura)

Pliki do stworzenia:
- `src/lib/types.ts` — modele danych
- `src/lib/constants.ts` — API config

```typescript
// types.ts
type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
  timestamp: number
  isError?: boolean
}

interface Conversation {
  id: string
  title: string        // pierwsze N znaków pierwszej wiadomości usera
  messages: Message[]
  createdAt: number
}

type ChatStatus =
  | { type: 'idle' }
  | { type: 'streaming'; abortController: AbortController }
  | { type: 'error'; message: string }
```

shadcn komponenty do zainstalowania:
- `button`, `textarea`, `scroll-area`, `separator`, `badge`, `tooltip`

---

### Faza 2 — SSE streaming client

Plik: `src/lib/llm-client.ts`

Podejście: natywny `fetch` + `ReadableStream` + `TextDecoder`. Bez biblioteki.

```typescript
interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

async function streamChat(
  messages: Pick<Message, 'role' | 'content'>[],
  callbacks: StreamCallbacks,
  signal: AbortSignal
): Promise<void>
```

Parsowanie SSE:
1. `response.body.getReader()` + `TextDecoder`
2. Split na `\n`, filtruj linie `data: `
3. Skip `[DONE]`, parsuj JSON → `choices[0].delta.content`
4. Obsługa partial chunks (chunk może nie zawierać pełnej linii JSON)

Edge cases w kliencie:
- `signal.aborted` → throw `AbortError` → calling code ignoruje
- HTTP error (4xx/5xx) → throw z message
- Malformed JSON w chunce → `continue` (partial buffer)

---

### Faza 3 — useChat hook

Plik: `src/hooks/use-chat.ts`

Stan zarządzany przez hook:
```typescript
interface UseChatReturn {
  conversations: Conversation[]
  activeConversationId: string
  activeMessages: Message[]
  chatStatus: ChatStatus
  sendMessage: (content: string) => Promise<void>
  stopStreaming: () => void
  startNewConversation: () => void
  switchConversation: (id: string) => void
}
```

Logika sendMessage:
1. Guard: `content.trim() === ''` → return
2. Guard: `status.type === 'streaming'` → abort poprzedni, zacznij nowy
3. Dodaj message usera do historii
4. Dodaj placeholder assistant message z `content: ''`
5. Utwórz `AbortController`, ustaw status na `streaming`
6. Wywołaj `streamChat`, aktualizuj content asystenta token po tokenie (functional update)
7. `onDone` → status `idle`, finalizuj message
8. `onError` → status `error`, oznacz message jako `isError: true`

Persystencja: `localStorage` dla konwersacji (serializuj przy każdej zmianie).

---

### Faza 4 — Smart auto-scroll

Plik: `src/hooks/use-auto-scroll.ts`

Logika:
- Śledź `isUserScrolledUp: boolean` — `true` gdy user > 100px od dołu
- Podczas streamingu: scroll do dołu TYLKO jeśli `!isUserScrolledUp`
- Reset `isUserScrolledUp` = false gdy user sam scrolluje do dołu

---

### Faza 5 — Komponenty UI

```
src/components/
├── chat/
│   ├── ChatWindow.tsx      # kontener z ScrollArea, lista MessageBubble
│   ├── MessageBubble.tsx   # user (prawo, ciemne tło) vs assistant (lewo, jasne)
│   ├── ChatInput.tsx       # Textarea + Send/Stop Button
│   └── TypingIndicator.tsx # 3 animowane kropki gdy czekamy na 1. token
├── sidebar/
│   ├── Sidebar.tsx         # lista konwersacji
│   └── ConversationItem.tsx
└── layout/
    └── AppLayout.tsx       # flex: sidebar (fixed width) + main
```

MessageBubble — wizualne rozróżnienie:
- User: `bg-primary text-primary-foreground`, align right
- Assistant: `bg-muted`, align left
- Error state: `bg-destructive/10 border-destructive`

ChatInput zachowanie:
- `Textarea` auto-resize (max 5 linii)
- `Enter` → send, `Shift+Enter` → nowa linia
- Disabled podczas streamingu (Send zmienia się w Stop)
- Empty input guard (nie wysyłaj)

---

### Faza 6 — Markdown rendering

Biblioteka: `react-markdown` + `remark-gfm` + `rehype-highlight`

Tylko w MessageBubble dla roli `assistant`.
Code blocks ze składnią highlight i przyciskiem copy.

---

## Struktura plików końcowa

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   └── ConversationItem.tsx
│   └── layout/
│       └── AppLayout.tsx
├── hooks/
│   ├── use-chat.ts
│   └── use-auto-scroll.ts
├── lib/
│   ├── llm-client.ts
│   ├── types.ts
│   └── constants.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Decyzje architektoniczne

| Decyzja | Wybór | Powód |
|---------|-------|-------|
| API call | Direct frontend | Assignment dopuszcza; brak backendu = prostota |
| SSE parsing | Native fetch + ReadableStream | Żadna dodatkowa dep; pełna kontrola; eventsource nie obsługuje POST |
| State mgmt | useState w custom hooku | Lokalny stan wystarczy; bez Redux/Zustand overhead |
| Persystencja | localStorage | Prosto; konwersacje muszą przetrwać odświeżenie |
| Streaming abort | AbortController | Native browser API; clean cancel |
| Markdown | react-markdown | Standard; małe bundle; obsługa GFM |

---

## Edge cases — lista kontrolna

- [ ] Pusty input → block send
- [ ] API HTTP error (500, 429) → error state z komunikatem
- [ ] Stream drop mid-response → partial message zostaje, `isError: true`
- [ ] Nowa wiadomość podczas streamingu → abort poprzedni stream, zacznij nowy
- [ ] AbortError (stop button) → partial message zostaje, status `idle`
- [ ] Sieć offline → catch w streamChat → error state
- [ ] Bardzo długa odpowiedź → auto-scroll działa, memory OK (string concat)
- [ ] Pierwszy token nie przychodzi → TypingIndicator widoczny

---

## Bonus — priorytet

1. Stop generating (AbortController) — najprostsze, duży efekt
2. Smart auto-scroll — UX kluczowy przy streamingu  
3. Markdown rendering — czytelność odpowiedzi
4. Conversation sidebar — wielosesyjność

## Zależności do zainstalowania

```bash
# shadcn (już zainstalowany przez init)
# Markdown
npm install react-markdown remark-gfm rehype-highlight
# shadcn komponenty
npx shadcn@latest add button textarea scroll-area separator badge tooltip
```
