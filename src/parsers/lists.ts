import { REGEX_PATTERNS } from '../utils/regex-patterns';
import {
  extractSection,
  splitLines,
  normalizeWhitespace,
} from '../utils/text-utils';

export interface Language {
  language: string;
  proficiency: string;
}

export class ListParser {
  static parseSkills(text: string): string[] {
    const skillsSection = extractSection(text, REGEX_PATTERNS.TOP_SKILLS);

    if (!skillsSection) {
      return [];
    }

    const lines = splitLines(skillsSection);
    return lines
      .map(line => normalizeWhitespace(line))
      .filter(skill => {
        const lowerSkill = skill.toLowerCase();
        return (
          skill.length > 1 &&
          skill.length < 50 &&
          !lowerSkill.includes('languages') &&
          !lowerSkill.includes('summary') &&
          !lowerSkill.includes('experience') &&
          !lowerSkill.includes('education') &&
          !lowerSkill.includes('page ') &&
          !lowerSkill.match(/^\d+$/)
        );
      })
      .slice(0, 10);
  }

  static parseLanguages(text: string): Language[] {
    const languagesSection = extractSection(text, REGEX_PATTERNS.LANGUAGES);

    if (!languagesSection) {
      return [];
    }

    const lines = splitLines(languagesSection);
    const languages: Language[] = [];

    for (const line of lines) {
      const normalizedLine = normalizeWhitespace(line);

      if (
        !normalizedLine ||
        normalizedLine.toLowerCase().includes('summary') ||
        normalizedLine.toLowerCase().includes('experience') ||
        normalizedLine.toLowerCase().includes('education') ||
        normalizedLine.match(/^page\s+\d+/i)
      ) {
        continue;
      }

      const language = this.extractLanguageInfo(normalizedLine);
      if (language) {
        languages.push(language);
      }
    }

    return languages;
  }

  private static extractLanguageInfo(line: string): Language | null {
    const patterns = [
      /^([A-Z][a-z]+)\s*\(([^)]+)\)/,
      /^([A-Z][a-z]+)\s+(Native|Bilingual|Professional|Elementary|Limited|Fluent|Working)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          language: match[1].trim(),
          proficiency: match[2].trim(),
        };
      }
    }

    const proficiencyMatch = line.match(REGEX_PATTERNS.LANGUAGE_PROFICIENCY);
    if (proficiencyMatch) {
      const proficiency = proficiencyMatch[1];
      const language = line
        .replace(proficiency, '')
        .replace(/[()]/g, '')
        .trim();

      if (language && language.length > 1 && language.length < 20) {
        return {
          language,
          proficiency,
        };
      }
    }

    if (line.length > 1 && line.length < 20 && /^[A-Z][a-z]+$/.test(line)) {
      return {
        language: line,
        proficiency: 'Unknown',
      };
    }

    return null;
  }
}
