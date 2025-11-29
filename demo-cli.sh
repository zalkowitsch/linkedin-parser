#!/bin/bash

echo "🚀 LinkedIn PDF Parser CLI Demo"
echo "==============================="
echo

# Test CLI help
echo "📋 1. Showing help:"
node bin/cli.js --help
echo

# Test with Profile.pdf in compact mode
echo "📄 2. Parsing Profile.pdf (compact mode):"
echo "node bin/cli.js \"/Users/arkady/Downloads/Profile.pdf\" --compact"
echo
echo "Output (first 300 characters):"
node bin/cli.js "/Users/arkady/Downloads/Profile.pdf" --compact | head -c 300
echo "..."
echo

# Test with Profile (1).pdf showing just structure
echo "📄 3. Parsing Profile (1).pdf (structured output):"
echo "node bin/cli.js \"/Users/arkady/Downloads/Profile (1).pdf\""
echo
echo "Key fields extracted:"
RESULT=$(node bin/cli.js "/Users/arkady/Downloads/Profile (1).pdf" --compact)
echo "Name: $(echo $RESULT | grep -o '"name":"[^"]*"' | cut -d'"' -f4)"
echo "Email: $(echo $RESULT | grep -o '"email":"[^"]*"' | cut -d'"' -f4)"
echo "Location: $(echo $RESULT | grep -o '"location":"[^"]*"' | cut -d'"' -f4)"
echo "Skills count: $(echo $RESULT | grep -o '"top_skills":\[[^\]]*\]' | grep -o ',' | wc -l | xargs expr 1 +)"
echo "Experience count: $(echo $RESULT | grep -o '"experience":\[[^\]]*\]' | grep -o '"title":' | wc -l)"
echo

# Test error handling
echo "🚨 4. Error handling examples:"
echo

echo "   a) Non-existent file:"
echo "   node bin/cli.js non-existent.pdf"
node bin/cli.js non-existent.pdf 2>&1 || true
echo

echo "   b) Non-PDF file:"
echo "   node bin/cli.js package.json"
node bin/cli.js package.json 2>&1 || true
echo

# Usage examples
echo "💡 5. Real-world usage examples:"
echo "   # Save to file:"
echo "   linkedin-pdf-parser resume.pdf > profile-data.json"
echo
echo "   # Extract specific data (with jq):"
echo "   linkedin-pdf-parser resume.pdf | jq '.profile.name'"
echo "   linkedin-pdf-parser resume.pdf | jq '.profile.contact.email'"
echo "   linkedin-pdf-parser resume.pdf | jq '.profile.experience[].company'"
echo
echo "   # Process multiple files:"
echo "   for pdf in *.pdf; do"
echo "     linkedin-pdf-parser \"\$pdf\" --compact > \"\${pdf%.pdf}.json\""
echo "   done"
echo

echo "✅ CLI Demo completed successfully!"
echo "📖 See CLI_USAGE.md for complete documentation"