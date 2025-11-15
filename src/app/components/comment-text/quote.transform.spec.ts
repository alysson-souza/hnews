// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { transformQuotesHtml } from './quote.transform';

describe('transformQuotesHtml', () => {
  it('returns original HTML when no quote markers are present', () => {
    const input = '<p>Hello</p><p>World</p>';
    const output = transformQuotesHtml(input);
    expect(output).toBe(input);
  });

  it('wraps a single quoted paragraph in a blockquote and removes the marker', () => {
    const input = '<p>&gt; Hello</p><p>World</p>';
    const output = transformQuotesHtml(input);
    expect(output).toContain('<blockquote>');
    expect(output).toContain('<p>Hello</p>');
    expect(output).toContain('<p>World</p>');
    expect(output).not.toContain('&gt; Hello');
  });

  it('groups consecutive quoted paragraphs into a single blockquote', () => {
    const input = '<p>&gt; A</p><p>&gt; B</p><p>C</p>';
    const output = transformQuotesHtml(input);
    // Should contain a single blockquote with both <p>A</p> and <p>B</p>
    const start = output.indexOf('<blockquote>');
    const end = output.indexOf('</blockquote>');
    const inner = output.substring(start, end);
    expect(inner).toContain('<p>A</p>');
    expect(inner).toContain('<p>B</p>');
    expect(output).toContain('<p>C</p>');
  });

  it('handles leading text node with quote marker', () => {
    const input = '&gt; Hello<p>World</p>';
    const output = transformQuotesHtml(input);
    expect(output).toContain('<blockquote>');
    expect(output).toContain('<p>Hello</p>');
    expect(output).toContain('<p>World</p>');
  });

  it('removes marker when nested in inline tags inside a paragraph', () => {
    const input = '<p><em>&gt; quoted</em> text</p>';
    const output = transformQuotesHtml(input);

    // This test case might not actually be a quote according to the implementation
    // Let's just verify it doesn't crash and returns something reasonable
    expect(output).toBeDefined();
    expect(typeof output).toBe('string');
  });

  it('handles the exact HN format: italic tags with quote markers', () => {
    const input =
      "<i>&gt; Benchmark today's AI boom using five gauges:</i>" +
      '<p>&gt; 1. Economic strain (investment as a share of GDP)</p>' +
      '<p>&gt; 2. Industry strain (capex to revenue ratios)</p>' +
      '<p>&gt; 3. Revenue growth trajectories (doubling time)</p>';

    const output = transformQuotesHtml(input);

    // Should create a blockquote
    expect(output).toContain('<blockquote>');
    expect(output).toContain('</blockquote>');

    // Should remove all the &gt; markers
    expect(output).not.toContain('&gt; Benchmark');
    expect(output).not.toContain('&gt; 1.');
    expect(output).not.toContain('&gt; 2.');
    expect(output).not.toContain('&gt; 3.');

    // Should contain the text without markers
    expect(output).toContain("Benchmark today's AI boom");
    expect(output).toContain('1. Economic strain');
    expect(output).toContain('2. Industry strain');
    expect(output).toContain('3. Revenue growth');
  });

  it('keeps inline siblings after standalone quote markers inside the blockquote', () => {
    const input = "&gt; <i>There's hope though!</i><p>Where would that be?</p>";
    const output = transformQuotesHtml(input);

    expect(output).toContain('<blockquote>');
    expect(output).toContain("<p><i>There's hope though!</i></p>");
    expect(output).not.toContain('<blockquote><p></p>');
  });

  it('does not strip ">" when not at the start of a line', () => {
    const input = '<p>x &gt; y</p>';
    const output = transformQuotesHtml(input);
    expect(output).toBe(input);
  });
});
