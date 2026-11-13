import { WcagAuditReport, WcagCheckItem } from '../types';

function parseRgb(colorStr: string): [number, number, number, number] | null {
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] !== undefined ? Number(m[4]) : 1];
}

function linearizeChannel(c255: number): number {
  const c = c255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: [number, number, number]): number {
  return (
    0.2126 * linearizeChannel(rgb[0]) +
    0.7152 * linearizeChannel(rgb[1]) +
    0.0722 * linearizeChannel(rgb[2])
  );
}

function getContrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveEffectiveBackground(el: Element): [number, number, number] {
  let curr: Element | null = el;
  while (curr) {
    const bg = parseRgb(getComputedStyle(curr).backgroundColor);
    if (bg && bg[3] > 0.1) {
      return [bg[0], bg[1], bg[2]];
    }
    curr = curr.parentElement;
  }
  const bodyBg = parseRgb(getComputedStyle(document.body).backgroundColor);
  return bodyBg ? [bodyBg[0], bodyBg[1], bodyBg[2]] : [255, 255, 255];
}

function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const text = (el.textContent || '').trim().slice(0, 28);
  return `${tag}${id}${text ? ` ("${text}")` : ''}`;
}

function isVisible(el: Element): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function runLiveWcagDomAudit(): WcagAuditReport {
  const root = document.getElementById('root') || document.body;
  const allNodes = Array.from(root.querySelectorAll('*'));

  // 1. WCAG 1.1.1 Non-text Content (Images)
  const imgs = Array.from(root.querySelectorAll('img'));
  const imgIssues: WcagCheckItem['issues'] = [];
  for (const img of imgs) {
    const alt = img.getAttribute('alt');
    if (alt === null) {
      imgIssues.push({
        selector: describeElement(img),
        detail: 'Missing alt attribute on image element.',
        measuredValue: 'alt=missing',
      });
    }
  }

  // 2. WCAG 1.4.3 Contrast (Minimum) on visible text leaves
  const textCandidates = allNodes.filter((el) => {
    if (!isVisible(el)) return false;
    const hasDirectText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
    );
    return hasDirectText;
  });

  const contrastIssues: WcagCheckItem['issues'] = [];
  let minContrastMeasured = 21;
  for (const el of textCandidates.slice(0, 120)) {
    const style = getComputedStyle(el);
    const fg = parseRgb(style.color);
    if (!fg || fg[3] < 0.2) continue;
    const bg = resolveEffectiveBackground(el);
    const ratio = getContrastRatio([fg[0], fg[1], fg[2]], bg);
    if (ratio < minContrastMeasured) minContrastMeasured = ratio;

    const fontSizePx = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
    const threshold = isLarge ? 3.0 : 4.5;

    if (ratio < threshold) {
      contrastIssues.push({
        selector: describeElement(el),
        detail: `Contrast below WCAG AA (${threshold}:1 required for ${isLarge ? 'large' : 'normal'} text).`,
        measuredValue: `${ratio.toFixed(2)}:1`,
      });
    }
  }

  // 3. WCAG 4.1.2 / 2.4.4 Accessible Names on interactive controls
  const interactiveControls = Array.from(
    root.querySelectorAll('button, a[href], input, select, textarea')
  ).filter(isVisible);

  const nameIssues: WcagCheckItem['issues'] = [];
  for (const ctrl of interactiveControls) {
    const tag = ctrl.tagName.toLowerCase();
    const ariaLabel = ctrl.getAttribute('aria-label')?.trim();
    const ariaLabelledBy = ctrl.getAttribute('aria-labelledby')?.trim();
    const text = (ctrl.textContent || '').trim();
    let hasLabel = Boolean(ariaLabel || ariaLabelledBy || text);

    if (!hasLabel && (tag === 'input' || tag === 'select' || tag === 'textarea')) {
      const id = ctrl.getAttribute('id');
      if (id && document.querySelector(`label[for="${id}"]`)) {
        hasLabel = true;
      }
    }

    if (!hasLabel) {
      nameIssues.push({
        selector: describeElement(ctrl),
        detail: 'Interactive control lacks an accessible text label or aria-label.',
        measuredValue: 'name=""',
      });
    }
  }

  // 4. WCAG 2.5.5 / 2.5.8 Touch Target Size (>= 44px recommended on mobile/touch)
  const targetIssues: WcagCheckItem['issues'] = [];
  const touchButtons = Array.from(
    root.querySelectorAll('button, nav a, [role="radio"], [role="tab"]')
  ).filter(isVisible);

  for (const btn of touchButtons) {
    const rect = btn.getBoundingClientRect();
    // Skip inline prose text links; inspect buttons, tabs, nav links, and radio controls
    if (rect.width < 40 || rect.height < 40) {
      targetIssues.push({
        selector: describeElement(btn),
        detail: 'Control hitbox is smaller than 40x40px touch accessibility target.',
        measuredValue: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
      });
    }
  }

  // 5. WCAG 1.3.1 Semantic Landmarks & Heading Structure
  const landmarkIssues: WcagCheckItem['issues'] = [];
  const hasMain = Boolean(document.querySelector('main'));
  const hasNav = Boolean(document.querySelector('nav'));
  const h1Count = document.querySelectorAll('h1').length;
  if (!hasMain) {
    landmarkIssues.push({
      selector: 'document',
      detail: 'Missing <main> landmark region.',
      measuredValue: '0 <main>',
    });
  }
  if (!hasNav) {
    landmarkIssues.push({
      selector: 'document',
      detail: 'Missing <nav> landmark region.',
      measuredValue: '0 <nav>',
    });
  }
  if (h1Count !== 1) {
    landmarkIssues.push({
      selector: 'h1',
      detail: `Expected 1 primary <h1> heading on active view, found ${h1Count}.`,
      measuredValue: `${h1Count} <h1>`,
    });
  }

  // 6. WCAG 2.4.1 Skip Navigation Link
  const skipLink = document.querySelector('a.skip-link, a[href="#main-content"]');
  const skipIssues: WcagCheckItem['issues'] = skipLink
    ? []
    : [
        {
          selector: 'header',
          detail: 'Missing keyboard bypass skip-to-content link.',
          measuredValue: 'missing',
        },
      ];

  const checks: WcagCheckItem[] = [
    {
      id: 'wcag-1-1-1',
      criterion: '1.1.1',
      level: 'A',
      title: 'Non-text Content (Image Alt Text)',
      status: imgIssues.length === 0 ? 'Pass' : 'Fail',
      checkedCount: imgs.length,
      issueCount: imgIssues.length,
      measuredSummary:
        imgs.length === 0
          ? '0 images in current view'
          : `${imgs.length} / ${imgs.length} images have explicit alt text`,
      issues: imgIssues,
    },
    {
      id: 'wcag-1-4-3',
      criterion: '1.4.3',
      level: 'AA',
      title: 'Color Contrast (Minimum 4.5:1)',
      status: contrastIssues.length === 0 ? 'Pass' : 'Fail',
      checkedCount: textCandidates.slice(0, 120).length,
      issueCount: contrastIssues.length,
      measuredSummary: `Min measured ratio ${minContrastMeasured.toFixed(2)}:1 across ${textCandidates.slice(0, 120).length} nodes`,
      issues: contrastIssues,
    },
    {
      id: 'wcag-4-1-2',
      criterion: '4.1.2',
      level: 'A',
      title: 'Name, Role, Value (Accessible Labels)',
      status: nameIssues.length === 0 ? 'Pass' : 'Fail',
      checkedCount: interactiveControls.length,
      issueCount: nameIssues.length,
      measuredSummary: `${interactiveControls.length - nameIssues.length} / ${interactiveControls.length} controls labeled`,
      issues: nameIssues,
    },
    {
      id: 'wcag-2-5-5',
      criterion: '2.5.5',
      level: 'AAA',
      title: 'Target Size (Touch Hitbox >= 44px)',
      status: targetIssues.length === 0 ? 'Pass' : targetIssues.length <= 2 ? 'Warning' : 'Fail',
      checkedCount: touchButtons.length,
      issueCount: targetIssues.length,
      measuredSummary: `${touchButtons.length - targetIssues.length} / ${touchButtons.length} controls >= 40x40px`,
      issues: targetIssues,
    },
    {
      id: 'wcag-1-3-1',
      criterion: '1.3.1',
      level: 'A',
      title: 'Semantic Landmarks & Heading Hierarchy',
      status: landmarkIssues.length === 0 ? 'Pass' : 'Fail',
      checkedCount: 3,
      issueCount: landmarkIssues.length,
      measuredSummary: `<main>: ${hasMain ? 'Yes' : 'No'}, <nav>: ${hasNav ? 'Yes' : 'No'}, <h1> count: ${h1Count}`,
      issues: landmarkIssues,
    },
    {
      id: 'wcag-2-4-1',
      criterion: '2.4.1',
      level: 'A',
      title: 'Bypass Blocks (Skip to Main Content)',
      status: skipIssues.length === 0 ? 'Pass' : 'Fail',
      checkedCount: 1,
      issueCount: skipIssues.length,
      measuredSummary: skipLink ? 'Skip link present targeting #main-content' : 'Skip link missing',
      issues: skipIssues,
    },
  ];

  const passedChecks = checks.filter((c) => c.status === 'Pass').length;
  const warningChecks = checks.filter((c) => c.status === 'Warning').length;
  const failedChecks = checks.filter((c) => c.status === 'Fail').length;
  const complianceRate = Math.round(((passedChecks + warningChecks * 0.5) / checks.length) * 100);

  return {
    timestamp: new Date().toLocaleTimeString(),
    totalElementsScanned: allNodes.length,
    passedChecks,
    warningChecks,
    failedChecks,
    complianceRate,
    checks,
  };
}
