const BASE_URL = "https://jsonplaceholder.typicode.com";

// ---- Raw API shapes ----

interface ApiUser {
    readonly id: number;
    name: string;
    email: string;
    address: {
        city: string;
    };
}

interface ApiPost {
    readonly id: number;
    userId: number;
    title: string;
}

interface ApiTodo {
    readonly id: number;
    userId: number;
    completed: boolean;
}

interface RawData {
    users: ApiUser[];
    posts: ApiPost[];
    todos: ApiTodo[];
}

// ---- Computed shapes ----

interface UserReport {
    name: string;
    email: string;
    city: string;
    postCount: number;
    completedTodos: number;
    openTodos: number;
}

interface Summary {
    totalUsers: number;
    totalPosts: number;
    averagePosts: number;
    mostCompletedName: string;
}

/**
 * Generic utility: groups an array of items into buckets keyed by keyFn(item).
 */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return items.reduce((groups, item) => {
        const key = keyFn(item);
        const existing = groups[key] ?? [];
        return { ...groups, [key]: [...existing, item] };
    }, {} as Record<string, T[]>);
}

/**
 * Fetches users, posts, and todos concurrently.
 * Throws if a request fails (bad status or network error).
 */
async function fetchAllData(): Promise<RawData> {
    const [usersRes, postsRes, todosRes] = await Promise.all([
        fetch(`${BASE_URL}/users`),
        fetch(`${BASE_URL}/posts`),
        fetch(`${BASE_URL}/todos`)
    ]);

    if (!usersRes.ok || !postsRes.ok || !todosRes.ok) {
        throw new Error("One or more requests to JSONPlaceholder failed.");
    }

    const [users, posts, todos] = await Promise.all([
        usersRes.json() as Promise<ApiUser[]>,
        postsRes.json() as Promise<ApiPost[]>,
        todosRes.json() as Promise<ApiTodo[]>
    ]);

    return { users, posts, todos };
}

/**
 * Builds a per-user record: name, email, city, post count,
 * completed todos, open todos. Pure array methods only, no loops.
 * Uses groupBy so posts/todos are scanned once, not once per user.
 */
function buildUserRecords(users: ApiUser[], posts: ApiPost[], todos: ApiTodo[]): UserReport[] {
    const postsByUserId = groupBy(posts, (post) => String(post.userId));
    const todosByUserId = groupBy(todos, (todo) => String(todo.userId));

    return users.map((user): UserReport => {
        const userPosts = postsByUserId[String(user.id)] ?? [];
        const userTodos = todosByUserId[String(user.id)] ?? [];
        const completedTodos = userTodos.filter((todo) => todo.completed);
        const openTodos = userTodos.filter((todo) => !todo.completed);

        return {
            name: user.name,
            email: user.email,
            city: user.address.city,
            postCount: userPosts.length,
            completedTodos: completedTodos.length,
            openTodos: openTodos.length
        };
    });
}

/**
 * Sorts records by post count descending, ties broken by name ascending.
 * Returns a new array — does not mutate the input.
 */
function sortRecords(records: UserReport[]): UserReport[] {
    return [...records].sort((a, b) => {
        if (b.postCount !== a.postCount) {
            return b.postCount - a.postCount;
        }
        return a.name.localeCompare(b.name);
    });
}

/**
 * Computes summary statistics using reduce.
 */
function computeSummary(records: UserReport[]): Summary {
    const totalUsers = records.length;
    const totalPosts = records.reduce((sum, r) => sum + r.postCount, 0);
    const averagePosts = totalUsers === 0 ? 0 : totalPosts / totalUsers;

    const mostCompletedUser = records.reduce((best, current) =>
        current.completedTodos > best.completedTodos ? current : best
    );

    return {
        totalUsers,
        totalPosts,
        averagePosts,
        mostCompletedName: mostCompletedUser.name
    };
}

/**
 * Prints the aligned report followed by summary stats.
 */
function printReport(sortedRecords: UserReport[], summary: Summary): void {
    console.log("User Insights Report");
    console.log("=".repeat(70));

    sortedRecords.forEach((r) => {
        const namePart = r.name.padEnd(22);
        const cityPart = r.city.padEnd(16);
        const postsPart = `Posts: ${String(r.postCount).padStart(2)}`;
        const donePart = `Done: ${String(r.completedTodos).padStart(2)}`;
        const openPart = `Open: ${String(r.openTodos).padStart(2)}`;
        console.log(`${namePart} ${cityPart} ${postsPart}  ${donePart}  ${openPart}`);
    });

    console.log("-".repeat(70));
    console.log(`Total users:            ${summary.totalUsers}`);
    console.log(`Total posts:            ${summary.totalPosts}`);
    console.log(`Average posts per user: ${summary.averagePosts.toFixed(2)}`);
    console.log(`Most completed todos:   ${summary.mostCompletedName}`);
}

/**
 * Parses the --min-posts flag from CLI args.
 * Defaults to 0. Exits non-zero on a non-numeric value.
 */
function parseMinPosts(args: string[]): number {
    const flagIndex = args.indexOf("--min-posts");
    if (flagIndex === -1) {
        return 0;
    }

    const raw = args[flagIndex + 1];
    const parsed = Number(raw);

    if (Number.isNaN(parsed)) {
        console.error(`Invalid --min-posts value: "${raw}". Must be a number.`);
        process.exit(1);
    }

    return parsed;
}

async function main(): Promise<void> {
    try {
        const minPosts = parseMinPosts(process.argv.slice(2));
        const { users, posts, todos } = await fetchAllData();
        const records = buildUserRecords(users, posts, todos);
        const filtered = records.filter((r) => r.postCount >= minPosts);
        const sorted = sortRecords(filtered);
        const summary = computeSummary(filtered);
        printReport(sorted, summary);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        console.error(`\nSomething went wrong while generating the report: ${message}`);
        process.exit(1);
    }
}

main();