import { siteCopy } from '../siteCopy';
import { staggeredRevealDelays, type ChapterScene } from '../chapterContentTiming';

export default function ChapterContent({ scene, animationDurationMs }: { scene: ChapterScene | null; animationDurationMs: number }) {
  if (!scene || scene === 'home') return null;

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
      <a href={`mailto:${siteCopy.join.email}`}>{siteCopy.join.email}</a>
    </div>
    <p className="chapter-reveal" style={{ animationDelay: `${delays[6]}ms` }}>{siteCopy.join.locations}</p>
  </section>;
}
