import { useState } from 'react';
import { getSiteCopy, type Language } from '../siteCopy';
import { staggeredRevealDelays, type ChapterScene } from '../chapterContentTiming';

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Could not copy email address');
}

export default function ChapterContent({ scene, animationDurationMs, language = 'cn' }: { scene: ChapterScene | null; animationDurationMs: number; language?: Language }) {
  const [emailCopied, setEmailCopied] = useState(false);
  if (!scene || scene === 'home') return null;
  const siteCopy = getSiteCopy(language);

  async function handleCopyEmail() {
    try {
      await copyText(siteCopy.join.email);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 1800);
    } catch {
      setEmailCopied(false);
    }
  }

  if (scene === 'pink') {
    const delays = staggeredRevealDelays(2 + siteCopy.about.paragraphs.flat().length, animationDurationMs);
    return <section className="chapter-content chapter-content--pink" aria-labelledby="chapter-about-title" tabIndex={0}>
      <h2 id="chapter-about-title" className="chapter-reveal" style={{ animationDelay: `${delays[0]}ms` }}>{siteCopy.about.title}</h2>
      <p className="chapter-statement chapter-reveal" style={{ animationDelay: `${delays[1]}ms` }}>{siteCopy.about.statement}</p>
      {siteCopy.about.paragraphs.flat().map((sentence, index) => <p className="chapter-reveal" style={{ animationDelay: `${delays[index + 2]}ms` }} key={sentence}>{sentence}</p>)}
    </section>;
  }

  if (scene === 'yellow') {
    const delays = staggeredRevealDelays(1 + siteCopy.work.principles.length, animationDurationMs);
    return <section className="chapter-content chapter-content--yellow" aria-labelledby="chapter-work-title" tabIndex={0}>
      <h2 id="chapter-work-title" className="chapter-reveal" style={{ animationDelay: `${delays[0]}ms` }}>{siteCopy.work.title}</h2>
      <ol className="work-principles">
        {siteCopy.work.principles.map(({ name, description }, index) => <li className="chapter-reveal" style={{ animationDelay: `${delays[index + 1]}ms` }} key={name}><strong>{name}</strong><p>{description}</p></li>)}
      </ol>
    </section>;
  }

  const delays = staggeredRevealDelays(7, animationDurationMs);
  return <section className="chapter-content chapter-content--beige" aria-labelledby="chapter-join-title" tabIndex={0}>
    <h2 id="chapter-join-title" className="chapter-reveal" style={{ animationDelay: `${delays[0]}ms` }}>{siteCopy.join.title}</h2>
    <div className="join-path join-path--contributor">
      <h3 className="chapter-reveal" style={{ animationDelay: `${delays[1]}ms` }}>{siteCopy.join.contributor.heading}</h3>
      <p className="chapter-reveal" style={{ animationDelay: `${delays[2]}ms` }}>{siteCopy.join.contributor.paragraph}</p>
    </div>
    <div className="join-path join-path--founder">
      <h3 className="chapter-reveal" style={{ animationDelay: `${delays[3]}ms` }}>{siteCopy.join.founder.heading}</h3>
      <p className="chapter-reveal" style={{ animationDelay: `${delays[4]}ms` }}>{siteCopy.join.founder.paragraph}</p>
    </div>
    <div className="join-contact chapter-reveal" style={{ animationDelay: `${delays[5]}ms` }}>
      <a className="join-contact-action join-contact-action--email" href={`mailto:${siteCopy.join.email}`} aria-label={`${siteCopy.ui.emailAria} ${siteCopy.join.email}`}>
        <span className="join-email-action">{siteCopy.ui.email}</span>
        <svg className="join-action-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
      </a>
      <button className="join-contact-action join-contact-action--copy" type="button" onClick={handleCopyEmail} aria-label={`${siteCopy.ui.copyEmailAria}: ${siteCopy.join.email}`}>
        <svg className="join-copy-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="11" height="13" rx="2" /><rect x="3" y="8" width="11" height="13" rx="2" /></svg>
        <span aria-live="polite">{emailCopied ? siteCopy.ui.emailCopied : siteCopy.ui.copyEmail}</span>
      </button>
    </div>
    <p className="chapter-reveal" style={{ animationDelay: `${delays[6]}ms` }}>{siteCopy.join.locations}</p>
  </section>;
}
