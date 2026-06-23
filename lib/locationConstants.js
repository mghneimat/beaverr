export const PRE_ALPHA_COUNTRY_CODE = 'CZ';

/** @type {Array<{ code: string, name: string, nameCs?: string, currency: string, region: string }>} */
export const COUNTRIES = [
  { code: 'CZ', name: 'Czech Republic', nameCs: 'Česká republika', currency: 'CZK', region: 'EU' },
  { code: 'SK', name: 'Slovakia', nameCs: 'Slovensko', currency: 'EUR', region: 'EU' },
  { code: 'PL', name: 'Poland', nameCs: 'Polsko', currency: 'PLN', region: 'EU' },
  { code: 'DE', name: 'Germany', nameCs: 'Německo', currency: 'EUR', region: 'EU' },
  { code: 'AT', name: 'Austria', nameCs: 'Rakousko', currency: 'EUR', region: 'EU' },
  { code: 'HU', name: 'Hungary', nameCs: 'Maďarsko', currency: 'HUF', region: 'EU' },
  { code: 'FR', name: 'France', nameCs: 'Francie', currency: 'EUR', region: 'EU' },
  { code: 'IT', name: 'Italy', nameCs: 'Itálie', currency: 'EUR', region: 'EU' },
  { code: 'ES', name: 'Spain', nameCs: 'Španělsko', currency: 'EUR', region: 'EU' },
  { code: 'NL', name: 'Netherlands', nameCs: 'Nizozemsko', currency: 'EUR', region: 'EU' },
  { code: 'BE', name: 'Belgium', nameCs: 'Belgie', currency: 'EUR', region: 'EU' },
  { code: 'SE', name: 'Sweden', nameCs: 'Švédsko', currency: 'SEK', region: 'EU' },
  { code: 'DK', name: 'Denmark', nameCs: 'Dánsko', currency: 'DKK', region: 'EU' },
  { code: 'FI', name: 'Finland', nameCs: 'Finsko', currency: 'EUR', region: 'EU' },
  { code: 'IE', name: 'Ireland', nameCs: 'Irsko', currency: 'EUR', region: 'EU' },
  { code: 'PT', name: 'Portugal', nameCs: 'Portugalsko', currency: 'EUR', region: 'EU' },
  { code: 'RO', name: 'Romania', nameCs: 'Rumunsko', currency: 'RON', region: 'EU' },
  { code: 'BG', name: 'Bulgaria', nameCs: 'Bulharsko', currency: 'BGN', region: 'EU' },
  { code: 'GR', name: 'Greece', nameCs: 'Řecko', currency: 'EUR', region: 'EU' },
  { code: 'HR', name: 'Croatia', nameCs: 'Chorvatsko', currency: 'EUR', region: 'EU' },
  { code: 'SI', name: 'Slovenia', nameCs: 'Slovinsko', currency: 'EUR', region: 'EU' },
  { code: 'LT', name: 'Lithuania', nameCs: 'Litva', currency: 'EUR', region: 'EU' },
  { code: 'LV', name: 'Latvia', nameCs: 'Lotyšsko', currency: 'EUR', region: 'EU' },
  { code: 'EE', name: 'Estonia', nameCs: 'Estonsko', currency: 'EUR', region: 'EU' },
  { code: 'GB', name: 'United Kingdom', nameCs: 'Spojené království', currency: 'GBP', region: 'Other' },
  { code: 'CH', name: 'Switzerland', nameCs: 'Švýcarsko', currency: 'CHF', region: 'Other' },
  { code: 'NO', name: 'Norway', nameCs: 'Norsko', currency: 'NOK', region: 'Other' },
  { code: 'US', name: 'United States', nameCs: 'Spojené státy', currency: 'USD', region: 'Other' },
  { code: 'CA', name: 'Canada', nameCs: 'Kanada', currency: 'CAD', region: 'Other' },
  { code: 'AU', name: 'Australia', nameCs: 'Austrálie', currency: 'AUD', region: 'Other' },
  { code: 'NZ', name: 'New Zealand', nameCs: 'Nový Zéland', currency: 'NZD', region: 'Other' },
  { code: 'JP', name: 'Japan', nameCs: 'Japonsko', currency: 'JPY', region: 'Other' },
  { code: 'KR', name: 'South Korea', nameCs: 'Jižní Korea', currency: 'KRW', region: 'Other' },
  { code: 'CN', name: 'China', nameCs: 'Čína', currency: 'CNY', region: 'Other' },
  { code: 'IN', name: 'India', nameCs: 'Indie', currency: 'INR', region: 'Other' },
  { code: 'RU', name: 'Russia', nameCs: 'Rusko', currency: 'RUB', region: 'Other' },
  { code: 'UA', name: 'Ukraine', nameCs: 'Ukrajina', currency: 'UAH', region: 'Other' },
  { code: 'Other', name: 'Other', nameCs: 'Jiné', currency: 'EUR', region: 'Other' },
];

/** @type {Array<{ code: string, name: string, symbol: string }>} */
export const CURRENCIES = [
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
];

/**
 * @param {string} countryCode
 * @returns {string}
 */
export function getFlagEmoji(countryCode) {
  if (countryCode === 'Other' || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 0x1F1E6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}
