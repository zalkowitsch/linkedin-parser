import { Context } from "hono";
import pdfParse from "pdf-parse";

export async function handlePDFUpload(c: Context) {
  try {
    console.log("[PDF Parser V2] Starting PDF processing...");

    const formData = await c.req.formData();
    const file = formData.get("pdf") as File;

    if (!file) {
      return c.json({ success: false, error: "No PDF file provided" }, 400);
    }

    console.log("[PDF Parser V2] File:", file.name, "Size:", file.size);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    console.log("[PDF Parser V2] Text length:", text.length);

    const parsedData = parseLinkedInPDFV2(text);
    const result = transformToLinkedInSchema(parsedData);

    return c.json(result);
  } catch (error: any) {
    console.error("[PDF Parser V2] Error:", error);
    return c.json(
      { success: false, error: error.message || "Failed to process PDF" },
      500
    );
  }
}

function parseLinkedInPDFV2(text: string): any {
  console.log("[PDF Parser V2] Starting regex-based parsing...");

  text = text.replace(/Page \d+ of \d+/gi, "");

  const profile: any = {
    name: "",
    headline: "",
    location: "",
    contact: {
      email: "",
      phone: "",
      linkedin_url: "",
      other_links: [],
    },
    top_skills: [],
    languages: [],
    summary: "",
    experience: [],
    education: [],
  };

  const emailMatch = text.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  );
  if (emailMatch) {
    profile.contact.email = emailMatch[0];
    console.log("[PDF Parser V2] Email:", profile.contact.email);
  }

  const linkedInMatch = text.match(
    /(?:www\.)?linkedin\.com\/in\/([\w-]+)/i
  );
  if (linkedInMatch) {
    const username = linkedInMatch[1];
    profile.contact.linkedin_url = `https://linkedin.com/in/${username}`;
    console.log("[PDF Parser V2] LinkedIn:", profile.contact.linkedin_url);
  }

  const phoneMatch = text.match(
    /(\+\d{1,3}\s?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/
  );
  if (phoneMatch) {
    profile.contact.phone = phoneMatch[0];
    console.log("[PDF Parser V2] Phone:", profile.contact.phone);
  }

  const skillsMatch = text.match(/Top Skills\s+([\s\S]+?)(?:Languages|Idiomas)/i);
  if (skillsMatch) {
    const skillsBlock = skillsMatch[1];
    const skills = skillsBlock
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    profile.top_skills = skills;
    console.log("[PDF Parser V2] Top skills:", profile.top_skills);
  }

  const languagesMatch = text.match(
    /Languages\s+([\s\S]+?)(?:Summary|Resumo|Experiência|Experience|Education|Educação|$)/i
  );
  if (languagesMatch) {
    const langBlock = languagesMatch[1];
    const langLines = langBlock
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Filter out lines that don't look like languages
    const validLanguageLines = langLines.filter(line => {
      // Skip if it looks like a person's name (2-3 capitalized words)
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(line)) {
        return false;
      }
      // Skip if it contains job titles or role descriptions
      if (/\b(?:Engineering|Manager|Director|Developer|Designer|MBA|Business|Management|Scaling|teams|systems)\b/i.test(line)) {
        return false;
      }
      // Skip if it looks like a location
      if (/\b(?:California|United States|Brazil|Brasil|Sunnyvale|San Francisco)\b/i.test(line)) {
        return false;
      }
      // Skip if it's too long to be a language (likely description)
      if (line.length > 50) {
        return false;
      }
      return true;
    });

    profile.languages = validLanguageLines.map((line) => {
      const m = line.match(/^(.+?)\s*\((.+?)\)\s*$/);
      if (m) {
        return {
          language: m[1].trim(),
          proficiency: m[2].trim(),
        };
      }
      return {
        language: line,
        proficiency: "",
      };
    });

    console.log("[PDF Parser V2] Languages:", profile.languages);
  }

  let nameMatch = text.match(
    /(?:Languages|Idiomas)[\s\S]{50,600}?\n([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\s*\n(?:Engineering|Manager|Director|Developer|Designer)/
  );
  if (nameMatch) {
    profile.name = nameMatch[1].trim();
    console.log("[PDF Parser V2] Name (pattern 1):", profile.name);
  }

  if (!profile.name) {
    nameMatch = text.match(
      /\n([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\n[^\n]*(?:Manager|Engineer|Director)[^\n]*\n(?:Sunnyvale|California|Brazil|United States)/
    );
    if (nameMatch) {
      profile.name = nameMatch[1].trim();
      console.log("[PDF Parser V2] Name (pattern 2):", profile.name);
    }
  }

  if (!profile.name && profile.contact.email) {
    nameMatch = text.match(
      /\n([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\n/
    );
    if (nameMatch) {
      const potentialName = nameMatch[1].trim();
      if (
        ![
          "Contact",
          "Top Skills",
          "Languages",
          "Summary",
          "Experience",
          "Education",
        ].includes(potentialName)
      ) {
        profile.name = potentialName;
        console.log("[PDF Parser V2] Name (pattern 3):", profile.name);
      }
    }
  }

  if (!profile.name) {
    console.log("[PDF Parser V2] WARNING: Name not found in any pattern!");
  }

  const headlineMatch = text.match(
    /([^\n]+(?:Manager|Engineer|Director)[^\n]+)\s+(?:Sunnyvale|California|Brazil|United States)/
  );
  if (headlineMatch) {
    profile.headline = headlineMatch[1].trim();
    console.log("[PDF Parser V2] Headline:", profile.headline);
  }

  const locationMatch = text.match(
    /([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*(?:,\s*United States|,?\s*Brasil|,?\s*Brazil)?)\s*\n(?:Contact|Summary|Resumo|\d+)/
  );
  if (locationMatch) {
    profile.location = locationMatch[1].trim();
    console.log("[PDF Parser V2] Location:", profile.location);
  } else {
    const locationFallback = text.match(
      /(Sunnyvale,\s*California,\s*United States|San Francisco,\s*California|New York,\s*New York|[A-Z][a-z]+,\s*[A-Z][a-z]+,\s*United States)/
    );
    if (locationFallback) {
      profile.location = locationFallback[1].trim();
      console.log(
        "[PDF Parser V2] Location (fallback):",
        profile.location
      );
    }
  }

  const summaryMatch = text.match(
    /(?:Summary|About|Resumo)\s+([\s\S]{50,800}?)\s+(?:Experience|Experiência)/
  );
  if (summaryMatch) {
    profile.summary = summaryMatch[1].trim().replace(/\s+/g, " ");
    console.log("[PDF Parser V2] Summary length:", profile.summary.length);
  }

  const experienceMatch = text.match(
    /(?:Experience|Experiência)\s+([\s\S]+?)(?:Education|Educação|$)/
  );
  if (experienceMatch) {
    const expText = experienceMatch[1];
    console.log(
      "[PDF Parser V2] Experience section found, length:",
      expText.length
    );
    console.log(
      "[PDF Parser V2] Experience text (first 500 chars):",
      expText.substring(0, 500)
    );
    profile.experience = parseExperienceSectionV2(expText);
    console.log(
      "[PDF Parser V2] Parsed",
      profile.experience.length,
      "companies"
    );
  } else {
    console.log("[PDF Parser V2] WARNING: Experience section NOT FOUND in text");
    console.log(
      "[PDF Parser V2] Text contains \"Experience\"?",
      text.includes("Experience")
    );
    console.log(
      "[PDF Parser V2] Text contains \"Education\"?",
      text.includes("Education")
    );
  }

  const educationMatch = text.match(
    /(?:Education|Educação)\s+([\s\S]+?)(?:Licenses|Skills|Endorsements|$)/
  );
  if (educationMatch) {
    const eduText = educationMatch[1];
    console.log(
      "[PDF Parser V2] Education section found, length:",
      eduText.length
    );
    console.log(
      "[PDF Parser V2] Education text (first 300 chars):",
      eduText.substring(0, 300)
    );
    profile.education = parseEducationSectionV2(eduText);
    console.log(
      "[PDF Parser V2] Parsed",
      profile.education.length,
      "educations"
    );
  } else {
    console.log("[PDF Parser V2] WARNING: Education section NOT FOUND in text");
  }

  return profile;
}

function parseExperienceSectionV2(text: string): any[] {
  console.log("[PDF Parser V2] ========== PARSING EXPERIENCE ==========");
  console.log("[PDF Parser V2] Experience text length:", text.length);

  const companies: any[] = [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  console.log("[PDF Parser V2] Total lines to process:", lines.length);
  console.log("[PDF Parser V2] First 10 lines:", lines.slice(0, 10));

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    console.log(`[PDF Parser V2] Line ${i}:`, line);

    if (
      /^(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]/.test(
        line
      )
    ) {
      console.log(`[PDF Parser V2]   -> Is a DATE, skipping`);
      i++;
      continue;
    }

    const isCompanyName =
      line.length < 60 &&
      /^[A-Z]/.test(line) &&
      !/^(?:January|February|March|April|May|June|July|August|September|October|November|December)/.test(
        line
      ) &&
      i + 1 < lines.length;

    console.log(
      `[PDF Parser V2]   -> isCompanyName?`,
      isCompanyName,
      `(length: ${line.length}, startsCap: ${/^[A-Z]/.test(line)})`
    );

    if (isCompanyName) {
      const companyName = line;
      i++;

      const tenureLine = lines[i];
      let tenure = "";
      console.log(
        `[PDF Parser V2]   -> Next line (checking tenure):`,
        tenureLine
      );

      if (
        /^\d+\s+years?\s+\d+\s+months?$|^\d+\s+years?$|^\d+\s+months?$/.test(
          tenureLine
        )
      ) {
        tenure = tenureLine;
        i++;
        console.log(`[PDF Parser V2]   -> FOUND TENURE:`, tenure);
      } else {
        console.log(
          `[PDF Parser V2]   -> NOT tenure (might be role or date)`
        );
      }

      console.log(
        "[PDF Parser V2] ===== FOUND COMPANY:",
        companyName,
        tenure ? `(${tenure})` : "(no tenure)"
      );

      const roles: any[] = [];

      while (i < lines.length) {
        const potentialRole = lines[i];
        const potentialDate = i + 1 < lines.length ? lines[i + 1] : "";

        console.log(
          `[PDF Parser V2]     Checking role - Line ${i}:`,
          potentialRole
        );
        console.log(
          `[PDF Parser V2]     Next line (date?):`,
          potentialDate
        );

        const isDateLine =
          /^(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]/.test(
            potentialDate
          );
        console.log(`[PDF Parser V2]     isDateLine?`, isDateLine);

        if (!isDateLine) {
          const looksLikeNewCompany =
            potentialRole.length < 60 &&
            /^[A-Z]/.test(potentialRole) &&
            !potentialRole.startsWith("•") &&
            !potentialRole.match(
              /^(I |We |The |This |Leading |Working |Building |Developing |Managing )/
            );

          console.log(
            `[PDF Parser V2]     looksLikeNewCompany?`,
            looksLikeNewCompany
          );

          if (looksLikeNewCompany) {
            console.log(
              `[PDF Parser V2]     -> Breaking (new company detected)`
            );
            break;
          } else {
            console.log(
              `[PDF Parser V2]     -> Breaking (no date and not a company)`
            );
            break;
          }
        }

        const roleTitle = potentialRole;
        const dateStr = potentialDate;
        i += 2;

        let location = "";
        if (i < lines.length) {
          const locationCandidate = lines[i];
          if (/, [A-Z]{2}(?:, [A-Z][a-z]+)?$/.test(locationCandidate)) {
            location = locationCandidate;
            console.log(
              "[PDF Parser V2]     -> FOUND LOCATION:",
              location
            );
            i++;
          }
        }

        console.log("[PDF Parser V2]     *** FOUND ROLE:", roleTitle);
        console.log("[PDF Parser V2]     *** DATE:", dateStr);

        const descriptions: string[] = [];
        console.log(
          `[PDF Parser V2]       -> Starting description collection...`
        );

        while (i < lines.length) {
          const descLine = lines[i];

          console.log(
            `[PDF Parser V2]       -> Desc line ${i}:`,
            descLine.substring(0, 80)
          );

          const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
          const isNextRole =
            /^(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]/.test(
              nextLine
            );
          const isNewCompany =
            descLine.length < 60 &&
            /^[A-Z]/.test(descLine) &&
            !descLine.startsWith("•");

          console.log(
            `[PDF Parser V2]       -> isNextRole?`,
            isNextRole,
            `isNewCompany?`,
            isNewCompany
          );

          if (isNextRole || isNewCompany) {
            console.log(
              `[PDF Parser V2]       -> End of descriptions (next role or company)`
            );
            break;
          }

          if (
            descLine.startsWith("•") ||
            descLine.startsWith("-") ||
            descLine.startsWith("*")
          ) {
            const cleaned = descLine.replace(/^[•\-\*]\s*/, "").trim();
            descriptions.push(cleaned);
            console.log(
              `[PDF Parser V2]       -> ✓ Added bullet:`,
              cleaned.substring(0, 60)
            );
          } else if (
            descLine.length > 20 &&
            descLine.length < 500
          ) {
            descriptions.push(descLine);
            console.log(
              `[PDF Parser V2]       -> ✓ Added paragraph:`,
              descLine.substring(0, 60)
            );
          } else {
            console.log(
              `[PDF Parser V2]       -> ✗ Skipped (length: ${descLine.length})`
            );
          }

          i++;
        }

        console.log(
          `[PDF Parser V2]     *** Descriptions found:`,
          descriptions.length
        );
        console.log(
          `[PDF Parser V2]     *** Sample descriptions:`,
          descriptions.slice(0, 2)
        );

        const dateParts = dateStr.split(/\s*[-–]\s*/);
        const startDate = dateParts[0]?.trim() || "";
        const endDate = dateParts[1]?.trim() || "";
        const isCurrent = /present/i.test(endDate);
        const duration = (dateStr.match(/\(([^)]+)\)/) || [])[1] || "";

        roles.push({
          title: roleTitle,
          location,
          start_date_raw: startDate,
          end_date_raw: endDate.replace(/\([^)]*\)/, "").trim(),
          is_current: isCurrent,
          duration_raw: duration,
          description_bullets: descriptions,
        });

        console.log("[PDF Parser V2]     *** Role added to array");
      }

      if (roles.length > 0) {
        companies.push({
          company: companyName,
          company_total_tenure: tenure,
          roles: roles,
        });
        console.log(
          "[PDF Parser V2] ===== Company added with",
          roles.length,
          "roles"
        );
      } else {
        console.log(
          "[PDF Parser V2] ===== WARNING: Company had 0 roles, not added"
        );
      }
    } else {
      i++;
    }
  }

  console.log(
    "[PDF Parser V2] ========== EXPERIENCE PARSING DONE =========="
  );
  console.log("[PDF Parser V2] Total companies:", companies.length);

  return companies;
}

function parseEducationSectionV2(text: string): any[] {
  const educations: any[] = [];

  console.log("[PDF Parser V2] Parsing education section...");
  console.log("[PDF Parser V2] Education text length:", text.length);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const yearMatch = line.match(/^(\d{4})(?:\s*[-–]\s*(\d{4}))?$/);

    if (yearMatch && i >= 1) {
      const years = yearMatch[0];
      const startYear = yearMatch[1];
      const endYear = yearMatch[2] || startYear;

      const line1 = i >= 1 ? lines[i - 1] : "";
      const line2 = i >= 2 ? lines[i - 2] : "";
      const line3 = i >= 3 ? lines[i - 3] : "";

      console.log("[PDF Parser V2] Found year pattern:", years);
      console.log("[PDF Parser V2]   -3:", line3);
      console.log("[PDF Parser V2]   -2:", line2);
      console.log("[PDF Parser V2]   -1:", line1);

      let institution = "";
      let degreeAndField = "";

      const degreeKeywords =
        /Bachelor|Master|MBA|Degree|Certification|Technician|Associate|Doctorate|PhD|diploma/i;

      if (degreeKeywords.test(line1)) {
        degreeAndField = line1;
        institution = line2;
      } else if (degreeKeywords.test(line2)) {
        degreeAndField = line2;

        if (
          line1.length > 0 &&
          (line1[0] === line1[0].toLowerCase() || line1.includes(","))
        ) {
          degreeAndField = line2 + " " + line1;
          institution = line3;
        } else {
          institution = line1;
        }
      } else {
        console.log("[PDF Parser V2] Skipping - no degree keywords found");
        continue;
      }

      if (!institution || !degreeAndField) {
        console.log(
          "[PDF Parser V2] Skipping - missing institution or degree"
        );
        continue;
      }

      const degreeParts = degreeAndField.split(/,\s*/);
      const degree = degreeParts[0]?.trim() || "";
      const field = degreeParts.slice(1).join(", ").trim();

      const key = `${institution}:${degree}:${startYear}`;
      const isDuplicate = educations.some(
        (e) =>
          `${e.institution}:${e.degree}:${e.start_year}` === key
      );

      if (!isDuplicate) {
        const edu = {
          institution,
          degree,
          field_of_study: field,
          start_year: startYear,
          end_year: endYear,
        };

        educations.push(edu);
        console.log(
          "[PDF Parser V2] Added education:",
          institution,
          "-",
          degree,
          "-",
          years
        );
      } else {
        console.log(
          "[PDF Parser V2] Skipping duplicate:",
          institution
        );
      }
    }
  }

  console.log(
    "[PDF Parser V2] Total educations found:",
    educations.length
  );

  return educations;
}

function transformToLinkedInSchema(parsedData: any): any {
  const workExperiences: any[] = [];

  for (const company of parsedData.experience || []) {
    if (!company.roles || company.roles.length === 0) continue;

    const positions = company.roles.map((role: any) => {
      const start = parseToMonthYear(role.start_date_raw);
      const end = role.is_current
        ? "Present"
        : parseToMonthYear(role.end_date_raw);
      const description = (role.description_bullets || []).join("\n");

      return {
        id: `pos-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        title: role.title,
        location: role.location || "",
        startDate: start || "",
        endDate: end || "",
        description,
      };
    });

    workExperiences.push({
      id: `exp-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      company: company.company,
      positions,
    });
  }

  const eduBySchool: Record<string, any> = {};

  (parsedData.education || []).forEach((edu: any) => {
    if (!eduBySchool[edu.institution]) {
      eduBySchool[edu.institution] = {
        id: `edu-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        school: edu.institution,
        courses: [],
      };
    }

    eduBySchool[edu.institution].courses.push({
      id: `course-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      title:
        edu.degree && edu.field_of_study
          ? `${edu.degree}, ${edu.field_of_study}`
          : edu.degree || edu.field_of_study || "",
      startDate: edu.start_year || "",
      endDate: edu.end_year || "",
      GPA: null,
    });
  });

  const educations = Object.values(eduBySchool);

  const skills = parsedData.top_skills || [];

  const languages = (parsedData.languages || []).map((l: any) => ({
    language: l.language,
    proficiency: l.proficiency,
  }));

  return {
    profile: {
      name: parsedData.name || "",
      summary: parsedData.summary || "",
      email: parsedData.contact?.email || "",
      phone: parsedData.contact?.phone || "",
      location: parsedData.location || "",
      url: parsedData.contact?.linkedin_url || "",
    },
    workExperiences,
    educations,
    projects: [],
    skills,
    custom: {
      descriptions: [],
    },
    languages,
  };
}

function parseToMonthYear(dateStr: string): string {
  if (!dateStr || dateStr.toLowerCase() === "present") return "";

  const monthMap: { [key: string]: string } = {
    january: "01",
    jan: "01",
    february: "02",
    feb: "02",
    march: "03",
    mar: "03",
    april: "04",
    apr: "04",
    may: "05",
    june: "06",
    jun: "06",
    july: "07",
    jul: "07",
    august: "08",
    aug: "08",
    september: "09",
    sep: "09",
    october: "10",
    oct: "10",
    november: "11",
    nov: "11",
    december: "12",
    dec: "12",
  };

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const month = monthMap[parts[0].toLowerCase()];
    const year = parts[1];
    if (month && year) return `${month}-${year}`;
  }

  return dateStr;
}