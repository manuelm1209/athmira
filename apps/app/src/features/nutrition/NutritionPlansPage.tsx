import {
  calculateBottleTotals,
  calculateNutritionItem,
  calculatePlanTotals,
  calculateSuggestedNutritionTargets,
  getNutritionWarnings,
  round,
  type BottleCalculation,
  type NutritionCalculatedItem,
  type NutritionWarning,
  type PlanTotals
} from "@athmira/nutrition-engine";
import {
  MAX_CUSTOM_NUTRITION_PRODUCTS,
  createCustomNutritionProduct,
  deleteCustomNutritionProduct,
  deleteNutritionPlan,
  getNutritionPlan,
  listNutritionPlans,
  listNutritionProducts,
  saveNutritionPlan,
  updateCustomNutritionProduct
} from "@athmira/supabase";
import type {
  NutritionActivityType,
  NutritionIconKey,
  NutritionIntensity,
  NutritionPlan,
  NutritionPlanBottleInput,
  NutritionPlanInput,
  NutritionPlanItemInput,
  NutritionPlanItemLocation,
  NutritionProduct,
  NutritionProductCategory,
  NutritionProductInput,
  NutritionTimingType
} from "@athmira/types";
import {
  Body,
  Button,
  Card,
  FadeInView,
  Field,
  Inline,
  Screen,
  SelectField,
  colors,
  radii,
  shadows,
  spacing,
  typography
} from "@athmira/ui";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage, numberToInput, parseOptionalNumber } from "@/utils/form";

type DraftBottle = NutritionPlanBottleInput & {
  id: string;
  name: string;
};

type DraftItem = NutritionPlanItemInput & {
  id: string;
  product: NutritionProduct;
};

type DraftPlan = NutritionPlanInput & {
  id?: string;
  bottles: DraftBottle[];
  items: DraftItem[];
};

type PreparedPlanPayload = {
  bottles: NutritionPlanBottleInput[];
  items: NutritionPlanItemInput[];
  plan: NutritionPlanInput;
  planId?: string;
};

type ProductFormMode = {
  product?: NutritionProduct;
  visible: boolean;
};

const activityOptions: { label: string; value: NutritionActivityType }[] = [
  { label: "Cycling", value: "cycling" },
  { label: "Running", value: "running" },
  { label: "Triathlon", value: "triathlon" },
  { label: "Gravel", value: "gravel" },
  { label: "Mountain biking", value: "mountain_biking" },
  { label: "Indoor cycling", value: "indoor_cycling" },
  { label: "Hiking", value: "hiking" },
  { label: "Other", value: "other" }
];

const intensityOptions: { label: string; value: NutritionIntensity }[] = [
  { label: "Easy", value: "easy" },
  { label: "Moderate", value: "moderate" },
  { label: "Hard", value: "hard" },
  { label: "Race effort", value: "race_effort" }
];

const categoryOptions: { label: string; value: NutritionProductCategory }[] = [
  { label: "Bottle ingredient", value: "bottle_ingredient" },
  { label: "Gel", value: "gel" },
  { label: "Bar", value: "bar" },
  { label: "Solid food", value: "solid_food" },
  { label: "Drink", value: "drink" },
  { label: "Powder", value: "powder" },
  { label: "Fruit", value: "fruit" },
  { label: "Candy", value: "candy" },
  { label: "Sandwich", value: "sandwich" },
  { label: "Custom", value: "custom" }
];

const locationOptions: { label: string; value: NutritionPlanItemLocation }[] = [
  { label: "Inside bottle", value: "bottle" },
  { label: "Carried", value: "carried" },
  { label: "Before", value: "before" },
  { label: "During", value: "during" },
  { label: "After", value: "after" }
];

const timingOptions: { label: string; value: NutritionTimingType }[] = [
  { label: "At start", value: "start" },
  { label: "Every 30 min", value: "every_30" },
  { label: "Every 45 min", value: "every_45" },
  { label: "Every hour", value: "hourly" },
  { label: "Custom minute", value: "custom" }
];

const bottleSizes = [
  { label: "500 ml", value: 500 },
  { label: "620 ml / 21 oz", value: 620 },
  { label: "750 ml", value: 750 },
  { label: "950 ml / 32 oz", value: 950 },
  { label: "1000 ml", value: 1000 }
];

const iconOptions: NutritionIconKey[] = [
  "bottle",
  "gel",
  "bar",
  "banana",
  "candy",
  "sandwich",
  "powder",
  "salt",
  "sugar",
  "honey",
  "water",
  "drink",
  "rice",
  "dates",
  "raisins",
  "pretzel",
  "custom_food"
];

const bottleFillMotionStyle = Platform.select({
  default: undefined,
  web: {
    transitionDuration: "280ms",
    transitionProperty: "height, background-color, opacity",
    transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  } as never
});

const nutritionCopy = {
  en: {
    add: "Add",
    addBottle: "Add bottle",
    addCustom: "Add custom",
    addFood: "Add food",
    addIngredient: "Add ingredient",
    addNutritionItems: "Add nutrition items",
    addProductsTimeline: "Add products to build the timeline.",
    addTargetBottle: "Add a bottle before assigning products inside a bottle.",
    allProducts: "All products",
    atStart: "At start",
    athmiraFuelingPlan: "Athmira Fueling Plan",
    before: "Before",
    bodyWeightUsed: "Body weight used (kg)",
    bottle: "Bottle",
    bottleName: "Bottle name",
    bottleSizeGreaterThanZero: "Bottle size must be greater than 0.",
    bottleSizeMl: "Size ml",
    bottlesTitle: "Bottles / Caramanolas",
    calculateSuggestedTargets: "Calculate suggested targets",
    calories: "Calories",
    caloriesEstimate: "Calories estimate",
    caloriesShort: "Calories",
    cancel: "Cancel",
    capacity: "Capacity",
    carbs: "Carbs",
    carbsPerServing: "Carbs per serving",
    carbsTarget: "Carbs target",
    carbsHr: "Carbs/hr",
    carried: "Carried",
    carriedTimedFood: "Carried and timed food",
    category: "Category",
    chooseBottle: "Choose bottle",
    close: "Close",
    collapse: "Collapse",
    concentration: "Concentration",
    configurations: "Configurations",
    composition: "Composition",
    createFirstPlan: "Create first plan",
    createProduct: "Create product",
    customBottleSize: "Custom bottle size (ml)",
    customFoods: "Custom foods",
    customProductCreated: "Custom product created.",
    customProductDeleted: "Custom product deleted.",
    customProductNameRequired: "Custom product name is required.",
    customProductUpdated: "Custom product updated.",
    customProducts: "custom products",
    defaultLocation: "Default location",
    delete: "Delete",
    deleteCustomProduct: "Delete custom product",
    deleteCustomProductBody: (name: string) => `Delete ${name}? Existing draft items using it will be removed.`,
    deleteNutritionPlan: "Delete nutrition plan",
    deleteNutritionPlanBody: "Delete this saved nutrition plan?",
    duplicate: "Duplicate",
    durationGreaterThanZero: "Duration must be greater than 0.",
    durationMinutes: "Duration (minutes)",
    edit: "Edit",
    editCustomProduct: "Edit custom product",
    editPlan: "Edit plan",
    editTargets: "Edit target values",
    estimatesDisclaimer: "Athmira estimates sports fueling needs for planning. This is not medical or dietary advice.",
    expand: "Expand",
    every30: "Every 30 min",
    every30Long: "Every 30 minutes",
    every45: "Every 45 min",
    every45Long: "Every 45 minutes",
    everyHour: "Every hour",
    foodCarried: "Food carried",
    foodCarriedBody: "Gels, bars, sandwiches, fruit, or other food outside the bottles.",
    fluids: "Fluids",
    fluidsHr: "Fluids/hr",
    fluidsTarget: "Hydration target",
    fuelingTimeline: "Fueling timeline",
    globalProducts: "Global products",
    heroBody: "Plan carbs, hydration, sodium, calories, bottles, carried food, and timing for endurance sessions.",
    heroDisclaimer:
      "Athmira estimates sports fueling and hydration needs for education and training guidance. This is not medical advice or a prescribed diet.",
    heroKicker: "Nutrition Planning",
    heroTitle: "Build race-ready fueling plans",
    icon: "Icon",
    insideBottle: "Inside bottle",
    insideThisBottle: "Inside this bottle",
    itemToAdd: "Item to add",
    intensity: "Intensity",
    itemsAssignedBottleNeedBottle: "Items assigned inside a bottle need a bottle selected.",
    liquidVolumeMl: "Liquid volume ml",
    loadingNutritionPlans: "Loading nutrition plans...",
    location: "Location",
    minute: "Minute",
    name: "Name",
    newConfiguration: "New configuration",
    newCustomProduct: "New custom product",
    newPlan: "New plan",
    noItemsAssigned: "No products assigned here yet.",
    noItemsYet: "No items yet",
    noPlansBody: "Create reusable fueling setups for long rides, races, indoor sessions, or run days.",
    noPlansYet: "No plans yet",
    notes: "Notes",
    notesPlaceholder: "Example: Long endurance ride with two bottles and solid food every hour",
    nutritionPlan: "Nutrition plan",
    nutritionPlanDeleted: "Nutrition plan deleted.",
    nutritionPlanNotFound: "Nutrition plan not found.",
    nutritionPlanSaved: "Nutrition plan saved.",
    planSetup: "Plan setup",
    planAndTargets: "Plan and targets",
    planTitle: "Plan title",
    planTitleRequired: "Plan title is required.",
    plannedCarbsPerHour: "Planned carbs per hour",
    profileWeight: "Profile weight",
    quantityGreaterThanZero: "Quantity must be greater than 0.",
    quickSetup: "Quick setup",
    remainingWater: "Remaining water",
    remove: "Remove",
    reviewPlan: "Review plan",
    savePlan: "Save plan",
    savedNutritionPlans: "Saved nutrition plans",
    savedPlan: "Saved plan",
    servingSize: "Serving size",
    servingUnit: "Serving unit",
    sodium: "Sodium",
    sodiumHr: "Sodium/hr",
    sodiumMg: "Sodium mg",
    sodiumTarget: "Sodium target",
    strategyBoard: "Fueling strategy",
    strategyBoardBody: "Add each ingredient from the bottle card you are filling. Swipe horizontally to manage more bottles or carried food.",
    startCardBody:
      "Use the builder to combine bottles, gels, bars, bocadillos, gummies, bananas, sandwiches, rice cakes, and custom products into a complete endurance fueling strategy.",
    startCardTitle: "Select or create a plan",
    step1: "Step 1",
    step2: "Step 2",
    step3: "Step 3",
    step4: "Step 4",
    suggestedRanges: "Suggested ranges",
    targetBottle: "Target bottle",
    targets: "Targets",
    totalPlan: "Total plan",
    timing: "Timing",
    totalCalories: "Total calories",
    totalCarbs: "Total carbs",
    totalFluids: "Total fluids",
    totalSodium: "Total sodium",
    unit: "Unit",
    updateProduct: "Update product",
    usedByIngredients: "Used by ingredients",
    useSuggestedValues: "Use suggested values",
    viewPlan: "View plan",
    waterBottlePrompt: "Add at least one bottle to plan hydration and in-bottle carbohydrates.",
    weightGrams: "Weight grams",
    youMustSignInProducts: "You must be signed in to manage products."
  },
  es: {
    add: "Agregar",
    addBottle: "Agregar caramanola",
    addCustom: "Agregar personalizada",
    addFood: "Agregar comida",
    addIngredient: "Agregar ingrediente",
    addNutritionItems: "Agregar items de nutricion",
    addProductsTimeline: "Agrega productos para construir la linea de tiempo.",
    addTargetBottle: "Agrega una caramanola antes de asignar productos dentro de una botella.",
    allProducts: "Todos los productos",
    atStart: "Al inicio",
    athmiraFuelingPlan: "Plan de fueling Athmira",
    before: "Antes",
    bodyWeightUsed: "Peso usado (kg)",
    bottle: "Caramanola",
    bottleName: "Nombre de botella",
    bottleSizeGreaterThanZero: "El tamano de la botella debe ser mayor que 0.",
    bottleSizeMl: "Tamano ml",
    bottlesTitle: "Botellas / Caramanolas",
    calculateSuggestedTargets: "Calcular objetivos sugeridos",
    calories: "Calorias",
    caloriesEstimate: "Calorias estimadas",
    caloriesShort: "Calorias",
    cancel: "Cancelar",
    capacity: "Capacidad",
    carbs: "Carbohidratos",
    carbsPerServing: "Carbos por porcion",
    carbsTarget: "Objetivo de carbos",
    carbsHr: "Carbos/h",
    carried: "Llevar",
    carriedTimedFood: "Comida para llevar y horarios",
    category: "Categoria",
    chooseBottle: "Elige botella",
    close: "Cerrar",
    collapse: "Colapsar",
    concentration: "Concentracion",
    configurations: "Configuraciones",
    composition: "Composicion",
    createFirstPlan: "Crear primer plan",
    createProduct: "Crear producto",
    customBottleSize: "Tamano personalizado (ml)",
    customFoods: "Productos propios",
    customProductCreated: "Producto personalizado creado.",
    customProductDeleted: "Producto personalizado eliminado.",
    customProductNameRequired: "El nombre del producto personalizado es obligatorio.",
    customProductUpdated: "Producto personalizado actualizado.",
    customProducts: "productos personalizados",
    defaultLocation: "Ubicacion por defecto",
    delete: "Eliminar",
    deleteCustomProduct: "Eliminar producto personalizado",
    deleteCustomProductBody: (name: string) => `Eliminar ${name}? Los items del borrador que lo usen se quitaran.`,
    deleteNutritionPlan: "Eliminar plan de nutricion",
    deleteNutritionPlanBody: "Eliminar este plan de nutricion guardado?",
    duplicate: "Duplicar",
    durationGreaterThanZero: "La duracion debe ser mayor que 0.",
    durationMinutes: "Duracion (minutos)",
    edit: "Editar",
    editCustomProduct: "Editar producto personalizado",
    editPlan: "Editar plan",
    editTargets: "Editar valores objetivo",
    estimatesDisclaimer: "Athmira estima necesidades de fueling deportivo para planificar. No es consejo medico ni nutricional.",
    expand: "Expandir",
    every30: "Cada 30 min",
    every30Long: "Cada 30 minutos",
    every45: "Cada 45 min",
    every45Long: "Cada 45 minutos",
    everyHour: "Cada hora",
    foodCarried: "Comida para llevar",
    foodCarriedBody: "Geles, barras, sandwiches, fruta u otra comida por fuera de las caramanolas.",
    fluids: "Liquidos",
    fluidsHr: "Liquidos/h",
    fluidsTarget: "Objetivo de hidratacion",
    fuelingTimeline: "Linea de tiempo de fueling",
    globalProducts: "Productos globales",
    heroBody: "Planifica carbos, hidratacion, sodio, calorias, botellas, comida para llevar y horarios para sesiones de resistencia.",
    heroDisclaimer:
      "Athmira estima necesidades de fueling e hidratacion deportiva como guia educativa y de entrenamiento. No es consejo medico ni una dieta prescrita.",
    heroKicker: "Planificacion de nutricion",
    heroTitle: "Construye planes de fueling listos para carrera",
    icon: "Icono",
    insideBottle: "Dentro de botella",
    insideThisBottle: "Dentro de esta botella",
    itemToAdd: "Item a agregar",
    intensity: "Intensidad",
    itemsAssignedBottleNeedBottle: "Los items dentro de una botella necesitan una botella seleccionada.",
    liquidVolumeMl: "Volumen liquido ml",
    loadingNutritionPlans: "Cargando planes de nutricion...",
    location: "Ubicacion",
    minute: "Minuto",
    name: "Nombre",
    newConfiguration: "Nueva configuracion",
    newCustomProduct: "Nuevo producto personalizado",
    newPlan: "Nuevo plan",
    noItemsAssigned: "Aun no hay productos asignados aqui.",
    noItemsYet: "Sin items aun",
    noPlansBody: "Crea configuraciones reutilizables para fondos, carreras, sesiones indoor o dias de running.",
    noPlansYet: "Aun no hay planes",
    notes: "Notas",
    notesPlaceholder: "Ejemplo: Fondo largo con dos caramanolas y comida solida cada hora",
    nutritionPlan: "Plan de nutricion",
    nutritionPlanDeleted: "Plan de nutricion eliminado.",
    nutritionPlanNotFound: "Plan de nutricion no encontrado.",
    nutritionPlanSaved: "Plan de nutricion guardado.",
    planSetup: "Configuracion del plan",
    planAndTargets: "Plan y objetivos",
    planTitle: "Titulo del plan",
    planTitleRequired: "El titulo del plan es obligatorio.",
    plannedCarbsPerHour: "Carbos planificados por hora",
    profileWeight: "Peso del perfil",
    quantityGreaterThanZero: "La cantidad debe ser mayor que 0.",
    quickSetup: "Configuracion rapida",
    remainingWater: "Agua restante",
    remove: "Quitar",
    reviewPlan: "Revisar plan",
    savePlan: "Guardar plan",
    savedNutritionPlans: "Planes de nutricion guardados",
    savedPlan: "Plan guardado",
    servingSize: "Tamano porcion",
    servingUnit: "Unidad porcion",
    sodium: "Sodio",
    sodiumHr: "Sodio/h",
    sodiumMg: "Sodio mg",
    sodiumTarget: "Objetivo de sodio",
    strategyBoard: "Estrategia de alimentacion",
    strategyBoardBody: "Agrega cada ingrediente desde la tarjeta de la caramanola que estas llenando. Desliza horizontalmente para manejar mas botellas o comida.",
    startCardBody:
      "Usa el constructor para combinar botellas, gels, barras, bocadillos, gomitas, bananos, sandwiches, rice cakes y productos personalizados en una estrategia completa de fueling.",
    startCardTitle: "Selecciona o crea un plan",
    step1: "Paso 1",
    step2: "Paso 2",
    step3: "Paso 3",
    step4: "Paso 4",
    suggestedRanges: "Rangos sugeridos",
    targetBottle: "Botella destino",
    targets: "Objetivos",
    totalPlan: "Plan total",
    timing: "Horario",
    totalCalories: "Calorias totales",
    totalCarbs: "Carbos totales",
    totalFluids: "Liquidos totales",
    totalSodium: "Sodio total",
    unit: "Unidad",
    updateProduct: "Actualizar producto",
    usedByIngredients: "Usado por ingredientes",
    useSuggestedValues: "Usar valores sugeridos",
    viewPlan: "Ver plan",
    waterBottlePrompt: "Agrega al menos una caramanola para planificar hidratacion y carbohidratos dentro de botella.",
    weightGrams: "Peso gramos",
    youMustSignInProducts: "Debes iniciar sesion para gestionar productos."
  }
} as const;

export function NutritionPlansPage() {
  const { profile, user } = useAuth();
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const { width } = useWindowDimensions();
  const compact = width < 1040;
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [products, setProducts] = useState<NutritionProduct[]>([]);
  const [draft, setDraft] = useState<DraftPlan | null>(null);
  const [viewingDraft, setViewingDraft] = useState<DraftPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [nextPlans, nextProducts] = await Promise.all([
          listNutritionPlans(currentUser.id),
          listNutritionProducts(currentUser.id)
        ]);

        if (!cancelled) {
          setPlans(nextPlans);
          setProducts(nextProducts);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const customProductCount = products.filter((product) => product.product_scope === "user").length;

  function startNewPlan() {
    setMessage(null);
    setViewingDraft(null);
    setDraft(createDefaultDraft(profile?.weight_kg ?? null, language));
  }

  async function loadPlanDraft(planId: string) {
    if (!user) {
      return null;
    }

    setLoadingPlanId(planId);
    setError(null);
    setMessage(null);

    try {
      const detail = await getNutritionPlan(user.id, planId);

      if (!detail) {
        setError(copy.nutritionPlanNotFound);
        return null;
      }

      return createDraftFromDetail(detail);
    } catch (openError) {
      setError(getErrorMessage(openError));
      return null;
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function openPlan(planId: string) {
    const nextDraft = await loadPlanDraft(planId);

    if (nextDraft) {
      setViewingDraft(null);
      setDraft(nextDraft);
    }
  }

  async function viewPlan(planId: string) {
    const nextDraft = await loadPlanDraft(planId);

    if (nextDraft) {
      setDraft(null);
      setViewingDraft(nextDraft);
    }
  }

  async function duplicatePlan(planId: string) {
    if (!user) {
      return;
    }

    setLoadingPlanId(planId);
    setError(null);
    setMessage(null);

    try {
      const detail = await getNutritionPlan(user.id, planId);

      if (!detail) {
        setError(copy.nutritionPlanNotFound);
        return;
      }

      const nextDraft = createDraftFromDetail(detail);
      const bottleIdMap = new Map(nextDraft.bottles.map((bottle) => [bottle.id, createUuid()]));
      const duplicatedBottles = nextDraft.bottles.map((bottle, index) => ({
        ...bottle,
        display_order: index,
        id: bottleIdMap.get(bottle.id) ?? createUuid()
      }));
      const duplicatedItems = nextDraft.items.map((item) => ({
        ...item,
        bottle_id: item.bottle_id ? bottleIdMap.get(item.bottle_id) ?? null : null,
        id: createUuid()
      }));

      setDraft({
        ...nextDraft,
        bottles: duplicatedBottles,
        id: undefined,
        items: duplicatedItems,
        title: `${nextDraft.title} copy`
      });
    } catch (duplicateError) {
      setError(getErrorMessage(duplicateError));
    } finally {
      setLoadingPlanId(null);
    }
  }

  function confirmDeletePlan(planId: string) {
    Alert.alert(copy.deleteNutritionPlan, copy.deleteNutritionPlanBody, [
      { text: copy.cancel, style: "cancel" },
      { text: copy.delete, style: "destructive", onPress: () => void removePlan(planId) }
    ]);
  }

  async function removePlan(planId: string) {
    if (!user) {
      return;
    }

    setError(null);

    try {
      await deleteNutritionPlan(user.id, planId);
      setPlans((current) => current.filter((plan) => plan.id !== planId));
      setDraft((current) => (current?.id === planId ? null : current));
      setViewingDraft((current) => (current?.id === planId ? null : current));
      setMessage(copy.nutritionPlanDeleted);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  async function saveDraft(payload: PreparedPlanPayload) {
    if (!user) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const savedPlan = await saveNutritionPlan(user.id, payload);
      const nextPlans = await listNutritionPlans(user.id);
      setPlans(nextPlans);
      setDraft(createDraftFromDetail(savedPlan));
      setMessage(copy.nutritionPlanSaved);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function saveCustomProduct(input: NutritionProductInput, productId?: string) {
    if (!user) {
      throw new Error(copy.youMustSignInProducts);
    }

    const product = productId
      ? await updateCustomNutritionProduct(user.id, productId, input)
      : await createCustomNutritionProduct(user.id, input);
    const nextProducts = await listNutritionProducts(user.id);
    setProducts(nextProducts);
    setMessage(productId ? copy.customProductUpdated : copy.customProductCreated);
    return product;
  }

  async function removeCustomProduct(productId: string) {
    if (!user) {
      return;
    }

    await deleteCustomNutritionProduct(user.id, productId);
    const nextProducts = await listNutritionProducts(user.id);
    setProducts(nextProducts);
    setDraft((current) =>
      current
        ? {
            ...current,
            items: current.items.filter((item) => item.product_id !== productId)
          }
        : current
    );
    setMessage(copy.customProductDeleted);
  }

  return (
    <Screen maxWidth={1360}>
      <View style={styles.stack}>
        {error ? <Text selectable style={styles.error}>{error}</Text> : null}
        {message ? <Text selectable style={styles.message}>{message}</Text> : null}

        <View style={[styles.pageGrid, (compact || draft || viewingDraft) && styles.pageGridCompact]}>
          {draft || viewingDraft ? null : (
          <FadeInView delayMs={80} style={styles.planRail}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>{copy.configurations}</Text>
                <Text style={styles.sectionTitle}>{copy.savedNutritionPlans}</Text>
              </View>
              <Button onPress={startNewPlan}>{copy.newPlan}</Button>
            </View>

            {loading ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} />
                <Body>{copy.loadingNutritionPlans}</Body>
              </Card>
            ) : (
              <View style={styles.planGrid}>
                {plans.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>{copy.noPlansYet}</Text>
                    <Body>{copy.noPlansBody}</Body>
                    <Button onPress={startNewPlan}>{copy.createFirstPlan}</Button>
                  </Card>
                ) : null}

                {plans.map((plan) => (
                  <NutritionPlanCard
                    key={plan.id}
                    loading={loadingPlanId === plan.id}
                    onDelete={() => confirmDeletePlan(plan.id)}
                    onDuplicate={() => void duplicatePlan(plan.id)}
                    onOpen={() => void openPlan(plan.id)}
                    onView={() => void viewPlan(plan.id)}
                    plan={plan}
                  />
                ))}
              </View>
            )}
          </FadeInView>
          )}

          <FadeInView delayMs={140} style={[styles.editorColumn, draft && styles.editorColumnFull]}>
            {draft ? (
              <NutritionPlanEditor
                customProductCount={customProductCount}
                draft={draft}
                onCancel={() => setDraft(null)}
                onChange={setDraft}
                onCreateOrUpdateProduct={saveCustomProduct}
                onDeleteProduct={removeCustomProduct}
                onSave={saveDraft}
                products={products}
                saving={saving}
              />
            ) : viewingDraft ? (
              <NutritionPlanViewer
                draft={viewingDraft}
                onClose={() => setViewingDraft(null)}
                onEdit={() => {
                  setDraft(viewingDraft);
                  setViewingDraft(null);
                }}
              />
            ) : (
              <Card style={styles.startCard}>
                <View style={styles.startIcon}>
                  <NutritionIcon iconKey="bottle" />
                </View>
                  <Text style={styles.startTitle}>{copy.startCardTitle}</Text>
                <Body>{copy.startCardBody}</Body>
                <Inline>
                  <Button onPress={startNewPlan}>{copy.newPlan}</Button>
                  <LinkButton href="/profile" variant="secondary">
                    {copy.profileWeight}
                  </LinkButton>
                </Inline>
              </Card>
            )}
          </FadeInView>
        </View>
      </View>
    </Screen>
  );
}

export function NutritionPlanCard({
  loading,
  onDelete,
  onDuplicate,
  onOpen,
  onView,
  plan
}: {
  loading?: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onOpen: () => void;
  onView: () => void;
  plan: NutritionPlan;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const durationHours = plan.duration_minutes / 60;
  const carbsPerHour = durationHours > 0 ? plan.total_planned_carbs / durationHours : 0;

  return (
    <Card style={styles.planCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconBubble}>
          <NutritionIcon iconKey={getActivityIcon(plan.activity_type)} />
        </View>
        <View style={styles.planCardCopy}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planMeta}>
            {getActivityLabel(plan.activity_type, language)} / {formatDuration(plan.duration_minutes)} / {getIntensityLabel(plan.intensity, language)}
          </Text>
        </View>
      </View>

      <View style={styles.compactMetricGrid}>
        <MiniMetric label={copy.carbsHr} value={`${round(carbsPerHour, 0)} g`} />
        <MiniMetric label={copy.fluids} value={`${round(plan.total_planned_fluids_ml, 0)} ml`} />
        <MiniMetric label={copy.sodium} value={`${round(plan.total_planned_sodium_mg, 0)} mg`} />
      </View>

      <Inline style={styles.cardActions}>
        <Button loading={loading} onPress={onView} variant="secondary">
          {copy.viewPlan}
        </Button>
        <Button loading={loading} onPress={onOpen} variant="ghost">
          {copy.editPlan}
        </Button>
        <Button onPress={onDuplicate} variant="ghost">
          {copy.duplicate}
        </Button>
        <Button onPress={onDelete} variant="danger">
          {copy.delete}
        </Button>
      </Inline>
    </Card>
  );
}

export function NutritionPlanEditor({
  customProductCount,
  draft,
  onCancel,
  onChange,
  onCreateOrUpdateProduct,
  onDeleteProduct,
  onSave,
  products,
  saving
}: {
  customProductCount: number;
  draft: DraftPlan;
  onCancel: () => void;
  onChange: (draft: DraftPlan) => void;
  onCreateOrUpdateProduct: (input: NutritionProductInput, productId?: string) => Promise<NutritionProduct>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSave: (payload: PreparedPlanPayload) => Promise<void>;
  products: NutritionProduct[];
  saving: boolean;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeBottleId, setActiveBottleId] = useState(draft.bottles[0]?.id ?? "");
  const [addModalTarget, setAddModalTarget] = useState<{ bottleId?: string; mode: "bottle" | "carried" } | null>(null);

  const calculations = useMemo(() => calculateDraft(draft), [draft]);
  const activeBottle = draft.bottles.find((bottle) => bottle.id === activeBottleId) ?? draft.bottles[0] ?? null;

  useEffect(() => {
    if (!draft.bottles.length) {
      setActiveBottleId("");
      return;
    }

    if (!draft.bottles.some((bottle) => bottle.id === activeBottleId)) {
      setActiveBottleId(draft.bottles[0]?.id ?? "");
    }
  }, [activeBottleId, draft.bottles]);

  function updateDraft(patch: Partial<DraftPlan>) {
    onChange({ ...draft, ...patch });
  }

  function updateDraftWithSuggestedTargets(patch: Partial<DraftPlan>) {
    const nextDraft = { ...draft, ...patch };
    const targets = calculateSuggestedNutritionTargets({
      activityType: nextDraft.activity_type,
      bodyWeightKg: nextDraft.body_weight_kg ?? null,
      durationMinutes: nextDraft.duration_minutes,
      intensity: nextDraft.intensity
    });

    onChange({
      ...nextDraft,
      estimated_calories_burned: targets.caloriesBurned,
      target_carbs_per_hour: targets.carbsPerHour,
      target_fluids_ml_per_hour: targets.fluidsMlPerHour,
      target_sodium_mg_per_hour: targets.sodiumMgPerHour
    });
  }

  function updateBottle(bottleId: string, patch: Partial<DraftBottle>) {
    onChange({
      ...draft,
      bottles: draft.bottles.map((bottle) => (bottle.id === bottleId ? { ...bottle, ...patch } : bottle))
    });
  }

  function removeBottle(bottleId: string) {
    onChange({
      ...draft,
      bottles: draft.bottles.filter((bottle) => bottle.id !== bottleId),
      items: draft.items.filter((item) => item.bottle_id !== bottleId)
    });
  }

  function addBottle(sizeMl = 620, label = "620 ml / 21 oz") {
    const nextIndex = draft.bottles.length + 1;
    const nextBottleId = createUuid();

    onChange({
      ...draft,
      bottles: [
        ...draft.bottles,
        {
          bottle_size_label: label,
          bottle_size_ml: sizeMl,
          display_order: draft.bottles.length,
          id: nextBottleId,
          name: language === "es" ? `Caramanola ${nextIndex}` : `Bottle ${nextIndex}`
        }
      ]
    });
    setActiveBottleId(nextBottleId);
  }

  function addItem(item: DraftItem) {
    onChange({ ...draft, items: [...draft.items, item] });
  }

  function addProductToPlan(product: NutritionProduct, location: NutritionPlanItemLocation, bottleId?: string | null, quantity?: number) {
    if (location === "bottle" && !bottleId) {
      setLocalError(copy.addTargetBottle);
      return;
    }

    const itemQuantity = quantity && quantity > 0 ? quantity : product.default_serving_size ?? 1;
    setLocalError(null);
    addItem({
      bottle_id: location === "bottle" ? bottleId ?? null : null,
      id: createUuid(),
      location,
      product,
      product_id: product.id,
      quantity: itemQuantity,
      serving_multiplier: 1,
      timing_type: location === "bottle" || location === "during" || location === "carried" ? "hourly" : null,
      unit: product.default_serving_unit ?? (language === "es" ? "porcion" : "serving")
    });
  }

  function removeItem(itemId: string) {
    onChange({ ...draft, items: draft.items.filter((item) => item.id !== itemId) });
  }

  async function handleSave() {
    const validationError = validateDraft(draft, copy);

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    await onSave(preparePlanPayload(draft, calculations));
  }

  return (
    <View style={styles.editorStack}>
      <View style={styles.editorHeader}>
        <View>
          <Text style={styles.sectionKicker}>{draft.id ? copy.savedPlan : copy.newConfiguration}</Text>
          <Text style={styles.editorTitle}>{draft.title || copy.nutritionPlan}</Text>
        </View>
        <Inline>
          <Button loading={saving} onPress={() => void handleSave()}>
            {copy.savePlan}
          </Button>
          <Button onPress={onCancel} variant="secondary">
            {copy.close}
          </Button>
        </Inline>
      </View>

      {localError ? <Text selectable style={styles.error}>{localError}</Text> : null}

      <PlanControlBar
        compact={compact}
        draft={draft}
        onChange={updateDraft}
        onChangeWithSuggestedTargets={updateDraftWithSuggestedTargets}
        totals={calculations.totals}
      />

      <PlanTotalStrip draft={draft} totals={calculations.totals} warnings={calculations.warnings} />

      <FuelingCanvas
        activeBottleId={activeBottle?.id ?? ""}
        bottleCalculations={calculations.bottleCalculations}
        bottles={draft.bottles}
        items={draft.items}
        onAddBottle={addBottle}
        onOpenAddModal={setAddModalTarget}
        onRemoveBottle={removeBottle}
        onRemoveItem={removeItem}
        onSelectBottle={setActiveBottleId}
        onUpdateBottle={updateBottle}
      />

      <AddNutritionModal
        bottles={draft.bottles}
        customProductCount={customProductCount}
        onAddProduct={addProductToPlan}
        onClose={() => setAddModalTarget(null)}
        onCreateOrUpdateProduct={onCreateOrUpdateProduct}
        onDeleteProduct={onDeleteProduct}
        products={products}
        target={addModalTarget}
      />
    </View>
  );
}

function NutritionPlanViewer({
  draft,
  onClose,
  onEdit
}: {
  draft: DraftPlan;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const calculations = useMemo(() => calculateDraft(draft), [draft]);

  return (
    <View style={styles.editorStack}>
      <View style={styles.editorHeader}>
        <View>
          <Text style={styles.sectionKicker}>{copy.viewPlan}</Text>
          <Text style={styles.editorTitle}>{draft.title || copy.nutritionPlan}</Text>
          <Text style={styles.planControlMeta}>
            {getActivityLabel(draft.activity_type, language)} / {formatDuration(draft.duration_minutes)} / {getIntensityLabel(draft.intensity, language)}
          </Text>
        </View>
        <Inline>
          <Button onPress={onEdit}>{copy.editPlan}</Button>
          <Button onPress={onClose} variant="secondary">
            {copy.close}
          </Button>
        </Inline>
      </View>

      <PlanTotalStrip draft={draft} totals={calculations.totals} warnings={calculations.warnings} />
      <ReadOnlyFuelingCanvas bottleCalculations={calculations.bottleCalculations} bottles={draft.bottles} items={draft.items} />
    </View>
  );
}

export function NutritionPlanSetupForm({
  draft,
  onApplyTargets,
  onChange
}: {
  draft: DraftPlan;
  onApplyTargets: () => void;
  onChange: (patch: Partial<DraftPlan>) => void;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  return (
    <Card style={styles.editorCard}>
      <View style={styles.sectionHeaderTight}>
        <Text style={styles.sectionKicker}>{copy.step1}</Text>
        <Text style={styles.sectionTitle}>{copy.planSetup}</Text>
      </View>
      <Field label={copy.planTitle} onChangeText={(title) => onChange({ title })} value={draft.title} />
      <Field
        label={copy.notes}
        multiline
        onChangeText={(description) => onChange({ description })}
        placeholder={copy.notesPlaceholder}
        style={styles.notesField}
        value={draft.description ?? ""}
      />
      <Inline>
        <View style={styles.splitField}>
          <SelectField
            label={language === "es" ? "Actividad" : "Activity"}
            onValueChange={(value) => onChange({ activity_type: toActivityType(value) })}
            options={getActivityOptions(language)}
            value={draft.activity_type}
          />
        </View>
        <View style={styles.splitField}>
          <SelectField
            label={copy.intensity}
            onValueChange={(value) => onChange({ intensity: toIntensity(value) })}
            options={getIntensityOptions(language)}
            value={draft.intensity}
          />
        </View>
      </Inline>
      <Inline>
        <View style={styles.splitField}>
          <Field
            inputMode="numeric"
            label={copy.durationMinutes}
            onChangeText={(value) => onChange({ duration_minutes: Math.max(0, parseOptionalNumber(value) ?? 0) })}
            value={numberToInput(draft.duration_minutes)}
          />
        </View>
        <View style={styles.splitField}>
          <Field
            inputMode="numeric"
            label={copy.bodyWeightUsed}
            onChangeText={(value) => onChange({ body_weight_kg: parseOptionalNumber(value) })}
            value={numberToInput(draft.body_weight_kg)}
          />
        </View>
      </Inline>
      <Button onPress={onApplyTargets} variant="secondary">
        {copy.calculateSuggestedTargets}
      </Button>
    </Card>
  );
}

export function NutritionTargetCalculator({
  draft,
  onApply,
  totals
}: {
  draft: DraftPlan;
  onApply: () => void;
  totals: PlanTotals;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const suggested = calculateSuggestedNutritionTargets({
    activityType: draft.activity_type,
    bodyWeightKg: draft.body_weight_kg ?? null,
    durationMinutes: draft.duration_minutes,
    intensity: draft.intensity
  });
  const caloriesEstimate = draft.estimated_calories_burned ?? suggested.caloriesBurned;

  return (
    <Card style={styles.editorCard}>
      <View style={styles.sectionHeaderTight}>
        <Text style={styles.sectionKicker}>{copy.targets}</Text>
        <Text style={styles.sectionTitle}>{copy.suggestedRanges}</Text>
      </View>
      <View style={styles.targetGrid}>
        <MiniMetric label={copy.carbsTarget} value={`${draft.target_carbs_per_hour ?? suggested.carbsPerHour} g/hr`} />
        <MiniMetric label={copy.fluidsTarget} value={`${draft.target_fluids_ml_per_hour ?? suggested.fluidsMlPerHour} ml/hr`} />
        <MiniMetric label={copy.sodiumTarget} value={`${draft.target_sodium_mg_per_hour ?? suggested.sodiumMgPerHour} mg/hr`} />
        <MiniMetric label={copy.caloriesEstimate} value={caloriesEstimate ? `${caloriesEstimate} kcal` : language === "es" ? "Agrega peso" : "Add weight"} />
      </View>
      <NutritionProgressBar
        current={totals.carbsPerHour}
        label={copy.plannedCarbsPerHour}
        target={draft.target_carbs_per_hour ?? suggested.carbsPerHour}
        unit="g/hr"
      />
      <Text style={styles.helperCopy}>
        {draft.intensity === "race_effort" || draft.duration_minutes >= 240
          ? language === "es"
            ? "Los objetivos altos de carbohidratos deben practicarse gradualmente en entrenamiento antes del dia de carrera."
            : suggested.advisory
          : copy.estimatesDisclaimer}
      </Text>
      <Button onPress={onApply} variant="ghost">
        {copy.useSuggestedValues}
      </Button>
    </Card>
  );
}

function PlanControlBar({
  compact,
  draft,
  onChange,
  onChangeWithSuggestedTargets,
  totals
}: {
  compact: boolean;
  draft: DraftPlan;
  onChange: (patch: Partial<DraftPlan>) => void;
  onChangeWithSuggestedTargets: (patch: Partial<DraftPlan>) => void;
  totals: PlanTotals;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const suggested = calculateSuggestedNutritionTargets({
    activityType: draft.activity_type,
    bodyWeightKg: draft.body_weight_kg ?? null,
    durationMinutes: draft.duration_minutes,
    intensity: draft.intensity
  });
  const caloriesEstimate = draft.estimated_calories_burned ?? suggested.caloriesBurned;

  return (
    <Card style={styles.planControlBar}>
      <View style={styles.planControlHeader}>
        <View style={styles.planControlTitleBlock}>
          <Text style={styles.planControlTitle}>{copy.planAndTargets}</Text>
          <Text style={styles.planControlMeta}>
            {getActivityLabel(draft.activity_type, language)} / {formatDuration(draft.duration_minutes)} / {getIntensityLabel(draft.intensity, language)}
          </Text>
        </View>
        <View style={styles.planControlSnapshot}>
          <Pill label={`${draft.target_carbs_per_hour ?? suggested.carbsPerHour} g/h`} tone="primary" />
          <Pill label={`${draft.target_fluids_ml_per_hour ?? suggested.fluidsMlPerHour} ml/h`} tone="blue" />
          <Pill label={`${draft.target_sodium_mg_per_hour ?? suggested.sodiumMgPerHour} mg/h`} tone="amber" />
        </View>
      </View>

      <View style={[styles.planControlBody, compact && styles.planControlBodyCompact]}>
          <View style={styles.planControlForm}>
            <Field label={copy.planTitle} onChangeText={(title) => onChange({ title })} value={draft.title} />
            <Inline>
              <View style={styles.splitField}>
                <SelectField
                  label={language === "es" ? "Actividad" : "Activity"}
                  onValueChange={(value) => onChangeWithSuggestedTargets({ activity_type: toActivityType(value) })}
                  options={getActivityOptions(language)}
                  value={draft.activity_type}
                />
              </View>
              <View style={styles.splitField}>
                <SelectField
                  label={copy.intensity}
                  onValueChange={(value) => onChangeWithSuggestedTargets({ intensity: toIntensity(value) })}
                  options={getIntensityOptions(language)}
                  value={draft.intensity}
                />
              </View>
            </Inline>
            <Inline>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={copy.durationMinutes}
                  onChangeText={(value) => onChangeWithSuggestedTargets({ duration_minutes: Math.max(0, parseOptionalNumber(value) ?? 0) })}
                  value={numberToInput(draft.duration_minutes)}
                />
              </View>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={copy.bodyWeightUsed}
                  onChangeText={(value) => onChangeWithSuggestedTargets({ body_weight_kg: parseOptionalNumber(value) })}
                  value={numberToInput(draft.body_weight_kg)}
                />
              </View>
            </Inline>
          </View>
          <View style={styles.planControlTargets}>
            <Text style={styles.subsectionTitle}>{copy.editTargets}</Text>
            <Inline>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={copy.carbsTarget}
                  onChangeText={(value) => onChange({ target_carbs_per_hour: parseOptionalNumber(value) })}
                  value={numberToInput(draft.target_carbs_per_hour ?? suggested.carbsPerHour)}
                />
              </View>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={copy.fluidsTarget}
                  onChangeText={(value) => onChange({ target_fluids_ml_per_hour: parseOptionalNumber(value) })}
                  value={numberToInput(draft.target_fluids_ml_per_hour ?? suggested.fluidsMlPerHour)}
                />
              </View>
            </Inline>
            <Inline>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={copy.sodiumTarget}
                  onChangeText={(value) => onChange({ target_sodium_mg_per_hour: parseOptionalNumber(value) })}
                  value={numberToInput(draft.target_sodium_mg_per_hour ?? suggested.sodiumMgPerHour)}
                />
              </View>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={copy.caloriesEstimate}
                  onChangeText={(value) => onChange({ estimated_calories_burned: parseOptionalNumber(value) })}
                  value={numberToInput(caloriesEstimate)}
                />
              </View>
            </Inline>
            <NutritionProgressBar
              current={totals.carbsPerHour}
              label={copy.plannedCarbsPerHour}
              target={draft.target_carbs_per_hour ?? suggested.carbsPerHour}
              unit="g/hr"
            />
            <Text style={styles.helperCopy}>{copy.estimatesDisclaimer}</Text>
          </View>
        </View>
    </Card>
  );
}

function PlanTotalStrip({
  draft,
  totals,
  warnings
}: {
  draft: DraftPlan;
  totals: PlanTotals;
  warnings: NutritionWarning[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const visibleWarnings = warnings.filter((warning) => warning.message !== "This is an estimated sports fueling plan for training guidance, not medical advice.");

  return (
    <Card style={styles.totalStrip}>
      <View style={styles.totalStripHeaderCompact}>
        <Text style={styles.totalStripTitle}>{copy.totalPlan}</Text>
      </View>
      <View style={styles.totalMetricStrip}>
        <TotalPlanMetric
          color={colors.accent}
          current={totals.carbsPerHour}
          label={copy.carbs}
          target={draft.target_carbs_per_hour ?? 0}
          total={`${round(totals.totalCarbs, 0)} g`}
          unit="g/hr"
        />
        <TotalPlanMetric
          color="#51d9df"
          current={totals.fluidsMlPerHour}
          label={copy.fluids}
          target={draft.target_fluids_ml_per_hour ?? 0}
          total={`${round(totals.totalFluidsMl, 0)} ml`}
          unit="ml/hr"
        />
        <TotalPlanMetric
          color={colors.amber}
          current={totals.sodiumMgPerHour}
          label={copy.sodium}
          target={draft.target_sodium_mg_per_hour ?? 0}
          total={`${round(totals.totalSodiumMg, 0)} mg`}
          unit="mg/hr"
        />
        <TotalPlanMetric
          color={colors.coral}
          current={totals.totalCalories}
          label={copy.calories}
          target={draft.estimated_calories_burned ?? 0}
          total={`${round(totals.totalCalories, 0)} kcal`}
          unit="kcal"
        />
      </View>
      {visibleWarnings.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.warningRail}>
          {visibleWarnings.slice(0, 3).map((warning, index) => (
            <NutritionWarningBadge key={`${warning.message}-${index}`} warning={warning} />
          ))}
        </ScrollView>
      ) : null}
    </Card>
  );
}

function TotalPlanMetric({
  color,
  current,
  label,
  target,
  total,
  unit
}: {
  color: string;
  current: number;
  label: string;
  target: number;
  total: string;
  unit: string;
}) {
  return (
    <View style={styles.totalMetricCard}>
      <TargetRing color={color} current={current} target={target} />
      <View style={styles.totalMetricCopy}>
        <Text style={styles.totalMetricLabel}>{label}</Text>
        <Text style={styles.totalMetricTotal}>{total}</Text>
        <Text style={styles.totalMetricTarget}>
          {round(current, 0)} / {target > 0 ? round(target, 0) : "--"} {unit}
        </Text>
      </View>
    </View>
  );
}

function TargetRing({
  color,
  current,
  target
}: {
  color: string;
  current: number;
  target: number;
}) {
  const percent = target > 0 ? Math.min(100, Math.max(0, current / target * 100)) : 0;
  const ringStyle = Platform.select({
    web: {
      backgroundImage: `conic-gradient(${color} ${percent}%, #dbecee ${percent}% 100%)`,
      transitionDuration: "320ms",
      transitionProperty: "background-image",
      transitionTimingFunction: "ease"
    } as never,
    default: {
      borderColor: color
    }
  });

  return (
    <View style={styles.targetRingBlock}>
      <View style={[styles.targetRing, ringStyle]}>
        <View style={styles.targetRingInner}>
          <Text style={styles.targetRingValue}>{round(percent, 0)}%</Text>
        </View>
      </View>
    </View>
  );
}

function FuelingCanvas({
  activeBottleId,
  bottleCalculations,
  bottles,
  items,
  onAddBottle,
  onOpenAddModal,
  onRemoveBottle,
  onRemoveItem,
  onSelectBottle,
  onUpdateBottle
}: {
  activeBottleId: string;
  bottleCalculations: BottleCalculation[];
  bottles: DraftBottle[];
  items: DraftItem[];
  onAddBottle: (sizeMl?: number, label?: string) => void;
  onOpenAddModal: (target: { bottleId?: string; mode: "bottle" | "carried" }) => void;
  onRemoveBottle: (bottleId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onSelectBottle: (bottleId: string) => void;
  onUpdateBottle: (bottleId: string, patch: Partial<DraftBottle>) => void;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const carriedItems = items.filter((item) => item.location !== "bottle");

  return (
    <Card style={styles.fuelingCanvas}>
      <View style={styles.canvasToolbar}>
        <View>
          <Text style={styles.canvasTitle}>{copy.strategyBoard}</Text>
          <Text style={styles.canvasSubtitle}>{language === "es" ? "Llena caramanolas y separa lo que vas a llevar." : "Fill bottles and separate what you carry."}</Text>
        </View>
        <View style={styles.canvasActions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottleSizeRail}>
            {bottleSizes.map((size) => (
              <Pressable
                accessibilityRole="button"
                key={size.label}
                onPress={() => onAddBottle(size.value, size.label)}
                style={styles.sizeChip}
              >
                <Text style={styles.sizeChipText}>{size.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button onPress={() => onOpenAddModal({ mode: "carried" })} variant="secondary">
            {copy.addFood}
          </Button>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.fuelingScroller}>
        {bottles.map((bottle) => {
          const calculation = bottleCalculations.find((entry) => entry.bottle.id === bottle.id) ?? calculateBottleTotals(bottle, []);
          const bottleItems = items.filter((item) => item.location === "bottle" && item.bottle_id === bottle.id);

          return (
            <BottleFuelCard
              active={bottle.id === activeBottleId}
              bottle={bottle}
              calculation={calculation}
              items={bottleItems}
              key={bottle.id}
              onAddIngredient={() => onOpenAddModal({ bottleId: bottle.id, mode: "bottle" })}
              onRemoveBottle={() => onRemoveBottle(bottle.id)}
              onRemoveItem={onRemoveItem}
              onSelect={() => onSelectBottle(bottle.id)}
              onUpdateBottle={(patch) => onUpdateBottle(bottle.id, patch)}
            />
          );
        })}
        <CarriedFuelCard items={carriedItems} onAddFood={() => onOpenAddModal({ mode: "carried" })} onRemoveItem={onRemoveItem} />
        <Pressable accessibilityRole="button" onPress={() => onAddBottle()} style={styles.addBottleTile}>
          <Text style={styles.addBottleTileMark}>+</Text>
          <Text style={styles.addBottleTileText}>{copy.addBottle}</Text>
        </Pressable>
      </ScrollView>
    </Card>
  );
}

function ReadOnlyFuelingCanvas({
  bottleCalculations,
  bottles,
  items
}: {
  bottleCalculations: BottleCalculation[];
  bottles: DraftBottle[];
  items: DraftItem[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const carriedItems = items.filter((item) => item.location !== "bottle");

  return (
    <Card style={styles.fuelingCanvas}>
      <View style={styles.canvasToolbar}>
        <View>
          <Text style={styles.canvasTitle}>{copy.strategyBoard}</Text>
          <Text style={styles.canvasSubtitle}>{language === "es" ? "Esto es lo que debes preparar y llevar." : "What to prepare and carry."}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.fuelingScroller}>
        {bottles.map((bottle) => {
          const calculation = bottleCalculations.find((entry) => entry.bottle.id === bottle.id) ?? calculateBottleTotals(bottle, []);
          const bottleItems = items.filter((item) => item.location === "bottle" && item.bottle_id === bottle.id);

          return <ReadOnlyBottleCard bottle={bottle} calculation={calculation} items={bottleItems} key={bottle.id} />;
        })}
        <ReadOnlyCarriedCard items={carriedItems} />
      </ScrollView>
    </Card>
  );
}

function ReadOnlyBottleCard({
  bottle,
  calculation,
  items
}: {
  bottle: DraftBottle;
  calculation: BottleCalculation;
  items: DraftItem[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  return (
    <View style={[styles.fuelCard, styles.readOnlyFuelCard]}>
      <View style={styles.fuelCardHeader}>
        <View style={styles.fuelTitleBlock}>
          <Text style={styles.fuelCardKicker}>{copy.bottle}</Text>
          <Text style={styles.fuelCardTitle}>{bottle.name}</Text>
          <Text style={styles.fuelCardMeta}>
            {round(calculation.remainingWaterMl, 0)} ml {copy.remainingWater.toLowerCase()} / {round(calculation.carbsPerLiter, 0)} g/L
          </Text>
        </View>
      </View>
      <View style={styles.bottleHeroRow}>
        <VirtualBottle bottle={bottle} calculation={calculation} items={items} large />
        <View style={styles.bottleSideStats}>
          <MiniMetric label={copy.capacity} value={`${round(bottle.bottle_size_ml, 0)} ml`} />
          <MiniMetric label={copy.usedByIngredients} value={`${round(calculation.totalUsedVolumeMl, 0)} ml`} />
          <MiniMetric label={language === "es" ? "Conc." : "Conc."} value={`${round(calculation.carbsPerLiter, 0)} g/L`} />
        </View>
      </View>
      <NutrientBars
        calories={calculation.totalCalories}
        carbs={calculation.totalCarbs}
        fluids={bottle.bottle_size_ml}
        sodium={calculation.totalSodiumMg}
      />
      <IngredientComposition items={items} onRemoveItem={() => undefined} readonly />
    </View>
  );
}

function ReadOnlyCarriedCard({ items }: { items: DraftItem[] }) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const calculated = items.map((item) => calculateNutritionItem(item.product, stripDraftItem(item)));
  const carbs = calculated.reduce((total, item) => total + item.calculated_carbs, 0);
  const sodium = calculated.reduce((total, item) => total + item.calculated_sodium_mg, 0);
  const calories = calculated.reduce((total, item) => total + item.calculated_calories, 0);
  const fluids = calculated.reduce((total, item) => total + item.calculated_volume_ml, 0);

  return (
    <View style={[styles.fuelCard, styles.carriedFuelCard, styles.readOnlyFuelCard]}>
      <View style={styles.fuelCardHeader}>
        <View style={styles.fuelTitleBlock}>
          <Text style={styles.fuelCardKicker}>{copy.carried}</Text>
          <Text style={styles.fuelCardTitle}>{copy.foodCarried}</Text>
          <Text style={styles.fuelCardMeta}>{copy.foodCarriedBody}</Text>
        </View>
      </View>
      <NutrientBars calories={calories} carbs={carbs} fluids={fluids} sodium={sodium} />
      <IngredientComposition items={items} onRemoveItem={() => undefined} readonly />
    </View>
  );
}

function BottleFuelCard({
  active,
  bottle,
  calculation,
  items,
  onAddIngredient,
  onRemoveBottle,
  onRemoveItem,
  onSelect,
  onUpdateBottle
}: {
  active: boolean;
  bottle: DraftBottle;
  calculation: BottleCalculation;
  items: DraftItem[];
  onAddIngredient: () => void;
  onRemoveBottle: () => void;
  onRemoveItem: (itemId: string) => void;
  onSelect: () => void;
  onUpdateBottle: (patch: Partial<DraftBottle>) => void;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  return (
    <Pressable accessibilityRole="button" onPress={onSelect} style={[styles.fuelCard, active && styles.fuelCardActive]}>
      <View style={styles.fuelCardHeader}>
        <View style={styles.fuelTitleBlock}>
          <Text style={styles.fuelCardKicker}>{active ? (language === "es" ? "Seleccionada" : "Selected") : copy.bottle}</Text>
          <Text style={styles.fuelCardTitle}>{bottle.name}</Text>
          <Text style={styles.fuelCardMeta}>
            {round(calculation.remainingWaterMl, 0)} ml {copy.remainingWater.toLowerCase()} / {round(calculation.carbsPerLiter, 0)} g/L
          </Text>
        </View>
        <Button onPress={onAddIngredient}>{copy.addIngredient}</Button>
      </View>

      <View style={styles.bottleHeroRow}>
        <VirtualBottle bottle={bottle} calculation={calculation} items={items} large />
        <View style={styles.bottleSideStats}>
          <MiniMetric label={copy.capacity} value={`${round(bottle.bottle_size_ml, 0)} ml`} />
          <MiniMetric label={copy.usedByIngredients} value={`${round(calculation.totalUsedVolumeMl, 0)} ml`} />
          <MiniMetric label={language === "es" ? "Conc." : "Conc."} value={`${round(calculation.carbsPerLiter, 0)} g/L`} />
        </View>
      </View>

      <View style={styles.compactEditRow}>
        <View style={styles.strategyNameField}>
          <Field label={copy.bottleName} onChangeText={(name) => onUpdateBottle({ name })} value={bottle.name} />
        </View>
        <View style={styles.strategySizeField}>
          <Field
            inputMode="numeric"
            label={copy.bottleSizeMl}
            onChangeText={(value) => onUpdateBottle({ bottle_size_ml: Math.max(0, parseOptionalNumber(value) ?? 0) })}
            value={numberToInput(bottle.bottle_size_ml)}
          />
        </View>
      </View>

      <NutrientBars
        calories={calculation.totalCalories}
        carbs={calculation.totalCarbs}
        fluids={bottle.bottle_size_ml}
        sodium={calculation.totalSodiumMg}
      />
      <IngredientComposition items={items} onRemoveItem={onRemoveItem} />
      <Button onPress={onRemoveBottle} variant="danger">
        {copy.remove}
      </Button>
    </Pressable>
  );
}

function CarriedFuelCard({
  items,
  onAddFood,
  onRemoveItem
}: {
  items: DraftItem[];
  onAddFood: () => void;
  onRemoveItem: (itemId: string) => void;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const calculated = items.map((item) => calculateNutritionItem(item.product, stripDraftItem(item)));
  const carbs = calculated.reduce((total, item) => total + item.calculated_carbs, 0);
  const sodium = calculated.reduce((total, item) => total + item.calculated_sodium_mg, 0);
  const calories = calculated.reduce((total, item) => total + item.calculated_calories, 0);
  const fluids = calculated.reduce((total, item) => total + item.calculated_volume_ml, 0);

  return (
    <View style={[styles.fuelCard, styles.carriedFuelCard]}>
      <View style={styles.fuelCardHeader}>
        <View style={styles.fuelTitleBlock}>
          <Text style={styles.fuelCardKicker}>{copy.carried}</Text>
          <Text style={styles.fuelCardTitle}>{copy.foodCarried}</Text>
          <Text style={styles.fuelCardMeta}>{copy.foodCarriedBody}</Text>
        </View>
        <Button onPress={onAddFood}>{copy.addFood}</Button>
      </View>
      <NutrientBars calories={calories} carbs={carbs} fluids={fluids} sodium={sodium} />
      <IngredientComposition items={items} onRemoveItem={onRemoveItem} />
    </View>
  );
}

function AddNutritionModal({
  bottles,
  customProductCount,
  onAddProduct,
  onClose,
  onCreateOrUpdateProduct,
  onDeleteProduct,
  products,
  target
}: {
  bottles: DraftBottle[];
  customProductCount: number;
  onAddProduct: (product: NutritionProduct, location: NutritionPlanItemLocation, bottleId?: string | null, quantity?: number) => void;
  onClose: () => void;
  onCreateOrUpdateProduct: (input: NutritionProductInput, productId?: string) => Promise<NutritionProduct>;
  onDeleteProduct: (productId: string) => Promise<void>;
  products: NutritionProduct[];
  target: { bottleId?: string; mode: "bottle" | "carried" } | null;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const [productForm, setProductForm] = useState<ProductFormMode>({ visible: false });
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState<NutritionPlanItemLocation>("during");
  const [error, setError] = useState<string | null>(null);
  const filteredProducts = useMemo(() => {
    if (target?.mode === "bottle") {
      return products.filter((product) => ["bottle_ingredient", "powder", "drink", "gel", "custom"].includes(product.category));
    }

    return products.filter((product) => product.category !== "bottle_ingredient" && product.category !== "powder");
  }, [products, target?.mode]);
  const selectedProduct = filteredProducts.find((product) => product.id === productId) ?? filteredProducts[0] ?? null;
  const targetBottle = bottles.find((bottle) => bottle.id === target?.bottleId);

  useEffect(() => {
    if (!target) {
      return;
    }

    const nextProduct = filteredProducts[0];
    setProductId(nextProduct?.id ?? "");
    setQuantity(numberToInput(nextProduct?.default_serving_size ?? 1));
    setLocation(target.mode === "bottle" ? "bottle" : "during");
    setProductForm({ visible: false });
    setError(null);
  }, [filteredProducts, target]);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(numberToInput(selectedProduct.default_serving_size ?? 1));
    }
  }, [selectedProduct]);

  async function submitProduct(input: NutritionProductInput, productIdToUpdate?: string) {
    try {
      const product = await onCreateOrUpdateProduct(input, productIdToUpdate);
      setProductId(product.id);
      setProductForm({ visible: false });
      setError(null);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  function confirmDeleteProduct(product: NutritionProduct) {
    Alert.alert(copy.deleteCustomProduct, copy.deleteCustomProductBody(product.name), [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.delete,
        style: "destructive",
        onPress: () => {
          onDeleteProduct(product.id).catch((deleteError) => setError(getErrorMessage(deleteError)));
        }
      }
    ]);
  }

  function addSelectedProduct() {
    if (!selectedProduct || !target) {
      return;
    }

    onAddProduct(selectedProduct, target.mode === "bottle" ? "bottle" : location, target.mode === "bottle" ? target.bottleId ?? null : null, parseOptionalNumber(quantity) ?? undefined);
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(target)}>
      <View style={styles.modalOverlay}>
        <View style={styles.addModal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{target?.mode === "bottle" ? copy.addIngredient : copy.addFood}</Text>
              <Text style={styles.modalMeta}>{targetBottle?.name ?? copy.foodCarried}</Text>
            </View>
            <Button onPress={onClose} variant="secondary">
              {copy.close}
            </Button>
          </View>

          {productForm.visible ? (
            <CustomProductForm
              initialProduct={productForm.product}
              onCancel={() => setProductForm({ visible: false })}
              onSubmit={submitProduct}
            />
          ) : (
            <View style={styles.modalForm}>
              <SelectField
                label={copy.itemToAdd}
                onValueChange={setProductId}
                options={filteredProducts.map((product) => ({ label: product.name, value: product.id }))}
                value={productId}
              />
              {target?.mode === "carried" ? (
                <SelectField
                  label={copy.location}
                  onValueChange={(value) => setLocation(toLocation(value))}
                  options={getLocationOptions(language).filter((option) => option.value !== "bottle")}
                  value={location}
                />
              ) : null}
              <Field inputMode="numeric" label={language === "es" ? "Cantidad" : "Quantity"} onChangeText={setQuantity} value={quantity} />
              {selectedProduct ? (
                <View style={styles.selectedProductPreview}>
                  <View style={[styles.ingredientDot, { backgroundColor: getProductColor(selectedProduct) }]} />
                  <View style={styles.simpleItemCopy}>
                    <Text style={styles.simpleItemTitle}>{selectedProduct.name}</Text>
                    <Text style={styles.simpleItemMeta}>
                      {round(selectedProduct.carbs_per_serving, 0)} g {copy.carbs.toLowerCase()} / {round(selectedProduct.sodium_mg_per_serving, 0)} mg {copy.sodium.toLowerCase()} / {round(selectedProduct.calories_per_serving, 0)} kcal
                    </Text>
                  </View>
                </View>
              ) : null}
              <NutrientBars
                calories={selectedProduct?.calories_per_serving ?? 0}
                carbs={selectedProduct?.carbs_per_serving ?? 0}
                fluids={selectedProduct?.liquid_volume_ml_per_serving ?? 0}
                sodium={selectedProduct?.sodium_mg_per_serving ?? 0}
              />
              <Inline>
                <Button onPress={addSelectedProduct}>{copy.add}</Button>
                <Button onPress={() => setProductForm({ visible: true })} variant="secondary">
                  {copy.newCustomProduct}
                </Button>
                <Pill label={`${customProductCount}/${MAX_CUSTOM_NUTRITION_PRODUCTS}`} tone="blue" />
              </Inline>
              {selectedProduct?.product_scope === "user" ? (
                <Inline>
                  <Button onPress={() => setProductForm({ product: selectedProduct, visible: true })} variant="ghost">
                    {copy.edit}
                  </Button>
                  <Button onPress={() => confirmDeleteProduct(selectedProduct)} variant="danger">
                    {copy.delete}
                  </Button>
                </Inline>
              ) : null}
            </View>
          )}
          {error ? <Text selectable style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function NutrientBars({
  calories,
  carbs,
  fluids,
  sodium
}: {
  calories: number;
  carbs: number;
  fluids: number;
  sodium: number;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const max = Math.max(carbs, fluids / 10, sodium / 10, calories / 4, 1);

  return (
    <View style={styles.nutrientBars}>
      <CompactNutritionBar color={colors.accent} label={copy.carbs} max={max} unit="g" value={carbs} />
      <CompactNutritionBar color="#51d9df" label={copy.fluids} max={max} unit="ml" value={fluids} scale={10} />
      <CompactNutritionBar color={colors.amber} label={copy.sodium} max={max} unit="mg" value={sodium} scale={10} />
      <CompactNutritionBar color={colors.coral} label={copy.calories} max={max} unit="kcal" value={calories} scale={4} />
    </View>
  );
}

function CompactNutritionBar({
  color,
  label,
  max,
  scale = 1,
  unit,
  value
}: {
  color: string;
  label: string;
  max: number;
  scale?: number;
  unit: string;
  value: number;
}) {
  const visualValue = value / scale;
  const width = Math.min(100, Math.max(4, visualValue / max * 100));

  return (
    <View style={styles.compactBarRow}>
      <View style={styles.compactBarLabelRow}>
        <Text style={styles.compactBarLabel}>{label}</Text>
        <Text style={styles.compactBarValue}>
          {round(value, 0)} {unit}
        </Text>
      </View>
      <View style={styles.compactBarTrack}>
        <View style={[styles.compactBarFill, { backgroundColor: color, width: `${width}%` }]} />
      </View>
    </View>
  );
}

function IngredientComposition({
  items,
  onRemoveItem,
  readonly
}: {
  items: DraftItem[];
  onRemoveItem: (itemId: string) => void;
  readonly?: boolean;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  if (!items.length) {
    return <Text style={styles.helperCopy}>{copy.noItemsAssigned}</Text>;
  }

  return (
    <View style={styles.compositionList}>
      <Text style={styles.compositionTitle}>{copy.composition}</Text>
      {items.map((item, index) => {
        const calculated = calculateNutritionItem(item.product, stripDraftItem(item));
        const color = getProductColor(item.product, index);

        return (
          <View key={item.id} style={styles.compositionRow}>
            <View style={[styles.ingredientDot, { backgroundColor: color }]} />
            <View style={styles.simpleItemCopy}>
              <Text style={styles.simpleItemTitle}>{item.product.name}</Text>
              <Text style={styles.simpleItemMeta}>
                {item.quantity} {item.unit ?? (language === "es" ? "porcion" : "serving")} / {round(calculated.calculated_carbs, 0)} g {copy.carbs.toLowerCase()} / {round(calculated.calculated_sodium_mg, 0)} mg {copy.sodium.toLowerCase()}
              </Text>
            </View>
            {readonly ? null : (
              <Pressable accessibilityRole="button" onPress={() => onRemoveItem(item.id)} style={styles.removeItemButton}>
                <Text style={styles.removeItemButtonText}>x</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function BottleStrategyBoard({
  activeBottleId,
  bottleCalculations,
  bottles,
  customProductCount,
  items,
  onAddBottle,
  onAddProduct,
  onCreateOrUpdateProduct,
  onDeleteProduct,
  onRemoveBottle,
  onRemoveItem,
  onSelectBottle,
  onUpdateBottle,
  products
}: {
  activeBottleId: string;
  bottleCalculations: BottleCalculation[];
  bottles: DraftBottle[];
  customProductCount: number;
  items: DraftItem[];
  onAddBottle: (sizeMl?: number, label?: string) => void;
  onAddProduct: (product: NutritionProduct, location: NutritionPlanItemLocation, bottleId?: string | null, quantity?: number) => void;
  onCreateOrUpdateProduct: (input: NutritionProductInput, productId?: string) => Promise<NutritionProduct>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onRemoveBottle: (bottleId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onSelectBottle: (bottleId: string) => void;
  onUpdateBottle: (bottleId: string, patch: Partial<DraftBottle>) => void;
  products: NutritionProduct[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const [customBottleSize, setCustomBottleSize] = useState("");
  const [productForm, setProductForm] = useState<ProductFormMode>({ visible: false });
  const [error, setError] = useState<string | null>(null);
  const userProducts = useMemo(() => products.filter((product) => product.product_scope === "user"), [products]);

  function addCustomBottle() {
    const size = parseOptionalNumber(customBottleSize);

    if (!size || size <= 0) {
      return;
    }

    onAddBottle(size, `${size} ml`);
    setCustomBottleSize("");
  }

  async function submitProduct(input: NutritionProductInput, productId?: string) {
    try {
      await onCreateOrUpdateProduct(input, productId);
      setProductForm({ visible: false });
      setError(null);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  function confirmDeleteProduct(product: NutritionProduct) {
    Alert.alert(copy.deleteCustomProduct, copy.deleteCustomProductBody(product.name), [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.delete,
        style: "destructive",
        onPress: () => {
          onDeleteProduct(product.id).catch((deleteError) => setError(getErrorMessage(deleteError)));
        }
      }
    ]);
  }

  return (
    <Card style={styles.strategyBoardCard}>
      <View style={styles.strategyBoardHeader}>
        <View style={styles.strategyBoardCopy}>
          <Text style={styles.sectionKicker}>{copy.step2}</Text>
          <Text style={styles.sectionTitle}>{copy.strategyBoard}</Text>
          <Text style={styles.helperCopy}>{copy.strategyBoardBody}</Text>
        </View>
        <View style={styles.addBottleControls}>
          <View style={styles.bottleSizeRow}>
            {bottleSizes.map((size) => (
              <Pressable
                accessibilityRole="button"
                key={size.label}
                onPress={() => onAddBottle(size.value, size.label)}
                style={styles.sizeChip}
              >
                <Text style={styles.sizeChipText}>{size.label}</Text>
              </Pressable>
            ))}
          </View>
          <Inline>
            <View style={styles.customBottleMiniField}>
              <Field
                inputMode="numeric"
                label={copy.customBottleSize}
                onChangeText={setCustomBottleSize}
                value={customBottleSize}
              />
            </View>
            <Button onPress={addCustomBottle} variant="secondary">
              {copy.addCustom}
            </Button>
          </Inline>
        </View>
      </View>

      <Inline>
        <Button onPress={() => setProductForm({ visible: true })} variant="secondary">
          {copy.newCustomProduct}
        </Button>
        <Pill label={`${customProductCount}/${MAX_CUSTOM_NUTRITION_PRODUCTS} ${copy.customProducts}`} tone="blue" />
      </Inline>
      {error ? <Text selectable style={styles.error}>{error}</Text> : null}
      {productForm.visible ? (
        <CustomProductForm
          initialProduct={productForm.product}
          onCancel={() => setProductForm({ visible: false })}
          onSubmit={submitProduct}
        />
      ) : null}
      {userProducts.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.customProductStrip}>
          {userProducts.map((product) => (
            <View key={product.id} style={styles.customProductChip}>
              <NutritionIcon iconKey={product.icon_key ?? "custom_food"} />
              <Text style={styles.customProductChipText}>{product.name}</Text>
              <Pressable accessibilityRole="button" onPress={() => setProductForm({ visible: true, product })} style={styles.customProductAction}>
                <Text style={styles.customProductActionText}>{copy.edit}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => confirmDeleteProduct(product)} style={styles.customProductActionDanger}>
                <Text style={styles.customProductActionDangerText}>{copy.delete}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.strategyScroller}
      >
        {bottles.map((bottle) => {
          const calculation = bottleCalculations.find((entry) => entry.bottle.id === bottle.id) ?? calculateBottleTotals(bottle, []);
          const bottleItems = items.filter((item) => item.location === "bottle" && item.bottle_id === bottle.id);

          return (
            <BottleStrategyCard
              active={bottle.id === activeBottleId}
              bottle={bottle}
              calculation={calculation}
              items={bottleItems}
              key={bottle.id}
              onAddProduct={onAddProduct}
              onRemoveBottle={onRemoveBottle}
              onRemoveItem={onRemoveItem}
              onSelect={() => onSelectBottle(bottle.id)}
              onUpdateBottle={onUpdateBottle}
              products={products}
            />
          );
        })}
        <CarriedFoodStrategyCard
          items={items.filter((item) => item.location !== "bottle")}
          onAddProduct={onAddProduct}
          onRemoveItem={onRemoveItem}
          products={products}
        />
      </ScrollView>
    </Card>
  );
}

function BottleStrategyCard({
  active,
  bottle,
  calculation,
  items,
  onAddProduct,
  onRemoveBottle,
  onRemoveItem,
  onSelect,
  onUpdateBottle,
  products
}: {
  active: boolean;
  bottle: DraftBottle;
  calculation: BottleCalculation;
  items: DraftItem[];
  onAddProduct: (product: NutritionProduct, location: NutritionPlanItemLocation, bottleId?: string | null, quantity?: number) => void;
  onRemoveBottle: (bottleId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onSelect: () => void;
  onUpdateBottle: (bottleId: string, patch: Partial<DraftBottle>) => void;
  products: NutritionProduct[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const bottleProducts = useMemo(
    () => products.filter((product) => ["bottle_ingredient", "powder", "drink", "gel", "custom"].includes(product.category)),
    [products]
  );
  const [productId, setProductId] = useState(bottleProducts[0]?.id ?? "");
  const selectedProduct = bottleProducts.find((product) => product.id === productId) ?? bottleProducts[0] ?? null;
  const [quantity, setQuantity] = useState(numberToInput(selectedProduct?.default_serving_size ?? 1));

  useEffect(() => {
    if (!productId && bottleProducts[0]?.id) {
      setProductId(bottleProducts[0].id);
    }
  }, [bottleProducts, productId]);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(numberToInput(selectedProduct.default_serving_size ?? 1));
    }
  }, [selectedProduct]);

  function addSelectedProduct() {
    if (!selectedProduct) {
      return;
    }

    onAddProduct(selectedProduct, "bottle", bottle.id, parseOptionalNumber(quantity) ?? undefined);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onSelect}
      style={[styles.strategyCard, active && styles.strategyCardActive]}
    >
      <View style={styles.strategyCardHeader}>
        <View style={styles.strategyCardTitleBlock}>
          <Text style={styles.strategyCardKicker}>{active ? (language === "es" ? "Llenando ahora" : "Filling now") : copy.bottle}</Text>
          <Text style={styles.strategyCardTitle}>{bottle.name}</Text>
          <Text style={styles.strategyCardMeta}>
            {round(calculation.totalCarbs, 0)} g {copy.carbs.toLowerCase()} / {round(calculation.remainingWaterMl, 0)} ml {copy.remainingWater.toLowerCase()}
          </Text>
        </View>
        <Pill label={`${round(calculation.carbsPerLiter, 0)} g/L`} tone={calculation.concentration === "very_high" ? "amber" : "primary"} />
      </View>

      <View style={styles.strategyFieldsRow}>
        <View style={styles.strategyNameField}>
          <Field label={copy.bottleName} onChangeText={(name) => onUpdateBottle(bottle.id, { name })} value={bottle.name} />
        </View>
        <View style={styles.strategySizeField}>
          <Field
            inputMode="numeric"
            label={copy.bottleSizeMl}
            onChangeText={(value) => onUpdateBottle(bottle.id, { bottle_size_ml: Math.max(0, parseOptionalNumber(value) ?? 0) })}
            value={numberToInput(bottle.bottle_size_ml)}
          />
        </View>
      </View>

      <View style={styles.addItemPanel}>
        <SelectField
          label={copy.itemToAdd}
          onValueChange={setProductId}
          options={bottleProducts.map((product) => ({ label: product.name, value: product.id }))}
          value={productId}
        />
        <Inline>
          <View style={styles.strategyQuantityField}>
            <Field inputMode="numeric" label={language === "es" ? "Cantidad" : "Quantity"} onChangeText={setQuantity} value={quantity} />
          </View>
          <Button onPress={addSelectedProduct}>{copy.add}</Button>
        </Inline>
      </View>

      <SimpleItemList emptyText={copy.noItemsAssigned} items={items} onRemoveItem={onRemoveItem} />

      <Inline style={styles.strategyCardFooter}>
        <MiniMetric label={copy.capacity} value={`${round(bottle.bottle_size_ml, 0)} ml`} />
        <MiniMetric label={copy.usedByIngredients} value={`${round(calculation.totalUsedVolumeMl, 0)} ml`} />
        <Button onPress={() => onRemoveBottle(bottle.id)} variant="danger">
          {copy.remove}
        </Button>
      </Inline>
    </Pressable>
  );
}

function CarriedFoodStrategyCard({
  items,
  onAddProduct,
  onRemoveItem,
  products
}: {
  items: DraftItem[];
  onAddProduct: (product: NutritionProduct, location: NutritionPlanItemLocation, bottleId?: string | null, quantity?: number) => void;
  onRemoveItem: (itemId: string) => void;
  products: NutritionProduct[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const carriedProducts = useMemo(
    () => products.filter((product) => product.category !== "bottle_ingredient" && product.category !== "powder"),
    [products]
  );
  const [productId, setProductId] = useState(carriedProducts[0]?.id ?? "");
  const [location, setLocation] = useState<NutritionPlanItemLocation>("during");
  const selectedProduct = carriedProducts.find((product) => product.id === productId) ?? carriedProducts[0] ?? null;
  const [quantity, setQuantity] = useState(numberToInput(selectedProduct?.default_serving_size ?? 1));

  useEffect(() => {
    if (!productId && carriedProducts[0]?.id) {
      setProductId(carriedProducts[0].id);
    }
  }, [carriedProducts, productId]);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(numberToInput(selectedProduct.default_serving_size ?? 1));
    }
  }, [selectedProduct]);

  function addSelectedProduct() {
    if (!selectedProduct) {
      return;
    }

    onAddProduct(selectedProduct, location, null, parseOptionalNumber(quantity) ?? undefined);
  }

  return (
    <View style={[styles.strategyCard, styles.carriedStrategyCard]}>
      <View style={styles.strategyCardHeader}>
        <View style={styles.strategyCardTitleBlock}>
          <Text style={styles.strategyCardKicker}>{copy.step3}</Text>
          <Text style={styles.strategyCardTitle}>{copy.foodCarried}</Text>
          <Text style={styles.strategyCardMeta}>{copy.foodCarriedBody}</Text>
        </View>
      </View>
      <View style={styles.addItemPanel}>
        <SelectField
          label={copy.itemToAdd}
          onValueChange={setProductId}
          options={carriedProducts.map((product) => ({ label: product.name, value: product.id }))}
          value={productId}
        />
        <SelectField
          label={copy.location}
          onValueChange={(value) => setLocation(toLocation(value))}
          options={getLocationOptions(language).filter((option) => option.value !== "bottle")}
          value={location}
        />
        <Inline>
          <View style={styles.strategyQuantityField}>
            <Field inputMode="numeric" label={language === "es" ? "Cantidad" : "Quantity"} onChangeText={setQuantity} value={quantity} />
          </View>
          <Button onPress={addSelectedProduct}>{copy.add}</Button>
        </Inline>
      </View>
      <SimpleItemList emptyText={copy.noItemsAssigned} items={items} onRemoveItem={onRemoveItem} />
    </View>
  );
}

export function ActiveBottleFocus({
  bottle,
  calculation,
  draft,
  items,
  totals,
  warnings
}: {
  bottle: DraftBottle | null;
  calculation: BottleCalculation | null;
  draft: DraftPlan;
  items: DraftItem[];
  totals: PlanTotals;
  warnings: NutritionWarning[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  return (
    <Card style={styles.focusCard}>
      <View style={styles.sectionHeaderTight}>
        <Text style={styles.sectionKicker}>{copy.reviewPlan}</Text>
        <Text style={styles.sectionTitle}>{bottle?.name ?? copy.bottle}</Text>
      </View>
      {bottle && calculation ? (
        <VirtualBottle bottle={bottle} calculation={calculation} large />
      ) : (
        <Text style={styles.helperCopy}>{copy.waterBottlePrompt}</Text>
      )}
      <View style={styles.focusMetricGrid}>
        <MiniMetric label={copy.totalCarbs} value={`${round(totals.totalCarbs, 0)} g`} />
        <MiniMetric label={copy.totalFluids} value={`${round(totals.totalFluidsMl, 0)} ml`} />
        <MiniMetric label={copy.totalSodium} value={`${round(totals.totalSodiumMg, 0)} mg`} />
        <MiniMetric label={copy.totalCalories} value={`${round(totals.totalCalories, 0)} kcal`} />
      </View>
      <NutritionProgressBar current={totals.carbsPerHour} label={copy.carbs} target={draft.target_carbs_per_hour ?? 0} unit="g/hr" />
      <NutritionProgressBar current={totals.fluidsMlPerHour} label={copy.fluids} target={draft.target_fluids_ml_per_hour ?? 0} unit="ml/hr" />
      <NutritionProgressBar current={totals.sodiumMgPerHour} label={copy.sodium} target={draft.target_sodium_mg_per_hour ?? 0} unit="mg/hr" />
      <View style={styles.warningListCompact}>
        {warnings.slice(0, 3).map((warning, index) => (
          <NutritionWarningBadge key={`${warning.message}-${index}`} warning={warning} />
        ))}
      </View>
      <SimpleItemList
        emptyText={copy.noItemsYet}
        items={items.slice(0, 6)}
        onRemoveItem={() => undefined}
        readonly
      />
    </Card>
  );
}

function SimpleItemList({
  emptyText,
  items,
  onRemoveItem,
  readonly
}: {
  emptyText: string;
  items: DraftItem[];
  onRemoveItem: (itemId: string) => void;
  readonly?: boolean;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  if (!items.length) {
    return <Text style={styles.helperCopy}>{emptyText}</Text>;
  }

  return (
    <View style={styles.simpleItemList}>
      {items.map((item) => {
        const calculated = calculateNutritionItem(item.product, stripDraftItem(item));

        return (
          <View key={item.id} style={styles.simpleItemRow}>
            <NutritionIcon iconKey={item.product.icon_key ?? "custom_food"} />
            <View style={styles.simpleItemCopy}>
              <Text style={styles.simpleItemTitle}>{item.product.name}</Text>
              <Text style={styles.simpleItemMeta}>
                {item.quantity} {item.unit ?? (language === "es" ? "porcion" : "serving")} / {round(calculated.calculated_carbs, 0)} g {copy.carbs.toLowerCase()} / {round(calculated.calculated_sodium_mg, 0)} mg {copy.sodium.toLowerCase()}
              </Text>
            </View>
            {readonly ? null : (
              <Pressable accessibilityRole="button" onPress={() => onRemoveItem(item.id)} style={styles.removeItemButton}>
                <Text style={styles.removeItemButtonText}>x</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function BottleBuilder({
  bottleCalculations,
  bottles,
  items,
  onAddBottle,
  onRemoveBottle,
  onRemoveItem,
  onUpdateBottle,
  onUpdateItem
}: {
  bottleCalculations: BottleCalculation[];
  bottles: DraftBottle[];
  items: DraftItem[];
  onAddBottle: (sizeMl?: number, label?: string) => void;
  onRemoveBottle: (bottleId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateBottle: (bottleId: string, patch: Partial<DraftBottle>) => void;
  onUpdateItem: (itemId: string, patch: Partial<DraftItem>) => void;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const [customBottleSize, setCustomBottleSize] = useState("");

  function addCustomBottle() {
    const size = parseOptionalNumber(customBottleSize);

    if (!size || size <= 0) {
      return;
    }

    onAddBottle(size, `${size} ml custom`);
    setCustomBottleSize("");
  }

  return (
    <Card style={styles.editorCard}>
      <View style={styles.sectionHeaderTight}>
        <Text style={styles.sectionKicker}>{copy.step2}</Text>
        <Text style={styles.sectionTitle}>{copy.bottlesTitle}</Text>
      </View>
      <View style={styles.bottleSizeRow}>
        {bottleSizes.map((size) => (
          <Pressable
            accessibilityRole="button"
            key={size.label}
            onPress={() => onAddBottle(size.value, size.label)}
            style={styles.sizeChip}
          >
            <Text style={styles.sizeChipText}>{size.label}</Text>
          </Pressable>
        ))}
      </View>
      <Inline>
        <View style={styles.splitField}>
          <Field
            inputMode="numeric"
            label={copy.customBottleSize}
            onChangeText={setCustomBottleSize}
            value={customBottleSize}
          />
        </View>
        <Button onPress={addCustomBottle} variant="secondary">
          {copy.addCustom}
        </Button>
      </Inline>

      {bottles.length === 0 ? (
        <View style={styles.emptyInline}>
          <NutritionIcon iconKey="water" />
          <Text style={styles.helperCopy}>{copy.waterBottlePrompt}</Text>
        </View>
      ) : null}

      {bottles.map((bottle) => {
        const calculation = bottleCalculations.find((entry) => entry.bottle.id === bottle.id) ?? calculateBottleTotals(bottle, []);
        const bottleItems = items.filter((item) => item.location === "bottle" && item.bottle_id === bottle.id);

        return (
          <View key={bottle.id} style={styles.bottlePanel}>
            <View style={styles.bottlePanelHeader}>
              <View style={styles.bottleNameFields}>
                <Field
                  label={copy.bottleName}
                  onChangeText={(name) => onUpdateBottle(bottle.id, { name })}
                  value={bottle.name}
                />
              </View>
              <View style={styles.bottleSizeField}>
                <Field
                  inputMode="numeric"
                  label={copy.bottleSizeMl}
                  onChangeText={(value) => onUpdateBottle(bottle.id, { bottle_size_ml: Math.max(0, parseOptionalNumber(value) ?? 0) })}
                  value={numberToInput(bottle.bottle_size_ml)}
                />
              </View>
              <Button onPress={() => onRemoveBottle(bottle.id)} variant="danger">
                {copy.remove}
              </Button>
            </View>
            <View style={styles.bottleVisualRow}>
              <VirtualBottle bottle={bottle} calculation={calculation} />
              <View style={styles.bottleFacts}>
                <MiniMetric label={copy.capacity} value={`${round(bottle.bottle_size_ml, 0)} ml`} />
                <MiniMetric label={copy.usedByIngredients} value={`${round(calculation.totalUsedVolumeMl, 0)} ml`} />
                <MiniMetric label={copy.remainingWater} value={`${round(calculation.remainingWaterMl, 0)} ml`} />
                <MiniMetric label={copy.concentration} value={`${calculation.carbsPerLiter} g/L`} />
              </View>
            </View>
            <BottleIngredientList
              bottles={bottles}
              items={bottleItems}
              onRemoveItem={onRemoveItem}
              onUpdateItem={onUpdateItem}
              title={copy.insideThisBottle}
            />
          </View>
        );
      })}
    </Card>
  );
}

export function VirtualBottle({
  bottle,
  calculation,
  items = [],
  large
}: {
  bottle: DraftBottle | NutritionPlanBottleInput;
  calculation: BottleCalculation;
  items?: DraftItem[];
  large?: boolean;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const fillPercent = bottle.bottle_size_ml > 0
    ? Math.min(116, Math.max(0, calculation.totalUsedVolumeMl / bottle.bottle_size_ml * 100))
    : 0;
  const waterPercent = bottle.bottle_size_ml > 0
    ? Math.min(100, Math.max(0, calculation.remainingWaterMl / bottle.bottle_size_ml * 100))
    : 0;
  const overfilled = calculation.overfilled;
  const layers = items.map((item, index) => {
    const calculated = calculateNutritionItem(item.product, stripDraftItem(item));
    const rawPercent = bottle.bottle_size_ml > 0 ? calculated.calculated_volume_ml / bottle.bottle_size_ml * 100 : 0;

    return {
      color: getProductColor(item.product, index),
      height: Math.max(calculated.calculated_volume_ml > 0 ? rawPercent : calculated.calculated_carbs > 0 ? 3 : 1.5, 1.5),
      id: item.id
    };
  });
  let layerOffset = 0;

  return (
    <View style={[styles.virtualBottleBlock, large && styles.virtualBottleBlockLarge]}>
      <View style={[styles.bottleCap, large && styles.bottleCapLarge, overfilled && styles.bottleCapDanger]} />
      <View style={[styles.virtualBottle, large && styles.virtualBottleLarge, overfilled && styles.virtualBottleDanger]}>
        <View style={[styles.waterZone, { height: `${waterPercent}%` }]} />
        {layers.map((layer) => {
          const bottom = layerOffset;
          layerOffset += layer.height;

          return (
            <View
              key={layer.id}
              style={[
                styles.bottleLayer,
                bottleFillMotionStyle,
                {
                  backgroundColor: layer.color,
                  bottom: `${bottom}%`,
                  height: `${Math.min(layer.height, 100)}%`
                }
              ]}
            />
          );
        })}
        <View
          style={[
            styles.bottleFill,
            bottleFillMotionStyle,
            overfilled && styles.bottleFillDanger,
            layers.length > 0 && styles.bottleFillTransparent,
            { height: `${fillPercent}%` }
          ]}
        />
        <View style={styles.bottleShine} />
      </View>
      <Text style={styles.bottleVolume}>
        {round(calculation.totalUsedVolumeMl, 0)} ml {language === "es" ? "usados" : "used"}
      </Text>
      <View style={styles.bottleBadgeRow}>
        <BottleStatBadge label={`${round(calculation.totalCarbs, 0)} g ${language === "es" ? "carbos" : "carbs"}`} tone="primary" />
        <BottleStatBadge label={`${round(calculation.totalSodiumMg, 0)} mg ${copy.sodium.toLowerCase()}`} tone="amber" />
        <BottleStatBadge label={`${round(calculation.totalCalories, 0)} kcal`} tone="blue" />
      </View>
    </View>
  );
}

function BottleStatBadge({ label, tone }: { label: string; tone: "amber" | "blue" | "primary" }) {
  return (
    <View style={[styles.bottleStatBadge, tone === "amber" && styles.pillAmber, tone === "blue" && styles.pillBlue]}>
      <Text style={[styles.bottleStatBadgeText, tone === "amber" && styles.pillTextAmber, tone === "blue" && styles.pillTextBlue]}>
        {label}
      </Text>
    </View>
  );
}

export function BottleIngredientList({
  bottles,
  items,
  onRemoveItem,
  onUpdateItem,
  title
}: {
  bottles: DraftBottle[];
  items: DraftItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, patch: Partial<DraftItem>) => void;
  title: string;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  return (
    <View style={styles.itemListBlock}>
      <Text style={styles.subsectionTitle}>{title}</Text>
      {items.length === 0 ? <Text style={styles.helperCopy}>{copy.noItemsAssigned}</Text> : null}
      {items.map((item) => {
        const calculated = calculateNutritionItem(item.product, stripDraftItem(item));

        return (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemIdentity}>
              <NutritionIcon iconKey={item.product.icon_key ?? "custom_food"} />
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.product.name}</Text>
                <Text style={styles.itemMeta}>
                  {round(calculated.calculated_carbs, 1)} g carbs / {round(calculated.calculated_sodium_mg, 0)} mg sodium /{" "}
                  {round(calculated.calculated_calories, 0)} kcal
                </Text>
              </View>
            </View>
            <View style={styles.itemControls}>
              <View style={styles.quantityField}>
                <Field
                  inputMode="numeric"
                  label={language === "es" ? "Cant." : "Qty"}
                  onChangeText={(value) => onUpdateItem(item.id, { quantity: Math.max(0, parseOptionalNumber(value) ?? 0) })}
                  value={numberToInput(item.quantity)}
                />
              </View>
              <View style={styles.unitFieldSmall}>
                <Field label={copy.unit} onChangeText={(unit) => onUpdateItem(item.id, { unit })} value={item.unit ?? ""} />
              </View>
              <View style={styles.locationField}>
                <SelectField
                  label={copy.location}
                  onValueChange={(value) => onUpdateItem(item.id, { location: toLocation(value) })}
                  options={getLocationOptions(language)}
                  value={item.location}
                />
              </View>
              {item.location === "bottle" ? (
                <View style={styles.locationField}>
                  <SelectField
                    label={copy.bottle}
                    onValueChange={(value) => onUpdateItem(item.id, { bottle_id: value })}
                    options={bottles.map((bottle) => ({ label: bottle.name, value: bottle.id }))}
                    value={item.bottle_id ?? ""}
                  />
                </View>
              ) : null}
              <View style={styles.locationField}>
                <SelectField
                  label={copy.timing}
                  onValueChange={(value) => onUpdateItem(item.id, { timing_type: toTimingType(value) })}
                  options={getTimingOptions(language)}
                  placeholder={language === "es" ? "Ninguno" : "None"}
                  value={item.timing_type ?? ""}
                />
              </View>
              {item.timing_type === "custom" ? (
                <View style={styles.quantityField}>
                  <Field
                    inputMode="numeric"
                    label={copy.minute}
                    onChangeText={(value) => onUpdateItem(item.id, { timing_minute: parseOptionalNumber(value) ?? null })}
                    value={numberToInput(item.timing_minute)}
                  />
                </View>
              ) : null}
              <Button onPress={() => onRemoveItem(item.id)} variant="danger">
                {copy.remove}
              </Button>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ProductPicker({
  bottles,
  customProductCount,
  onAddItem,
  onCreateOrUpdateProduct,
  onDeleteProduct,
  products
}: {
  bottles: DraftBottle[];
  customProductCount: number;
  onAddItem: (item: DraftItem) => void;
  onCreateOrUpdateProduct: (input: NutritionProductInput, productId?: string) => Promise<NutritionProduct>;
  onDeleteProduct: (productId: string) => Promise<void>;
  products: NutritionProduct[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<NutritionPlanItemLocation>("during");
  const [bottleId, setBottleId] = useState<string>("");
  const [productForm, setProductForm] = useState<ProductFormMode>({ visible: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bottleId && bottles[0]?.id) {
      setBottleId(bottles[0].id);
    }
  }, [bottleId, bottles]);

  const filteredProducts = products.filter((product) => !category || product.category === category);

  function addProduct(product: NutritionProduct) {
    if (location === "bottle" && !bottleId) {
      setError(copy.addTargetBottle);
      return;
    }

    setError(null);
    onAddItem({
      bottle_id: location === "bottle" ? bottleId : null,
      id: createUuid(),
      location,
      product,
      product_id: product.id,
      quantity: product.default_serving_size ?? 1,
      serving_multiplier: 1,
      timing_type: location === "during" || location === "carried" ? "hourly" : null,
      unit: product.default_serving_unit ?? "serving"
    });
  }

  async function submitProduct(input: NutritionProductInput, productId?: string) {
    try {
      await onCreateOrUpdateProduct(input, productId);
      setProductForm({ visible: false });
      setError(null);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  function confirmDeleteProduct(product: NutritionProduct) {
    Alert.alert(copy.deleteCustomProduct, copy.deleteCustomProductBody(product.name), [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.delete,
        style: "destructive",
        onPress: () => {
          onDeleteProduct(product.id).catch((deleteError) => setError(getErrorMessage(deleteError)));
        }
      }
    ]);
  }

  return (
    <Card style={styles.editorCard}>
      <View style={styles.sectionHeaderTight}>
        <Text style={styles.sectionKicker}>{copy.step3}</Text>
        <Text style={styles.sectionTitle}>{copy.addNutritionItems}</Text>
      </View>
      <Inline>
        <View style={styles.splitField}>
          <SelectField
            label={copy.category}
            onValueChange={setCategory}
            options={getCategoryOptions(language)}
            placeholder={copy.allProducts}
            value={category}
          />
        </View>
        <View style={styles.splitField}>
          <SelectField
            label={copy.defaultLocation}
            onValueChange={(value) => setLocation(toLocation(value))}
            options={getLocationOptions(language)}
            value={location}
          />
        </View>
      </Inline>
      {location === "bottle" ? (
        <SelectField
          label={copy.targetBottle}
          onValueChange={setBottleId}
          options={bottles.map((bottle) => ({ label: bottle.name, value: bottle.id }))}
          placeholder={copy.chooseBottle}
          value={bottleId}
        />
      ) : null}
      <Inline>
        <Button onPress={() => setProductForm({ visible: true })} variant="secondary">
          {copy.newCustomProduct}
        </Button>
        <Pill label={`${customProductCount}/${MAX_CUSTOM_NUTRITION_PRODUCTS} ${copy.customProducts}`} tone="blue" />
      </Inline>
      {error ? <Text selectable style={styles.error}>{error}</Text> : null}
      {productForm.visible ? (
        <CustomProductForm
          initialProduct={productForm.product}
          onCancel={() => setProductForm({ visible: false })}
          onSubmit={submitProduct}
        />
      ) : null}
      <View style={styles.productGrid}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            onAdd={() => addProduct(product)}
            onDelete={product.product_scope === "user" ? () => confirmDeleteProduct(product) : undefined}
            onEdit={product.product_scope === "user" ? () => setProductForm({ product, visible: true }) : undefined}
            product={product}
          />
        ))}
      </View>
    </Card>
  );
}

export function ProductCard({
  onAdd,
  onDelete,
  onEdit,
  product
}: {
  onAdd: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  product: NutritionProduct;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  return (
    <View style={styles.productRow}>
      <Pressable accessibilityRole="button" onPress={onAdd} style={styles.productAddZone}>
        <NutritionIcon iconKey={product.icon_key ?? "custom_food"} />
        <View style={styles.productCopy}>
          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.productMeta}>
            {round(product.carbs_per_serving, 1)} g carbs / {round(product.calories_per_serving, 0)} kcal /{" "}
            {round(product.sodium_mg_per_serving, 0)} mg sodium
          </Text>
          <Text style={styles.productMeta}>
            {product.default_serving_size ?? 1} {product.default_serving_unit ?? (language === "es" ? "porcion" : "serving")} / {getCategoryLabel(product.category, language)}
          </Text>
        </View>
      </Pressable>
      <View style={styles.productActions}>
        <Button onPress={onAdd} variant="secondary">
          {copy.add}
        </Button>
        {onEdit ? (
          <Button onPress={onEdit} variant="ghost">
            {copy.edit}
          </Button>
        ) : null}
        {onDelete ? (
          <Button onPress={onDelete} variant="danger">
            {copy.delete}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export function CustomProductForm({
  initialProduct,
  onCancel,
  onSubmit
}: {
  initialProduct?: NutritionProduct;
  onCancel: () => void;
  onSubmit: (input: NutritionProductInput, productId?: string) => Promise<void>;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [category, setCategory] = useState<NutritionProductCategory>(initialProduct?.category ?? "custom");
  const [servingSize, setServingSize] = useState(numberToInput(initialProduct?.default_serving_size ?? 1));
  const [servingUnit, setServingUnit] = useState(initialProduct?.default_serving_unit ?? "serving");
  const [carbs, setCarbs] = useState(numberToInput(initialProduct?.carbs_per_serving ?? 0));
  const [calories, setCalories] = useState(numberToInput(initialProduct?.calories_per_serving ?? 0));
  const [sodium, setSodium] = useState(numberToInput(initialProduct?.sodium_mg_per_serving ?? 0));
  const [liquidVolume, setLiquidVolume] = useState(numberToInput(initialProduct?.liquid_volume_ml_per_serving ?? 0));
  const [weightGrams, setWeightGrams] = useState(numberToInput(initialProduct?.weight_g_per_serving ?? 0));
  const [iconKey, setIconKey] = useState<NutritionIconKey>(initialProduct?.icon_key ?? "custom_food");
  const [notes, setNotes] = useState(initialProduct?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveProduct() {
    if (!name.trim()) {
      setError(copy.customProductNameRequired);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSubmit(
        {
          calories_per_serving: parseOptionalNumber(calories) ?? 0,
          carbs_per_serving: parseOptionalNumber(carbs) ?? 0,
          category,
          default_serving_size: parseOptionalNumber(servingSize) ?? 1,
          default_serving_unit: servingUnit,
          icon_key: iconKey,
          liquid_volume_ml_per_serving: parseOptionalNumber(liquidVolume) ?? 0,
          name,
          notes,
          sodium_mg_per_serving: parseOptionalNumber(sodium) ?? 0,
          weight_g_per_serving: parseOptionalNumber(weightGrams) ?? 0
        },
        initialProduct?.id
      );
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.customProductPanel}>
      <Text style={styles.subsectionTitle}>{initialProduct ? copy.editCustomProduct : copy.newCustomProduct}</Text>
      <Field label={copy.name} onChangeText={setName} value={name} />
      <Inline>
        <View style={styles.splitField}>
          <SelectField
            label={copy.category}
            onValueChange={(value) => setCategory(toCategory(value))}
            options={getCategoryOptions(language)}
            value={category}
          />
        </View>
        <View style={styles.splitField}>
          <SelectField
            label={copy.icon}
            onValueChange={(value) => setIconKey(toIconKey(value))}
            options={iconOptions.map((icon) => ({ label: getIconLabel(icon), value: icon }))}
            value={iconKey}
          />
        </View>
      </Inline>
      <Inline>
        <View style={styles.splitField}>
          <Field inputMode="numeric" label={copy.servingSize} onChangeText={setServingSize} value={servingSize} />
        </View>
        <View style={styles.splitField}>
          <Field label={copy.servingUnit} onChangeText={setServingUnit} value={servingUnit} />
        </View>
      </Inline>
      <Inline>
        <View style={styles.splitField}>
          <Field inputMode="numeric" label={copy.carbsPerServing} onChangeText={setCarbs} value={carbs} />
        </View>
        <View style={styles.splitField}>
          <Field inputMode="numeric" label={copy.calories} onChangeText={setCalories} value={calories} />
        </View>
        <View style={styles.splitField}>
          <Field inputMode="numeric" label={copy.sodiumMg} onChangeText={setSodium} value={sodium} />
        </View>
      </Inline>
      <Inline>
        <View style={styles.splitField}>
          <Field inputMode="numeric" label={copy.liquidVolumeMl} onChangeText={setLiquidVolume} value={liquidVolume} />
        </View>
        <View style={styles.splitField}>
          <Field inputMode="numeric" label={copy.weightGrams} onChangeText={setWeightGrams} value={weightGrams} />
        </View>
      </Inline>
      <Field label={copy.notes} onChangeText={setNotes} value={notes} />
      {error ? <Text selectable style={styles.error}>{error}</Text> : null}
      <Inline>
        <Button loading={saving} onPress={() => void saveProduct()}>
          {initialProduct ? copy.updateProduct : copy.createProduct}
        </Button>
        <Button onPress={onCancel} variant="secondary">
          {copy.cancel}
        </Button>
      </Inline>
    </View>
  );
}

export function NutritionSummaryPanel({
  bottleCalculations,
  draft,
  items,
  totals,
  warnings
}: {
  bottleCalculations: BottleCalculation[];
  draft: DraftPlan;
  items: DraftItem[];
  totals: PlanTotals;
  warnings: NutritionWarning[];
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];

  return (
    <Card style={styles.summaryCard}>
      <View style={styles.sectionHeaderTight}>
        <Text style={styles.sectionKicker}>{copy.step4}</Text>
        <Text style={styles.sectionTitle}>{copy.reviewPlan}</Text>
      </View>
      <View style={styles.summaryMetricGrid}>
        <MiniMetric label={copy.totalCarbs} value={`${round(totals.totalCarbs, 0)} g`} />
        <MiniMetric label={copy.totalFluids} value={`${round(totals.totalFluidsMl, 0)} ml`} />
        <MiniMetric label={copy.totalSodium} value={`${round(totals.totalSodiumMg, 0)} mg`} />
        <MiniMetric label={copy.totalCalories} value={`${round(totals.totalCalories, 0)} kcal`} />
      </View>
      <NutritionProgressBar current={totals.carbsPerHour} label={copy.carbs} target={draft.target_carbs_per_hour ?? 0} unit="g/hr" />
      <NutritionProgressBar
        current={totals.fluidsMlPerHour}
        label={copy.fluids}
        target={draft.target_fluids_ml_per_hour ?? 0}
        unit="ml/hr"
      />
      <NutritionProgressBar
        current={totals.sodiumMgPerHour}
        label={copy.sodium}
        target={draft.target_sodium_mg_per_hour ?? 0}
        unit="mg/hr"
      />
      <NutritionProgressBar
        current={totals.totalCalories}
        label={copy.calories}
        target={draft.estimated_calories_burned ?? 0}
        unit="kcal"
      />
      <View style={styles.warningList}>
        {warnings.map((warning, index) => (
          <NutritionWarningBadge key={`${warning.message}-${index}`} warning={warning} />
        ))}
      </View>
      <NutritionTimeline items={items} />
      <SharePreviewCard bottleCalculations={bottleCalculations} draft={draft} items={items} totals={totals} />
    </Card>
  );
}

export function NutritionProgressBar({
  current,
  label,
  target,
  unit
}: {
  current: number;
  label: string;
  target: number;
  unit: string;
}) {
  const percent = target > 0 ? Math.min(140, current / target * 100) : 0;
  const high = target > 0 && current > target * 1.2;
  const low = target > 0 && current < target * 0.75;

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>
          {round(current, 0)} / {target > 0 ? round(target, 0) : "--"} {unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            high && styles.progressFillHigh,
            low && styles.progressFillLow,
            { width: `${Math.min(100, percent)}%` }
          ]}
        />
      </View>
    </View>
  );
}

export function NutritionWarningBadge({ warning }: { warning: NutritionWarning }) {
  const { language } = useLanguage();
  return (
    <View
      style={[
        styles.warningBadge,
        warning.level === "danger" && styles.warningDanger,
        warning.level === "warning" && styles.warningCaution
      ]}
    >
      <Text style={styles.warningText}>{translateNutritionWarning(warning.message, language)}</Text>
    </View>
  );
}

export function NutritionTimeline({ items }: { items: DraftItem[] }) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const timedItems = [...items].sort((a, b) => getTimingSortValue(a) - getTimingSortValue(b));

  return (
    <View style={styles.timelineBlock}>
      <Text style={styles.subsectionTitle}>{copy.fuelingTimeline}</Text>
      {timedItems.length === 0 ? <Text style={styles.helperCopy}>{copy.addProductsTimeline}</Text> : null}
      {timedItems.map((item) => (
        <View key={item.id} style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineCopy}>
            <Text style={styles.timelineTitle}>{formatTiming(item, language)}</Text>
            <Text style={styles.timelineMeta}>
              {item.product.name} / {item.quantity} {item.unit ?? (language === "es" ? "porcion" : "serving")} / {getLocationLabel(item.location, language)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function SharePreviewCard({
  draft,
  items,
  totals
}: {
  bottleCalculations: BottleCalculation[];
  draft: DraftPlan;
  items: DraftItem[];
  totals: PlanTotals;
}) {
  const { language } = useLanguage();
  const copy = nutritionCopy[language];
  const uniqueItems = Array.from(new Set(items.map((item) => item.product.name))).slice(0, 6);

  return (
    <View style={styles.sharePreview}>
      <View style={styles.shareBrandRow}>
        <View style={styles.shareMark}>
          <Text style={styles.shareMarkText}>A</Text>
        </View>
        <Text style={styles.shareBrand}>{copy.athmiraFuelingPlan}</Text>
      </View>
      <Text style={styles.shareTitle}>{draft.title || copy.nutritionPlan}</Text>
      <Text style={styles.shareMeta}>
        {getActivityLabel(draft.activity_type, language)} / {formatDuration(draft.duration_minutes)} / {getIntensityLabel(draft.intensity, language)}
      </Text>
      <View style={styles.shareMetrics}>
        <MiniMetric label={copy.carbsHr} value={`${round(totals.carbsPerHour, 0)} g`} />
        <MiniMetric label={copy.fluidsHr} value={`${round(totals.fluidsMlPerHour, 0)} ml`} />
        <MiniMetric label={copy.sodiumHr} value={`${round(totals.sodiumMgPerHour, 0)} mg`} />
      </View>
      <View style={styles.shareItems}>
        {uniqueItems.length ? uniqueItems.map((item) => <Pill key={item} label={item} tone="primary" />) : <Pill label={copy.noItemsYet} tone="blue" />}
      </View>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniMetric}>
      <Text style={styles.miniMetricValue}>{value}</Text>
      <Text style={styles.miniMetricLabel}>{label}</Text>
    </View>
  );
}

function Pill({ label, tone = "primary" }: { label: string; tone?: "amber" | "blue" | "primary" }) {
  return (
    <View style={[styles.pill, tone === "amber" && styles.pillAmber, tone === "blue" && styles.pillBlue]}>
      <Text style={[styles.pillText, tone === "amber" && styles.pillTextAmber, tone === "blue" && styles.pillTextBlue]}>
        {label}
      </Text>
    </View>
  );
}

function NutritionIcon({ iconKey }: { iconKey: NutritionIconKey }) {
  return (
    <View style={[styles.nutritionIcon, getIconTone(iconKey)]}>
      <Text style={styles.nutritionIconText}>{getIconGlyph(iconKey)}</Text>
    </View>
  );
}

function calculateDraft(draft: DraftPlan) {
  const calculatedItems: (NutritionCalculatedItem & { product: NutritionProduct })[] = draft.items.map((item) => ({
    ...calculateNutritionItem(item.product, stripDraftItem(item)),
    product: item.product
  }));
  const bottleCalculations = draft.bottles.map((bottle) => calculateBottleTotals(bottle, calculatedItems));
  const totals = calculatePlanTotals({
    bottles: draft.bottles,
    durationMinutes: draft.duration_minutes,
    items: calculatedItems
  });
  const warnings = getNutritionWarnings({
    bottles: bottleCalculations,
    targets: {
      carbsPerHour: draft.target_carbs_per_hour,
      fluidsMlPerHour: draft.target_fluids_ml_per_hour,
      sodiumMgPerHour: draft.target_sodium_mg_per_hour
    },
    totals
  });

  return { bottleCalculations, calculatedItems, totals, warnings };
}

function preparePlanPayload(
  draft: DraftPlan,
  calculations: ReturnType<typeof calculateDraft>
): PreparedPlanPayload {
  const bottleCalculationsById = new Map(calculations.bottleCalculations.map((calculation) => [calculation.bottle.id, calculation]));

  return {
    bottles: draft.bottles.map((bottle, index) => {
      const calculation = bottleCalculationsById.get(bottle.id) ?? calculateBottleTotals(bottle, []);

      return {
        ...bottle,
        display_order: index,
        remaining_water_ml: calculation.remainingWaterMl,
        total_calories: calculation.totalCalories,
        total_carbs: calculation.totalCarbs,
        total_sodium_mg: calculation.totalSodiumMg,
        total_used_volume_ml: calculation.totalUsedVolumeMl
      };
    }),
    items: calculations.calculatedItems.map((item) => ({
      bottle_id: item.bottle_id ?? null,
      calculated_calories: item.calculated_calories,
      calculated_carbs: item.calculated_carbs,
      calculated_sodium_mg: item.calculated_sodium_mg,
      calculated_volume_ml: item.calculated_volume_ml,
      id: item.id,
      location: item.location,
      product_id: item.product_id,
      quantity: item.quantity,
      serving_multiplier: item.serving_multiplier,
      timing_minute: item.timing_minute ?? null,
      timing_type: item.timing_type ?? null,
      unit: item.unit ?? null
    })),
    plan: {
      activity_type: draft.activity_type,
      body_weight_kg: draft.body_weight_kg ?? null,
      description: draft.description?.trim() || null,
      duration_minutes: draft.duration_minutes,
      estimated_calories_burned: draft.estimated_calories_burned ?? null,
      intensity: draft.intensity,
      target_carbs_per_hour: draft.target_carbs_per_hour ?? null,
      target_fluids_ml_per_hour: draft.target_fluids_ml_per_hour ?? null,
      target_sodium_mg_per_hour: draft.target_sodium_mg_per_hour ?? null,
      title: draft.title,
      total_planned_calories: calculations.totals.totalCalories,
      total_planned_carbs: calculations.totals.totalCarbs,
      total_planned_fluids_ml: calculations.totals.totalFluidsMl,
      total_planned_sodium_mg: calculations.totals.totalSodiumMg
    },
    planId: draft.id
  };
}

function createDefaultDraft(profileWeightKg?: number | null, language: "en" | "es" = "en"): DraftPlan {
  const targets = calculateSuggestedNutritionTargets({
    activityType: "cycling",
    bodyWeightKg: profileWeightKg ?? null,
    durationMinutes: 120,
    intensity: "moderate"
  });

  return {
    activity_type: "cycling",
    body_weight_kg: profileWeightKg ?? null,
    bottles: [
      {
        bottle_size_label: "620 ml / 21 oz",
        bottle_size_ml: 620,
        display_order: 0,
        id: createUuid(),
        name: language === "es" ? "Caramanola 1" : "Bottle 1"
      }
    ],
    description: "",
    duration_minutes: 120,
    estimated_calories_burned: targets.caloriesBurned,
    intensity: "moderate",
    items: [],
    target_carbs_per_hour: targets.carbsPerHour,
    target_fluids_ml_per_hour: targets.fluidsMlPerHour,
    target_sodium_mg_per_hour: targets.sodiumMgPerHour,
    title: language === "es" ? "Nutricion para ciclismo de 2 horas" : "Cycling nutrition for 2 hours"
  };
}

function createDraftFromDetail(detail: import("@athmira/types").NutritionPlanDetail): DraftPlan {
  return {
    activity_type: detail.activity_type,
    body_weight_kg: detail.body_weight_kg,
    bottles: detail.bottles.map((bottle) => ({
      bottle_size_label: bottle.bottle_size_label,
      bottle_size_ml: bottle.bottle_size_ml,
      display_order: bottle.display_order,
      id: bottle.id,
      name: bottle.name ?? "Bottle"
    })),
    description: detail.description ?? "",
    duration_minutes: detail.duration_minutes,
    estimated_calories_burned: detail.estimated_calories_burned,
    id: detail.id,
    intensity: detail.intensity,
    items: detail.items
      .filter((item) => item.product)
      .map((item) => ({
        bottle_id: item.bottle_id,
        id: item.id,
        location: item.location,
        product: item.product as NutritionProduct,
        product_id: item.product_id,
        quantity: item.quantity,
        serving_multiplier: item.serving_multiplier,
        timing_minute: item.timing_minute,
        timing_type: item.timing_type,
        unit: item.unit
      })),
    target_carbs_per_hour: detail.target_carbs_per_hour,
    target_fluids_ml_per_hour: detail.target_fluids_ml_per_hour,
    target_sodium_mg_per_hour: detail.target_sodium_mg_per_hour,
    title: detail.title
  };
}

function stripDraftItem(item: DraftItem): NutritionPlanItemInput {
  return {
    bottle_id: item.bottle_id ?? null,
    id: item.id,
    location: item.location,
    product_id: item.product_id,
    quantity: item.quantity,
    serving_multiplier: item.serving_multiplier,
    timing_minute: item.timing_minute ?? null,
    timing_type: item.timing_type ?? null,
    unit: item.unit ?? null
  };
}

function validateDraft(draft: DraftPlan, copy: typeof nutritionCopy.en | typeof nutritionCopy.es) {
  if (!draft.title.trim()) {
    return copy.planTitleRequired;
  }

  if (draft.duration_minutes <= 0) {
    return copy.durationGreaterThanZero;
  }

  const invalidBottle = draft.bottles.find((bottle) => bottle.bottle_size_ml <= 0);

  if (invalidBottle) {
    return copy.bottleSizeGreaterThanZero;
  }

  const invalidItem = draft.items.find((item) => item.quantity <= 0);

  if (invalidItem) {
    return copy.quantityGreaterThanZero;
  }

  const bottleItemWithoutBottle = draft.items.find((item) => item.location === "bottle" && !item.bottle_id);

  if (bottleItemWithoutBottle) {
    return copy.itemsAssignedBottleNeedBottle;
  }

  return null;
}

function createUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getActivityOptions(language: "en" | "es") {
  if (language === "es") {
    return [
      { label: "Ciclismo", value: "cycling" },
      { label: "Running", value: "running" },
      { label: "Triatlon", value: "triathlon" },
      { label: "Gravel", value: "gravel" },
      { label: "Mountain bike", value: "mountain_biking" },
      { label: "Ciclismo indoor", value: "indoor_cycling" },
      { label: "Senderismo", value: "hiking" },
      { label: "Otro", value: "other" }
    ] satisfies { label: string; value: NutritionActivityType }[];
  }

  return activityOptions;
}

function getIntensityOptions(language: "en" | "es") {
  if (language === "es") {
    return [
      { label: "Suave", value: "easy" },
      { label: "Moderada", value: "moderate" },
      { label: "Dura", value: "hard" },
      { label: "Ritmo de carrera", value: "race_effort" }
    ] satisfies { label: string; value: NutritionIntensity }[];
  }

  return intensityOptions;
}

function getCategoryOptions(language: "en" | "es") {
  if (language === "es") {
    return [
      { label: "Ingrediente de botella", value: "bottle_ingredient" },
      { label: "Gel", value: "gel" },
      { label: "Barra", value: "bar" },
      { label: "Comida solida", value: "solid_food" },
      { label: "Bebida", value: "drink" },
      { label: "Polvo", value: "powder" },
      { label: "Fruta", value: "fruit" },
      { label: "Dulce", value: "candy" },
      { label: "Sandwich", value: "sandwich" },
      { label: "Personalizado", value: "custom" }
    ] satisfies { label: string; value: NutritionProductCategory }[];
  }

  return categoryOptions;
}

function getLocationOptions(language: "en" | "es") {
  if (language === "es") {
    return [
      { label: "Dentro de botella", value: "bottle" },
      { label: "Llevar", value: "carried" },
      { label: "Antes", value: "before" },
      { label: "Durante", value: "during" },
      { label: "Despues", value: "after" }
    ] satisfies { label: string; value: NutritionPlanItemLocation }[];
  }

  return locationOptions;
}

function getTimingOptions(language: "en" | "es") {
  if (language === "es") {
    return [
      { label: "Al inicio", value: "start" },
      { label: "Cada 30 min", value: "every_30" },
      { label: "Cada 45 min", value: "every_45" },
      { label: "Cada hora", value: "hourly" },
      { label: "Minuto personalizado", value: "custom" }
    ] satisfies { label: string; value: NutritionTimingType }[];
  }

  return timingOptions;
}

function getActivityLabel(activityType: NutritionActivityType, language: "en" | "es") {
  return getActivityOptions(language).find((option) => option.value === activityType)?.label ?? (language === "es" ? "Otro" : "Other");
}

function getIntensityLabel(intensity: NutritionIntensity, language: "en" | "es") {
  return getIntensityOptions(language).find((option) => option.value === intensity)?.label ?? (language === "es" ? "Moderada" : "Moderate");
}

function getCategoryLabel(category: NutritionProductCategory, language: "en" | "es") {
  return getCategoryOptions(language).find((option) => option.value === category)?.label ?? (language === "es" ? "Personalizado" : "Custom");
}

function getLocationLabel(location: NutritionPlanItemLocation, language: "en" | "es") {
  return getLocationOptions(language).find((option) => option.value === location)?.label ?? (language === "es" ? "Durante" : "During");
}

function formatDuration(minutes: number) {
  if (minutes % 60 === 0) {
    return `${minutes / 60} hr`;
  }

  return `${round(minutes / 60, 1)} hr`;
}

function formatTiming(item: DraftItem, language: "en" | "es") {
  if (item.timing_type === "custom" && item.timing_minute != null) {
    return language === "es" ? `Minuto ${item.timing_minute}` : `Minute ${item.timing_minute}`;
  }

  switch (item.timing_type) {
    case "start":
      return nutritionCopy[language].atStart;
    case "every_30":
      return nutritionCopy[language].every30Long;
    case "every_45":
      return nutritionCopy[language].every45Long;
    case "hourly":
      return nutritionCopy[language].everyHour;
    case "custom":
      return language === "es" ? "Horario personalizado" : "Custom timing";
    default:
      return getLocationLabel(item.location, language);
  }
}

function getTimingSortValue(item: DraftItem) {
  switch (item.timing_type) {
    case "start":
      return 0;
    case "custom":
      return item.timing_minute ?? 9999;
    case "every_30":
      return 30;
    case "every_45":
      return 45;
    case "hourly":
      return 60;
    default:
      return item.location === "before" ? -1 : item.location === "after" ? 9998 : 500;
  }
}

function translateNutritionWarning(message: string, language: "en" | "es") {
  if (language !== "es") {
    return message;
  }

  if (message === "Carbs per hour are well below the target for this session.") {
    return "Los carbohidratos por hora estan bastante por debajo del objetivo para esta sesion.";
  }

  if (message === "Carbs per hour are above target. Make sure this amount is trained gradually.") {
    return "Los carbohidratos por hora estan por encima del objetivo. Entrena esta cantidad gradualmente.";
  }

  if (message === "Hydration is below the current target for the planned duration.") {
    return "La hidratacion esta por debajo del objetivo actual para la duracion planeada.";
  }

  if (message === "Sodium is lower than the target. Adjust for sweat rate, heat, and tolerance.") {
    return "El sodio esta por debajo del objetivo. Ajusta segun sudoracion, calor y tolerancia.";
  }

  if (message === "This is an estimated sports fueling plan for training guidance, not medical advice.") {
    return "Este es un plan estimado de fueling deportivo para guia de entrenamiento, no consejo medico.";
  }

  return message
    .replace(" is overfilled. Reduce ingredients or use a larger bottle.", " esta sobrellenada. Reduce ingredientes o usa una botella mas grande.")
    .replace(" is above 90 g/L. This can increase stomach discomfort risk.", " supera 90 g/L. Esto puede aumentar el riesgo de molestias estomacales.")
    .replace(" has a high carbohydrate concentration. Test it in training first.", " tiene una concentracion alta de carbohidratos. Pruebala primero en entrenamiento.");
}

function getActivityIcon(activityType: NutritionActivityType): NutritionIconKey {
  switch (activityType) {
    case "running":
    case "hiking":
      return "custom_food";
    case "triathlon":
    case "cycling":
    case "gravel":
    case "mountain_biking":
    case "indoor_cycling":
    case "other":
    default:
      return "bottle";
  }
}

function getIconGlyph(iconKey: NutritionIconKey) {
  switch (iconKey) {
    case "bottle":
      return "BT";
    case "gel":
      return "GL";
    case "bar":
      return "BR";
    case "banana":
      return "BN";
    case "candy":
      return "CY";
    case "sandwich":
      return "SW";
    case "powder":
      return "PW";
    case "salt":
      return "Na";
    case "sugar":
      return "CH";
    case "honey":
      return "HN";
    case "water":
      return "H2";
    case "drink":
      return "DR";
    case "rice":
      return "RC";
    case "dates":
      return "DT";
    case "raisins":
      return "RS";
    case "pretzel":
      return "PZ";
    case "custom_food":
    default:
      return "FD";
  }
}

function getIconLabel(iconKey: NutritionIconKey) {
  return `${getIconGlyph(iconKey)} ${iconKey.replace("_", " ")}`;
}

function getIconTone(iconKey: NutritionIconKey) {
  switch (iconKey) {
    case "water":
    case "drink":
    case "bottle":
      return styles.iconBlue;
    case "salt":
    case "pretzel":
      return styles.iconAmber;
    case "gel":
    case "bar":
    case "candy":
    case "sugar":
    case "honey":
    case "powder":
      return styles.iconAccent;
    case "banana":
    case "dates":
    case "raisins":
    case "rice":
    case "sandwich":
    case "custom_food":
    default:
      return styles.iconPrimary;
  }
}

function getProductColor(product: NutritionProduct, fallbackIndex = 0) {
  const palette = ["#a7f23a", "#51d9df", "#f5a623", "#2f6fdf", "#f26f5e", "#8aa10f", "#00a48f", "#efc84a"];

  switch (product.icon_key) {
    case "honey":
      return "#f5a623";
    case "powder":
      return "#2f6fdf";
    case "sugar":
      return "#a7f23a";
    case "salt":
      return "#f26f5e";
    case "water":
    case "drink":
    case "bottle":
      return "#51d9df";
    case "gel":
      return "#00a48f";
    case "bar":
    case "candy":
      return "#8aa10f";
    case "banana":
    case "dates":
    case "raisins":
      return "#efc84a";
    case "sandwich":
      return "#c97943";
    default:
      return palette[fallbackIndex % palette.length];
  }
}

function toActivityType(value: string): NutritionActivityType {
  return activityOptions.some((option) => option.value === value) ? (value as NutritionActivityType) : "cycling";
}

function toIntensity(value: string): NutritionIntensity {
  return intensityOptions.some((option) => option.value === value) ? (value as NutritionIntensity) : "moderate";
}

function toCategory(value: string): NutritionProductCategory {
  return categoryOptions.some((option) => option.value === value) ? (value as NutritionProductCategory) : "custom";
}

function toLocation(value: string): NutritionPlanItemLocation {
  return locationOptions.some((option) => option.value === value) ? (value as NutritionPlanItemLocation) : "during";
}

function toTimingType(value: string): NutritionTimingType | null {
  return timingOptions.some((option) => option.value === value) ? (value as NutritionTimingType) : null;
}

function toIconKey(value: string): NutritionIconKey {
  return iconOptions.includes(value as NutritionIconKey) ? (value as NutritionIconKey) : "custom_food";
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl
  },
  hero: {
    alignItems: "stretch",
    backgroundColor: colors.graphite,
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing.xl,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: spacing.xxl,
    ...shadows.medium
  },
  heroCompact: {
    flexDirection: "column"
  },
  heroCopy: {
    flex: 1,
    gap: spacing.md
  },
  heroTitle: {
    color: colors.white,
    maxWidth: 720
  },
  heroBody: {
    color: "#d8e6e4",
    maxWidth: 760
  },
  heroStats: {
    flexBasis: 260,
    gap: spacing.md
  },
  eyebrow: {
    color: colors.accent,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  disclaimer: {
    color: "#b9c9ca",
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 19,
    maxWidth: 760
  },
  metricPill: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg
  },
  metricPillValue: {
    color: colors.white,
    fontFamily,
    fontSize: 26,
    fontVariant: ["tabular-nums"],
    fontWeight: typography.weights.black
  },
  metricPillLabel: {
    color: "#bdd0d0",
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  pageGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg
  },
  pageGridCompact: {
    flexDirection: "column"
  },
  planRail: {
    flexBasis: 360,
    flexGrow: 0.45,
    gap: spacing.lg,
    width: "100%"
  },
  editorColumn: {
    flex: 1.4,
    width: "100%"
  },
  editorColumnFull: {
    flex: 1,
    width: "100%"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  sectionHeaderTight: {
    gap: spacing.xs
  },
  sectionKicker: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 28
  },
  planGrid: {
    gap: spacing.md
  },
  loadingCard: {
    alignItems: "center",
    gap: spacing.md
  },
  emptyCard: {
    gap: spacing.lg
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black
  },
  planCard: {
    gap: spacing.lg
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  planCardCopy: {
    flex: 1,
    gap: spacing.xs
  },
  planTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 19,
    fontWeight: typography.weights.black,
    lineHeight: 24
  },
  planMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  compactMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  miniMetric: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flexBasis: 112,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  miniMetricValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: typography.weights.black
  },
  miniMetricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    lineHeight: 14,
    textTransform: "uppercase"
  },
  cardActions: {
    justifyContent: "flex-start"
  },
  startCard: {
    gap: spacing.lg,
    minHeight: 360
  },
  startIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  startTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.black,
    lineHeight: 34
  },
  editorStack: {
    gap: spacing.lg
  },
  editorHeader: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
    ...shadows.soft
  },
  editorTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 30,
    fontWeight: typography.weights.black,
    lineHeight: 36
  },
  planControlBar: {
    gap: spacing.md,
    padding: spacing.lg
  },
  planControlHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  planControlTitleBlock: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 240
  },
  planControlTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.black,
    lineHeight: 25
  },
  planControlMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  planControlSnapshot: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  collapseText: {
    color: colors.primary,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  planControlBody: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    paddingTop: spacing.md
  },
  planControlBodyCompact: {
    flexDirection: "column"
  },
  planControlForm: {
    flex: 1,
    gap: spacing.md,
    minWidth: 280
  },
  planControlTargets: {
    flex: 1,
    gap: spacing.md,
    minWidth: 300
  },
  totalStrip: {
    gap: spacing.md,
    padding: spacing.md
  },
  totalStripHeaderCompact: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  totalStripLayout: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl
  },
  totalStripLeft: {
    flexBasis: 320,
    gap: spacing.md
  },
  totalStripRight: {
    flex: 1,
    gap: spacing.md,
    minWidth: 320
  },
  totalStripHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  totalStripTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 28
  },
  totalMetricStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  totalMetricCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 220,
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  totalMetricCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  totalMetricLabel: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  totalMetricTotal: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontVariant: ["tabular-nums"],
    fontWeight: typography.weights.black,
    lineHeight: 27
  },
  totalMetricTarget: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: typography.weights.black,
    lineHeight: 16
  },
  totalStripMetrics: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    minWidth: 300
  },
  totalStripBars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  ringGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  targetRingBlock: {
    alignItems: "center",
    gap: spacing.xs,
    width: 54
  },
  targetRing: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.round,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  targetRingInner: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.round,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  targetRingValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: typography.weights.black
  },
  targetRingLabel: {
    color: colors.ink,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    textAlign: "center"
  },
  targetRingMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    fontWeight: typography.weights.bold,
    textAlign: "center"
  },
  warningRail: {
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  fuelingCanvas: {
    gap: spacing.lg,
    overflow: "hidden",
    padding: spacing.lg
  },
  canvasToolbar: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  canvasTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 26,
    fontWeight: typography.weights.black,
    lineHeight: 32
  },
  canvasSubtitle: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    lineHeight: 20
  },
  canvasActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  bottleSizeRail: {
    gap: spacing.sm,
    paddingRight: spacing.sm
  },
  fuelingScroller: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
    paddingRight: spacing.lg
  },
  fuelCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.lg,
    minHeight: 660,
    padding: spacing.lg,
    width: 440,
    ...shadows.soft
  },
  fuelCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary
  },
  carriedFuelCard: {
    backgroundColor: "#fffdf6",
    borderColor: "#f3d596"
  },
  readOnlyFuelCard: {
    minHeight: 560
  },
  fuelCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  fuelTitleBlock: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  fuelCardKicker: {
    color: colors.primary,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  fuelCardTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.black,
    lineHeight: 34
  },
  fuelCardMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    lineHeight: 18
  },
  bottleHeroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center"
  },
  bottleSideStats: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 130
  },
  compactEditRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  addBottleTile: {
    alignItems: "center",
    backgroundColor: colors.primaryMist,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing.md,
    justifyContent: "center",
    minHeight: 660,
    padding: spacing.xl,
    width: 220
  },
  addBottleTileMark: {
    color: colors.primary,
    fontFamily,
    fontSize: 44,
    fontWeight: typography.weights.black,
    lineHeight: 48
  },
  addBottleTileText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.black,
    textAlign: "center"
  },
  nutrientBars: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.md
  },
  compactBarRow: {
    gap: spacing.xs
  },
  compactBarLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  compactBarLabel: {
    color: colors.ink,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  compactBarValue: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black
  },
  compactBarTrack: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.round,
    height: 8,
    overflow: "hidden"
  },
  compactBarFill: {
    borderRadius: radii.round,
    height: "100%"
  },
  compositionList: {
    gap: spacing.sm
  },
  compositionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  compositionRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  ingredientDot: {
    borderRadius: radii.round,
    height: 18,
    width: 18
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(7,18,28,0.46)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  addModal: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.lg,
    maxWidth: 560,
    padding: spacing.xl,
    width: "100%",
    ...shadows.medium
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  modalTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 24,
    fontWeight: typography.weights.black,
    lineHeight: 30
  },
  modalMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  modalForm: {
    gap: spacing.md
  },
  selectedProductPreview: {
    alignItems: "center",
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  builderGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg
  },
  builderGridCompact: {
    flexDirection: "column"
  },
  leftBuilderColumn: {
    flex: 1,
    flexBasis: 390,
    gap: spacing.lg,
    width: "100%"
  },
  centerBuilderColumn: {
    flex: 1.25,
    flexBasis: 460,
    gap: spacing.lg,
    width: "100%"
  },
  rightBuilderColumn: {
    flex: 0.95,
    flexBasis: 360,
    width: "100%"
  },
  workspaceLayout: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg
  },
  workspaceLayoutCompact: {
    gap: spacing.lg
  },
  workspaceRail: {
    flexBasis: 330,
    flexGrow: 0,
    gap: spacing.lg,
    width: "100%"
  },
  strategyMain: {
    flex: 1,
    minWidth: 0,
    width: "100%"
  },
  strategyFocus: {
    flexBasis: 390,
    flexGrow: 0,
    width: "100%"
  },
  reviewFooter: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  editorCard: {
    gap: spacing.lg
  },
  strategyBoardCard: {
    gap: spacing.lg,
    minWidth: 0
  },
  strategyBoardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    justifyContent: "space-between"
  },
  strategyBoardCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 260
  },
  addBottleControls: {
    flexBasis: 360,
    gap: spacing.md
  },
  customBottleMiniField: {
    flexBasis: 150,
    flexGrow: 1
  },
  strategyScroller: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingRight: spacing.md
  },
  strategyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 520,
    padding: spacing.lg,
    width: 360
  },
  strategyCardActive: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.primary,
    ...shadows.soft
  },
  carriedStrategyCard: {
    backgroundColor: "#fffdf6",
    borderColor: "#f3d596"
  },
  strategyCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  strategyCardTitleBlock: {
    flex: 1,
    gap: spacing.xs
  },
  strategyCardKicker: {
    color: colors.primary,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  strategyCardTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 21,
    fontWeight: typography.weights.black,
    lineHeight: 26
  },
  strategyCardMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    lineHeight: 17
  },
  strategyFieldsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  strategyNameField: {
    flex: 1.2
  },
  strategySizeField: {
    flex: 0.8
  },
  addItemPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    gap: spacing.md,
    padding: spacing.md
  },
  strategyQuantityField: {
    flexBasis: 116,
    flexGrow: 1
  },
  strategyCardFooter: {
    marginTop: "auto"
  },
  focusCard: {
    gap: spacing.lg
  },
  focusMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  warningListCompact: {
    gap: spacing.sm
  },
  simpleItemList: {
    gap: spacing.sm
  },
  simpleItemRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  simpleItemCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  simpleItemTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  simpleItemMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    lineHeight: 15
  },
  removeItemButton: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.round,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  removeItemButtonText: {
    color: colors.danger,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black,
    lineHeight: 16
  },
  summaryCard: {
    gap: spacing.lg
  },
  splitField: {
    flexBasis: 170,
    flexGrow: 1
  },
  notesField: {
    minHeight: 92,
    textAlignVertical: "top"
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  helperCopy: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 19
  },
  bottleSizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  sizeChip: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.border,
    borderRadius: radii.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  sizeChipText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  emptyInline: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  bottlePanel: {
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  bottlePanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  bottleNameFields: {
    flexBasis: 180,
    flexGrow: 1
  },
  bottleSizeField: {
    flexBasis: 120
  },
  bottleVisualRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  bottleFacts: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    minWidth: 240
  },
  virtualBottleBlock: {
    alignItems: "center",
    flexBasis: 170,
    gap: spacing.sm
  },
  virtualBottleBlockLarge: {
    alignSelf: "center",
    flexBasis: "auto",
    width: "100%"
  },
  bottleCap: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.sm,
    height: 14,
    width: 42
  },
  bottleCapLarge: {
    height: 18,
    width: 56
  },
  bottleCapDanger: {
    backgroundColor: colors.danger
  },
  virtualBottle: {
    backgroundColor: "#edf6f7",
    borderColor: colors.primaryDark,
    borderRadius: 28,
    borderWidth: 3,
    height: 220,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
    width: 94
  },
  virtualBottleLarge: {
    borderRadius: 36,
    height: 300,
    width: 128
  },
  virtualBottleDanger: {
    borderColor: colors.danger
  },
  waterZone: {
    backgroundColor: "rgba(81,217,223,0.22)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0
  },
  bottleFill: {
    backgroundColor: colors.accent,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0
  },
  bottleLayer: {
    left: 0,
    opacity: 0.92,
    position: "absolute",
    right: 0
  },
  bottleFillTransparent: {
    opacity: 0
  },
  bottleFillDanger: {
    backgroundColor: colors.coral
  },
  bottleShine: {
    backgroundColor: "rgba(255,255,255,0.46)",
    borderRadius: radii.round,
    bottom: 28,
    position: "absolute",
    right: 17,
    top: 26,
    width: 10
  },
  bottleVolume: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  bottleBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
    maxWidth: "100%"
  },
  bottleStatBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.round,
    maxWidth: 150,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  bottleStatBadgeText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    lineHeight: 14,
    textAlign: "center"
  },
  itemListBlock: {
    gap: spacing.md
  },
  subsectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.black
  },
  itemRow: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  itemIdentity: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs
  },
  itemTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black
  },
  itemMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold
  },
  itemControls: {
    alignItems: "flex-end",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  quantityField: {
    flexBasis: 90,
    flexGrow: 0
  },
  unitFieldSmall: {
    flexBasis: 110,
    flexGrow: 0
  },
  locationField: {
    flexBasis: 140,
    flexGrow: 1
  },
  productGrid: {
    gap: spacing.sm
  },
  productRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  productAddZone: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 240
  },
  productCopy: {
    flex: 1,
    gap: spacing.xs
  },
  productTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  productMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.medium
  },
  productActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  customProductPanel: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  customProductStrip: {
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  customProductChip: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  customProductChipText: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  customProductAction: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.round,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  customProductActionText: {
    color: colors.primary,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black
  },
  customProductActionDanger: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  customProductActionDangerText: {
    color: colors.danger,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black
  },
  summaryMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  progressBlock: {
    gap: spacing.sm
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressLabel: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  progressValue: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: typography.weights.black
  },
  progressTrack: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.round,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    height: "100%"
  },
  progressFillHigh: {
    backgroundColor: colors.amber
  },
  progressFillLow: {
    backgroundColor: colors.coral
  },
  warningList: {
    gap: spacing.sm
  },
  warningBadge: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  warningCaution: {
    backgroundColor: colors.amberSoft,
    borderColor: "#f3cc7a"
  },
  warningDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#f2b2aa"
  },
  warningText: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    lineHeight: 18
  },
  timelineBlock: {
    gap: spacing.md
  },
  timelineRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  timelineDot: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    height: 12,
    marginTop: 4,
    width: 12
  },
  timelineCopy: {
    flex: 1,
    gap: spacing.xs
  },
  timelineTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  timelineMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.medium
  },
  sharePreview: {
    backgroundColor: colors.graphite,
    borderRadius: radii.lg,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg
  },
  shareBrandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  shareMark: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  shareMarkText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  shareBrand: {
    color: colors.white,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  shareTitle: {
    color: colors.white,
    fontFamily,
    fontSize: 24,
    fontWeight: typography.weights.black,
    lineHeight: 30
  },
  shareMeta: {
    color: "#c8d7d8",
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  shareMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  shareItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  pill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  pillAmber: {
    backgroundColor: colors.amberSoft
  },
  pillBlue: {
    backgroundColor: "#e4edff"
  },
  pillText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  pillTextAmber: {
    color: "#8a5200"
  },
  pillTextBlue: {
    color: colors.blue
  },
  nutritionIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  nutritionIconText: {
    color: colors.white,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  iconPrimary: {
    backgroundColor: colors.primary
  },
  iconAccent: {
    backgroundColor: "#6f8f11"
  },
  iconAmber: {
    backgroundColor: colors.amber
  },
  iconBlue: {
    backgroundColor: colors.blue
  },
  error: {
    color: colors.danger,
    fontFamily,
    fontWeight: typography.weights.black
  },
  message: {
    color: colors.primary,
    fontFamily,
    fontWeight: typography.weights.black
  }
});
