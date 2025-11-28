export const REGEX_PATTERNS = {
  // Contact Information
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  LINKEDIN: /(?:www\.)?linkedin\.com\/in\/([\w-]+)/i,
  PHONE: /(\+\d{1,3}\s?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/,

  // Content Sections
  PAGE_NUMBERS: /Page \d+ of \d+/gi,
  TOP_SKILLS: /Top Skills\s+([\s\S]+?)(?:Languages|Idiomas)/i,
  LANGUAGES:
    /Languages\s+([\s\S]+?)(?:Summary|Resumo|Experiência|Experience|Education|Educação|$)/i,
  SUMMARY:
    /(?:Summary|Resumo)\s+([\s\S]+?)(?:Experience|Experiência|Education|Educação|$)/i,
  EXPERIENCE:
    /(?:Experience|Experiência)\s+([\s\S]+?)(?:Education|Educação|$)/i,
  EDUCATION: /(?:Education|Educação)\s+([\s\S]+?)(?:$)/i,

  // Profile Information
  NAME: /^([A-Z][a-z]+(?: [A-Z][a-z]+)*)/m,
  LOCATION: /([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*(?:,\s*[A-Z]{2,})?)/,

  // Language Proficiency
  LANGUAGE_PROFICIENCY:
    /(Native|Bilingual|Professional|Elementary|Limited|Fluent|Working)/i,

  // Date Patterns
  DATE_RANGE:
    /(\w+\s+\d{4})\s*(?:-|–|to|até)\s*(\w+\s+\d{4}|Present|Presente)/i,
  YEAR: /\b(19|20)\d{2}\b/g,

  // Common Separators
  LINE_BREAK: /\r?\n/g,
  MULTIPLE_SPACES: /\s{2,}/g,
  BULLET_POINTS: /^[\u2022\u2023\u25E6\u2043\u2219•·‣⁃]\s*/gm,
} as const;

export const SECTION_KEYWORDS = {
  CONTACT: ['contact', 'contato'],
  SKILLS: ['skills', 'habilidades', 'competências'],
  LANGUAGES: ['languages', 'idiomas'],
  SUMMARY: ['summary', 'resumo', 'about'],
  EXPERIENCE: ['experience', 'experiência', 'work', 'trabalho'],
  EDUCATION: ['education', 'educação', 'formação'],
  CERTIFICATIONS: ['certifications', 'certificações', 'certificates'],
} as const;

export const LANGUAGE_LEVELS = [
  'Native or Bilingual',
  'Native',
  'Bilingual',
  'Full Professional',
  'Professional Working',
  'Professional',
  'Limited Working',
  'Elementary',
  'Beginner',
] as const;
