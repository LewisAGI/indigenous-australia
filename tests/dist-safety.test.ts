import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('dist cultural safety', () => {
  it('greps every dist file for Kuniya and Liru', () => {
    expect(existsSync('dist/catalog.json'), 'run npm run build before this test').toBe(true);
    expect(grepDist('Kuniya')).toBe('');
    expect(grepDist('Liru')).toBe('');
  });

  it('greps every dist file for private notes and names', () => {
    expect(existsSync('dist/catalog.json'), 'run npm run build before this test').toBe(true);
    ['RECOMMEND', 'Check with', 'ICIP', 'Mawalan', 'Milpirrum', 'Koiki', 'Mabo'].forEach((phrase) => {
      expect(grepDist(phrase), phrase).toBe('');
    });
  });
});

function grepDist(phrase: string): string {
  try {
    return execFileSync('grep', ['-R', '-a', '-F', '-n', phrase, 'dist'], { encoding: 'utf8' });
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string };
    if (failed.status === 1) return '';
    throw new Error(failed.stderr || failed.stdout || 'grep failed');
  }
}
