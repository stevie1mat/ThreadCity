import { Post } from '../types';

export function extractAtUri(url: string): { handle: string; rkey: string } | null {
  const m = url.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/?#]+)/);
  if (!m) return null;
  return { handle: m[1], rkey: m[2] };
}

export async function fetchThread(url: string): Promise<any> {
  const parts = extractAtUri(url);
  if (!parts) throw new Error('Invalid Bluesky URL. Expected: https://bsky.app/profile/.../post/...');

  // Resolve handle to DID
  const resolveRes = await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(parts.handle)}`);
  if (!resolveRes.ok) throw new Error('Could not resolve Bluesky handle');
  const { did } = await resolveRes.json();

  const atUri = `at://${did}/app.bsky.feed.post/${parts.rkey}`;
  const threadRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(atUri)}&depth=10&parentHeight=0`);
  if (!threadRes.ok) throw new Error('Could not fetch thread. Post may be private or deleted.');
  const data = await threadRes.json();
  return data.thread;
}

export function parseThread(node: any, depth: number = 0): Post | null {
  if (!node || node.$type !== 'app.bsky.feed.defs#threadViewPost') return null;
  const post = node.post;
  return {
    uri: post.uri,
    author: post.author?.displayName || post.author?.handle || 'unknown',
    handle: post.author?.handle || '',
    text: post.record?.text || '',
    likes: post.likeCount || 0,
    reposts: post.repostCount || 0,
    replies: post.replyCount || 0,
    depth,
    children: (node.replies || [])
      .map((r: any) => parseThread(r, depth + 1))
      .filter(Boolean)
      .sort((a: Post, b: Post) => (b.likes + b.replies * 2) - (a.likes + a.replies * 2))
  };
}
