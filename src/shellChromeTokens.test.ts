import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles-kibana-fidelity.css'), 'utf8');
const capabilityShell = readFileSync(resolve(process.cwd(), 'src/itsm/components/CapabilityShell.tsx'), 'utf8');

function luminance(hex: string) {
  const values = hex.slice(1).match(/../g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const [red, green, blue] = values.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe('dark shell chrome tokens', () => {
  it('keeps normal and selected navigation text above the normal-text contrast target', () => {
    expect(contrast('#9fb0c8', '#07101f')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#f8fafc', '#173256')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#71829b', '#07101f')).toBeGreaterThanOrEqual(4.5);
  });

  it('uses shell-owned tokens for sidebar states instead of light content text tokens', () => {
    expect(css).toContain('--shell-chrome-text: #c8d4e5');
    expect(css).toContain('.appShell .sidebar .euiSideNavItemButton');
    expect(css).toContain('color: var(--shell-chrome-muted)');
    expect(css).toContain('.appShell .sidebar .euiSideNavItemButton-isSelected');
    expect(css).toContain('background: var(--shell-chrome-selected)');
  });

  it('uses a compact, overflow-safe governance disclosure instead of four wide badges', () => {
    expect(capabilityShell).toContain('data-shell-governance="compact"');
    expect(capabilityShell).toContain('<EuiPopover');
    expect((capabilityShell.match(/<EuiBadge/g) ?? [])).toHaveLength(1);
    expect(capabilityShell).toContain('Queued or accepted is not completed.');
  });

});
