import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles-itsm-automation-templates.css'), 'utf8');
const library = readFileSync(resolve(process.cwd(), 'src/itsm/automation/components/TemplateLibrary.tsx'), 'utf8');

describe('Automation desktop layout contracts', () => {
  it('keeps workflow, simulation and version splits until a tablet-sized breakpoint', () => {
    expect(css).not.toContain('@media (max-width: 1500px)');
    expect(css).toContain('@media (max-width: 1050px)');
    expect(css).toContain('grid-template-columns: minmax(340px, .82fr) minmax(470px, 1.18fr)');
  });

  it('owns wide table overflow inside panels rather than the document', () => {
    expect(css).toContain('.itsmAutomationTemplateTablePanel');
    expect(css).toContain('overflow-x: auto');
    expect(library).toContain('responsiveBreakpoint={false}');
    expect(library).toContain('className="itsmAutomationTemplateTable"');
  });

  it('uses a single active schema grid instead of two simultaneous narrow scrollers', () => {
    const schema = readFileSync(resolve(process.cwd(), 'src/itsm/automation/components/SchemaEditor.tsx'), 'utf8');
    expect(schema).toContain("const schemaTabs = ['Input', 'Output']");
    expect(schema).not.toContain('itsmAutomationTwoColumn"><SchemaFields');
  });
});
