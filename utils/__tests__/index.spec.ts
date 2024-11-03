import { describe, expect, it } from 'vitest';

describe('formatRatio', () => {
  it('should format ratio', () => {
    expect(formatRatio(1, 2)).to.be.eql('0.5:1');
    expect(formatRatio(0, 0)).to.be.eql('0:0');
    expect(formatRatio(0, 1)).to.be.eql('0:1');
    expect(formatRatio(1, 0)).to.be.eql('∞:0');
  });
});
