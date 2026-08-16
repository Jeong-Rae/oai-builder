"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { SEED_RESOURCES, type Resource, type Cell, type ResourceFrame, type Section } from "@/lib/resources"

export interface ActionResult {
  ok: boolean
  error?: string
  slug?: string
}

interface CoreFields {
  name: string
  code: string
  lede: string
  navLabel: string
  group: "필드" | "오브젝트"
  hasControlStrip: boolean
}

interface ResourceContentInput extends CoreFields {
  sections: Section[]
  frames: ResourceFrame[]
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** "속성" 표의 "블록명"/"식별자" 값을 편집된 코어 필드에 맞춰 갱신한다. */
function syncAttributeTable(data: Resource): Resource {
  const sections = data.sections.map((section) => {
    if (section.type !== "table" || section.title !== "속성") return section
    const rows: Cell[][] = section.rows.map((row) => {
      const key = typeof row[0] === "string" ? row[0] : ""
      if (key === "블록명") return [row[0], data.name]
      if (key === "식별자") return [row[0], { code: data.code }]
      return row
    })
    return { ...section, rows }
  })
  return { ...data, sections }
}

async function getDatabaseClient() {
  try {
    const supabase = await createClient()
    return { supabase }
  } catch {
    return { error: "Supabase 환경 변수가 설정되지 않았습니다." }
  }
}

/** 최초 편집 때만 정적 리소스를 DB로 옮긴다. */
async function seedResources(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.from("resources").select("id").limit(1)
  if (error) return error.message
  if (data?.length) return

  const { error: insertError } = await supabase.from("resources").insert(
    SEED_RESOURCES.map((resource, sortOrder) => ({
      slug: resource.slug,
      group: resource.group,
      sort_order: sortOrder,
      data: resource,
      hero_image_url: null,
      preview_image_url: null,
    })),
  )
  return insertError?.message
}

/** 기존 리소스의 핵심 필드를 수정한다. */
export async function updateResourceCore(
  slug: string,
  fields: ResourceContentInput,
): Promise<ActionResult> {
  const client = await getDatabaseClient()
  if ("error" in client) return { ok: false, error: client.error }
  const { supabase } = client
  const seedError = await seedResources(supabase)
  if (seedError) return { ok: false, error: seedError }

  const { data: existing, error: fetchError } = await supabase
    .from("resources")
    .select("data")
    .eq("slug", slug)
    .maybeSingle()

  if (fetchError || !existing) {
    return { ok: false, error: fetchError?.message ?? "리소스를 찾을 수 없습니다." }
  }

  let nextData = {
    ...(existing.data as Resource),
    name: fields.name,
    code: fields.code,
    lede: fields.lede,
    navLabel: fields.navLabel,
    group: fields.group,
    hasControlStrip: fields.hasControlStrip,
    sections: fields.sections,
    frames: fields.frames,
  } as Resource
  nextData = syncAttributeTable(nextData)

  const { error } = await supabase
    .from("resources")
    .update({ data: nextData, group: fields.group })
    .eq("slug", slug)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  revalidatePath(`/${slug}`)
  return { ok: true, slug }
}

/** 대표 이미지 / 프리뷰 이미지 URL을 설정한다. null 이면 제거. */
export async function updateResourceImages(
  slug: string,
  images: { heroImageUrl?: string | null; previewImageUrl?: string | null },
): Promise<ActionResult> {
  const client = await getDatabaseClient()
  if ("error" in client) return { ok: false, error: client.error }
  const { supabase } = client
  const seedError = await seedResources(supabase)
  if (seedError) return { ok: false, error: seedError }

  const patch: Record<string, string | null> = {}
  if ("heroImageUrl" in images) patch.hero_image_url = images.heroImageUrl ?? null
  if ("previewImageUrl" in images)
    patch.preview_image_url = images.previewImageUrl ?? null

  const { error } = await supabase.from("resources").update(patch).eq("slug", slug)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  revalidatePath(`/${slug}`)
  return { ok: true, slug }
}

/** 새 리소스 항목을 추가한다. */
export async function createResource(fields: CoreFields): Promise<ActionResult> {
  const client = await getDatabaseClient()
  if ("error" in client) return { ok: false, error: client.error }
  const { supabase } = client
  const seedError = await seedResources(supabase)
  if (seedError) return { ok: false, error: seedError }

  const base = slugify(fields.code || fields.name) || "resource"
  let slug = base
  // 슬러그 유일성 확보
  for (let i = 1; i < 50; i++) {
    const { data: dupe } = await supabase
      .from("resources")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (!dupe) break
    slug = `${base}-${i}`
  }

  const newResource: Resource = {
    slug,
    group: fields.group,
    navLabel: fields.navLabel || fields.name,
    code: fields.code,
    name: fields.name,
    lede: fields.lede,
    meta: [],
    hasControlStrip: fields.hasControlStrip,
    stories: [
      {
        id: "default",
        title: "기본",
        desc: `${fields.name}의 기본 리소스 상태.`,
        ref: fields.code,
        state: fields.code,
        controls: [],
      },
      {
        id: "controls",
        title: "컨트롤",
        desc: `${fields.name}에 연결된 컨트롤 상태.`,
        ref: fields.code,
        state: `${fields.code} / controls`,
        controls: [],
      },
    ],
    frames: [],
    sections: [
      {
        type: "table",
        title: "속성",
        headers: ["속성", "값"],
        rows: [
          ["블록명", fields.name],
          ["식별자", { code: fields.code }],
          ["블록 이미지", ""],
        ],
      },
    ],
    sources: [],
  }

  // 정렬 순서: 같은 그룹의 마지막 다음
  const { data: last } = await supabase
    .from("resources")
    .select("sort_order")
    .eq("group", fields.group)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = (last?.sort_order ?? -1) + 1

  const { error } = await supabase.from("resources").insert({
    slug,
    group: fields.group,
    sort_order: sortOrder,
    data: newResource,
    hero_image_url: null,
    preview_image_url: null,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  return { ok: true, slug }
}

/** 리소스 항목을 삭제한다. */
export async function deleteResource(slug: string): Promise<ActionResult> {
  const client = await getDatabaseClient()
  if ("error" in client) return { ok: false, error: client.error }
  const { supabase } = client
  const seedError = await seedResources(supabase)
  if (seedError) return { ok: false, error: seedError }
  const { error } = await supabase.from("resources").delete().eq("slug", slug)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/", "layout")
  return { ok: true }
}

/** 이미지 파일을 스토리지에 업로드하고 공개 URL을 반환한다. */
export async function uploadResourceImage(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const file = formData.get("file")
  const slug = String(formData.get("slug") ?? "misc")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "파일이 없습니다." }
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "이미지 파일만 업로드할 수 있습니다." }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "이미지 크기는 5MB 이하여야 합니다." }
  }

  const client = await getDatabaseClient()
  if ("error" in client) return { ok: false, error: client.error }
  const { supabase } = client
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
  const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from("resource-images")
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { ok: false, error: error.message }

  const { data } = supabase.storage.from("resource-images").getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}
