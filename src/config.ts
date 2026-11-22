export const SOURCE_BASE = 'https://viet69.be'
export const EMBED_BASE = 'https://emb.cd-vs.com'

export function embUrl(uuid: string): string {
  return `${EMBED_BASE}/embed/${uuid}`
}
