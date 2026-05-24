import type {
  NutritionAutoGeneratePreferences,
  NutritionAutoGeneratePreferencesInput,
  NutritionPlan,
  NutritionPlanBottle,
  NutritionPlanBottleInput,
  NutritionPlanDetail,
  NutritionPlanInput,
  NutritionPlanItem,
  NutritionPlanItemInput,
  NutritionPlanItemWithProduct,
  NutritionProduct,
  NutritionProductInput
} from "@athmira/types";

import { assertSupabaseConfigured, supabase } from "./client";

export const MAX_CUSTOM_NUTRITION_PRODUCTS = 15;
export const MAX_AUTO_GENERATE_BOTTLES = 10;

type SaveNutritionPlanInput = {
  bottles: NutritionPlanBottleInput[];
  items: NutritionPlanItemInput[];
  plan: NutritionPlanInput;
  planId?: string;
};

export async function listNutritionPlans(userId: string): Promise<NutritionPlan[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NutritionPlan[];
}

export async function getNutritionPlan(userId: string, planId: string): Promise<NutritionPlanDetail | null> {
  assertSupabaseConfigured();

  const planResult = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (planResult.error) {
    throw planResult.error;
  }

  if (!planResult.data) {
    return null;
  }

  const [bottlesResult, itemsResult, activeProducts] = await Promise.all([
    supabase
      .from("nutrition_plan_bottles")
      .select("*")
      .eq("plan_id", planId)
      .eq("user_id", userId)
      .order("display_order", { ascending: true }),
    supabase
      .from("nutrition_plan_items")
      .select("*")
      .eq("plan_id", planId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    listNutritionProducts(userId)
  ]);

  if (bottlesResult.error) {
    throw bottlesResult.error;
  }

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  const rawItems = (itemsResult.data ?? []) as NutritionPlanItem[];
  const products = await loadProductsForPlan(rawItems, activeProducts);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const items = rawItems.map<NutritionPlanItemWithProduct>((item) => ({
    ...item,
    product: productsById.get(item.product_id) ?? null
  }));

  return {
    ...planResult.data,
    bottles: (bottlesResult.data ?? []) as NutritionPlanBottle[],
    items
  } as NutritionPlanDetail;
}

export async function saveNutritionPlan(userId: string, input: SaveNutritionPlanInput): Promise<NutritionPlanDetail> {
  assertSupabaseConfigured();

  const planPayload = {
    activity_type: input.plan.activity_type,
    body_weight_kg: input.plan.body_weight_kg ?? null,
    description: input.plan.description?.trim() || null,
    duration_minutes: input.plan.duration_minutes,
    estimated_calories_burned: input.plan.estimated_calories_burned ?? null,
    intensity: input.plan.intensity,
    target_carbs_per_hour: input.plan.target_carbs_per_hour ?? null,
    target_fluids_ml_per_hour: input.plan.target_fluids_ml_per_hour ?? null,
    target_sodium_mg_per_hour: input.plan.target_sodium_mg_per_hour ?? null,
    title: input.plan.title.trim(),
    total_planned_calories: input.plan.total_planned_calories ?? 0,
    total_planned_carbs: input.plan.total_planned_carbs ?? 0,
    total_planned_fluids_ml: input.plan.total_planned_fluids_ml ?? 0,
    total_planned_sodium_mg: input.plan.total_planned_sodium_mg ?? 0,
    updated_at: new Date().toISOString()
  };

  const plan = input.planId
    ? await updateNutritionPlanRecord(userId, input.planId, planPayload)
    : await createNutritionPlanRecord(userId, planPayload);

  if (input.planId) {
    const itemsDelete = await supabase
      .from("nutrition_plan_items")
      .delete()
      .eq("plan_id", plan.id)
      .eq("user_id", userId);

    if (itemsDelete.error) {
      throw itemsDelete.error;
    }

    const bottlesDelete = await supabase
      .from("nutrition_plan_bottles")
      .delete()
      .eq("plan_id", plan.id)
      .eq("user_id", userId);

    if (bottlesDelete.error) {
      throw bottlesDelete.error;
    }
  }

  if (input.bottles.length) {
    const { error } = await supabase.from("nutrition_plan_bottles").insert(
      input.bottles.map((bottle, index) => ({
        id: bottle.id,
        bottle_size_label: bottle.bottle_size_label ?? null,
        bottle_size_ml: bottle.bottle_size_ml,
        display_order: bottle.display_order ?? index,
        name: bottle.name ?? `Bottle ${index + 1}`,
        plan_id: plan.id,
        remaining_water_ml: bottle.remaining_water_ml ?? Math.max(0, bottle.bottle_size_ml - (bottle.total_used_volume_ml ?? 0)),
        total_calories: bottle.total_calories ?? 0,
        total_carbs: bottle.total_carbs ?? 0,
        total_sodium_mg: bottle.total_sodium_mg ?? 0,
        total_used_volume_ml: bottle.total_used_volume_ml ?? 0,
        user_id: userId
      }))
    );

    if (error) {
      throw error;
    }
  }

  if (input.items.length) {
    const { error } = await supabase.from("nutrition_plan_items").insert(
      input.items.map((item) => ({
        id: item.id,
        bottle_id: item.bottle_id ?? null,
        calculated_calories: item.calculated_calories ?? 0,
        calculated_carbs: item.calculated_carbs ?? 0,
        calculated_sodium_mg: item.calculated_sodium_mg ?? 0,
        calculated_volume_ml: item.calculated_volume_ml ?? 0,
        location: item.location,
        plan_id: plan.id,
        product_id: item.product_id,
        quantity: item.quantity,
        serving_multiplier: item.serving_multiplier ?? 1,
        timing_minute: item.timing_minute ?? null,
        timing_type: item.timing_type ?? null,
        unit: item.unit ?? null,
        user_id: userId
      }))
    );

    if (error) {
      throw error;
    }
  }

  const detail = await getNutritionPlan(userId, plan.id);

  if (!detail) {
    throw new Error("Nutrition plan was saved but could not be loaded.");
  }

  return detail;
}

export async function deleteNutritionPlan(userId: string, planId: string): Promise<void> {
  assertSupabaseConfigured();

  const { error } = await supabase.from("nutrition_plans").delete().eq("id", planId).eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function listNutritionProducts(userId: string): Promise<NutritionProduct[]> {
  assertSupabaseConfigured();

  const [globalResult, customResult] = await Promise.all([
    supabase
      .from("nutrition_products")
      .select("*")
      .eq("product_scope", "global")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("nutrition_products")
      .select("*")
      .eq("product_scope", "user")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true })
  ]);

  if (globalResult.error) {
    throw globalResult.error;
  }

  if (customResult.error) {
    throw customResult.error;
  }

  return [...((globalResult.data ?? []) as NutritionProduct[]), ...((customResult.data ?? []) as NutritionProduct[])];
}

export async function listGlobalNutritionProducts(): Promise<NutritionProduct[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("nutrition_products")
    .select("*")
    .eq("product_scope", "global")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as NutritionProduct[];
}

export async function countCustomNutritionProducts(userId: string): Promise<number> {
  assertSupabaseConfigured();

  const { count, error } = await supabase
    .from("nutrition_products")
    .select("id", { count: "exact", head: true })
    .eq("product_scope", "user")
    .eq("is_active", true)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function createCustomNutritionProduct(
  userId: string,
  input: NutritionProductInput
): Promise<NutritionProduct> {
  assertSupabaseConfigured();

  const customProductCount = await countCustomNutritionProducts(userId);

  if (customProductCount >= MAX_CUSTOM_NUTRITION_PRODUCTS) {
    throw new Error(`Custom products are limited to ${MAX_CUSTOM_NUTRITION_PRODUCTS} per user.`);
  }

  const { data, error } = await supabase
    .from("nutrition_products")
    .insert({
      ...toNutritionProductPayload(input),
      product_scope: "user",
      user_id: userId
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionProduct;
}

export async function updateCustomNutritionProduct(
  userId: string,
  productId: string,
  input: NutritionProductInput
): Promise<NutritionProduct> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("nutrition_products")
    .update({
      ...toNutritionProductPayload(input),
      updated_at: new Date().toISOString()
    })
    .eq("id", productId)
    .eq("user_id", userId)
    .eq("product_scope", "user")
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionProduct;
}

export async function createGlobalNutritionProduct(input: NutritionProductInput): Promise<NutritionProduct> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("nutrition_products")
    .insert({
      ...toNutritionProductPayload(input),
      product_scope: "global",
      user_id: null
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionProduct;
}

export async function updateGlobalNutritionProduct(productId: string, input: NutritionProductInput): Promise<NutritionProduct> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("nutrition_products")
    .update({
      ...toNutritionProductPayload(input),
      product_scope: "global",
      updated_at: new Date().toISOString(),
      user_id: null
    })
    .eq("id", productId)
    .eq("product_scope", "global")
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionProduct;
}

export async function deleteCustomNutritionProduct(userId: string, productId: string): Promise<void> {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from("nutrition_products")
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", productId)
    .eq("user_id", userId)
    .eq("product_scope", "user");

  if (error) {
    throw error;
  }
}

export async function getNutritionAutoGeneratePreferences(
  userId: string
): Promise<NutritionAutoGeneratePreferences | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("nutrition_auto_generate_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as NutritionAutoGeneratePreferences | null;
}

export async function saveNutritionAutoGeneratePreferences(
  userId: string,
  input: NutritionAutoGeneratePreferencesInput
): Promise<NutritionAutoGeneratePreferences> {
  assertSupabaseConfigured();

  const normalizedMaxBottles =
    input.max_bottles == null
      ? null
      : Math.max(1, Math.min(MAX_AUTO_GENERATE_BOTTLES, Math.round(input.max_bottles)));

  const uniqueAllowed = Array.from(new Set(input.allowed_product_ids.filter((id) => typeof id === "string" && id.length > 0)));

  const { data, error } = await supabase
    .from("nutrition_auto_generate_preferences")
    .upsert(
      {
        user_id: userId,
        restrict_to_available_products: input.restrict_to_available_products,
        allowed_product_ids: uniqueAllowed,
        max_bottles: normalizedMaxBottles,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionAutoGeneratePreferences;
}

async function loadProductsForPlan(items: NutritionPlanItem[], activeProducts: NutritionProduct[]): Promise<NutritionProduct[]> {
  const productsById = new Map(activeProducts.map((product) => [product.id, product]));
  const missingProductIds = Array.from(new Set(items.map((item) => item.product_id))).filter(
    (productId) => !productsById.has(productId)
  );

  if (!missingProductIds.length) {
    return activeProducts;
  }

  const { data, error } = await supabase
    .from("nutrition_products")
    .select("*")
    .in("id", missingProductIds);

  if (error) {
    throw error;
  }

  return [...activeProducts, ...((data ?? []) as NutritionProduct[])];
}

async function createNutritionPlanRecord(
  userId: string,
  payload: Omit<NutritionPlanInput, "description"> & {
    description: string | null;
    updated_at: string;
  }
) {
  const { data, error } = await supabase
    .from("nutrition_plans")
    .insert({
      ...payload,
      user_id: userId
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionPlan;
}

async function updateNutritionPlanRecord(
  userId: string,
  planId: string,
  payload: Omit<NutritionPlanInput, "description"> & {
    description: string | null;
    updated_at: string;
  }
) {
  const { data, error } = await supabase
    .from("nutrition_plans")
    .update(payload)
    .eq("id", planId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionPlan;
}

function toNutritionProductPayload(input: NutritionProductInput) {
  return {
    calories_per_serving: input.calories_per_serving ?? 0,
    carbs_per_serving: input.carbs_per_serving ?? 0,
    category: input.category,
    default_serving_size: input.default_serving_size ?? null,
    default_serving_unit: input.default_serving_unit?.trim() || null,
    icon_key: input.icon_key ?? "custom_food",
    liquid_volume_ml_per_serving: input.liquid_volume_ml_per_serving ?? 0,
    name: input.name.trim(),
    name_en: input.name_en?.trim() || input.name.trim(),
    name_es: input.name_es?.trim() || input.name.trim(),
    notes: input.notes?.trim() || null,
    sodium_mg_per_serving: input.sodium_mg_per_serving ?? 0,
    weight_g_per_serving: input.weight_g_per_serving ?? 0
  };
}
