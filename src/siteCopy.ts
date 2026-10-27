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
      introduction: 'SIX 始于六个人，来自风险投资、慈善、文化、法律等不同领域。',
      foundersLabel: '认识发起合伙人',
      foundersHeading: 'SIX 的发起合伙人们',
      foundersPoints: [
        '管理过中国大陆规模最大的性别视角投资（Gender Lens Investing，按 AUM 计）',
        '是中国大陆面向性别多元社群的最大民间支持单位（2025～26 年，按 AUM 计）',
        '是中国有效公益（Effective Giving）社群的早期支持者与建设者',
        '全员出身一线：在科技与互联网企业落地 EDI 最佳实践、主导推进省级反家暴机制、2004 年起创办或主管 3 家行业领先的社会创业项目（social entrepreneurship）',
      ],
      paragraphs: [
        '我们投资的不仅是钱。',
        '我们自己，就是资源，也是方法。',
        '面对新的冒险，我们就是那颗激起涟漪的石子——涟漪散开，就是未来的可能。',
      ],
    },
    work: {
      title: '方法',
      principles: [
        { name: '品味', description: '我们投资于对真实世界的感知，能落地的创造力。' },
        { name: '信任', description: '我们押注志趣相投的创始人，然后陪她们摸爬滚打。' },
        { name: '长期', description: '我们看重从 0 到 1 的全程，包括不限次数的、坦诚的从头再来。' },
      ],
    },
    join: {
      title: '如何加入',
      contributor: {
        heading: '如果你是想加入 SIX 的贡献者（正式会员）',
        paragraph: '10–15k CNY',
      },
      founder: {
        heading: '如果你是需要支持的冒险家——',
        paragraph: '我们给你初创期的判断力、关系、资源（含 Pre-Seed Fund）。我们随时回复你的信息。',
      },
      email: 'xiaozhege@six.com',
      locations: '同时，你可以在北京、上海、香港、多伦多、纽约、密特罗尼西亚见到我们。',
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
      introduction: 'SIX began with six people from venture capital, philanthropy, culture, law, and other fields.',
      foundersLabel: 'Meet the founding partners',
      foundersHeading: 'The founding partners of SIX',
      foundersPoints: [
        'Have managed mainland China’s largest gender-lens investing effort to date, by assets under management (AUM)',
        'Are mainland China’s largest non-governmental funder of gender-diverse communities (2025–26, by AUM)',
        'Were early backers and builders of China’s effective-giving community',
        'All come from the front line: landing best-practice equity, diversity and inclusion (EDI) at technology and internet companies, leading provincial-level anti-domestic-violence programmes, and, since 2004, founding or running three of the sector’s leading social enterprises',
      ],
      paragraphs: [
        'We invest in more than money.',
        'We are resources ourselves, and a way of working.',
        'In every new adventure, we are the stone that sends out ripples—and those ripples open up future possibilities.',
      ],
    },
    work: {
      title: 'Our Approach',
      principles: [
        { name: 'Judgment', description: 'We invest in a clear reading of the real world and creativity that can take shape in it.' },
        { name: 'Trust', description: 'We back founders who share our curiosity, then work alongside them through the hard parts.' },
        { name: 'Long Term', description: 'We care about the full journey from 0 to 1, including every honest chance to begin again.' },
      ],
    },
    join: {
      title: 'Join Us',
      contributor: {
        heading: 'If you want to contribute to SIX (formal membership)',
        paragraph: 'CNY 10–15k',
      },
      founder: {
        heading: 'If you are an adventurer looking for support',
        paragraph: 'We bring early-stage judgment, relationships, and resources, including a Pre-Seed Fund. We are always ready to reply.',
      },
      email: 'xiaozhege@six.com',
      locations: 'You can also find us in Beijing, Shanghai, Hong Kong, Toronto, New York, and Micronesia.',
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
