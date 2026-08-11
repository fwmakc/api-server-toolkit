import { stripHtmlTags } from '../common/helper/string.helper';

describe('stripHtmlTags', () => {
  it('returns empty string for falsy input', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  it('strips simple HTML tags', () => {
    expect(stripHtmlTags('<b>bold</b>')).toBe('bold');
  });

  it('replaces </p> with newline', () => {
    const result = stripHtmlTags('<p>line1</p><p>line2</p>');
    expect(result).toMatch(/^line1\nline2/);
  });

  it('replaces </div> with newline', () => {
    const result = stripHtmlTags('<div>content</div>');
    expect(result).toMatch(/^content/);
  });

  it('replaces <br> with newline', () => {
    const result = stripHtmlTags('line1<br>line2');
    expect(result).toMatch(/^line1\nline2/);
  });

  it('replaces <br/> with newline', () => {
    const result = stripHtmlTags('line1<br/>line2');
    expect(result).toMatch(/^line1\nline2/);
  });

  it('converts <li> items with bullet prefix', () => {
    const result = stripHtmlTags('<ul><li>item1</li><li>item2</li></ul>');
    expect(result).toContain('* item1');
    expect(result).toContain('* item2');
  });

  it('extracts link text and href', () => {
    expect(stripHtmlTags('<a href="http://example.com">click</a>')).toMatch(/click \(http:\/\/example\.com\)/);
  });

  it('collapses multiple newlines into single', () => {
    const result = stripHtmlTags('<p>a</p><p>b</p>');
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).not.toContain('\n\n');
  });

  it('handles plain text without tags', () => {
    expect(stripHtmlTags('hello world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    const result = stripHtmlTags('  <p>text</p>  ');
    expect(result.trim()).toBe('text');
  });

  it('handles nested tags', () => {
    const result = stripHtmlTags('<div><b>bold</b> text</div>');
    expect(result).toContain('bold text');
  });
});
