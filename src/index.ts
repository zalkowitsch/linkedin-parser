import pdfParse from 'pdf-parse';
import { BasicInfoParser } from './parsers/basic-info';
import { ListParser } from './parsers/lists';
import { ExperienceParser } from './parsers/experience';
import { EducationParser } from './parsers/education';
import { cleanPDFText } from './utils/text-utils';

export interface Contact {
  email: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
}

export interface Language {
  language: string;
  proficiency: string;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  location?: string;
  description?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
  location?: string;
  description?: string;
}

export interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  contact: Contact;
  top_skills: string[];
  languages: Language[];
  summary?: string;
  experience: Experience[];
  education: Education[];
}

export interface ParseOptions {
  includeRawText?: boolean;
}

export interface ParseResult {
  profile: LinkedInProfile;
  rawText?: string;
}

/**
 * Parses a LinkedIn PDF resume and extracts structured profile data
 * @param input - PDF Buffer or extracted text string
 * @param options - Optional parsing configuration
 * @returns Promise resolving to structured LinkedIn profile data
 */
export async function parseLinkedInPDF(
  input: Buffer | string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  let text: string;

  // Handle both Buffer and string inputs
  if (Buffer.isBuffer(input)) {
    try {
      const pdfData = await pdfParse(input);
      text = pdfData.text;
    } catch (error) {
      throw new Error('PDF appears to be empty or unreadable');
    }
  } else {
    text = input;
  }

  if (!text || text.length < 50) {
    throw new Error('PDF appears to be empty or unreadable');
  }

  // Clean and parse the text
  const cleanedText = cleanPDFText(text);

  // Parse all sections using specialized parsers
  const basicInfo = BasicInfoParser.parse(cleanedText);
  const topSkills = ListParser.parseSkills(cleanedText);
  const languages = ListParser.parseLanguages(cleanedText);
  const experience = ExperienceParser.parse(cleanedText);
  const education = EducationParser.parse(cleanedText);

  // Combine into final profile
  const profile: LinkedInProfile = {
    name: basicInfo.name,
    headline: basicInfo.headline,
    location: basicInfo.location,
    contact: basicInfo.contact,
    top_skills: topSkills,
    languages,
    summary: basicInfo.summary,
    experience,
    education,
  };

  // Basic validation
  if (!profile.name || !profile.contact.email) {
    throw new Error(
      'Could not extract basic profile information (name or email missing)'
    );
  }

  const result: ParseResult = { profile };

  if (options.includeRawText) {
    result.rawText = text;
  }

  return result;
}

// All types are already exported above
