export type Language = 'en' | 'cn';

const copy = {
  cn: {
    home: {
      title: '与年轻的创业家\n一起冒险',
      description: '有想象力、有活力、有胆识的新一代创业者，\n和她们的新冒险。',
      button: '加入我们　→',
    },
    about: {
      title: '我们是谁',
      statement: 'SIX 是一场价值投资实验。',
      paragraphs: [
        [
          'SIX 始于六个人，来自慈善、风险投资、文化、法律等不同领域。',
          '我们身处一个新的时代，想看到有想象力、有活力、有胆识的新一代创业者，和她们的新冒险。',
        ],
        [
          '我们投资的不仅是钱。',
          '我们自己，就是资源，也是方法。',
          '面对新的冒险，我们就是那颗激起涟漪的石子——涟漪散开，就是未来的可能。',
        ],
      ],
    },
    work: {
      title: '方法',
      principles: [
        { name: '品味', description: '我们投资于对真实世界的感知，能落地的创造力。' },
        { name: '信任', description: '我们押注志趣相投的创始人，然后陪她们摸爬滚打。' },
        { name: '长期', description: '我们看重的是从0到1的全程，而非退出那天的兑现。' },
      ],
    },
    join: {
      title: '如何加入',
      contributor: {
        heading: '如果你是想加入 SIX 的贡献者',
        paragraph: '10-15k入局+持续贡献，我们能给你一手的信息、一群同频的人、一场值得参与的冒险。',
      },
      founder: {
        heading: '如果你是需要支持的冒险家——',
        paragraph: '我们给你初创期的判断力、关系和资源，和你需要时，真正的在场。',
      },
      email: 'xiaozhege@six.com',
      locations: '同时，你可以在北京、上海、香港、多伦多、密特罗尼西亚见到我们。',
    },
    ui: {
      language: '语言',
      aboutCaption: '我们是谁',
      workCaption: '方法',
      joinCaption: '加入我们',
      explore: '探索项目',
      scroll: '继续下滑',
      scrollAria: '继续下滑或点击进入下一页',
      home: '返回主页',
      loading: '准备动作…',
      loadError: '动作帧加载失败',
      firstFigure: '点击第一个人物，查看我们是谁并播放站起动作',
      middleFigure: '点击中间黄色人物，查看方法并播放转向镜头的动作',
      thirdFigure: '点击米色区域，查看如何加入并播放第三个人物动画',
      main: 'SIX 官网首页主视觉，可点击人物卡片或向下滚动依次体验三段动作',
      email: '发邮件',
      emailAria: '发送邮件至',
      seatedFigure: '坐着的女性',
      middleFigureImage: '转向镜头的女性',
      walkingFigure: '从左侧走入的女性',
      leaningFigure: '倚墙的女性',
    },
  },
  en: {
    home: {
      title: 'An adventure\nwith young founders',
      description: 'For a new generation of founders with imagination, energy, and courage—and the adventures they set in motion.',
      button: 'Join Us　→',
    },
    about: {
      title: 'About Us',
      statement: 'SIX is an experiment in value investing.',
      paragraphs: [
        [
          'SIX began with six people from philanthropy, venture capital, culture, law, and other fields.',
          'In a new era, we look for a generation of founders with imagination, energy, and courage—and the adventures they set in motion.',
        ],
        [
          'We invest more than capital.',
          'We bring our own resources and our own way of working.',
          'For every new venture, we are the stone that starts a ripple. Each ripple opens up new possibilities.',
        ],
      ],
    },
    work: {
      title: 'Our Approach',
      principles: [
        { name: 'Judgment', description: 'We invest in a clear reading of the real world and creativity that can take shape in it.' },
        { name: 'Trust', description: 'We back founders who share our curiosity, then work alongside them through the hard parts.' },
        { name: 'Long Term', description: 'We care about the full journey from 0 to 1, not just the day of exit.' },
      ],
    },
    join: {
      title: 'Join Us',
      contributor: {
        heading: 'If you want to contribute to SIX',
        paragraph: 'A 10–15k entry contribution, plus ongoing involvement, brings first-hand insight, a circle of like-minded people, and an adventure worth joining.',
      },
      founder: {
        heading: 'If you are a founder looking for support',
        paragraph: 'We bring early-stage judgment, relationships, and resources—and, when you need it, real presence.',
      },
      email: 'xiaozhege@six.com',
      locations: 'You can also find us in Beijing, Shanghai, Hong Kong, Toronto, and Micronesia.',
    },
    ui: {
      language: 'Language',
      aboutCaption: 'About Us',
      workCaption: 'Our Approach',
      joinCaption: 'Join Us',
      explore: 'Explore',
      scroll: 'Scroll to continue',
      scrollAria: 'Scroll down or select to continue to the next page',
      home: 'Back to Home',
      loading: 'Preparing animation…',
      loadError: 'Could not load animation frames',
      firstFigure: 'Select the first figure to learn about SIX and watch her rise',
      middleFigure: 'Select the central figure to explore our approach and watch her turn',
      thirdFigure: 'Select the beige area to learn how to join and watch the final animation',
      main: 'SIX homepage. Select a figure or scroll down to explore the three animated chapters.',
      email: 'Email us',
      emailAria: 'Send an email to',
      seatedFigure: 'Woman seated on the ground',
      middleFigureImage: 'Woman turning toward the camera',
      walkingFigure: 'Woman walking in from the left',
      leaningFigure: 'Woman leaning against a wall',
    },
  },
} as const;

export function getSiteCopy(language: Language) {
  return copy[language];
}

export const siteCopy = copy.cn;
