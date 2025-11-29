import { TextItem, LayoutInfo } from '../types/structural.js';

export class StructuralParser {
  static async extractStructuredText(pdfBuffer: Buffer): Promise<{
    textItems: TextItem[];
    layout: LayoutInfo;
  }> {
    // Use legacy build for Node.js compatibility
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Set worker source from node_modules
    (pdfjs.GlobalWorkerOptions as any).workerSrc =
      process.cwd() + '/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs';

    const uint8Array = new Uint8Array(pdfBuffer);
    const pdf = await pdfjs.getDocument({
      data: uint8Array
    }).promise;
    const allTextItems: TextItem[] = [];

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageTextItems = textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        fontSize: item.height,
        fontFamily: item.fontName || 'unknown',
        width: item.width,
        height: item.height,
        transform: item.transform,
      }));

      allTextItems.push(...pageTextItems);
    }

    // Detect layout
    const layout = this.detectLayout(allTextItems);

    return {
      textItems: allTextItems,
      layout,
    };
  }

  private static detectLayout(textItems: TextItem[]): LayoutInfo {
    // Analyze X positions to detect columns
    const xPositions = textItems.map(item => item.x);
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);

    // Look for two distinct clusters of X positions
    // Based on analysis, left column is around x=20, right column around x=220
    const leftItems = textItems.filter(item => item.x < 150);
    const rightItems = textItems.filter(item => item.x >= 150);

    // Check if there's a significant gap indicating columns
    const hasLeftColumn = leftItems.length > 20;
    const hasRightColumn = rightItems.length > 20;

    if (hasLeftColumn && hasRightColumn) {
      // Two-column layout detected
      const sidebarRight = Math.max(...leftItems.map(item => item.x + (item.width || 100)));
      const mainLeft = Math.min(...rightItems.map(item => item.x));

      return {
        type: 'two-column',
        sidebarBounds: {
          left: minX,
          right: sidebarRight,
          top: Math.min(...leftItems.map(item => item.y)),
          bottom: Math.max(...leftItems.map(item => item.y)),
        },
        mainBounds: {
          left: mainLeft,
          right: maxX,
          top: Math.min(...rightItems.map(item => item.y)),
          bottom: Math.max(...rightItems.map(item => item.y)),
        },
      };
    }

    return {
      type: 'single-column',
    };
  }

  static groupTextByProximity(textItems: TextItem[], maxYDistance = 5): TextItem[][] {
    // Detect layout first to handle columns separately
    const layout = this.detectLayout(textItems);

    if (layout.type === 'two-column') {
      // Process each column separately using the fixed boundary
      const leftItems = textItems.filter(item => item.x < 150);
      const rightItems = textItems.filter(item => item.x >= 150);

      const leftGroups = this.groupItemsByY(leftItems, maxYDistance);
      const rightGroups = this.groupItemsByY(rightItems, maxYDistance);

      // Combine and sort all groups by their average Y position
      const allGroups = [...leftGroups, ...rightGroups];
      allGroups.sort((a, b) => {
        const avgYA = a.reduce((sum, item) => sum + item.y, 0) / a.length;
        const avgYB = b.reduce((sum, item) => sum + item.y, 0) / b.length;
        return avgYB - avgYA; // Top to bottom
      });

      return allGroups;
    } else {
      // Single column processing
      return this.groupItemsByY(textItems, maxYDistance);
    }
  }

  private static groupItemsByY(textItems: TextItem[], maxYDistance = 5): TextItem[][] {
    // Sort by Y position (top to bottom)
    const sorted = [...textItems].sort((a, b) => b.y - a.y);
    const groups: TextItem[][] = [];
    let currentGroup: TextItem[] = [];

    for (const item of sorted) {
      if (currentGroup.length === 0) {
        currentGroup.push(item);
      } else {
        const lastItem = currentGroup[currentGroup.length - 1];
        const yDistance = Math.abs(lastItem.y - item.y);

        if (yDistance <= maxYDistance) {
          currentGroup.push(item);
        } else {
          if (currentGroup.length > 0) {
            groups.push([...currentGroup]);
          }
          currentGroup = [item];
        }
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  static combineGroupedText(groups: TextItem[][]): string[] {
    return groups.map(group => {
      // Sort by X position within group (left to right)
      const sortedGroup = group.sort((a, b) => a.x - b.x);
      return sortedGroup.map(item => item.text).join(' ').trim();
    });
  }
}