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

/** DB가 비어 있으면 정적 시드 데이터를 최초 1회 삽입한다. */
async function seedIfEmpty() {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("resources")
    .select("id", { count: "exact", head: true })

  if (error) {
    console.log("[v0] seedIfEmpty count error:", error.message)
    return
  }
  if (count && count > 0) return

  const rows = SEED_RESOURCES.map((r, i) => ({
    slug: r.slug,
    group: r.group,
    sort_order: i,
    data: r,
    hero_image_url: null,
    preview_image_url: null,
  }))

  const { error: insertError } = await supabase
    .from("resources")
    .insert(rows)

  if (insertError) {
    console.log("[v0] seed insert error:", insertError.message)
  }
}

export async function getAllResources(): Promise<Resource[]> {
  await seedIfEmpty()
  const supabase = await createClient()
  const { data, error } = await supabase.from("resources").select("*")

  if (error) {
    console.log("[v0] getAllResources error:", error.message)
    return SEED_RESOURCES
  }

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
  await seedIfEmpty()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.log("[v0] getResourceBySlug error:", error.message)
    return null
  }
  if (!data) return null
  return rowToResource(data as ResourceRow)
}

export async function getNavGroups(): Promise<NavGroup[]> {
  const resources = await getAllResources()
  return buildNavGroups(resources)
}
