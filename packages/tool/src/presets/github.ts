/**
 * @seashorelab/tool - GitHub Tool
 *
 * Preset tools for interacting with GitHub API
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Configuration for GitHub tools
 */
export interface GitHubToolConfig {
  /** GitHub personal access token (optional, for higher rate limits) */
  readonly token?: string;
  /** Base URL for GitHub API (default: https://api.github.com) */
  readonly baseUrl?: string;
}

/**
 * GitHub repository info
 */
export interface GitHubRepo {
  readonly name: string;
  readonly fullName: string;
  readonly description: string | null;
  readonly url: string;
  readonly htmlUrl: string;
  readonly language: string | null;
  readonly stars: number;
  readonly forks: number;
  readonly openIssues: number;
  readonly topics: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * GitHub issue info
 */
export interface GitHubIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string | null;
  readonly state: string;
  readonly url: string;
  readonly htmlUrl: string;
  readonly user: string;
  readonly labels: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly comments: number;
}

/**
 * GitHub pull request info
 */
export interface GitHubPullRequest {
  readonly number: number;
  readonly title: string;
  readonly body: string | null;
  readonly state: string;
  readonly url: string;
  readonly htmlUrl: string;
  readonly user: string;
  readonly labels: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly merged: boolean;
  readonly mergeable: boolean | null;
}

/**
 * Input schema for searching repositories
 */
const searchReposInputSchema = z.object({
  query: z.string().describe('Search query for repositories'),
  sort: z
    .enum(['stars', 'forks', 'help-wanted-issues', 'updated'])
    .optional()
    .describe('Sort criteria for results'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  perPage: z.number().int().min(1).max(100).optional().describe('Results per page (max 100)'),
  page: z.number().int().min(1).optional().describe('Page number'),
});

/**
 * Input schema for getting repository info
 */
const getRepoInputSchema = z.object({
  owner: z.string().describe('Repository owner (username or organization)'),
  repo: z.string().describe('Repository name'),
});

/**
 * Input schema for listing issues
 */
const listIssuesInputSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  state: z.enum(['open', 'closed', 'all']).optional().describe('Issue state filter'),
  labels: z.array(z.string()).optional().describe('Filter by labels'),
  sort: z.enum(['created', 'updated', 'comments']).optional().describe('Sort criteria'),
  direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  perPage: z.number().int().min(1).max(100).optional().describe('Results per page'),
  page: z.number().int().min(1).optional().describe('Page number'),
});

/**
 * Input schema for listing pull requests
 */
const listPullRequestsInputSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  state: z.enum(['open', 'closed', 'all']).optional().describe('PR state filter'),
  sort: z
    .enum(['created', 'updated', 'popularity', 'long-running'])
    .optional()
    .describe('Sort criteria'),
  direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  perPage: z.number().int().min(1).max(100).optional().describe('Results per page'),
  page: z.number().int().min(1).optional().describe('Page number'),
});

/**
 * Input schema for getting file content
 */
const getFileContentInputSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  path: z.string().describe('Path to the file in the repository'),
  ref: z.string().optional().describe('Branch, tag, or commit SHA (default: main branch)'),
});

/**
 * Input schema for searching code
 */
const searchCodeInputSchema = z.object({
  query: z.string().describe('Search query for code'),
  sort: z.enum(['indexed']).optional().describe('Sort by indexed date'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  perPage: z.number().int().min(1).max(100).optional().describe('Results per page'),
  page: z.number().int().min(1).optional().describe('Page number'),
});

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Create headers for GitHub API requests
 */
function createHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Create a GitHub repository search tool
 *
 * @example
 * ```typescript
 * import { githubSearchReposTool } from '@seashorelab/tool/presets';
 *
 * const search = githubSearchReposTool({ token: process.env.GITHUB_TOKEN });
 * const results = await search.execute({
 *   query: 'ai agent framework language:typescript',
 *   sort: 'stars',
 *   perPage: 10
 * });
 * ```
 */
export function githubSearchReposTool(config: GitHubToolConfig = {}) {
  const baseUrl = config.baseUrl ?? GITHUB_API_BASE;

  return defineTool({
    name: 'github_search_repos',
    description:
      'Search GitHub repositories. Supports advanced search qualifiers like language:, stars:>, created:, etc.',
    inputSchema: searchReposInputSchema,

    async execute({ query, sort, order = 'desc', perPage = 30, page = 1 }) {
      const params = new URLSearchParams({
        q: query,
        per_page: String(perPage),
        page: String(page),
      });

      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);

      const response = await fetch(`${baseUrl}/search/repositories?${params}`, {
        headers: createHeaders(config.token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      interface GitHubApiRepo {
        name: string;
        full_name: string;
        description: string | null;
        url: string;
        html_url: string;
        language: string | null;
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        topics: string[];
        created_at: string;
        updated_at: string;
      }

      const data = (await response.json()) as {
        total_count: number;
        items: GitHubApiRepo[];
      };

      return {
        query,
        totalCount: data.total_count,
        repos: data.items.map(
          (repo: GitHubApiRepo): GitHubRepo => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.url,
            htmlUrl: repo.html_url,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            openIssues: repo.open_issues_count,
            topics: repo.topics || [],
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
          })
        ),
      };
    },
  });
}

/**
 * Create a GitHub get repository tool
 *
 * @example
 * ```typescript
 * import { githubGetRepoTool } from '@seashorelab/tool/presets';
 *
 * const getRepo = githubGetRepoTool({ token: process.env.GITHUB_TOKEN });
 * const repo = await getRepo.execute({ owner: 'microsoft', repo: 'vscode' });
 * ```
 */
export function githubGetRepoTool(config: GitHubToolConfig = {}) {
  const baseUrl = config.baseUrl ?? GITHUB_API_BASE;

  return defineTool({
    name: 'github_get_repo',
    description: 'Get detailed information about a GitHub repository.',
    inputSchema: getRepoInputSchema,

    async execute({ owner, repo }) {
      const response = await fetch(`${baseUrl}/repos/${owner}/${repo}`, {
        headers: createHeaders(config.token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      interface GitHubApiRepoDetail {
        name: string;
        full_name: string;
        description: string | null;
        url: string;
        html_url: string;
        language: string | null;
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        topics: string[];
        created_at: string;
        updated_at: string;
        subscribers_count: number;
        default_branch: string;
        license: { name: string } | null;
      }

      const data = (await response.json()) as GitHubApiRepoDetail;

      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        url: data.url,
        htmlUrl: data.html_url,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        topics: data.topics || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        watchers: data.subscribers_count,
        defaultBranch: data.default_branch,
        license: data.license?.name ?? null,
      };
    },
  });
}

/**
 * Create a GitHub list issues tool
 *
 * @example
 * ```typescript
 * import { githubListIssuesTool } from '@seashorelab/tool/presets';
 *
 * const listIssues = githubListIssuesTool({ token: process.env.GITHUB_TOKEN });
 * const issues = await listIssues.execute({
 *   owner: 'microsoft',
 *   repo: 'vscode',
 *   state: 'open',
 *   labels: ['bug']
 * });
 * ```
 */
export function githubListIssuesTool(config: GitHubToolConfig = {}) {
  const baseUrl = config.baseUrl ?? GITHUB_API_BASE;

  return defineTool({
    name: 'github_list_issues',
    description: 'List issues for a GitHub repository with optional filters.',
    inputSchema: listIssuesInputSchema,

    async execute({
      owner,
      repo,
      state = 'open',
      labels,
      sort = 'created',
      direction = 'desc',
      perPage = 30,
      page = 1,
    }) {
      const params = new URLSearchParams({
        state,
        sort,
        direction,
        per_page: String(perPage),
        page: String(page),
      });

      if (labels && labels.length > 0) {
        params.set('labels', labels.join(','));
      }

      const response = await fetch(`${baseUrl}/repos/${owner}/${repo}/issues?${params}`, {
        headers: createHeaders(config.token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      interface GitHubApiIssue {
        number: number;
        title: string;
        body: string | null;
        state: string;
        url: string;
        html_url: string;
        user: { login: string };
        labels: { name: string }[];
        created_at: string;
        updated_at: string;
        comments: number;
        pull_request?: object;
      }

      const data = (await response.json()) as GitHubApiIssue[];

      // Filter out pull requests (they also appear in issues endpoint)
      const issues = data
        .filter((item: GitHubApiIssue) => !item.pull_request)
        .map(
          (issue: GitHubApiIssue): GitHubIssue => ({
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            url: issue.url,
            htmlUrl: issue.html_url,
            user: issue.user.login,
            labels: issue.labels.map((l) => l.name),
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            comments: issue.comments,
          })
        );

      return {
        owner,
        repo,
        issues,
      };
    },
  });
}

/**
 * Create a GitHub list pull requests tool
 *
 * @example
 * ```typescript
 * import { githubListPullRequestsTool } from '@seashorelab/tool/presets';
 *
 * const listPRs = githubListPullRequestsTool({ token: process.env.GITHUB_TOKEN });
 * const prs = await listPRs.execute({
 *   owner: 'microsoft',
 *   repo: 'vscode',
 *   state: 'open'
 * });
 * ```
 */
export function githubListPullRequestsTool(config: GitHubToolConfig = {}) {
  const baseUrl = config.baseUrl ?? GITHUB_API_BASE;

  return defineTool({
    name: 'github_list_pull_requests',
    description: 'List pull requests for a GitHub repository.',
    inputSchema: listPullRequestsInputSchema,

    async execute({
      owner,
      repo,
      state = 'open',
      sort = 'created',
      direction = 'desc',
      perPage = 30,
      page = 1,
    }) {
      const params = new URLSearchParams({
        state,
        sort,
        direction,
        per_page: String(perPage),
        page: String(page),
      });

      const response = await fetch(`${baseUrl}/repos/${owner}/${repo}/pulls?${params}`, {
        headers: createHeaders(config.token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      interface GitHubApiPR {
        number: number;
        title: string;
        body: string | null;
        state: string;
        url: string;
        html_url: string;
        user: { login: string };
        labels: { name: string }[];
        created_at: string;
        updated_at: string;
        merged_at: string | null;
        mergeable: boolean | null;
      }

      const data = (await response.json()) as GitHubApiPR[];

      return {
        owner,
        repo,
        pullRequests: data.map(
          (pr: GitHubApiPR): GitHubPullRequest => ({
            number: pr.number,
            title: pr.title,
            body: pr.body,
            state: pr.state,
            url: pr.url,
            htmlUrl: pr.html_url,
            user: pr.user.login,
            labels: pr.labels.map((l) => l.name),
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            merged: pr.merged_at !== null,
            mergeable: pr.mergeable,
          })
        ),
      };
    },
  });
}

/**
 * Create a GitHub get file content tool
 *
 * @example
 * ```typescript
 * import { githubGetFileContentTool } from '@seashorelab/tool/presets';
 *
 * const getFile = githubGetFileContentTool({ token: process.env.GITHUB_TOKEN });
 * const content = await getFile.execute({
 *   owner: 'microsoft',
 *   repo: 'vscode',
 *   path: 'README.md'
 * });
 * ```
 */
export function githubGetFileContentTool(config: GitHubToolConfig = {}) {
  const baseUrl = config.baseUrl ?? GITHUB_API_BASE;

  return defineTool({
    name: 'github_get_file_content',
    description: 'Get the content of a file from a GitHub repository.',
    inputSchema: getFileContentInputSchema,

    async execute({ owner, repo, path, ref }) {
      const params = ref ? `?ref=${encodeURIComponent(ref)}` : '';

      const response = await fetch(`${baseUrl}/repos/${owner}/${repo}/contents/${path}${params}`, {
        headers: createHeaders(config.token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        name: string;
        path: string;
        size: number;
        content: string;
        encoding: string;
        html_url: string;
        download_url: string;
      };

      // Decode base64 content
      const content =
        data.encoding === 'base64'
          ? Buffer.from(data.content, 'base64').toString('utf-8')
          : data.content;

      return {
        name: data.name,
        path: data.path,
        size: data.size,
        content,
        htmlUrl: data.html_url,
        downloadUrl: data.download_url,
      };
    },
  });
}

/**
 * Create a GitHub code search tool
 *
 * @example
 * ```typescript
 * import { githubSearchCodeTool } from '@seashorelab/tool/presets';
 *
 * const searchCode = githubSearchCodeTool({ token: process.env.GITHUB_TOKEN });
 * const results = await searchCode.execute({
 *   query: 'defineComponent repo:vuejs/core language:typescript'
 * });
 * ```
 */
export function githubSearchCodeTool(config: GitHubToolConfig = {}) {
  const baseUrl = config.baseUrl ?? GITHUB_API_BASE;

  return defineTool({
    name: 'github_search_code',
    description:
      'Search for code across GitHub repositories. Supports qualifiers like repo:, language:, path:, etc.',
    inputSchema: searchCodeInputSchema,

    async execute({ query, sort, order = 'desc', perPage = 30, page = 1 }) {
      const params = new URLSearchParams({
        q: query,
        per_page: String(perPage),
        page: String(page),
      });

      if (sort) params.set('sort', sort);
      if (order) params.set('order', order);

      const response = await fetch(`${baseUrl}/search/code?${params}`, {
        headers: createHeaders(config.token),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      interface GitHubApiCodeResult {
        name: string;
        path: string;
        html_url: string;
        repository: {
          full_name: string;
          html_url: string;
        };
        text_matches?: {
          fragment: string;
        }[];
      }

      const data = (await response.json()) as {
        total_count: number;
        items: GitHubApiCodeResult[];
      };

      return {
        query,
        totalCount: data.total_count,
        results: data.items.map((item: GitHubApiCodeResult) => ({
          name: item.name,
          path: item.path,
          htmlUrl: item.html_url,
          repository: item.repository.full_name,
          repositoryUrl: item.repository.html_url,
          matches: item.text_matches?.map((m) => m.fragment) ?? [],
        })),
      };
    },
  });
}
