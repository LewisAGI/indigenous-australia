import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('dist cultural safety', () => {
  it('greps every dist file for Kuniya and Liru', () => {
    expect(existsSync('dist/catalog.json'), 'run npm run build before this test').toBe(true);
    expect(grepDist('Kuniya')).toBe('');
    expect(grepDist('Liru')).toBe('');
  });

  it('greps every dist file for Budj Bim and Bunjil', () => {
    expect(existsSync('dist/catalog.json'), 'run npm run build before this test').toBe(true);
    expect(grepDist('Budj Bim')).toBe('');
    expect(grepDist('Bunjil')).toBe('');
  });

  it('greps every dist file for private notes and names', () => {
    expect(existsSync('dist/catalog.json'), 'run npm run build before this test').toBe(true);
    ['RECOMMEND', 'Check with', 'ICIP', 'Mawalan', 'Milpirrum', 'Koiki', 'Eddie Mabo', 'Benny Mabo'].forEach((phrase) => {
      expect(grepDist(phrase), phrase).toBe('');
    });
  });

  it('greps every dist file and finds Gail Mabo', () => {
    expect(existsSync('dist/catalog.json'), 'run npm run build before this test').toBe(true);
    expect(grepDist('Gail Mabo')).toContain('Gail Mabo');
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
