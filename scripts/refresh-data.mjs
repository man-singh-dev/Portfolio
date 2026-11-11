#!/usr/bin/env node
/**
 * npm run refresh-data
 *
 * Pulls live stats from GitHub, LeetCode and Codeforces.
 *  - raw responses   -> data/*.json        (for reference / debugging)
 *  - compact payload -> src/data/site.json (the only file the site imports)
 *
 * Each source is fetched independently. If one fails (rate limit, Cloudflare,
 * network), the previous values in site.json are kept so a deploy never breaks.
 *
 * Auth: GITHUB_TOKEN / GH_TOKEN env var, falling back to `gh auth token`.
 * Privacy: only PUBLIC repos and PRs to PUBLIC repos ever reach site.json.
 */
import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "data");
const SITE_FILE = path.join(ROOT, "src", "data", "site.json");

const GH_LOGIN = "man-singh-dev";
const LC_USER = "Mansingh876";
const CF_HANDLE = "maansimaan02";
/** Repos that never appear in the "other projects" grid. */
const HIDDEN_REPOS = new Set(["man-singh-dev"]);

const UA = "portfolio-refresh-data/1.0";

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execSync("gh auth token", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function saveRaw(name, data) {
  await writeFile(path.join(RAW_DIR, name), JSON.stringify(data, null, 2) + "\n");
}

async function fetchJson(url, init = {}, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": UA, ...(init.headers || {}) },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------- GitHub
async function gql(query, variables = {}) {
  const t = token();
  if (!t) throw new Error("No GitHub token (set GITHUB_TOKEN or run `gh auth login`)");
  const json = await fetchJson("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function fetchGithub() {
  const reposData = await gql(
    `query($login:String!){ user(login:$login){
      repositories(first:100, ownerAffiliations:OWNER, privacy:PUBLIC, orderBy:{field:UPDATED_AT,direction:DESC}){
        nodes{ name description url homepageUrl isFork stargazerCount forkCount updatedAt createdAt
          primaryLanguage{name color}
          languages(first:8, orderBy:{field:SIZE,direction:DESC}){ edges{ size node{name color} } }
          repositoryTopics(first:10){ nodes{ topic{name} } } } } } }`,
    { login: GH_LOGIN },
  );
  const allRepos = reposData.user.repositories.nodes;
  await saveRaw("repos.json", allRepos);

  const searchQ = (type) =>
    gql(
      `query($q:String!){ search(query:$q, type:ISSUE, first:100){ nodes{
        ... on PullRequest { title url number state createdAt closedAt mergedAt additions deletions changedFiles isDraft
          labels(first:10){ nodes{ name } }
          repository{ nameWithOwner isPrivate stargazerCount url owner{ login avatarUrl } } }
        ... on Issue { title url number state createdAt closedAt
          repository{ nameWithOwner isPrivate url owner{ login avatarUrl } } } } } }`,
      { q: `author:${GH_LOGIN} type:${type} sort:created-desc` },
    );
  const prRaw = (await searchQ("pr")).search.nodes.filter((n) => n && n.url);
  const issueRaw = (await searchQ("issue")).search.nodes.filter((n) => n && n.url);
  // raw files are committed too, so they get the same privacy filter as site.json
  await saveRaw("prs.json", prRaw.filter((p) => !p.repository.isPrivate));
  await saveRaw("issues.json", issueRaw.filter((i) => !i.repository.isPrivate));

  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - 1);
  const contrib = await gql(
    `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){ contributionsCollection(from:$from,to:$to){
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions totalRepositoryContributions restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } } } } }`,
    { login: GH_LOGIN, from: from.toISOString(), to: to.toISOString() },
  );
  const cc = contrib.user.contributionsCollection;
  await saveRaw("contributions.json", cc);

  const repos = allRepos
    .filter((r) => !r.isFork && !HIDDEN_REPOS.has(r.name))
    .map((r) => ({
      name: r.name,
      description: r.description || "",
      url: r.url,
      homepage: r.homepageUrl || "",
      language: r.primaryLanguage?.name || null,
      languageColor: r.primaryLanguage?.color || null,
      languages: r.languages.edges.map((e) => ({ name: e.node.name, size: e.size })),
      stars: r.stargazerCount,
      forks: r.forkCount,
      topics: r.repositoryTopics.nodes.map((t) => t.topic.name),
      updatedAt: r.updatedAt,
      createdAt: r.createdAt,
    }));

  const prs = prRaw
    .filter((p) => !p.repository.isPrivate) // private repo PRs never go public
    .map((p) => ({
      title: p.title,
      url: p.url,
      number: p.number,
      repo: p.repository.nameWithOwner,
      repoUrl: p.repository.url,
      repoStars: p.repository.stargazerCount,
      owner: p.repository.owner.login,
      avatar: p.repository.owner.avatarUrl,
      own: p.repository.owner.login.toLowerCase() === GH_LOGIN.toLowerCase(),
      status: p.mergedAt ? "merged" : p.state.toLowerCase(), // merged | open | closed
      draft: p.isDraft,
      createdAt: p.createdAt,
      mergedAt: p.mergedAt,
      closedAt: p.closedAt,
      additions: p.additions,
      deletions: p.deletions,
      labels: p.labels.nodes.map((l) => l.name),
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const issues = issueRaw
    .filter((i) => !i.repository.isPrivate)
    .map((i) => ({
      title: i.title,
      url: i.url,
      repo: i.repository.nameWithOwner,
      state: i.state.toLowerCase(),
      createdAt: i.createdAt,
    }));

  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  return {
    login: GH_LOGIN,
    repos,
    prs,
    issues,
    contributions: {
      total: cc.contributionCalendar.totalContributions,
      commits: cc.totalCommitContributions,
      pullRequests: cc.totalPullRequestContributions,
      reviews: cc.totalPullRequestReviewContributions,
      issues: cc.totalIssueContributions,
      privateContributions: cc.restrictedContributionsCount,
      start: days[0]?.date,
      end: days.at(-1)?.date,
      weeks: cc.contributionCalendar.weeks.map((w) =>
        w.contributionDays.map((d) => [d.date, d.contributionCount, d.weekday]),
      ),
    },
  };
}

// ---------------------------------------------------------------- LeetCode
async function fetchLeetcode() {
  const query = `query($u:String!){
    matchedUser(username:$u){ username profile{ ranking }
      submitStatsGlobal{ acSubmissionNum{ difficulty count } }
      badges{ name displayName icon creationDate } }
    allQuestionsCount{ difficulty count }
    userContestRanking(username:$u){ attendedContestsCount rating globalRanking topPercentage totalParticipants badge{ name } }
    userContestRankingHistory(username:$u){ attended rating ranking contest{ title startTime } } }`;
  const json = await fetchJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { u: LC_USER } }),
  });
  if (!json.data?.matchedUser) throw new Error("LeetCode user not found / blocked");
  await saveRaw("leetcode.json", json);
  const d = json.data;
  const solved = Object.fromEntries(
    d.matchedUser.submitStatsGlobal.acSubmissionNum.map((x) => [x.difficulty.toLowerCase(), x.count]),
  );
  const totals = Object.fromEntries(d.allQuestionsCount.map((x) => [x.difficulty.toLowerCase(), x.count]));
  const c = d.userContestRanking;
  return {
    username: LC_USER,
    url: `https://leetcode.com/u/${LC_USER}/`,
    ranking: d.matchedUser.profile.ranking,
    solved,
    totals,
    badges: d.matchedUser.badges.map((b) => ({ name: b.displayName || b.name, date: b.creationDate })),
    contest: c
      ? {
          rating: Math.round(c.rating),
          attended: c.attendedContestsCount,
          globalRanking: c.globalRanking,
          topPercentage: c.topPercentage,
          badge: c.badge?.name || null,
        }
      : null,
    history: (d.userContestRankingHistory || [])
      .filter((h) => h.attended)
      .map((h) => ({
        rating: Math.round(h.rating),
        date: new Date(h.contest.startTime * 1000).toISOString().slice(0, 10),
        contest: h.contest.title,
      })),
  };
}

// ---------------------------------------------------------------- Codeforces
async function fetchCodeforces() {
  const info = await fetchJson(`https://codeforces.com/api/user.info?handles=${CF_HANDLE}`);
  const rating = await fetchJson(`https://codeforces.com/api/user.rating?handle=${CF_HANDLE}`);
  const status = await fetchJson(`https://codeforces.com/api/user.status?handle=${CF_HANDLE}&from=1&count=10000`);
  if (info.status !== "OK" || rating.status !== "OK") throw new Error("Codeforces API error");
  await saveRaw("codeforces_info.json", info);
  await saveRaw("codeforces_rating.json", rating);
  const solvedSet = new Set(
    (status.result || [])
      .filter((s) => s.verdict === "OK")
      .map((s) => `${s.problem.contestId ?? "gym"}-${s.problem.index}-${s.problem.name}`),
  );
  const u = info.result[0];
  return {
    handle: u.handle,
    url: `https://codeforces.com/profile/${u.handle}`,
    rating: u.rating ?? null,
    maxRating: u.maxRating ?? null,
    rank: u.rank ?? null,
    maxRank: u.maxRank ?? null,
    solved: solvedSet.size,
    contests: rating.result.length,
    history: rating.result.map((r) => ({
      rating: r.newRating,
      date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString().slice(0, 10),
      contest: r.contestName,
      rank: r.rank,
    })),
  };
}

// ---------------------------------------------------------------- READMEs (raw only)
async function fetchReadmes(repos) {
  const t = token();
  const out = {};
  for (const r of repos) {
    try {
      const res = await fetch(`https://api.github.com/repos/${GH_LOGIN}/${r.name}/readme`, {
        headers: { Accept: "application/vnd.github.raw", Authorization: `bearer ${t}`, "User-Agent": UA },
      });
      out[r.name] = res.ok ? await res.text() : null;
    } catch {
      out[r.name] = null;
    }
  }
  await saveRaw("readmes.json", out);
}

// ---------------------------------------------------------------- main
async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(path.dirname(SITE_FILE), { recursive: true });
  const prev = await readJson(SITE_FILE, {});
  const next = { ...prev };
  const results = {};

  for (const [key, fn] of [
    ["github", fetchGithub],
    ["leetcode", fetchLeetcode],
    ["codeforces", fetchCodeforces],
  ]) {
    try {
      next[key] = await fn();
      results[key] = "ok";
    } catch (e) {
      results[key] = `FAILED (kept previous): ${e.message}`;
    }
  }

  if (results.github === "ok" && !process.argv.includes("--skip-readmes")) {
    await fetchReadmes(next.github.repos).catch(() => {});
  }

  next.generatedAt = new Date().toISOString();
  await writeFile(SITE_FILE, JSON.stringify(next, null, 2) + "\n");

  console.log("refresh-data:");
  for (const [k, v] of Object.entries(results)) console.log(`  ${k.padEnd(11)} ${v}`);
  if (next.github) {
    const oss = next.github.prs.filter((p) => !p.own);
    console.log(
      `  repos=${next.github.repos.length} prs=${next.github.prs.length} (oss=${oss.length}, merged=${
        oss.filter((p) => p.status === "merged").length
      }) contributions=${next.github.contributions.total}`,
    );
  }
  if (next.leetcode) console.log(`  leetcode solved=${next.leetcode.solved.all} rating=${next.leetcode.contest?.rating}`);
  if (next.codeforces)
    console.log(`  codeforces rating=${next.codeforces.rating} max=${next.codeforces.maxRating} solved=${next.codeforces.solved}`);

  if (!next.github || !next.leetcode || !next.codeforces) {
    console.error("Missing a data source with no previous fallback.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
