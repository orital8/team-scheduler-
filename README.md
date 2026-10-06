# Team Scheduler

Team task and follow-up tracker: projects → lists → tasks, follow-up dates, comments, and a full team history. English and Hebrew (RTL), switchable.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # data-layer tests
npm run build    # static build in dist/
```

On first open, build a team or launch the demo, then pick or add yourself. The **Me:** selector in the top bar sets who is acting; every change is recorded under that name.

## Features

- **Teams** – start screen: *Build a team* (open a new team with a name + password, or join an existing one with that password) or *Launch demo*. Each team has separate data; switch teams from the sidebar header. Passwords are stored only as salted PBKDF2 hashes.

- **Projects and lists** – any number of lists per project; tasks with status, owner, priority, due date, follow-up date, description.
- **Follow-ups** – open tasks grouped into Overdue / Today / Next 7 days / Later, for you or the whole team. Quick +1d / +3d / +1w follow-up buttons.
- **Updates & comments** on each task.
- **Team history** – who changed what and when, per task, per project and team-wide, filterable by project and member. History survives deletion of projects and tasks.
- **Team** – members, colors, open-task counts, JSON export/import.

## UI

Tailwind v4 + shadcn (Lyra style, RTL enabled) with components from [Watermelon UI](https://ui.watermelon.sh) (`@watermelon` registry in `components.json`). Corners are square everywhere: the theme sets `--radius: 0`, and badges/avatars were changed to `rounded-none`. Add more components with:

```bash
npx shadcn@latest add @watermelon/<name>
```

## Structure

```
src/
  types.ts             data model
  data/store.ts        DataStore interface (persistence boundary)
  data/localStore.ts   localStorage implementation + activity logging
  data/demo.ts         demo seed
  state/AppContext.tsx data snapshot, current member
  i18n/                EN/HE strings, formatting, RTL switch
  components/ui/       Watermelon/shadcn components (owned code, edit freely)
  components/ pages/   app UI
  index.css            theme tokens (light/dark)
```

## Data / backend

Data currently lives in each browser's localStorage, so it is **not shared between people yet** — joining a team only works in the browser where it was created, and the password is a gate, not real access control. To go multi-user, implement `TeamDirectory` (`src/data/teams.ts`, checked server-side) and `DataStore` against a server (Supabase, Node + DB, …) and swap them in `src/main.tsx` / `src/state/TeamSession.tsx`; the UI does not change. `subscribe()` is the hook for realtime updates, and the "Me" selector becomes the logged-in user.
