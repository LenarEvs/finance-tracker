import { Icon, addCollection } from "@iconify/react";
import notoData from "@iconify-json/noto/icons.json";
import type { TransactionType } from "../../types";

// Register only the icons we use to avoid bundling the full 3800-icon set
const USED_ICONS = [
  // income
  "money-bag", "laptop", "chart-increasing", "dollar-banknote", "handshake",
  "coin", "credit-card", "trophy", "wrapped-gift", "seedling",
  // expense
  "shopping-cart", "fork-and-knife", "automobile", "house", "medical-symbol",
  "graduation-cap", "airplane", "video-game", "t-shirt", "mobile-phone",
  "electric-plug", "musical-notes", "clapper-board", "books", "dog-face",
  "hot-beverage", "baby", "pill", "wrench", "label", "pizza", "taxi",
  "bus", "fuel-pump", "shopping-bags", "nail-polish", "bicycle", "brain",
  "stethoscope", "toolbox", "sports-medal",
];

const notoIcons = notoData.icons as Record<string, { body: string }>;
addCollection({
  prefix: "noto",
  width: notoData.width,
  height: notoData.height,
  icons: Object.fromEntries(
    USED_ICONS
      .filter((name) => notoIcons[name])
      .map((name) => [name, notoIcons[name]])
  ),
});

export interface NotoIcon {
  name: string;
  label: string;
}

export const INCOME_ICONS: NotoIcon[] = [
  { name: "money-bag",        label: "Зарплата" },
  { name: "laptop",           label: "Фриланс" },
  { name: "chart-increasing", label: "Инвестиции" },
  { name: "dollar-banknote",  label: "Наличные" },
  { name: "credit-card",      label: "Перевод" },
  { name: "coin",             label: "Монета" },
  { name: "handshake",        label: "Партнёрство" },
  { name: "wrapped-gift",     label: "Подарки" },
  { name: "trophy",           label: "Награда" },
  { name: "seedling",         label: "Рост" },
];

export const EXPENSE_ICONS: NotoIcon[] = [
  { name: "shopping-cart",  label: "Покупки" },
  { name: "fork-and-knife", label: "Еда" },
  { name: "hot-beverage",   label: "Кафе" },
  { name: "pizza",          label: "Доставка" },
  { name: "automobile",     label: "Авто" },
  { name: "taxi",           label: "Такси" },
  { name: "bus",            label: "Транспорт" },
  { name: "fuel-pump",      label: "Бензин" },
  { name: "bicycle",        label: "Велосипед" },
  { name: "house",          label: "ЖКХ" },
  { name: "electric-plug",  label: "Коммуналка" },
  { name: "toolbox",        label: "Ремонт" },
  { name: "wrench",         label: "Инструменты" },
  { name: "medical-symbol", label: "Здоровье" },
  { name: "pill",           label: "Аптека" },
  { name: "stethoscope",    label: "Врач" },
  { name: "t-shirt",        label: "Одежда" },
  { name: "shopping-bags",  label: "Шопинг" },
  { name: "nail-polish",    label: "Красота" },
  { name: "graduation-cap", label: "Образование" },
  { name: "books",          label: "Книги" },
  { name: "brain",          label: "Развитие" },
  { name: "airplane",       label: "Путешествия" },
  { name: "mobile-phone",   label: "Связь" },
  { name: "video-game",     label: "Игры" },
  { name: "musical-notes",  label: "Музыка" },
  { name: "clapper-board",  label: "Кино" },
  { name: "dog-face",       label: "Питомцы" },
  { name: "baby",           label: "Дети" },
  { name: "sports-medal",   label: "Спорт" },
  { name: "label",          label: "Прочее" },
];

export function getIconsForType(type: TransactionType): NotoIcon[] {
  return type === "income" ? INCOME_ICONS : EXPENSE_ICONS;
}

export function defaultIconForType(type: TransactionType): string {
  return type === "income" ? "money-bag" : "label";
}

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ name, size = 20, className }: Props) {
  // noto icon IDs (new format)
  if (name && !name.includes(":") && USED_ICONS.includes(name)) {
    return <Icon icon={`noto:${name}`} width={size} height={size} className={className} />;
  }
  // fully qualified iconify ID (e.g. "noto:shopping-cart")
  if (name && name.includes(":")) {
    return <Icon icon={name} width={size} height={size} className={className} />;
  }
  // legacy emoji / phosphor name — render as text fallback
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{name}</span>;
}
