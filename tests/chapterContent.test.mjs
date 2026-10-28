import assert from 'node:assert/strict';
import React from 'react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import test from 'node:test';

test('each animation chapter displays Dali’s supplied copy with Chinese punctuation', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: ChapterContent } = await vite.ssrLoadModule('/src/components/ChapterContent.tsx');
    const render = (scene, animationDurationMs = 3000) => renderToStaticMarkup(React.createElement(ChapterContent, { scene, animationDurationMs }));
    const about = render('pink');
    assert.ok(about.includes('SIX 是一场价值投资实验。'));
    assert.ok(about.includes('SIX 始于六个人，来自慈善、风险投资、文化、法律等不同领域。'));
    assert.ok(about.includes('我们投资的不仅是钱。'));
    assert.ok(about.includes('我们自己，就是资源，也是方法。'));

    const work = render('yellow');
    for (const phrase of ['品味', '信任', '长期', '能落地的创造力。', '退出那天的兑现。']) assert.ok(work.includes(phrase));
    assert.ok(!work.includes('我们的 Portfolio'));

    const join = render('beige');
    for (const phrase of ['如果你是想加入 SIX 的贡献者', '10-15k入局+持续贡献，我们能给你一手的信息、一群同频的人、一场值得参与的冒险。', '如果你是需要支持的冒险家——', 'helloworld@sixfund.org', '北京、上海、香港、多伦多、密特罗尼西亚']) assert.ok(join.includes(phrase), `missing original text: ${phrase}`);
  } finally {
    await vite.close();
  }
});

test('chapter copy fades in as separate, staggered text blocks', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: ChapterContent } = await vite.ssrLoadModule('/src/components/ChapterContent.tsx');
    const render = (scene, animationDurationMs = 3000) => renderToStaticMarkup(React.createElement(ChapterContent, { scene, animationDurationMs }));
    const html = render('pink', 3000);
    const delays = [...html.matchAll(/animation-delay:(\d+)ms/g)].map((match) => Number(match[1]));
    assert.equal(delays.length, 7);
    assert.equal(delays[0], 0);
    assert.equal(delays.at(-1) + 320, 2250);
    const styles = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8');
    assert.match(styles, /\.chapter-reveal\s*\{[^}]*animation:[^}]*chapter-fade-in/s);
    assert.match(styles, /@keyframes chapter-fade-in\s*\{\s*from\s*\{[^}]*opacity:\s*0[^}]*\}\s*to\s*\{[^}]*opacity:\s*1/s);
  } finally {
    await vite.close();
  }
});

test('English chapters render English copy and email controls', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: ChapterContent } = await vite.ssrLoadModule('/src/components/ChapterContent.tsx');
    const render = scene => renderToStaticMarkup(React.createElement(ChapterContent, { scene, animationDurationMs: 3000, language: 'en' }));
    const about = render('pink');
    assert.ok(about.includes('About Us'));
    assert.ok(about.includes('SIX is an experiment in value investing.'));
    const work = render('yellow');
    assert.ok(work.includes('Our Approach'));
    assert.ok(work.includes('Judgment'));
    const join = render('beige');
    assert.ok(join.includes('Join Us'));
    assert.ok(join.includes('Email Us'));
    assert.ok(join.includes('Copy Email'));
    assert.ok(join.includes('Send an email to helloworld@sixfund.org'));
    assert.ok(join.includes('Copy email address: helloworld@sixfund.org'));
    assert.match(join, /href="mailto:helloworld@sixfund\.org"/);
    assert.match(join, /<button[^>]*class="join-contact-action join-contact-action--copy"[^>]*type="button"/);
    assert.ok(!/[\u3400-\u9fff]/.test(about + work + join), 'English chapters should contain no Chinese text');
  } finally {
    await vite.close();
  }
});
