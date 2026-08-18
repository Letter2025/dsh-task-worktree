/**
 * Type declarations for dsh-task-worktree.
 * The plugin itself is plain ESM JavaScript; this file documents the public
 * cordis plugin surface (name/inject/apply) for TypeScript consumers.
 */

/** Plugin id. */
export const name: 'task-worktree'
/** Services this plugin declares through cordis fiber injection. */
export const inject: ('tools' | 'commands' | 'subprocess')[]

/** Mount the plugin. */
export declare function apply(ctx: any, config?: { dirName?: string }): void