import { hero } from './config';
import FrameSequence from './components/FrameSequence';
export default function App() {
  return <main><section className="scene" aria-label="三位女性的拼贴场景">
    <img className="background" src={hero.background} width={hero.width} height={hero.height} alt="" />
    <img className="figure figure-leaning" src={hero.leaning.image} width={hero.width} height={hero.height} alt={hero.leaning.label} />
    <img className="figure figure-walker" src={hero.walker.image} width={hero.width} height={hero.height} alt={hero.walker.label} />
    <div className="headline"><small>SIX · 一场价值投资实验</small><h1>与年轻的创业家<br />一起冒险</h1></div>
    <FrameSequence />
  </section></main>;
}
