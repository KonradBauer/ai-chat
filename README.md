# Agentica AI Chat

Streaming chat interface for the Agentica take-home. React 19, TypeScript, Tailwind v4, Vite.

## Running it

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://your-llm-provider-url
LLM_MODEL=unsloth/Qwen3.5-9B
```

**3. Start dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. Node 20+ required.

---

## Discussion Questions

### 1. AI Dev Stack

Used **Claude Code** (claude-sonnet-4-6) as the main dev tool — generating components, hooks, iterating on fixes. The model behind the chat itself is `unsloth/Qwen3.5-9B` on the provided API.

### 2. API Discovery

Hit `GET /v1/models` — standard OpenAI-compatible endpoint that returns available model IDs. If that had been missing, next step would be sending a completion request without a model field and reading what the error says back.

### 3. Architecture

Went with a Vite proxy (`/api/chat` → LLM endpoint). The `configure` hook on the proxy lets you inject the `Authorization` header server-side, so the key never shows up in DevTools network tab.

In production the Vite dev server obviously doesn't exist. Right replacement: a Cloudflare Worker or Vercel Edge Function — thin pass-through that pulls the key from an environment secret, streams the response back, and gives you a place to bolt on rate limiting and auth later.

### 4. Streaming Implementation

Native `fetch` + `ReadableStream` + `TextDecoder`, no library.

```
response.body.getReader()
  → read chunk
  → TextDecoder.decode(chunk, { stream: true })   // handles UTF-8 split across chunk boundaries
  → split on \n
  → lines starting with "data: "
  → JSON.parse → choices[0].delta.content
  → yield token
```

The `stream: true` flag on `TextDecoder` matters — multi-byte characters can get split across chunk boundaries and this reassembles them correctly.

Alternatives I considered:
- `EventSource` — GET only, can't POST a body, ruled out immediately
- `@microsoft/fetch-event-source` — handles reconnects and named events, worth it in production
- `eventsource-parser` — cleaner line parsing, would use it if the format were less predictable

Native approach is transparent and zero-dep, works fine here.

### 5. State Management

Everything lives in a single `useChat` hook with plain `useState`. No external library.

A few decisions worth noting:

- **`ChatStatus` discriminated union** (`idle | streaming | error`) instead of boolean flags — impossible states stop being representable at the type level
- **`AbortController` in a `useRef`** not state — cancelling the stream must not trigger a re-render
- **`streamResponse` extracted** from `sendMessage` — retry calls it directly with a clean history snapshot, which avoids a stale closure bug where the failed assistant message was getting included in the LLM context on retry
- **`localStorage` sync** via two `useEffect`s — conversations and active ID survive page refresh

React's built-ins were enough. The `AsyncGenerator` from `streamChat` slots naturally into an `async function` inside the hook.

### 6. Tradeoffs

Skipped or simplified:
- Dark/light mode toggle — hardcoded dark, a real toggle would read `localStorage` and expose a switch
- Message timestamps — stored in state, not rendered
- Copy-to-clipboard on messages
- Syntax highlighting in code blocks — markdown renders but no colour
- The Vite proxy is dev-only — production needs a real edge function (see Q3)

First things with another 3 hours:
1. Replace the Vite proxy with a Cloudflare Worker so a deployed build actually works
2. Dark/light mode toggle with `localStorage` persistence
3. `visualViewport` resize listener for mobile — the software keyboard on iOS/Android pushes the input behind the viewport
4. Syntax highlighting via `rehype-highlight` — code block structure is already in place
5. I would remove code comments before a production release

### 7. Time Spent

About **~ 2.5 hours** across planning, implementation in 6 phases, a code review pass, and iterative fixes.

What took longer than expected:

The auto-scroll hook. Balancing "follow the stream" vs "stop when the user scrolls up" needed a dual ref+state pattern: `useState` exposes the value to React for rendering the scroll-to-bottom button, `useRef` holds the same value synchronously so the scroll listener never reads a stale closure. Took a couple of iterations to get right.

The Vite proxy `configure` hook is sparsely documented. Injecting a request header server-side requires reaching into the underlying `http-proxy` `proxyReq` object (`proxyReq.setHeader`), which isn't covered in the Vite docs directly — had to check the `http-proxy` source.

Debugging the stale closure bug in `retryLastMessage` — the LLM was receiving the failed assistant message as part of the context on retry, causing it to try to continue from a broken response. Fix was extracting `streamResponse` and passing the history snapshot explicitly.
