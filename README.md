# user-insights-cli

A Node.js command-line tool, written in strict TypeScript, that fetches
`users`, `posts`, and `todos` from
[JSONPlaceholder](https://jsonplaceholder.typicode.com) and prints a
per-user report: post count, completed todos, and open todos — sorted by
post count, followed by summary statistics.

No API key is required.

## Requirements

- Node.js 18 or later

## Setup

```bash
git clone <your-repo-url>
cd user-insights-cli
npm install
```

## Run

```bash
npm start
```

Optionally filter the report to users at or above a given post count:

```bash
npm start -- --min-posts 5
```

A non-numeric value (e.g. `--min-posts abc`) prints a friendly error and
exits with a non-zero code.

## Other scripts

```bash
npm run typecheck   # runs tsc --noEmit, checks types under strict mode
npm run lint         # runs ESLint
npm run format       # formats source with Prettier
npm run build        # compiles to dist/
```

## What it does

1. Fetches `/users`, `/posts`, and `/todos` concurrently with `Promise.all`.
2. Groups posts and todos by `userId` once using a generic `groupBy<T>`
   utility, then builds a record per user (name, email, city, post count,
   completed todos, open todos) using `map` and `filter` — no `for`/`while`
   loops in the data logic.
3. Optionally filters records by `--min-posts`.
4. Sorts users by post count descending, breaking ties alphabetically by name.
5. Prints an aligned report, then summary statistics computed with `reduce`:
   total users, total posts, average posts per user, and the name of the
   user with the most completed todos.

## Types

All API and computed shapes are described with interfaces (`ApiUser`,
`ApiPost`, `ApiTodo`, `UserReport`, `Summary`). The project runs under
`strict` mode with no use of `any` — values of genuinely unknown shape
(like a caught error) are typed `unknown` and narrowed before use.

## Error handling

If a network request fails or JSONPlaceholder is unreachable, the script
prints a friendly error message and exits with a non-zero exit code (`1`).

## Project structure

```
user-insights-cli/
├── src/
│   └── index.ts     # all logic: fetch, transform, sort, summarize, print
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── package.json
└── README.md
```