import { useEffect, useState, type CSSProperties } from 'react';
import { getSiteCopy, type Language } from '../siteCopy';
import { staggeredRevealDelays, type ChapterScene } from '../chapterContentTiming';

export default function ChapterContent({ scene, animationDurationMs, language = 'cn', editorStyle, pageText = {} }: { scene: ChapterScene | null; animationDurationMs: number; language?: Language; editorStyle?: CSSProperties; pageText?: Record<string, string> }) {
  const [activeFounder, setActiveFounder] = useState<number | null>(null);
  useEffect(() => {
    if (scene !== 'founders') { setActiveFounder(null); return; }
    const chapter = document.querySelector<HTMLElement>('.chapter-content--founders');
    if (!chapter) return;
    const onScroll = () => {
      if (chapter.scrollTop <= 0) return;
      const items = [...chapter.querySelectorAll<HTMLElement>('[data-founder-claim]')];
      const center = chapter.getBoundingClientRect().top + chapter.clientHeight * 0.48;
      const closest = items.reduce<{ index: number; distance: number } | null>((best, item) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - center);
        const index = Number(item.dataset.founderClaim);
        return !best || distance < best.distance ? { index, distance } : best;
      }, null);
      if (closest && closest.distance < chapter.clientHeight * 0.22) setActiveFounder(closest.index);
    };
    chapter.addEventListener('scroll', onScroll, { passive: true });
    return () => chapter.removeEventListener('scroll', onScroll);
  }, [scene]);
  if (!scene || scene === 'home') return null;
  const siteCopy = getSiteCopy(language);
  const text = (key: string, fallback: string) => pageText[`${language}.${scene}.${key}`] ?? fallback;

  if (scene === 'pink') {
    const delays = staggeredRevealDelays(3 + siteCopy.about.paragraphs.length, animationDurationMs);
    return <section className="chapter-content chapter-content--pink" aria-labelledby="chapter-about-title" tabIndex={0} style={editorStyle}>
      <div className="about-page-inner">
        <h2 id="chapter-about-title" className="chapter-reveal" style={{ animationDelay: `${delays[0]}ms` }}>{text('title', siteCopy.about.title)}</h2>
        <p className="chapter-statement chapter-reveal" style={{ animationDelay: `${delays[1]}ms` }}>{text('statement', siteCopy.about.statement)}</p>
        <p className="about-introduction chapter-reveal" style={{ animationDelay: `${delays[2]}ms` }}>{text('introduction', siteCopy.about.introduction)}</p>
        {siteCopy.about.paragraphs.length > 0 && <div className="about-closing">
          {siteCopy.about.paragraphs.map((sentence, index) => <p className="chapter-reveal" style={{ animationDelay: `${delays[index + 3]}ms` }} key={sentence}>{sentence}</p>)}
        </div>}
      </div>
    </section>;
  }

  if (scene === 'founders') {
    const foundersHeading = text('heading', siteCopy.about.foundersHeading);
    return <section className="chapter-content chapter-content--founders" aria-labelledby="chapter-founders-title" tabIndex={0} style={editorStyle}>
      <div className="founders-page-inner">
        <div className="founders-page-heading chapter-reveal">
          <h2 id="chapter-founders-title">
            {foundersHeading.startsWith('SIX')
              ? <><span className="founders-heading-brand">SIX</span>{foundersHeading.slice(3)}</>
              : foundersHeading}
          </h2>
        </div>
        <ol className="founders-claims">{siteCopy.about.foundersPoints.map((point, index) => { const content = text(`point${index}`, point); return <li className="chapter-reveal" style={{ animationDelay: `${120 + index * 90}ms` }} key={index} data-founder-claim={index}>
          <button type="button" className={`founder-claim${activeFounder === index ? ' is-active' : ''}`} aria-pressed={activeFounder === index} onClick={() => setActiveFounder(activeFounder === index ? null : index)}>
            <span>{String(index + 1).padStart(2, '0')}</span><p>{content}</p>
          </button>
        </li>; })}</ol>
      </div>
    </section>;
  }

  if (scene === 'yellow') {
    const delays = staggeredRevealDelays(1 + siteCopy.work.principles.length, animationDurationMs);
    return <section className="chapter-content chapter-content--yellow" aria-labelledby="chapter-work-title" tabIndex={0} style={editorStyle}>
      <h2 id="chapter-work-title" className="chapter-reveal" style={{ animationDelay: `${delays[0]}ms` }}>{text('title', siteCopy.work.title)}</h2>
      <ol className="work-principles">
        {siteCopy.work.principles.map(({ name, description }, index) => <li className="chapter-reveal" style={{ animationDelay: `${delays[index + 1]}ms` }} key={index}><strong>{text(`name${index}`, name)}</strong><p>{text(`description${index}`, description)}</p></li>)}
      </ol>
    </section>;
  }

  const delays = staggeredRevealDelays(7, animationDurationMs);
  const contributorHeading = text('contributorHeading', siteCopy.join.contributor.heading).replace(/\s+/g, ' ');
  const contributorHeadingParts = contributorHeading.split(/(成为|正式会员|正式成员)/g);
  return <section className="chapter-content chapter-content--beige" aria-labelledby="chapter-join-title" tabIndex={0} style={editorStyle}>
    <h2 id="chapter-join-title" className="chapter-reveal" style={{ animationDelay: `${delays[0]}ms` }}>{text('title', siteCopy.join.title)}</h2>
    <div className="join-path join-path--contributor">
      <h3 className="chapter-reveal" style={{ animationDelay: `${delays[1]}ms` }}>{contributorHeadingParts.map((part, index) => /^(成为|正式会员|正式成员)$/.test(part) ? <span className="join-heading-keep" key={index}>{part}</span> : part)}</h3>
      <p className="join-contribution-amount chapter-reveal" style={{ animationDelay: `${delays[2]}ms` }}>{text('contributorParagraph', siteCopy.join.contributor.paragraph)}</p>
    </div>
    <div className="join-path join-path--founder">
      <h3 className="chapter-reveal" style={{ animationDelay: `${delays[3]}ms` }}>{text('founderHeading', siteCopy.join.founder.heading)}</h3>
      <p className="chapter-reveal" style={{ animationDelay: `${delays[4]}ms` }}>{text('founderParagraph', siteCopy.join.founder.paragraph)}</p>
    </div>
    <div className="join-contact chapter-reveal" style={{ animationDelay: `${delays[5]}ms` }}>
      <a href={`mailto:${text('email', siteCopy.join.email)}`} aria-label={`${siteCopy.ui.emailAria} ${text('email', siteCopy.join.email)}`}>
        <svg className="join-email-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></svg>
        <span className="join-email-action">{siteCopy.ui.email}</span>
      </a>
    </div>
    <p className="chapter-reveal" style={{ animationDelay: `${delays[6]}ms` }}>{text('locations', siteCopy.join.locations)}</p>
  </section>;
}
