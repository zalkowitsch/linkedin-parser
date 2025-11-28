import { REGEX_PATTERNS } from '../utils/regex-patterns';
import {
  extractSection,
  splitLines,
  normalizeWhitespace,
} from '../utils/text-utils';

export interface Experience {
  title: string;
  company: string;
  duration: string;
  location?: string;
  description?: string;
}

export class ExperienceParser {
  static parse(text: string): Experience[] {
    const experienceSection = extractSection(text, REGEX_PATTERNS.EXPERIENCE);

    if (!experienceSection) {
      return [];
    }

    const experiences: Experience[] = [];
    const lines = splitLines(experienceSection);

    let currentExperience: Partial<Experience> | null = null;
    let descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const normalizedLine = normalizeWhitespace(line);

      // Skip section headers
      if (this.isSectionHeader(normalizedLine)) {
        break;
      }

      // Check if this looks like a job title/company line
      if (this.looksLikeJobTitle(normalizedLine)) {
        // Save previous experience if exists
        if (currentExperience && currentExperience.title) {
          currentExperience.description = descriptionLines.join(' ').trim();
          experiences.push(currentExperience as Experience);
        }

        // Start new experience
        currentExperience = this.parseJobTitleLine(normalizedLine);
        descriptionLines = [];
      }
      // Check if this looks like a duration line
      else if (currentExperience && this.looksLikeDuration(normalizedLine)) {
        currentExperience.duration = normalizedLine;
      }
      // Check if this looks like a location line
      else if (currentExperience && this.looksLikeLocation(normalizedLine)) {
        currentExperience.location = normalizedLine;
      }
      // Otherwise, it's probably description
      else if (currentExperience && normalizedLine.length > 10) {
        descriptionLines.push(normalizedLine);
      }
    }

    // Add the last experience
    if (currentExperience && currentExperience.title) {
      currentExperience.description = descriptionLines.join(' ').trim();
      experiences.push(currentExperience as Experience);
    }

    return experiences;
  }

  private static parseJobTitleLine(line: string): Partial<Experience> {
    // Try to extract title and company from various formats
    // "Senior Developer at Google" or "Product Manager · Microsoft"
    const patterns = [
      /^(.+?)\s+at\s+(.+)$/i,
      /^(.+?)\s+@\s+(.+)$/i,
      /^(.+?)\s*[·•-]\s*(.+)$/,
      /^(.+?),\s*(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          title: match[1].trim(),
          company: match[2].trim(),
          location: '',
          duration: '',
          description: '',
        };
      }
    }

    // Fallback: treat the whole line as title
    return {
      title: line,
      company: '',
      location: '',
      duration: '',
      description: '',
    };
  }

  private static looksLikeJobTitle(line: string): boolean {
    const lowerLine = line.toLowerCase();

    // Common job title patterns
    const jobTitlePatterns = [
      /\b(manager|director|engineer|developer|analyst|consultant|specialist|lead|senior|junior)\b/i,
      /\b(product|software|data|marketing|sales|business|technical|project)\b.*\b(manager|engineer|analyst)\b/i,
      /\bat\s+[A-Z]/i, // "at Company"
      /\s+@\s+[A-Z]/i, // "@ Company"
      /[·•-]\s*[A-Z]/, // "· Company"
    ];

    return (
      line.length > 5 &&
      line.length < 100 &&
      jobTitlePatterns.some(pattern => pattern.test(line)) &&
      !lowerLine.includes('education') &&
      !lowerLine.includes('skills')
    );
  }

  private static looksLikeDuration(line: string): boolean {
    return (
      REGEX_PATTERNS.DATE_RANGE.test(line) ||
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line) ||
      /\b\d{4}\b/.test(line) ||
      /present|atual|current/i.test(line)
    );
  }

  private static looksLikeLocation(line: string): boolean {
    return (
      line.length > 2 &&
      line.length < 50 &&
      /^[A-Z][a-z]+(?:,\s*[A-Z][a-z]*)*$/i.test(line) &&
      !this.looksLikeDuration(line)
    );
  }

  private static isSectionHeader(line: string): boolean {
    const lowerLine = line.toLowerCase();
    return (
      lowerLine.includes('education') ||
      lowerLine.includes('skills') ||
      lowerLine.includes('languages') ||
      lowerLine.includes('certifications')
    );
  }
}
