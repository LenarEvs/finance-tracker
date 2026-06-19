interface CurrencyMeta {
  symbol: string;
  locale: string;
  name: string;
}

const CURRENCIES: Record<string, CurrencyMeta> = {
  RUB: { symbol: "₽", locale: "ru-RU", name: "Российский рубль" },
  USD: { symbol: "$", locale: "en-US", name: "Доллар США" },
  EUR: { symbol: "€", locale: "de-DE", name: "Евро" },
  GBP: { symbol: "£", locale: "en-GB", name: "Британский фунт" },
  CNY: { symbol: "¥", locale: "zh-CN", name: "Китайский юань" },
  JPY: { symbol: "¥", locale: "ja-JP", name: "Японская иена" },
  TRY: { symbol: "₺", locale: "tr-TR", name: "Турецкая лира" },
  KZT: { symbol: "₸", locale: "kk-KZ", name: "Казахстанский тенге" },
  BYN: { symbol: "Br", locale: "be-BY", name: "Белорусский рубль" },
  UAH: { symbol: "₴", locale: "uk-UA", name: "Украинская гривна" },
};

export const SUPPORTED_CURRENCIES = Object.entries(CURRENCIES).map(([code, meta]) => ({
  code,
  ...meta,
}));

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES[currency]?.symbol ?? currency;
}

export function formatAmount(value: number | string | undefined, currency: string): string {
  if (value === undefined) return "—";
  const locale = CURRENCIES[currency]?.locale ?? "en-US";
  return Number(value).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
