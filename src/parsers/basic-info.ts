import { REGEX_PATTERNS } from '../utils/regex-patterns';
import {
  extractFirstMatch,
  extractSection,
  splitLines,
  normalizeWhitespace,
} from '../utils/text-utils';

export interface Contact {
  email: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
}

export interface BasicInfo {
  name: string;
  headline: string;
  location: string;
  summary: string;
  contact: Contact;
}

export class BasicInfoParser {
  static parse(text: string): BasicInfo {
    return {
      name: this.extractName(text),
      headline: this.extractHeadline(text),
      location: this.extractLocation(text),
      summary: this.extractSummary(text),
      contact: this.extractContact(text),
    };
  }

  private static extractName(text: string): string {
    const lines = splitLines(text);

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];

      if (
        line.includes('@') ||
        line.includes('http') ||
        line.toLowerCase().includes('linkedin') ||
        line.toLowerCase().includes('contact') ||
        line.toLowerCase().includes('page') ||
        line.length < 3 ||
        line.length > 50
      ) {
        continue;
      }

      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);
      if (nameMatch) {
        return nameMatch[1];
      }

      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line) && !line.includes(',')) {
        return line.split(/\s{2,}/)[0];
      }
    }

    const specificNameMatch = text.match(
      /(?:^|\n)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|$)/m
    );
    return specificNameMatch ? specificNameMatch[1] : '';
  }

  private static extractLocation(text: string): string {
    const locationPatterns = [
      /([A-Z][a-z]+,\s*[A-Z][a-z]+,?\s*[A-Z]{2,}?)(?:\s|$)/,
      /([A-Z][a-z]+,\s*[A-Z]{2})(?:\s|$)/,
      /(New York|San Francisco|Los Angeles|Chicago|Boston|Austin|Seattle|London|Toronto)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  private static extractHeadline(text: string): string {
    const lines = splitLines(text);

    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      if (
        line.includes('@') ||
        line.includes('http') ||
        lowerLine.includes('contact') ||
        lowerLine.includes('page') ||
        line.length < 10 ||
        line.length > 150
      ) {
        continue;
      }

      const titlePatterns = [
        /(Senior|Lead|Principal|Chief|Director|VP|President).+/i,
        /(Product|Software|Data|Marketing|Sales|Business).+(Manager|Engineer|Analyst|Director)/i,
        /.*@.*\|.*/,
        /.*[·•-].*/,
      ];

      for (const pattern of titlePatterns) {
        if (pattern.test(line)) {
          return line.split('|')[0].trim();
        }
      }
    }

    return '';
  }

  private static extractSummary(text: string): string {
    const summarySection = extractSection(text, REGEX_PATTERNS.SUMMARY);

    if (summarySection) {
      return normalizeWhitespace(summarySection)
        .split('\n')
        .filter(line => line.trim().length > 10)
        .join(' ')
        .slice(0, 500);
    }

    const lines = splitLines(text);
    const potentialSummaryLines: string[] = [];

    for (let i = 5; i < Math.min(30, lines.length); i++) {
      const line = lines[i];

      if (
        line.length > 50 &&
        line.length < 200 &&
        !line.includes('@') &&
        !line.toLowerCase().includes('experience') &&
        !line.toLowerCase().includes('education') &&
        !line.toLowerCase().includes('skills')
      ) {
        potentialSummaryLines.push(line);

        if (potentialSummaryLines.join(' ').length > 100) {
          break;
        }
      }
    }

    return potentialSummaryLines.join(' ').slice(0, 500);
  }

  private static extractContact(text: string): Contact {
    const contact: Contact = {
      email: '',
    };

    // Extract email
    const emailMatch = extractFirstMatch(text, REGEX_PATTERNS.EMAIL);
    if (emailMatch) {
      contact.email = emailMatch;
    }

    // Extract LinkedIn URL
    const linkedinMatch = text.match(REGEX_PATTERNS.LINKEDIN);
    if (linkedinMatch) {
      const username = linkedinMatch[1];
      contact.linkedin_url = `https://linkedin.com/in/${username}`;
    }

    // Extract phone number
    const phoneMatch = extractFirstMatch(text, REGEX_PATTERNS.PHONE);
    if (phoneMatch) {
      contact.phone = phoneMatch;
    }

    return contact;
  }
}
