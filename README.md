# user-insights-cli

A Node.js command-line tool that fetches `users`, `posts`, and `todos` from
[JSONPlaceholder](https://jsonplaceholder.typicode.com) and prints a per-user
report: post count, completed todos, and open todos — sorted by post count,
followed by summary statistics.

No API key is required.

## Requirements

- Node.js 18 or later (uses the built-in `fetch`, no dependencies to install)

## Setup

```bash
git clone <your-repo-url>
cd user-insights-cli
```

No `npm install` is needed — the project has zero external dependencies.

## Run

```bash
npm start
```

This runs `node index.js`, fetches the three endpoints concurrently, and
prints the report followed by summary stats.

## What it does

1. Fetches `/users`, `/posts`, and `/todos` concurrently with `Promise.all`.
2. Builds a record per user containing name, email, city, post count,
   completed todos, and open todos, using `map` and `filter` (no `for`/`while`
   loops in the data logic).
3. Sorts users by post count descending, breaking ties alphabetically by name.
4. Prints an aligned report, then summary statistics computed with `reduce`:
   total users, total posts, average posts per user, and the name of the
   user with the most completed todos.

## Error handling

If a network request fails or JSONPlaceholder is unreachable, the script
prints a friendly error message and exits with a non-zero exit code (`1`).

## Project structure

```
user-insights-cli/
├── index.js        # all logic: fetch, transform, sort, summarize, print
├── package.json
└── README.md
```