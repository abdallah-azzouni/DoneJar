# DoneJar

DoneJar is an offline-first, kanban-style task manager where your completed tasks literally drop into a physics-simulated jar. It solves the mundane feeling of crossing items off a to-do list by making task completion tactile and fun, while still functioning as a robust, capable productivity tool.

**[Live →](https://donejar.app)**

![Screenshot of DoneJar](src/lib/assets/landing/hero.png)

![Jar physics in action](src/lib/assets/landing/step3.gif)

---

## Key Features

- **Kanban board** — drag-and-drop task management across fully customizable columns
- **Physics jar** — completed tasks bounce and stack inside a Matter.js-powered beaker
- **Offline-first** — zero load screens; everything saves locally and syncs when connected
- **Cross-device sync** — real-time replication across all your devices via Supabase
- **Auth** — account creation, login, and secure session management
- **Rich text editor** — Quill powers task descriptions (headers, lists, links, code, video)
- **Attachments** — drag and drop files directly onto notes, stored in Cloudflare R2
- **Dates & priorities** — rich metadata on every note with expiry timers
- **Multi-project** — multiple boards with custom names, colors, and flexible columns
- **Data export/import** — full JSON backup and restore

---

## Tech Stack

- **Framework**: SvelteKit + Svelte 5 runes, TypeScript
- **Styling**: TailwindCSS 4.1, doodle.css
- **Local Database**: RxDB (Dexie storage adapter)
- **Sync**: Supabase (Postgres + Realtime + Auth)
- **Attachments**: Cloudflare R2
- **Hosting**: Cloudflare Pages
- **Physics**: Matter.js
- **Rich Text**: Quill
- **Validation & IDs**: zod, nanoid

---

## Architecture

DoneJar is built on a **local-first** foundation — the local database is the source of truth, and sync is a background concern.

- **Local storage**: RxDB with Dexie as the storage adapter, wrapped in `wrappedKeyCompressionStorage` and `wrappedValidateAjvStorage`. All reads and writes go through a structured Data Access Layer (DAL) that follows DIP/OCP principles for clean separation between the app and the database layer.
- **Sync**: RxDB's Supabase replication plugin handles bidirectional sync against a Postgres backend. RLS policies enforce access control at the database level; the DAL enforces role checks client-side before writes reach RxDB.
- **Auth**: Supabase Auth with scoped local DB instances per user (`donejar-{userId}`). Replication starts and stops cleanly on auth state changes.
- **Attachments**: Metadata lives in RxDB; blobs go to Cloudflare R2. The browser Cache API handles local caching keyed by `attachmentId`. Attachment records are immutable — upload or delete only.
- **Collaboration**: A `project_members` junction table is the membership authority. RLS subqueries on all tables reference it. The creator is auto-inserted as `owner` via an `AFTER INSERT` trigger on `projects`.
- **State**: UI state (stores) sits above the DAL. Reactive queries use RxDB observables composed with `from(db()).pipe(switchMap(...))`.

---

## Project Structure

```text
src/
├── lib/
│   ├── actions/          # Domain actions (attachments, notes, projects)
│   ├── components/       # Board, Physics Jar, Sticky notes, etc.
│   ├── db/               # RxDB setup, schema, DAL
│   ├── popups/           # Menus, date pickers, delete confirmations
│   ├── stores/           # App state (current info, UI states, timers)
│   ├── validators/       # zod schemas for core data types
│   └── assets/           # Images, icons, landing page assets
└── routes/               # SvelteKit structure & pages
```

---

## Local Development

```bash
git clone https://github.com/abdallah-azzouni/DoneJar.git
cd DoneJar
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

### Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run build`   | Production build                  |
| `npm run preview` | Preview production build          |
| `npm run check`   | TypeScript + Svelte type checking |
| `npm run format`  | Format with Prettier              |
| `npm run lint`    | Lint with ESLint                  |

---

## Roadmap

### ✅ Phase 1 — Local-first Kanban (Completed)

The full single-player experience. Everything you need to manage tasks on one device.

- Kanban workflow with customizable columns
- Multi-project support with custom names and colors
- Physics-based completion jar (Matter.js)
- Drag-and-drop task management
- Rich text task descriptions (Quill)
- Task dates, and priority flags
- Attachments via Cloudflare R2
- Data export/import (JSON)
- Responsive, hand-drawn UI
- Deployed to production (donejar.app)

### ✅ Phase 2 — Sync & Identity (Completed)

The app gains a persistent identity and works seamlessly across devices.

- Account creation, login, and session management (Supabase Auth)
- Migrated local storage from Dexie to RxDB
- Real-time cross-device sync (RxDB ↔ Supabase replication)
- Per-user scoped local databases
- RLS-enforced access control on all collections
- Collaboration infrastructure (project_members, roles, RLS policies)
- Offline-first: full functionality without a connection, syncs on reconnect

### 🚧 Phase 3 — Collaboration & Mobile (Planned)

The social and platform layer.

- **Collaboration** — invite flow, role enforcement, free/Pro tier limits
- **Mobile layout** — optimized kanban experience on small screens
- **Mobile & desktop apps** — Tauri packaging for native distribution
- **Jar browsing** — view and retrieve notes from inside the physics jar
- **Column editing** — rename, reorder, add/remove columns
- **Arabic language support**
- **Accessibility** — keyboard navigation, ARIA roles, focus management

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

---

## Author

**Abdallah Azzouni** — [@abdallah-azzouni](https://github.com/abdallah-azzouni)
