import "server-only"
import { createClient } from "@/lib/supabase/server"
import {
  SEED_RESOURCES,
  buildNavGroups,
  GROUPS,
  type Resource,
  type NavGroup,
} from "@/lib/resources"

interface ResourceRow {
  id: string
  slug: string
  group: string
  sort_order: number
  data: Resource
  hero_image_url: string | null
  preview_image_url: string | null
}

function rowToResource(row: ResourceRow): Resource {
  return {
    ...row.data,
    slug: row.slug,
    group: row.group as Resource["group"],
    heroImageUrl: row.hero_image_url,
    previewImageUrl: row.preview_image_url,
  }
}

export async function getAllResources(): Promise<Resource[]> {
  let data: ResourceRow[] | null = null
  let error: { message: string } | null = null
  try {
    const result = await (await createClient()).from("resources").select("*")
    data = result.data as ResourceRow[] | null
    error = result.error
  } catch (cause) {
    console.log("[resourcebook] Supabase is not configured:", cause)
    return SEED_RESOURCES
  }

  if (error) {
    console.log("[resourcebook] getAllResources error:", error.message)
    return SEED_RESOURCES
  }
  if (!data?.length) return SEED_RESOURCES

  const rank = (g: string) => {
    const i = GROUPS.indexOf(g as Resource["group"])
    return i === -1 ? GROUPS.length : i
  }
  const rows = (data as ResourceRow[]).slice().sort((a, b) => {
    const byGroup = rank(a.group) - rank(b.group)
    return byGroup !== 0 ? byGroup : a.sort_order - b.sort_order
  })
  return rows.map(rowToResource)
}

export async function getResourceBySlug(
  slug: string,
): Promise<Resource | null> {
  let data: ResourceRow | null = null
  let error: { message: string } | null = null
  try {
    const result = await (await createClient())
      .from("resources")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
    data = result.data as ResourceRow | null
    error = result.error
  } catch (cause) {
    console.log("[resourcebook] Supabase is not configured:", cause)
    return SEED_RESOURCES.find((resource) => resource.slug === slug) ?? null
  }

  if (error) {
    console.log("[resourcebook] getResourceBySlug error:", error.message)
    return SEED_RESOURCES.find((resource) => resource.slug === slug) ?? null
  }
  if (!data) return SEED_RESOURCES.find((resource) => resource.slug === slug) ?? null
  return rowToResource(data)
}

export async function getNavGroups(): Promise<NavGroup[]> {
  const resources = await getAllResources()
  return buildNavGroups(resources)
}
