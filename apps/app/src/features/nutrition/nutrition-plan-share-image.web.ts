import type {
  NutritionPlanShareImageBottle,
  NutritionPlanShareImageIngredient,
  NutritionPlanShareImagePayload,
  NutritionPlanShareImageResult
} from "./nutrition-plan-share-image.types";
import { Asset } from "expo-asset";

const splashIconSource = require("../../../assets/splash-icon.png");

const SIZE = 1080;
const PADDING = 38;
const INNER_PADDING = 34;
const COLORS = {
  accent: "#b7e64a",
  aqua: "#51d9df",
  background: "#f4f8fa",
  border: "#d8e5e6",
  graphite: "#101820",
  ink: "#0d1b22",
  inkMuted: "#53666f",
  primary: "#00857d",
  primaryDark: "#063f3d",
  primaryMist: "#effbfa",
  surface: "#ffffff",
  surfaceMuted: "#eef6f6"
};
const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

export async function generateNutritionPlanShareImage(payload: NutritionPlanShareImagePayload): Promise<NutritionPlanShareImageResult> {
  const canvas = document.createElement("canvas");
  canvas.height = SIZE;
  canvas.width = SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    return { message: payload.copy.unsupported, status: "unsupported" };
  }

  const splashIcon = await loadSplashIcon();
  drawShareImage(context, payload, splashIcon);

  const fileName = `${sanitizeFileName(payload.fileName)}.png`;

  return {
    dataUrl: canvas.toDataURL("image/png"),
    fileName,
    message: payload.copy.shared,
    status: "generated"
  };
}

export function downloadNutritionPlanShareImage(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function drawShareImage(context: CanvasRenderingContext2D, payload: NutritionPlanShareImagePayload, splashIcon: HTMLImageElement | null) {
  const contentX = PADDING + INNER_PADDING;
  const contentWidth = SIZE - (PADDING + INNER_PADDING) * 2;

  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, SIZE, SIZE);

  drawRoundedRect(context, PADDING, PADDING, SIZE - PADDING * 2, SIZE - PADDING * 2, 34, COLORS.surface);
  context.strokeStyle = COLORS.border;
  context.lineWidth = 2;
  strokeRoundedRect(context, PADDING, PADDING, SIZE - PADDING * 2, SIZE - PADDING * 2, 34);

  drawBrand(context, payload, splashIcon);
  drawText(context, payload.title, contentX, 108, 44, 52, 610, COLORS.ink, 900, 2);
  drawText(context, payload.meta, contentX, 218, 23, 30, 780, COLORS.inkMuted, 800, 1);

  drawSectionLabel(context, payload.copy.goals, contentX, 286);
  drawMetrics(context, payload.metrics, contentX, 318, contentWidth);

  drawSectionLabel(context, payload.copy.strategy, contentX, 466);
  drawStrategy(context, payload, contentX, 498, contentWidth);
}

function drawBrand(context: CanvasRenderingContext2D, payload: NutritionPlanShareImagePayload, splashIcon: HTMLImageElement | null) {
  const brandWidth = 282;
  const x = SIZE - PADDING - INNER_PADDING - brandWidth;
  const y = 104;
  drawSplashIcon(context, splashIcon, x, y, 58, 16);
  drawText(context, payload.copy.domain, x + 75, y + 12, 30, 36, 300, COLORS.ink, 900, 1);
}

function drawSplashIcon(context: CanvasRenderingContext2D, image: HTMLImageElement | null, x: number, y: number, size: number, radius: number) {
  context.save();
  roundedRectPath(context, x, y, size, size, radius);
  context.clip();

  if (image) {
    context.drawImage(image, x, y, size, size);
  } else {
    drawRoundedRect(context, x, y, size, size, radius, COLORS.graphite);
  }

  context.restore();
  context.strokeStyle = COLORS.border;
  context.lineWidth = 1.5;
  strokeRoundedRect(context, x, y, size, size, radius);
}

function drawMetrics(context: CanvasRenderingContext2D, metrics: NutritionPlanShareImagePayload["metrics"], x: number, y: number, totalWidth: number) {
  const gap = 15;
  const width = (totalWidth - gap * 3) / 4;
  metrics.slice(0, 4).forEach((metric, index) => {
    const cardX = x + index * (width + gap);
    drawRoundedRect(context, cardX, y, width, 108, 18, COLORS.surfaceMuted);
    context.strokeStyle = COLORS.border;
    context.lineWidth = 2;
    strokeRoundedRect(context, cardX, y, width, 108, 18);
    drawText(context, metric.value, cardX + 20, y + 20, 34, 39, width - 40, COLORS.ink, 900, 1);
    drawText(context, metric.label, cardX + 20, y + 62, 17, 22, width - 40, COLORS.inkMuted, 900, 1);
    if (metric.detail) {
      drawText(context, metric.detail, cardX + 20, y + 82, 15, 19, width - 40, COLORS.primaryDark, 800, 1);
    }
  });
}

function drawStrategy(context: CanvasRenderingContext2D, payload: NutritionPlanShareImagePayload, x: number, y: number, totalWidth: number) {
  if (payload.bottles.length >= 3) {
    drawCompactStrategyGrid(context, payload, x, y, totalWidth);
    return;
  }

  const gap = 18;
  const carriedWidth = 320;
  const bottleWidth = (totalWidth - carriedWidth - gap * 2) / 2;
  const bottleHeight = 470;
  const visibleBottles = payload.bottles.slice(0, 2);

  visibleBottles.forEach((bottle, index) => {
    drawBottleCard(context, bottle, x + index * (bottleWidth + gap), y, bottleWidth, bottleHeight, payload.copy.empty, payload.copy.more);
  });

  if (payload.bottles.length > visibleBottles.length) {
    drawText(context, payload.copy.more(payload.bottles.length - visibleBottles.length), x, y + bottleHeight + 16, 19, 25, 590, COLORS.primaryDark, 900, 1);
  }

  drawCarriedCard(context, payload.carriedItems, x + (bottleWidth + gap) * 2, y, carriedWidth, bottleHeight, payload.copy.carried, payload.copy.empty, payload.copy.more);
}

function drawCompactStrategyGrid(context: CanvasRenderingContext2D, payload: NutritionPlanShareImagePayload, x: number, y: number, totalWidth: number) {
  const gap = 14;
  const cardWidth = (totalWidth - gap * 2) / 3;
  const cardHeight = 220;
  const cards: { bottle?: NutritionPlanShareImageBottle; carried?: boolean }[] = payload.bottles.map((bottle) => ({ bottle }));

  if (payload.carriedItems.length > 0) {
    cards.push({ carried: true });
  }

  const visibleCards = cards.slice(0, 6);
  visibleCards.forEach((card, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const cardX = x + column * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);

    if (card.bottle) {
      drawCompactBottleCard(context, card.bottle, cardX, cardY, cardWidth, cardHeight, payload.copy.empty, payload.copy.more);
      return;
    }

    drawCompactCarriedCard(context, payload.carriedItems, cardX, cardY, cardWidth, cardHeight, payload.copy.carried, payload.copy.empty, payload.copy.more);
  });

  if (cards.length > visibleCards.length) {
    drawText(context, payload.copy.more(cards.length - visibleCards.length), x, y + (cardHeight + gap) * 2 + 4, 17, 22, totalWidth, COLORS.primaryDark, 900, 1);
  }
}

function drawBottleCard(
  context: CanvasRenderingContext2D,
  bottle: NutritionPlanShareImageBottle,
  x: number,
  y: number,
  width: number,
  height: number,
  emptyText: string,
  moreLabel: (count: number) => string
) {
  drawRoundedRect(context, x, y, width, height, 22, COLORS.surface);
  context.strokeStyle = COLORS.border;
  context.lineWidth = 2;
  strokeRoundedRect(context, x, y, width, height, 22);
  drawText(context, bottle.name, x + 22, y + 24, 27, 33, width - 44, COLORS.ink, 900, 1);
  drawText(context, bottle.meta, x + 22, y + 62, 16, 21, width - 44, COLORS.inkMuted, 800, 2);
  drawIngredientList(context, bottle.ingredients, x + 22, y + 134, width - 44, 296, emptyText, moreLabel, 4);
}

function drawCarriedCard(
  context: CanvasRenderingContext2D,
  items: NutritionPlanShareImageIngredient[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  emptyText: string,
  moreLabel: (count: number) => string
) {
  drawRoundedRect(context, x, y, width, height, 22, "#fffdf6");
  context.strokeStyle = "#f3d596";
  context.lineWidth = 2;
  strokeRoundedRect(context, x, y, width, height, 22);
  drawText(context, title, x + 22, y + 24, 30, 36, width - 44, COLORS.ink, 900, 2);
  drawIngredientList(context, items, x + 22, y + 122, width - 44, 306, emptyText, moreLabel, 5);
}

function drawCompactBottleCard(
  context: CanvasRenderingContext2D,
  bottle: NutritionPlanShareImageBottle,
  x: number,
  y: number,
  width: number,
  height: number,
  emptyText: string,
  moreLabel: (count: number) => string
) {
  drawRoundedRect(context, x, y, width, height, 18, COLORS.surface);
  context.strokeStyle = COLORS.border;
  context.lineWidth = 2;
  strokeRoundedRect(context, x, y, width, height, 18);
  drawText(context, bottle.name, x + 18, y + 17, 22, 27, width - 36, COLORS.ink, 900, 1);
  drawText(context, bottle.meta, x + 18, y + 48, 13, 17, width - 36, COLORS.inkMuted, 800, 2);
  drawIngredientList(context, bottle.ingredients, x + 18, y + 88, width - 36, 118, emptyText, moreLabel, 3, "compact");
}

function drawCompactCarriedCard(
  context: CanvasRenderingContext2D,
  items: NutritionPlanShareImageIngredient[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  emptyText: string,
  moreLabel: (count: number) => string
) {
  drawRoundedRect(context, x, y, width, height, 18, "#fffdf6");
  context.strokeStyle = "#f3d596";
  context.lineWidth = 2;
  strokeRoundedRect(context, x, y, width, height, 18);
  drawText(context, title, x + 18, y + 17, 22, 27, width - 36, COLORS.ink, 900, 2);
  drawIngredientList(context, items, x + 18, y + 82, width - 36, 124, emptyText, moreLabel, 3, "compact");
}

function drawIngredientList(
  context: CanvasRenderingContext2D,
  items: NutritionPlanShareImageIngredient[],
  x: number,
  y: number,
  width: number,
  maxHeight: number,
  emptyText: string,
  moreLabel: (count: number) => string,
  maxItems: number,
  density: "compact" | "regular" = "regular"
) {
  if (!items.length) {
    drawText(context, emptyText, x, y, 18, 24, width, COLORS.inkMuted, 800, 2);
    return;
  }

  const visibleItems = items.slice(0, maxItems);
  const rowGap = density === "compact" ? 39 : 70;
  const dotRadius = density === "compact" ? 7.5 : 10;
  const dotY = density === "compact" ? 10 : 13;
  const titleSize = density === "compact" ? 14 : 18;
  const titleLineHeight = density === "compact" ? 18 : 23;
  const metaSize = density === "compact" ? 10.5 : 14;
  const metaLineHeight = density === "compact" ? 13 : 18;
  const metaOffset = density === "compact" ? 18 : 24;

  visibleItems.forEach((item, index) => {
    const rowY = y + index * rowGap;
    if (rowY > y + maxHeight) return;
    context.fillStyle = item.color;
    context.beginPath();
    context.arc(x + 12, rowY + dotY, dotRadius, 0, Math.PI * 2);
    context.fill();
    drawText(context, item.name, x + 34, rowY, titleSize, titleLineHeight, width - 34, COLORS.ink, 900, 1);
    drawText(context, item.meta, x + 34, rowY + metaOffset, metaSize, metaLineHeight, width - 34, COLORS.inkMuted, 800, density === "compact" ? 1 : 2);
  });

  if (items.length > visibleItems.length) {
    drawText(context, moreLabel(items.length - visibleItems.length), x + 34, y + visibleItems.length * rowGap, density === "compact" ? 12 : 16, density === "compact" ? 16 : 21, width - 34, COLORS.primaryDark, 900, 1);
  }
}

function drawSectionLabel(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
  drawText(context, text, x, y, 18, 22, 600, COLORS.primary, 900, 1);
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  maxWidth: number,
  color: string,
  weight = 700,
  maxLines = 1,
  align: CanvasTextAlign = "left"
) {
  context.fillStyle = color;
  context.font = `${weight} ${fontSize}px ${FONT}`;
  context.textAlign = align;
  context.textBaseline = "top";

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);

  lines.slice(0, maxLines).forEach((line, index) => {
    const clippedLine = index === maxLines - 1 && lines.length > maxLines ? clipText(context, `${line}...`, maxWidth) : line;
    context.fillText(clippedLine, x, y + index * lineHeight);
  });
}

function clipText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && context.measureText(clipped).width > maxWidth) {
    clipped = `${clipped.slice(0, -4)}...`;
  }
  return clipped;
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fillStyle: string) {
  context.fillStyle = fillStyle;
  roundedRectPath(context, x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  roundedRectPath(context, x, y, width, height, radius);
  context.stroke();
}

function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "athmira-nutrition-plan";
}

async function loadSplashIcon() {
  const asset = Asset.fromModule(splashIconSource);
  if (!asset.localUri && !asset.uri) {
    await asset.downloadAsync();
  }

  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    return null;
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = uri;
  });
}
