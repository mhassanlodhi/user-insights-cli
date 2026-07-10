const BASE_URL = "https://jsonplaceholder.typicode.com";

/**
 * Fetches users, posts, and todos concurrently.
 * Throws if any request fails (bad status or network error).
 */
async function fetchAllData() {
    const [usersRes, postsRes, todosRes] = await Promise.all([
        fetch(`${BASE_URL}/users`),
        fetch(`${BASE_URL}/posts`),
        fetch(`${BASE_URL}/todos`)
    ]);

    if (!usersRes.ok || !postsRes.ok || !todosRes.ok) {
        throw new Error("One or more requests to JSONPlaceholder failed.");
    }

    const [users, posts, todos] = await Promise.all([
        usersRes.json(),
        postsRes.json(),
        todosRes.json()
    ]);

    return { users, posts, todos };
}

/**
 * Builds a per-user record: name, email, city, post count,
 * completed todos, open todos. Pure array methods only, no loops.
 */
function buildUserRecords(users, posts, todos) {
    return users.map((user) => {
        const userPosts = posts.filter((post) => post.userId === user.id);
        const userTodos = todos.filter((todo) => todo.userId === user.id);
        const completedTodos = userTodos.filter((todo) => todo.completed);
        const openTodos = userTodos.filter((todo) => !todo.completed);

        return {
            name: user.name,
            email: user.email,
            city: user.address?.city ?? "Unknown",
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
function sortRecords(records) {
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
function computeSummary(records) {
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
function printReport(sortedRecords, summary) {
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

async function main() {
    try {
        const { users, posts, todos } = await fetchAllData();
        const records = buildUserRecords(users, posts, todos);
        const sorted = sortRecords(records);
        const summary = computeSummary(records);
        printReport(sorted, summary);
    } catch (error) {
        console.error(`\nSomething went wrong while generating the report: ${error.message}`);
        process.exit(1);
    }
}

main();