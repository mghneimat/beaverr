/**
 * Curated country-specific official resource chunks (static v1).
 * Human source of truth: docs/knowledge-country-cz.md
 *
 * @typedef {{
 *   id: string,
 *   country_code: string,
 *   topic_tags: string[],
 *   excerpt: string,
 *   metadata: {
 *     source_type: 'official',
 *     title: string,
 *     official_url: string,
 *     last_reviewed: string,
 *   },
 * }} CountryKnowledgeChunk
 */

/** @type {CountryKnowledgeChunk[]} */
export const COUNTRY_KNOWLEDGE_CHUNKS = [
  {
    id: 'cz_official#permits',
    country_code: 'CZ',
    topic_tags: ['permits', 'residence', 'immigration', 'moi'],
    excerpt:
      'Foreign nationals staying in the Czech Republic longer than permitted visa-free periods generally need a residence permit. The Ministry of the Interior (MOI) publishes permit types, application steps, and required documents. Permit rules depend on purpose of stay (work, study, family reunification). Check MOI before assuming tourist status covers your situation.',
    metadata: {
      source_type: 'official',
      title: 'Residence permits — Ministry of the Interior',
      official_url: 'https://www.mvcr.cz/mvcren/article/third-country-nationals.aspx',
      last_reviewed: '2026-06-30',
    },
  },
  {
    id: 'cz_official#renting',
    country_code: 'CZ',
    topic_tags: ['renting', 'housing', 'tenant', 'landlord'],
    excerpt:
      'Rental agreements in the Czech Republic should be in writing. Tenants typically pay a deposit (often one to three months’ rent) and monthly utilities may be billed separately from rent. Notice periods and rent increases depend on contract type and Civil Code rules. Official consumer guidance covers deposits, handover protocols, and dispute channels.',
    metadata: {
      source_type: 'official',
      title: 'Housing and renting — Czech Trade Inspection',
      official_url: 'https://www.coi.cz/en/consumer-protection/housing/',
      last_reviewed: '2026-06-30',
    },
  },
  {
    id: 'cz_official#health_insurance',
    country_code: 'CZ',
    topic_tags: ['health', 'health_insurance', 'vzp', 'coverage'],
    excerpt:
      'Health insurance is mandatory for most residents. Employees are usually insured through employer registration with a public insurer (e.g. VZP). Self-employed persons must arrange coverage themselves and pay monthly premiums. Without valid insurance, medical costs can be charged at full price. Public insurers publish premium tables and registration steps.',
    metadata: {
      source_type: 'official',
      title: 'Public health insurance — VZP',
      official_url: 'https://www.vzp.cz/en/individuals',
      last_reviewed: '2026-06-30',
    },
  },
  {
    id: 'cz_official#taxes',
    country_code: 'CZ',
    topic_tags: ['taxes', 'income_tax', 'financni_sprava'],
    excerpt:
      'Income tax for employees is typically withheld via payroll. Self-employed persons file with the Financial Administration (Finanční správa), pay advances, and may need VAT registration above turnover thresholds. Tax residency rules affect whether worldwide income is taxed in the Czech Republic. Official portals list filing deadlines, forms, and electronic submission (Datová schránka).',
    metadata: {
      source_type: 'official',
      title: 'Taxes — Financial Administration',
      official_url: 'https://www.financnisprava.cz/en/taxes',
      last_reviewed: '2026-06-30',
    },
  },
  {
    id: 'cz_official#utilities',
    country_code: 'CZ',
    topic_tags: ['utilities', 'energy', 'waste', 'municipal'],
    excerpt:
      'Household utilities often include electricity, gas, water, waste collection, and sometimes heating (central vs. individual). Waste fees are set by the municipality. Tenants should confirm which utilities are included in rent versus billed separately. Energy suppliers must provide clear contracts; switching suppliers is possible for many households.',
    metadata: {
      source_type: 'official',
      title: 'Energy and consumer rights — ERÚ',
      official_url: 'https://www.eru.cz/en/consumer-protection',
      last_reviewed: '2026-06-30',
    },
  },
  {
    id: 'cz_official#transport',
    country_code: 'CZ',
    topic_tags: ['transport', 'vignette', 'vehicle', 'parking'],
    excerpt:
      'Motorway vignettes are required for vehicles using marked Czech highways unless exempt. Vignettes are sold electronically with validity tied to the vehicle registration plate. Prague and other cities operate paid parking zones with resident permits. Vehicle owners must maintain mandatory liability insurance (povinné ručení) and periodic technical inspections (STK).',
    metadata: {
      source_type: 'official',
      title: 'Motorway vignette — eDalnice',
      official_url: 'https://edalnice.cz/en/index.html',
      last_reviewed: '2026-06-30',
    },
  },
];

/**
 * @param {string} countryCode
 * @returns {CountryKnowledgeChunk[]}
 */
export function getCountryKnowledgeChunks(countryCode) {
  const code = (countryCode || '').toUpperCase();
  return COUNTRY_KNOWLEDGE_CHUNKS.filter((c) => c.country_code === code);
}

/**
 * @param {string[]} ids
 * @param {string} [countryCode]
 * @returns {CountryKnowledgeChunk[]}
 */
export function getCountryKnowledgeChunksByIds(ids, countryCode = 'CZ') {
  const code = countryCode.toUpperCase();
  const idSet = new Set(ids);
  return COUNTRY_KNOWLEDGE_CHUNKS.filter((c) => c.country_code === code && idSet.has(c.id));
}

/**
 * @param {CountryKnowledgeChunk} chunk
 * @returns {{ id: string, excerpt: string, title: string, official_url: string, last_reviewed: string }}
 */
export function toKbChunkPayload(chunk) {
  return {
    id: chunk.id,
    excerpt: chunk.excerpt,
    title: chunk.metadata.title,
    official_url: chunk.metadata.official_url,
    last_reviewed: chunk.metadata.last_reviewed,
  };
}

/**
 * @param {CountryKnowledgeChunk} chunk
 * @returns {{ id: string, title: string, official_url: string, last_reviewed: string }}
 */
export function toSourceLink(chunk) {
  return {
    id: chunk.id,
    title: chunk.metadata.title,
    official_url: chunk.metadata.official_url,
    last_reviewed: chunk.metadata.last_reviewed,
  };
}
