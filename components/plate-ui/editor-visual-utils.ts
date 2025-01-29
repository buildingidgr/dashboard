import { CustomElement } from './types';

interface VisualFeedbackOptions {
  blockId: string;
  styles?: {
    opacity?: string;
    textDecoration?: string;
  };
  classes?: string[];
  debug?: boolean;
}

/**
 * Utility class for managing visual feedback in the editor
 */
export class EditorVisualManager {
  private static findBlockElement(blockId: string, debug = false): HTMLElement | null {
    const possibleSelectors = [
      `[data-slate-node][data-block-id="${blockId}"]`,
      `[data-block-id="${blockId}"]`,
      `[id="${blockId}"]`,
      `.slate-callout[data-block-id="${blockId}"]`,
      `div[data-block-id="${blockId}"]`,
      `[data-slate-node="element"]`,
    ];

    if (debug) {
      console.log('Trying selectors:', possibleSelectors);
    }

    let blockElement: HTMLElement | null = null;

    // Try each selector and log the results if debug is enabled
    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      if (debug) {
        console.log(`Trying selector "${selector}":`, elements.length, 'elements found');
        elements.forEach((el, i) => {
          console.log(`Element ${i} for selector "${selector}":`, {
            classes: el.classList.toString(),
            attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', '),
            textContent: el.textContent?.slice(0, 50) + '...'
          });
        });
      }

      const element = Array.from(elements).find(el => 
        el.getAttribute('data-block-id') === blockId
      );
      
      if (element) {
        blockElement = element as HTMLElement;
        if (debug) {
          console.log('Found matching element with selector:', selector);
        }
        break;
      }
    }

    if (debug) {
      console.log('Final block element found:', blockElement);
    }

    return blockElement;
  }

  private static findTextElements(blockElement: HTMLElement): NodeListOf<HTMLElement> {
    return blockElement.querySelectorAll('span, p, div[data-slate-string="true"]');
  }

  /**
   * Apply visual feedback to text elements within a block
   */
  static applyVisualFeedback({ blockId, styles, classes, debug = false }: VisualFeedbackOptions): void {
    if (debug) console.log('=== Applying Visual Feedback ===');

    const blockElement = this.findBlockElement(blockId, debug);
    if (!blockElement) {
      console.error('Could not find block element with ID:', blockId);
      return;
    }

    if (debug) {
      console.log('Block element found, current classes:', blockElement.classList.toString());
    }

    const textElements = this.findTextElements(blockElement);
    if (debug) {
      console.log('Found text elements:', textElements.length);
    }

    textElements.forEach((element, index) => {
      // Only process elements that contain text
      if (element.textContent?.trim()) {
        if (debug) {
          console.log(`Processing element ${index}:`, element.textContent);
          console.log(`Element ${index} before:`, {
            classes: element.classList.toString(),
            styles: element.style.cssText
          });
        }

        // Apply styles if provided
        if (styles) {
          if (styles.opacity !== undefined) element.style.opacity = styles.opacity;
          if (styles.textDecoration !== undefined) element.style.textDecoration = styles.textDecoration;
        }

        // Apply classes if provided
        if (classes) {
          element.classList.add(...classes);
        }

        if (debug) {
          console.log(`Element ${index} after:`, {
            classes: element.classList.toString(),
            styles: element.style.cssText
          });
        }
      }
    });

    if (debug) console.log('=== Visual Feedback Applied ===');
  }

  /**
   * Remove visual feedback from text elements within a block
   */
  static removeVisualFeedback({ blockId, styles, classes, debug = false }: VisualFeedbackOptions): void {
    if (debug) console.log('=== Removing Visual Feedback ===');

    const blockElement = this.findBlockElement(blockId, debug);
    if (!blockElement) {
      console.error('Could not find block element with ID:', blockId);
      return;
    }

    if (debug) {
      console.log('Block element found, current classes:', blockElement.classList.toString());
    }

    const textElements = this.findTextElements(blockElement);
    if (debug) {
      console.log('Found text elements for cleanup:', textElements.length);
    }

    textElements.forEach((element, index) => {
      // Only process elements that contain text
      if (element.textContent?.trim()) {
        if (debug) {
          console.log(`Cleaning up element ${index}:`, element.textContent);
          console.log(`Element ${index} before cleanup:`, {
            classes: element.classList.toString(),
            styles: element.style.cssText
          });
        }

        // Remove styles if provided
        if (styles) {
          if (styles.opacity !== undefined) element.style.opacity = '';
          if (styles.textDecoration !== undefined) element.style.textDecoration = '';
        }

        // Remove classes if provided
        if (classes) {
          element.classList.remove(...classes);
        }

        if (debug) {
          console.log(`Element ${index} after cleanup:`, {
            classes: element.classList.toString(),
            styles: element.style.cssText
          });
        }
      }
    });

    if (debug) console.log('=== Visual Feedback Removed ===');
  }
} 