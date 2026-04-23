/**
 * Resolve public delivery URL for a stored object key.
 * Use Supabase Storage public bucket, or S3+CloudFront base URL, depending on env.
 */
export function publicUrlForStorageKey(
  s3Key: string,
  opts: { supabaseBase?: string; cloudFrontBase?: string } = {}
): string {
  const supabase = opts.supabaseBase ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const useSupabase =
    process.env.NEXT_PUBLIC_ASSETS_USE_SUPABASE === 'true' &&
    supabase &&
    process.env.SUPABASE_ASSETS_BUCKET

  if (useSupabase) {
    const bucket = process.env.SUPABASE_ASSETS_BUCKET
    return `${supabase}/storage/v1/object/public/${bucket}/${s3Key.replace(/^\//, '')}`
  }

  const base = (opts.cloudFrontBase ?? process.env.ASSETS_PUBLIC_BASE_URL ?? '').replace(/\/$/, '')
  if (base) {
    return `${base}/${s3Key.replace(/^\//, '')}`
  }

  // Dev fallback: key is already a full URL
  if (s3Key.startsWith('https://') || s3Key.startsWith('http://')) {
    return s3Key
  }

  return s3Key
}
