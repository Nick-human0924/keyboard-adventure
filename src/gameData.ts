// ============ Game Data ============

export interface ContentItem {
  id: string;
  text: string;
  meaningCn: string;
  type: 'letter' | 'combo' | 'word' | 'phrase';
  stage: number;
}

export interface WaveConfig {
  name: string;
  nameEn: string;
  typeWeights: { letter: number; combo: number; word: number; phrase: number };
  maxStage: number;
  timeMultiplier: number;
  count: number;
}

export interface Monster {
  id: string;
  name: string;
  nameCn: string;
  image: string;
  hp: number;
  maxHp: number;
  attackDamage: number;
  waves: WaveConfig[];
  description: string;
  isBoss: boolean;
  baseXp: number;
  baseCoins: number;
}

export interface MapEntity {
  id: string;
  type: 'monster' | 'coin' | 'chest' | 'flag';
  x: number;
  y: number;
  monsterId?: string;
  collected?: boolean;
  opened?: boolean;
}

export interface LevelDef {
  id: string;
  name: string;
  monsterId: string;
  unlockRequirement: string | null;
  worldId: string;
  stage: number;
}

export interface WorldDef {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  theme: string;
  levels: LevelDef[];
  bgColor: string;
  locked: boolean;
}

// ============ Content Library - 8 Stage Difficulty System ============
// Stage 0: Home row letters + G,H (9 items) - absolute beginner
// Stage 1A: Other single letters A-Z (26 items)
// Stage 1B: Home row adjacent combos (8)
// Stage 1C: Top row adjacent combos (9)
// Stage 1D: Bottom row adjacent combos (6)
// Stage 1E: Vertical adjacent combos (18) - same finger, different rows
// Stage 1F: Cross-hand combos (20) - left to right hand transition
// Stage 1G: Diagonal / stretch combos (20) - challenging finger stretches
// Stage 2: 2-letter words (80)
// Stage 3: 3-letter CVC words (120)
// Stage 4: 4-6 letter words (120)
// Stage 5: 7-10 letter words (80)
// Stage 6: Short phrases (40)
// Stage 7: Longer sentences (20)

// Stage 0: Home row + G,H (9 items)
const stage0Letters: ContentItem[] = [
  { id: 's0_0', text: 'A', meaningCn: '字母A，左手小指', type: 'letter', stage: 0 },
  { id: 's0_1', text: 'S', meaningCn: '字母S，左手中指', type: 'letter', stage: 0 },
  { id: 's0_2', text: 'D', meaningCn: '字母D，左手食指', type: 'letter', stage: 0 },
  { id: 's0_3', text: 'F', meaningCn: '字母F，左手食指', type: 'letter', stage: 0 },
  { id: 's0_4', text: 'G', meaningCn: '字母G，左手食指右移', type: 'letter', stage: 0 },
  { id: 's0_5', text: 'H', meaningCn: '字母H，右手食指左移', type: 'letter', stage: 0 },
  { id: 's0_6', text: 'J', meaningCn: '字母J，右手食指', type: 'letter', stage: 0 },
  { id: 's0_7', text: 'K', meaningCn: '字母K，右手中指', type: 'letter', stage: 0 },
  { id: 's0_8', text: 'L', meaningCn: '字母L，右手无名指', type: 'letter', stage: 0 },
];

// Stage 1A: Other single letters (26 items, full A-Z coverage)
const stage1Letters: ContentItem[] = 'QWERTYUIOPZXCVBNM'.split('').map((ch) => {
  const meanings: Record<string, string> = {
    Q: '字母Q，左手小指上排', W: '字母W，左手无名指上排', E: '字母E，左手中指上排',
    R: '字母R，左手食指上排', T: '字母T，左手食指上排', Y: '字母Y，右手食指上排',
    U: '字母U，右手食指上排', I: '字母I，右手中指上排', O: '字母O，右手无名指上排',
    P: '字母P，右手小指上排', Z: '字母Z，左手小指下排', X: '字母X，左手无名指下排',
    C: '字母C，左手中指下排', V: '字母V，左手食指下排', B: '字母B，右手食指下排',
    N: '字母N，右手食指下排', M: '字母M，右手中指下排',
  };
  return { id: `s1a_${ch}`, text: ch, meaningCn: meanings[ch] || `字母${ch}`, type: 'letter' as const, stage: 1 };
});

// Stage 1B: Home row adjacent combos (8) - most natural finger rolls
const stage1BCombos: ContentItem[] = [
  { id: 's1b_as', text: 'as', meaningCn: '小指→中指，左手滚入', type: 'combo', stage: 1 },
  { id: 's1b_sa', text: 'sa', meaningCn: '中指→小指，左手滚出', type: 'combo', stage: 1 },
  { id: 's1b_sd', text: 'sd', meaningCn: '中指→食指，左手滚入', type: 'combo', stage: 1 },
  { id: 's1b_ds', text: 'ds', meaningCn: '食指→中指，左手滚出', type: 'combo', stage: 1 },
  { id: 's1b_df', text: 'df', meaningCn: '中指→食指，左手并拢', type: 'combo', stage: 1 },
  { id: 's1b_fd', text: 'fd', meaningCn: '食指→中指，左手并拢', type: 'combo', stage: 1 },
  { id: 's1b_fg', text: 'fg', meaningCn: '食指跨键，左手伸展', type: 'combo', stage: 1 },
  { id: 's1b_gf', text: 'gf', meaningCn: '食指回缩，左手收紧', type: 'combo', stage: 1 },
  { id: 's1b_gh', text: 'gh', meaningCn: '双手食指，中央过渡', type: 'combo', stage: 1 },
  { id: 's1b_hg', text: 'hg', meaningCn: '右手→左手，中央回移', type: 'combo', stage: 1 },
  { id: 's1b_hj', text: 'hj', meaningCn: '右手食指，中央过渡', type: 'combo', stage: 1 },
  { id: 's1b_jh', text: 'jh', meaningCn: '食指回左，右手收紧', type: 'combo', stage: 1 },
  { id: 's1b_jk', text: 'jk', meaningCn: '食指→中指，右手并拢', type: 'combo', stage: 1 },
  { id: 's1b_kj', text: 'kj', meaningCn: '中指→食指，右手并拢', type: 'combo', stage: 1 },
  { id: 's1b_kl', text: 'kl', meaningCn: '中指→无名指，右手滚入', type: 'combo', stage: 1 },
  { id: 's1b_lk', text: 'lk', meaningCn: '无名指→中指，右手滚出', type: 'combo', stage: 1 },
];

// Stage 1C: Top row adjacent combos (9)
const stage1CCombos: ContentItem[] = [
  { id: 's1c_qw', text: 'qw', meaningCn: '上排小指→无名指，左手', type: 'combo', stage: 1 },
  { id: 's1c_wq', text: 'wq', meaningCn: '上排无名指→小指，左手', type: 'combo', stage: 1 },
  { id: 's1c_we', text: 'we', meaningCn: '上排无名指→中指，左手', type: 'combo', stage: 1 },
  { id: 's1c_ew', text: 'ew', meaningCn: '上排中指→无名指，左手', type: 'combo', stage: 1 },
  { id: 's1c_er', text: 'er', meaningCn: '上排中指→食指，左手', type: 'combo', stage: 1 },
  { id: 's1c_re', text: 're', meaningCn: '上排食指→中指，左手', type: 'combo', stage: 1 },
  { id: 's1c_rt', text: 'rt', meaningCn: '上排食指并拢，左手', type: 'combo', stage: 1 },
  { id: 's1c_tr', text: 'tr', meaningCn: '上排食指并拢，左手', type: 'combo', stage: 1 },
  { id: 's1c_ty', text: 'ty', meaningCn: '上排双手食指，中央', type: 'combo', stage: 1 },
  { id: 's1c_yt', text: 'yt', meaningCn: '上排右手→左手，中央', type: 'combo', stage: 1 },
  { id: 's1c_yu', text: 'yu', meaningCn: '上排右手食指并拢', type: 'combo', stage: 1 },
  { id: 's1c_uy', text: 'uy', meaningCn: '上排右手食指并拢', type: 'combo', stage: 1 },
  { id: 's1c_ui', text: 'ui', meaningCn: '上排食指→中指，右手', type: 'combo', stage: 1 },
  { id: 's1c_iu', text: 'iu', meaningCn: '上排中指→食指，右手', type: 'combo', stage: 1 },
  { id: 's1c_io', text: 'io', meaningCn: '上排中指→无名指，右手', type: 'combo', stage: 1 },
  { id: 's1c_oi', text: 'oi', meaningCn: '上排无名指→中指，右手', type: 'combo', stage: 1 },
  { id: 's1c_op', text: 'op', meaningCn: '上排无名指→小指，右手', type: 'combo', stage: 1 },
  { id: 's1c_po', text: 'po', meaningCn: '上排小指→无名指，右手', type: 'combo', stage: 1 },
];

// Stage 1D: Bottom row adjacent combos (6)
const stage1DCombos: ContentItem[] = [
  { id: 's1d_zx', text: 'zx', meaningCn: '下排小指→无名指，左手', type: 'combo', stage: 1 },
  { id: 's1d_xz', text: 'xz', meaningCn: '下排无名指→小指，左手', type: 'combo', stage: 1 },
  { id: 's1d_xc', text: 'xc', meaningCn: '下排无名指→中指，左手', type: 'combo', stage: 1 },
  { id: 's1d_cx', text: 'cx', meaningCn: '下排中指→无名指，左手', type: 'combo', stage: 1 },
  { id: 's1d_cv', text: 'cv', meaningCn: '下排中指→食指，左手', type: 'combo', stage: 1 },
  { id: 's1d_vc', text: 'vc', meaningCn: '下排食指→中指，左手', type: 'combo', stage: 1 },
  { id: 's1d_vb', text: 'vb', meaningCn: '下排双手食指，中央', type: 'combo', stage: 1 },
  { id: 's1d_bv', text: 'bv', meaningCn: '下排右手→左手，中央', type: 'combo', stage: 1 },
  { id: 's1d_bn', text: 'bn', meaningCn: '下排右手食指并拢', type: 'combo', stage: 1 },
  { id: 's1d_nb', text: 'nb', meaningCn: '下排右手食指并拢', type: 'combo', stage: 1 },
  { id: 's1d_nm', text: 'nm', meaningCn: '下排食指→中指，右手', type: 'combo', stage: 1 },
  { id: 's1d_mn', text: 'mn', meaningCn: '下排中指→食指，右手', type: 'combo', stage: 1 },
];

// Stage 1E: Vertical adjacent combos - same finger, different rows (18)
const stage1ECombos: ContentItem[] = [
  // Left hand vertical
  { id: 's1e_qa', text: 'qa', meaningCn: '小指上→下，Q→A', type: 'combo', stage: 1 },
  { id: 's1e_aq', text: 'aq', meaningCn: '小指下→上，A→Q', type: 'combo', stage: 1 },
  { id: 's1e_az', text: 'az', meaningCn: '小指下→更下，A→Z', type: 'combo', stage: 1 },
  { id: 's1e_za', text: 'za', meaningCn: '小指最下→中，Z→A', type: 'combo', stage: 1 },
  { id: 's1e_qz', text: 'qz', meaningCn: '小指大跳，Q→Z', type: 'combo', stage: 1 },
  { id: 's1e_zq', text: 'zq', meaningCn: '小指大跳，Z→Q', type: 'combo', stage: 1 },
  { id: 's1e_ws', text: 'ws', meaningCn: '无名指上→下，W→S', type: 'combo', stage: 1 },
  { id: 's1e_sw', text: 'sw', meaningCn: '无名指下→上，S→W', type: 'combo', stage: 1 },
  { id: 's1e_sx', text: 'sx', meaningCn: '无名指下→更下，S→X', type: 'combo', stage: 1 },
  { id: 's1e_xs', text: 'xs', meaningCn: '无名指最下→中，X→S', type: 'combo', stage: 1 },
  { id: 's1e_ed', text: 'ed', meaningCn: '中指上→下，E→D', type: 'combo', stage: 1 },
  { id: 's1e_de', text: 'de', meaningCn: '中指下→上，D→E', type: 'combo', stage: 1 },
  { id: 's1e_dc', text: 'dc', meaningCn: '中指下→更下，D→C', type: 'combo', stage: 1 },
  { id: 's1e_cd', text: 'cd', meaningCn: '中指最下→中，C→D', type: 'combo', stage: 1 },
  // Right hand vertical
  { id: 's1e_ju', text: 'ju', meaningCn: '食指上→上排，J→U', type: 'combo', stage: 1 },
  { id: 's1e_uj', text: 'uj', meaningCn: '上排→食指，U→J', type: 'combo', stage: 1 },
  { id: 's1e_ki', text: 'ki', meaningCn: '中指上→上排，K→I', type: 'combo', stage: 1 },
  { id: 's1e_ik', text: 'ik', meaningCn: '上排→中指，I→K', type: 'combo', stage: 1 },
  { id: 's1e_lo', text: 'lo', meaningCn: '无名指上→上排，L→O', type: 'combo', stage: 1 },
  { id: 's1e_ol', text: 'ol', meaningCn: '上排→无名指，O→L', type: 'combo', stage: 1 },
];

// Stage 1F: Cross-hand combos - left hand to right hand transition (20)
const stage1FCombos: ContentItem[] = [
  { id: 's1f_ag', text: 'ag', meaningCn: '左手小指→左手食指伸展', type: 'combo', stage: 1 },
  { id: 's1f_ah', text: 'ah', meaningCn: '左手小指→右手食指，跨手', type: 'combo', stage: 1 },
  { id: 's1f_aj', text: 'aj', meaningCn: '左手小指→右手食指，跨手', type: 'combo', stage: 1 },
  { id: 's1f_ak', text: 'ak', meaningCn: '左手小指→右手中指，跨手', type: 'combo', stage: 1 },
  { id: '1f_fj', text: 'fj', meaningCn: '左手食指→右手食指，基准跨手', type: 'combo', stage: 1 },
  { id: 's1f_fk', text: 'fk', meaningCn: '左手食指→右手中指，跨手', type: 'combo', stage: 1 },
  { id: 's1f_fl', text: 'fl', meaningCn: '左手食指→右手无名指，跨手', type: 'combo', stage: 1 },
  { id: 's1f_gj', text: 'gj', meaningCn: '双手食指左跨，中央', type: 'combo', stage: 1 },
  { id: 's1f_gk', text: 'gk', meaningCn: '左手食指→右手中指', type: 'combo', stage: 1 },
  { id: 's1f_gl', text: 'gl', meaningCn: '左手食指→右手无名指', type: 'combo', stage: 1 },
  { id: 's1f_ha', text: 'ha', meaningCn: '右手食指→左手小指，大跨手', type: 'combo', stage: 1 },
  { id: 's1f_hd', text: 'hd', meaningCn: '右手食指→左手食指，跨手', type: 'combo', stage: 1 },
  { id: 's1f_hf', text: 'hf', meaningCn: '右手食指→左手食指，跨手', type: 'combo', stage: 1 },
  { id: 's1f_jf', text: 'jf', meaningCn: '右手食指→左手食指，基准跨手', type: 'combo', stage: 1 },
  { id: 's1f_jg', text: 'jg', meaningCn: '右手食指→左手食指右移', type: 'combo', stage: 1 },
  { id: 's1f_ja', text: 'ja', meaningCn: '右手食指→左手小指，大跨手', type: 'combo', stage: 1 },
  { id: 's1f_kf', text: 'kf', meaningCn: '右手中指→左手食指', type: 'combo', stage: 1 },
  { id: 's1f_kg', text: 'kg', meaningCn: '右手中指→左手食指右移', type: 'combo', stage: 1 },
  { id: 's1f_lf', text: 'lf', meaningCn: '右手无名指→左手食指', type: 'combo', stage: 1 },
  { id: 's1f_lg', text: 'lg', meaningCn: '右手无名指→左手食指右移', type: 'combo', stage: 1 },
];

// Stage 1G: Diagonal / stretch combos - challenging finger reaches (20)
const stage1GCombos: ContentItem[] = [
  { id: 's1g_aw', text: 'aw', meaningCn: '小指大跳上，A→W', type: 'combo', stage: 1 },
  { id: 's1g_dw', text: 'dw', meaningCn: '食指→无名指上，D→W', type: 'combo', stage: 1 },
  { id: 's1g_fw', text: 'fw', meaningCn: '食指大跳上左，F→W', type: 'combo', stage: 1 },
  { id: 's1g_se', text: 'se', meaningCn: '中指→中指上，S→E', type: 'combo', stage: 1 },
  { id: 's1g_fe', text: 'fe', meaningCn: '食指→中指上，F→E', type: 'combo', stage: 1 },
  { id: 's1g_ge', text: 'ge', meaningCn: '食指→中指上，G→E', type: 'combo', stage: 1 },
  { id: 's1g_te', text: 'te', meaningCn: '食指上并拢→中指上', type: 'combo', stage: 1 },
  { id: 's1g_af', text: 'af', meaningCn: '小指→食指，左手伸展', type: 'combo', stage: 1 },
  { id: 's1g_sf', text: 'sf', meaningCn: '中指→食指，左手并拢', type: 'combo', stage: 1 },
  { id: 's1g_ad', text: 'ad', meaningCn: '小指→食指，左手大伸展', type: 'combo', stage: 1 },
  // Right hand diagonal
  { id: 's1g_jy', text: 'jy', meaningCn: '食指大跳上，J→Y', type: 'combo', stage: 1 },
  { id: 's1g_ky', text: 'ky', meaningCn: '中指大跳上左，K→Y', type: 'combo', stage: 1 },
  { id: 's1g_ly', text: 'ly', meaningCn: '无名指大跳上左，L→Y', type: 'combo', stage: 1 },
  { id: 's1g_ku', text: 'ku', meaningCn: '中指→食指上，K→U', type: 'combo', stage: 1 },
  { id: 's1g_lu', text: 'lu', meaningCn: '无名指→食指上，L→U', type: 'combo', stage: 1 },
  { id: 's1g_hi', text: 'hi', meaningCn: '食指→中指上，H→I', type: 'combo', stage: 1 },
  { id: 's1g_ji', text: 'ji', meaningCn: '食指→中指上，J→I', type: 'combo', stage: 1 },
  { id: 's1g_ho', text: 'ho', meaningCn: '食指→无名指上，H→O', type: 'combo', stage: 1 },
  { id: 's1g_jo', text: 'jo', meaningCn: '食指→无名指上，J→O', type: 'combo', stage: 1 },
  { id: 's1g_ko', text: 'ko', meaningCn: '中指→无名指上，K→O', type: 'combo', stage: 1 },
];

// Stage 2: 2-letter real English words (80)
const stage2Words: ContentItem[] = [
  { id: 's2_0', text: 'at', meaningCn: '在' }, { id: 's2_1', text: 'be', meaningCn: '是' },
  { id: 's2_2', text: 'do', meaningCn: '做' }, { id: 's2_3', text: 'go', meaningCn: '去' },
  { id: 's2_4', text: 'he', meaningCn: '他' }, { id: 's2_5', text: 'hi', meaningCn: '嗨' },
  { id: 's2_6', text: 'if', meaningCn: '如果' }, { id: 's2_7', text: 'in', meaningCn: '在...里' },
  { id: 's2_8', text: 'is', meaningCn: '是' }, { id: 's2_9', text: 'it', meaningCn: '它' },
  { id: 's2_10', text: 'me', meaningCn: '我' }, { id: 's2_11', text: 'my', meaningCn: '我的' },
  { id: 's2_12', text: 'no', meaningCn: '不' }, { id: 's2_13', text: 'of', meaningCn: '...的' },
  { id: 's2_14', text: 'on', meaningCn: '在...上' }, { id: 's2_15', text: 'or', meaningCn: '或者' },
  { id: 's2_16', text: 'so', meaningCn: '所以' }, { id: 's2_17', text: 'to', meaningCn: '到' },
  { id: 's2_18', text: 'up', meaningCn: '向上' }, { id: 's2_19', text: 'we', meaningCn: '我们' },
  { id: 's2_20', text: 'an', meaningCn: '一个' }, { id: 's2_21', text: 'as', meaningCn: '作为' },
  { id: 's2_22', text: 'by', meaningCn: '通过' }, { id: 's2_23', text: 'am', meaningCn: '我是' },
  { id: 's2_24', text: 'ox', meaningCn: '公牛' }, { id: 's2_25', text: 'ah', meaningCn: '啊' },
  { id: 's2_26', text: 'oh', meaningCn: '哦' }, { id: 's2_27', text: 'ow', meaningCn: '哎哟' },
  { id: 's2_28', text: 'ok', meaningCn: '好的' }, { id: 's2_29', text: 'us', meaningCn: '我们' },
  { id: 's2_30', text: 'em', meaningCn: '恩' }, { id: 's2_31', text: 'en', meaningCn: '使...' },
  { id: 's2_32', text: 'ex', meaningCn: '前' }, { id: 's2_33', text: 'ax', meaningCn: '斧头' },
  { id: 's2_34', text: 'ad', meaningCn: '广告' }, { id: 's2_35', text: 'al', meaningCn: '艾尔' },
  { id: 's2_36', text: 'id', meaningCn: '身份证' }, { id: 's2_37', text: 'la', meaningCn: '啦' },
  { id: 's2_38', text: 'ma', meaningCn: '妈妈' }, { id: 's2_39', text: 'pa', meaningCn: '爸爸' },
  { id: 's2_40', text: 'pi', meaningCn: '圆周率' }, { id: 's2_41', text: 'ti', meaningCn: '钛' },
  { id: 's2_42', text: 'mo', meaningCn: '瞬间' }, { id: 's2_43', text: 'ne', meaningCn: '霓虹' },
  { id: 's2_44', text: 'nu', meaningCn: '核' }, { id: 's2_45', text: 'od', meaningCn: '古怪' },
  { id: 's2_46', text: 'oe', meaningCn: '诗歌' }, { id: 's2_47', text: 'om', meaningCn: '奥姆' },
  { id: 's2_48', text: 'op', meaningCn: '作品' }, { id: 's2_49', text: 'os', meaningCn: '骨骼' },
  { id: 's2_50', text: 'ow', meaningCn: '哎哟' }, { id: 's2_51', text: 'oy', meaningCn: '哎呀' },
  { id: 's2_52', text: 're', meaningCn: '关于' }, { id: 's2_53', text: 'sh', meaningCn: '嘘' },
  { id: 's2_54', text: 'si', meaningCn: '是' }, { id: 's2_55', text: 'ta', meaningCn: '谢谢' },
  { id: 's2_56', text: 'te', meaningCn: '茶' }, { id: 's2_57', text: 'ti', meaningCn: '钛' },
  { id: 's2_58', text: 'uh', meaningCn: '呃' }, { id: 's2_59', text: 'um', meaningCn: '嗯' },
  { id: 's2_60', text: 'un', meaningCn: '不' }, { id: 's2_61', text: 'ur', meaningCn: '你的' },
  { id: 's2_62', text: 'ut', meaningCn: '多' }, { id: 's2_63', text: 'wo', meaningCn: '哇' },
  { id: 's2_64', text: 'xi', meaningCn: '希腊字母' }, { id: 's2_65', text: 'xu', meaningCn: '越南货币' },
  { id: 's2_66', text: 'ya', meaningCn: '你' }, { id: 's2_67', text: 'ye', meaningCn: '耶' },
  { id: 's2_68', text: 'yo', meaningCn: '哟' }, { id: 's2_69', text: 'za', meaningCn: '能量' },
  { id: 's2_70', text: 'bi', meaningCn: '双' }, { id: 's2_71', text: 'bo', meaningCn: '朋友' },
  { id: 's2_72', text: 'eh', meaningCn: '呃' }, { id: 's2_73', text: 'fa', meaningCn: '音乐音名' },
  { id: 's2_74', text: 'gi', meaningCn: '柔道服' }, { id: 's2_75', text: 'ha', meaningCn: '哈' },
  { id: 's2_76', text: 'ho', meaningCn: '嗬' }, { id: 's2_77', text: 'jo', meaningCn: '甜心' },
  { id: 's2_78', text: 'ka', meaningCn: '灵魂' }, { id: 's2_79', text: 'li', meaningCn: '里' },
].map((w) => ({ ...w, type: 'word' as const, stage: 2 }));
// Stage 3: 3-letter CVC words (120)
const stage3Words: ContentItem[] = [
  { id: 's3_0', text: 'cat', meaningCn: '猫 🐱' }, { id: 's3_1', text: 'dog', meaningCn: '狗 🐕' },
  { id: 's3_2', text: 'sun', meaningCn: '太阳 ☀️' }, { id: 's3_3', text: 'red', meaningCn: '红色' },
  { id: 's3_4', text: 'big', meaningCn: '大的' }, { id: 's3_5', text: 'run', meaningCn: '跑' },
  { id: 's3_6', text: 'fun', meaningCn: '乐趣' }, { id: 's3_7', text: 'box', meaningCn: '盒子' },
  { id: 's3_8', text: 'bat', meaningCn: '蝙蝠' }, { id: 's3_9', text: 'bed', meaningCn: '床' },
  { id: 's3_10', text: 'bus', meaningCn: '公交' }, { id: 's3_11', text: 'can', meaningCn: '能' },
  { id: 's3_12', text: 'car', meaningCn: '汽车' }, { id: 's3_13', text: 'cow', meaningCn: '奶牛' },
  { id: 's3_14', text: 'cup', meaningCn: '杯子' }, { id: 's3_15', text: 'dad', meaningCn: '爸爸' },
  { id: 's3_16', text: 'day', meaningCn: '白天' }, { id: 's3_17', text: 'eat', meaningCn: '吃' },
  { id: 's3_18', text: 'egg', meaningCn: '鸡蛋' }, { id: 's3_19', text: 'eye', meaningCn: '眼睛' },
  { id: 's3_20', text: 'fan', meaningCn: '风扇' }, { id: 's3_21', text: 'fat', meaningCn: '胖的' },
  { id: 's3_22', text: 'fly', meaningCn: '飞' }, { id: 's3_23', text: 'fox', meaningCn: '狐狸' },
  { id: 's3_24', text: 'hat', meaningCn: '帽子' }, { id: 's3_25', text: 'hen', meaningCn: '母鸡' },
  { id: 's3_26', text: 'hot', meaningCn: '热的' }, { id: 's3_27', text: 'hug', meaningCn: '拥抱' },
  { id: 's3_28', text: 'ice', meaningCn: '冰' }, { id: 's3_29', text: 'jam', meaningCn: '果酱' },
  { id: 's3_30', text: 'jar', meaningCn: '罐子' }, { id: 's3_31', text: 'job', meaningCn: '工作' },
  { id: 's3_32', text: 'joy', meaningCn: '快乐' }, { id: 's3_33', text: 'key', meaningCn: '钥匙' },
  { id: 's3_34', text: 'kid', meaningCn: '小孩' }, { id: 's3_35', text: 'leg', meaningCn: '腿' },
  { id: 's3_36', text: 'lip', meaningCn: '嘴唇' }, { id: 's3_37', text: 'log', meaningCn: '木头' },
  { id: 's3_38', text: 'man', meaningCn: '男人' }, { id: 's3_39', text: 'map', meaningCn: '地图' },
  { id: 's3_40', text: 'mom', meaningCn: '妈妈' }, { id: 's3_41', text: 'mop', meaningCn: '拖把' },
  { id: 's3_42', text: 'net', meaningCn: '网' }, { id: 's3_43', text: 'new', meaningCn: '新的' },
  { id: 's3_44', text: 'now', meaningCn: '现在' }, { id: 's3_45', text: 'nut', meaningCn: '坚果' },
  { id: 's3_46', text: 'one', meaningCn: '一' }, { id: 's3_47', text: 'pan', meaningCn: '锅' },
  { id: 's3_48', text: 'pen', meaningCn: '笔' }, { id: 's3_49', text: 'pet', meaningCn: '宠物' },
  { id: 's3_50', text: 'pig', meaningCn: '猪' }, { id: 's3_51', text: 'pin', meaningCn: '别针' },
  { id: 's3_52', text: 'pot', meaningCn: '锅' }, { id: 's3_53', text: 'rat', meaningCn: '老鼠' },
  { id: 's3_54', text: 'sad', meaningCn: '难过' }, { id: 's3_55', text: 'sea', meaningCn: '大海' },
  { id: 's3_56', text: 'set', meaningCn: '放置' }, { id: 's3_57', text: 'shy', meaningCn: '害羞' },
  { id: 's3_58', text: 'sit', meaningCn: '坐' }, { id: 's3_59', text: 'six', meaningCn: '六' },
  { id: 's3_60', text: 'ski', meaningCn: '滑雪' }, { id: 's3_61', text: 'sky', meaningCn: '天空' },
  { id: 's3_62', text: 'tab', meaningCn: '标签' }, { id: 's3_63', text: 'tag', meaningCn: '标签' },
  { id: 's3_64', text: 'tap', meaningCn: '轻拍' }, { id: 's3_65', text: 'tea', meaningCn: '茶' },
  { id: 's3_66', text: 'ten', meaningCn: '十' }, { id: 's3_67', text: 'tie', meaningCn: '领带' },
  { id: 's3_68', text: 'top', meaningCn: '顶部' }, { id: 's3_69', text: 'toy', meaningCn: '玩具' },
  { id: 's3_70', text: 'two', meaningCn: '二' }, { id: 's3_71', text: 'van', meaningCn: '货车' },
  { id: 's3_72', text: 'vet', meaningCn: '兽医' }, { id: 's3_73', text: 'wag', meaningCn: '摇尾巴' },
  { id: 's3_74', text: 'war', meaningCn: '战争' }, { id: 's3_75', text: 'wax', meaningCn: '蜡' },
  { id: 's3_76', text: 'web', meaningCn: '网' }, { id: 's3_77', text: 'wet', meaningCn: '湿的' },
  { id: 's3_78', text: 'wig', meaningCn: '假发' }, { id: 's3_79', text: 'win', meaningCn: '赢' },
  { id: 's3_80', text: 'wit', meaningCn: '机智' }, { id: 's3_81', text: 'yes', meaningCn: '是' },
  { id: 's3_82', text: 'yet', meaningCn: '还' }, { id: 's3_83', text: 'zip', meaningCn: '拉链' },
  { id: 's3_84', text: 'zoo', meaningCn: '动物园' }, { id: 's3_85', text: 'ace', meaningCn: '王牌' },
  { id: 's3_86', text: 'act', meaningCn: '行动' }, { id: 's3_87', text: 'add', meaningCn: '加' },
  { id: 's3_88', text: 'age', meaningCn: '年龄' }, { id: 's3_89', text: 'ago', meaningCn: '以前' },
  { id: 's3_90', text: 'aid', meaningCn: '帮助' }, { id: 's3_91', text: 'aim', meaningCn: '目标' },
  { id: 's3_92', text: 'air', meaningCn: '空气' }, { id: 's3_93', text: 'all', meaningCn: '所有' },
  { id: 's3_94', text: 'ant', meaningCn: '蚂蚁' }, { id: 's3_95', text: 'any', meaningCn: '任何' },
  { id: 's3_96', text: 'arm', meaningCn: '手臂' }, { id: 's3_97', text: 'art', meaningCn: '艺术' },
  { id: 's3_98', text: 'ask', meaningCn: '问' }, { id: 's3_99', text: 'bad', meaningCn: '坏的' },
  { id: 's3_100', text: 'bag', meaningCn: '包' }, { id: 's3_101', text: 'bar', meaningCn: '酒吧' },
  { id: 's3_102', text: 'bay', meaningCn: '海湾' }, { id: 's3_103', text: 'bet', meaningCn: '打赌' },
  { id: 's3_104', text: 'bid', meaningCn: '出价' }, { id: 's3_105', text: 'bit', meaningCn: '一点' },
  { id: 's3_106', text: 'buy', meaningCn: '买' }, { id: 's3_107', text: 'cab', meaningCn: '出租车' },
  { id: 's3_108', text: 'cap', meaningCn: '帽子' }, { id: 's3_109', text: 'cry', meaningCn: '哭' },
  { id: 's3_110', text: 'cut', meaningCn: '切' }, { id: 's3_111', text: 'dig', meaningCn: '挖' },
  { id: 's3_112', text: 'dim', meaningCn: '昏暗' }, { id: 's3_113', text: 'dry', meaningCn: '干燥' },
  { id: 's3_114', text: 'dub', meaningCn: '配音' }, { id: 's3_115', text: 'due', meaningCn: '到期' },
  { id: 's3_116', text: 'dye', meaningCn: '染料' }, { id: 's3_117', text: 'ear', meaningCn: '耳朵' },
  { id: 's3_118', text: 'end', meaningCn: '结束' }, { id: 's3_119', text: 'far', meaningCn: '远' },
].map((w) => ({ ...w, type: 'word' as const, stage: 3 }));

// Stage 4: 4-6 letter words (120)
const stage4Words: ContentItem[] = [
  { id: 's4_0', text: 'apple', meaningCn: '苹果 🍎' }, { id: 's4_1', text: 'bread', meaningCn: '面包 🍞' },
  { id: 's4_2', text: 'chair', meaningCn: '椅子 🪑' }, { id: 's4_3', text: 'dance', meaningCn: '跳舞 💃' },
  { id: 's4_4', text: 'eagle', meaningCn: '鹰 🦅' }, { id: 's4_5', text: 'fruit', meaningCn: '水果 🍊' },
  { id: 's4_6', text: 'grape', meaningCn: '葡萄 🍇' }, { id: 's4_7', text: 'house', meaningCn: '房子 🏠' },
  { id: 's4_8', text: 'juice', meaningCn: '果汁 🧃' }, { id: 's4_9', text: 'lemon', meaningCn: '柠檬 🍋' },
  { id: 's4_10', text: 'mouse', meaningCn: '老鼠 🐭' }, { id: 's4_11', text: 'night', meaningCn: '夜晚 🌙' },
  { id: 's4_12', text: 'ocean', meaningCn: '海洋 🌊' }, { id: 's4_13', text: 'piano', meaningCn: '钢琴 🎹' },
  { id: 's4_14', text: 'queen', meaningCn: '女王 👑' }, { id: 's4_15', text: 'rabbit', meaningCn: '兔子 🐰' },
  { id: 's4_16', text: 'snake', meaningCn: '蛇 🐍' }, { id: 's4_17', text: 'tiger', meaningCn: '老虎 🐯' },
  { id: 's4_18', text: 'uncle', meaningCn: '叔叔 👨' }, { id: 's4_19', text: 'water', meaningCn: '水 💧' },
  { id: 's4_20', text: 'yellow', meaningCn: '黄色 🟡' }, { id: 's4_21', text: 'zebra', meaningCn: '斑马 🦓' },
  { id: 's4_22', text: 'banana', meaningCn: '香蕉 🍌' }, { id: 's4_23', text: 'camera', meaningCn: '相机 📷' },
  { id: 's4_24', text: 'doctor', meaningCn: '医生 👨‍⚕️' }, { id: 's4_25', text: 'eleven', meaningCn: '十一' },
  { id: 's4_26', text: 'family', meaningCn: '家庭 👨‍👩‍👧‍👦' }, { id: 's4_27', text: 'garden', meaningCn: '花园 🌸' },
  { id: 's4_28', text: 'happy', meaningCn: '开心 😊' }, { id: 's4_29', text: 'island', meaningCn: '岛屿 🏝️' },
  { id: 's4_30', text: 'jacket', meaningCn: '夹克 🧥' }, { id: 's4_31', text: 'kitten', meaningCn: '小猫 🐱' },
  { id: 's4_32', text: 'monkey', meaningCn: '猴子 🐵' }, { id: 's4_33', text: 'number', meaningCn: '数字 🔢' },
  { id: 's4_34', text: 'orange', meaningCn: '橙子 🍊' }, { id: 's4_35', text: 'pencil', meaningCn: '铅笔 ✏️' },
  { id: 's4_36', text: 'puzzle', meaningCn: '拼图 🧩' }, { id: 's4_37', text: 'rocket', meaningCn: '火箭 🚀' },
  { id: 's4_38', text: 'school', meaningCn: '学校 🏫' }, { id: 's4_39', text: 'turtle', meaningCn: '海龟 🐢' },
  { id: 's4_40', text: 'window', meaningCn: '窗户 🪟' }, { id: 's4_41', text: 'animal', meaningCn: '动物 🐾' },
  { id: 's4_42', text: 'butter', meaningCn: '黄油' }, { id: 's4_43', text: 'circle', meaningCn: '圆形' },
  { id: 's4_44', text: 'dinner', meaningCn: '晚餐 🍽️' }, { id: 's4_45', text: 'friend', meaningCn: '朋友 👫' },
  { id: 's4_46', text: 'guitar', meaningCn: '吉他 🎸' }, { id: 's4_47', text: 'hockey', meaningCn: '曲棍球 🏒' },
  { id: 's4_48', text: 'insect', meaningCn: '昆虫 🐛' }, { id: 's4_49', text: 'jungle', meaningCn: '丛林 🌴' },
  { id: 's4_50', text: 'kangaroo', meaningCn: '袋鼠 🦘' }, { id: 's4_51', text: 'lantern', meaningCn: '灯笼 🏮' },
  { id: 's4_52', text: 'magnet', meaningCn: '磁铁 🧲' }, { id: 's4_53', text: 'napkin', meaningCn: '餐巾' },
  { id: 's4_54', text: 'octopus', meaningCn: '章鱼 🐙' }, { id: 's4_55', text: 'pajamas', meaningCn: '睡衣' },
  { id: 's4_56', text: 'quarter', meaningCn: '四分之一' }, { id: 's4_57', text: 'rainbow', meaningCn: '彩虹 🌈' },
  { id: 's4_58', text: 'sandwich', meaningCn: '三明治 🥪' }, { id: 's4_59', text: 'teapot', meaningCn: '茶壶 🫖' },
  { id: 's4_60', text: 'umbrella', meaningCn: '雨伞 ☂️' }, { id: 's4_61', text: 'vacation', meaningCn: '假期 🏖️' },
  { id: 's4_62', text: 'wallet', meaningCn: '钱包 👛' }, { id: 's4_63', text: 'yogurt', meaningCn: '酸奶' },
  { id: 's4_64', text: 'zipper', meaningCn: '拉链' }, { id: 's4_65', text: 'airplane', meaningCn: '飞机 ✈️' },
  { id: 's4_66', text: 'birthday', meaningCn: '生日 🎂' }, { id: 's4_67', text: 'calendar', meaningCn: '日历 📅' },
  { id: 's4_68', text: 'dinosaur', meaningCn: '恐龙 🦕' }, { id: 's4_69', text: 'elephant', meaningCn: '大象 🐘' },
  { id: 's4_70', text: 'firework', meaningCn: '烟花 🎆' }, { id: 's4_71', text: 'giraffe', meaningCn: '长颈鹿 🦒' },
  { id: 's4_72', text: 'hospital', meaningCn: '医院 🏥' }, { id: 's4_73', text: 'internet', meaningCn: '互联网' },
  { id: 's4_74', text: 'journey', meaningCn: '旅行 ✈️' }, { id: 's4_75', text: 'keyboard', meaningCn: '键盘 ⌨️' },
  { id: 's4_76', text: 'language', meaningCn: '语言' }, { id: 's4_77', text: 'mountain', meaningCn: '山 ⛰️' },
  { id: 's4_78', text: 'notebook', meaningCn: '笔记本 📓' }, { id: 's4_79', text: 'painting', meaningCn: '绘画 🎨' },
  { id: 's4_80', text: 'question', meaningCn: '问题 ❓' }, { id: 's4_81', text: 'raincoat', meaningCn: '雨衣' },
  { id: 's4_82', text: 'scissors', meaningCn: '剪刀 ✂️' }, { id: 's4_83', text: 'teaspoon', meaningCn: '茶匙' },
  { id: 's4_84', text: 'umbrella', meaningCn: '雨伞 ☂️' }, { id: 's4_85', text: 'village', meaningCn: '村庄' },
  { id: 's4_86', text: 'weekend', meaningCn: '周末' }, { id: 's4_87', text: 'xylophone', meaningCn: '木琴 🎵' },
  { id: 's4_88', text: 'yoghurt', meaningCn: '酸奶' }, { id: 's4_89', text: 'zucchini', meaningCn: '西葫芦' },
  { id: 's4_90', text: 'baseball', meaningCn: '棒球 ⚾' }, { id: 's4_91', text: 'camping', meaningCn: '露营 ⛺' },
  { id: 's4_92', text: 'dolphin', meaningCn: '海豚 🐬' }, { id: 's4_93', text: 'eclipse', meaningCn: '日食' },
  { id: 's4_94', text: 'feather', meaningCn: '羽毛' }, { id: 's4_95', text: 'gateway', meaningCn: '大门' },
  { id: 's4_96', text: 'harmony', meaningCn: '和谐' }, { id: 's4_97', text: 'iceberg', meaningCn: '冰山 🧊' },
  { id: 's4_98', text: 'jewelry', meaningCn: '珠宝 💎' }, { id: 's4_99', text: 'kingdom', meaningCn: '王国' },
  { id: 's4_100', text: 'library', meaningCn: '图书馆 📚' }, { id: 's4_101', text: 'marathon', meaningCn: '马拉松 🏃' },
  { id: 's4_102', text: 'neptune', meaningCn: '海王星' }, { id: 's4_103', text: 'orchard', meaningCn: '果园' },
  { id: 's4_104', text: 'peacock', meaningCn: '孔雀 🦚' }, { id: 's4_105', text: 'quantum', meaningCn: '量子' },
  { id: 's4_106', text: 'rooster', meaningCn: '公鸡 🐓' }, { id: 's4_107', text: 'sausage', meaningCn: '香肠' },
  { id: 's4_108', text: 'tornado', meaningCn: '龙卷风 🌪️' }, { id: 's4_109', text: 'unicorn', meaningCn: '独角兽 🦄' },
  { id: 's4_110', text: 'volcano', meaningCn: '火山 🌋' }, { id: 's4_111', text: 'whistle', meaningCn: '哨子' },
  { id: 's4_112', text: 'avocado', meaningCn: '牛油果 🥑' }, { id: 's4_113', text: 'broccoli', meaningCn: '西兰花 🥦' },
  { id: 's4_114', text: 'caterpillar', meaningCn: '毛毛虫 🐛' }, { id: 's4_115', text: 'dragonfly', meaningCn: '蜻蜓' },
  { id: 's4_116', text: 'equipment', meaningCn: '设备' }, { id: 's4_117', text: 'furniture', meaningCn: '家具' },
  { id: 's4_118', text: 'gardening', meaningCn: '园艺' }, { id: 's4_119', text: 'hedgehog', meaningCn: '刺猬 🦔' },
].map((w) => ({ ...w, type: 'word' as const, stage: 4 }));

// Stage 5: 7-10 letter words (80)
const stage5Words: ContentItem[] = [
  { id: 's5w_0', text: 'kangaroo', meaningCn: '袋鼠 🦘' }, { id: 's5w_1', text: 'aircraft', meaningCn: '飞机 ✈️' },
  { id: 's5w_2', text: 'alphabet', meaningCn: '字母表' }, { id: 's5w_3', text: 'anything', meaningCn: '任何事' },
  { id: 's5w_4', text: 'backyard', meaningCn: '后院' }, { id: 's5w_5', text: 'bathroom', meaningCn: '浴室 🛁' },
  { id: 's5w_6', text: 'birthday', meaningCn: '生日 🎂' }, { id: 's5w_7', text: 'building', meaningCn: '建筑 🏢' },
  { id: 's5w_8', text: 'butterfly', meaningCn: '蝴蝶 🦋' }, { id: 's5w_9', text: 'calendar', meaningCn: '日历 📅' },
  { id: 's5w_10', text: 'campfire', meaningCn: '营火 🔥' }, { id: 's5w_11', text: 'children', meaningCn: '孩子们 👧👦' },
  { id: 's5w_12', text: 'chocolate', meaningCn: '巧克力 🍫' }, { id: 's5w_13', text: 'computer', meaningCn: '电脑 💻' },
  { id: 's5w_14', text: 'cupboard', meaningCn: '橱柜' }, { id: 's5w_15', text: 'daughter', meaningCn: '女儿 👧' },
  { id: 's5w_16', text: 'dinosaur', meaningCn: '恐龙 🦕' }, { id: 's5w_17', text: 'dolphins', meaningCn: '海豚 🐬' },
  { id: 's5w_18', text: 'elephant', meaningCn: '大象 🐘' }, { id: 's5w_19', text: 'firework', meaningCn: '烟花 🎆' },
  { id: 's5w_20', text: 'football', meaningCn: '足球 ⚽' }, { id: 's5w_21', text: 'forever', meaningCn: '永远 ♾️' },
  { id: 's5w_22', text: 'geography', meaningCn: '地理 🌍' }, { id: 's5w_23', text: 'giraffe', meaningCn: '长颈鹿 🦒' },
  { id: 's5w_24', text: 'grandma', meaningCn: '奶奶 👵' }, { id: 's5w_25', text: 'hospital', meaningCn: '医院 🏥' },
  { id: 's5w_26', text: 'icecream', meaningCn: '冰淇淋 🍦' }, { id: 's5w_27', text: 'internet', meaningCn: '互联网 🌐' },
  { id: 's5w_28', text: 'jasmine', meaningCn: '茉莉 🌼' }, { id: 's5w_29', text: 'journey', meaningCn: '旅行 ✈️' },
  { id: 's5w_30', text: 'keyboard', meaningCn: '键盘 ⌨️' }, { id: 's5w_31', text: 'knitting', meaningCn: '编织 🧶' },
  { id: 's5w_32', text: 'language', meaningCn: '语言 🗣️' }, { id: 's5w_33', text: 'laughter', meaningCn: '笑声 😄' },
  { id: 's5w_34', text: 'lightning', meaningCn: '闪电 ⚡' }, { id: 's5w_35', text: 'magazine', meaningCn: '杂志 📖' },
  { id: 's5w_36', text: 'magician', meaningCn: '魔术师 🎩' }, { id: 's5w_37', text: 'marriage', meaningCn: '婚姻 💒' },
  { id: 's5w_38', text: 'medicine', meaningCn: '药 💊' }, { id: 's5w_39', text: 'midnight', meaningCn: '午夜 🌑' },
  { id: 's5w_40', text: 'mountain', meaningCn: '山 ⛰️' }, { id: 's5w_41', text: 'mushroom', meaningCn: '蘑菇 🍄' },
  { id: 's5w_42', text: 'notebook', meaningCn: '笔记本 📓' }, { id: 's5w_43', text: 'overcome', meaningCn: '克服 💪' },
  { id: 's5w_44', text: 'painting', meaningCn: '绘画 🎨' }, { id: 's5w_45', text: 'paradise', meaningCn: '天堂 🌈' },
  { id: 's5w_46', text: 'passport', meaningCn: '护照 🛂' }, { id: 's5w_47', text: 'peaceful', meaningCn: '和平 ☮️' },
  { id: 's5w_48', text: 'pheasant', meaningCn: '野鸡 🐦' }, { id: 's5w_49', text: 'pheasant', meaningCn: '野鸡 🐦' },
  { id: 's5w_50', text: 'platform', meaningCn: '平台 📢' }, { id: 's5w_51', text: 'playground', meaningCn: '操场 🛝' },
  { id: 's5w_52', text: 'porridge', meaningCn: '粥 🥣' }, { id: 's5w_53', text: 'pregnant', meaningCn: '怀孕 🤰' },
  { id: 's5w_54', text: 'princess', meaningCn: '公主 👸' }, { id: 's5w_55', text: 'question', meaningCn: '问题 ❓' },
  { id: 's5w_56', text: 'raincoat', meaningCn: '雨衣 🧥' }, { id: 's5w_57', text: 'remember', meaningCn: '记得 🧠' },
  { id: 's5w_58', text: 'sandwich', meaningCn: '三明治 🥪' }, { id: 's5w_59', text: 'scissors', meaningCn: '剪刀 ✂️' },
  { id: 's5w_60', text: 'seahorse', meaningCn: '海马 🌊' }, { id: 's5w_61', text: 'shoulder', meaningCn: '肩膀 💪' },
  { id: 's5w_62', text: 'spider', meaningCn: '蜘蛛 🕷️' }, { id: 's5w_63', text: 'squirrel', meaningCn: '松鼠 🐿️' },
  { id: 's5w_64', text: 'starfish', meaningCn: '海星 ⭐' }, { id: 's5w_65', text: 'strawberry', meaningCn: '草莓 🍓' },
  { id: 's5w_66', text: 'sunshine', meaningCn: '阳光 ☀️' }, { id: 's5w_67', text: 'swimming', meaningCn: '游泳 🏊' },
  { id: 's5w_68', text: 'tentacle', meaningCn: '触手 🐙' }, { id: 's5w_69', text: 'tomorrow', meaningCn: '明天 📅' },
  { id: 's5w_70', text: 'treasure', meaningCn: '宝藏 💎' }, { id: 's5w_71', text: 'tropical', meaningCn: '热带 🌴' },
  { id: 's5w_72', text: 'umbrella', meaningCn: '雨伞 ☂️' }, { id: 's5w_73', text: 'universe', meaningCn: '宇宙 🌌' },
  { id: 's5w_74', text: 'vacation', meaningCn: '假期 🏖️' }, { id: 's5w_75', text: 'valuable', meaningCn: '有价值 💰' },
  { id: 's5w_76', text: 'vampire', meaningCn: '吸血鬼 🧛' }, { id: 's5w_77', text: 'violence', meaningCn: '暴力 ⚔️' },
  { id: 's5w_78', text: 'volcano', meaningCn: '火山 🌋' }, { id: 's5w_79', text: 'whale', meaningCn: '鲸鱼 🐋' },
].map((w) => ({ ...w, type: 'word' as const, stage: 5 }));

// Stage 6: Short phrases (40)
const stage6Phrases: ContentItem[] = [
  { id: 's6_0', text: 'a red cat', meaningCn: '一只红色的猫' },
  { id: 's6_1', text: 'a big dog', meaningCn: '一只大狗' },
  { id: 's6_2', text: 'I can run', meaningCn: '我能跑' },
  { id: 's6_3', text: 'my book', meaningCn: '我的书' },
  { id: 's6_4', text: 'go up', meaningCn: '上去' },
  { id: 's6_5', text: 'I like cats', meaningCn: '我喜欢猫' },
  { id: 's6_6', text: 'the red apple', meaningCn: '这个红苹果' },
  { id: 's6_7', text: 'the big house', meaningCn: '这座大房子' },
  { id: 's6_8', text: 'I have a cat', meaningCn: '我有一只猫' },
  { id: 's6_9', text: 'go to bed', meaningCn: '去睡觉' },
  { id: 's6_10', text: 'the sky is blue', meaningCn: '天空是蓝色的' },
  { id: 's6_11', text: 'I like my mom', meaningCn: '我爱我的妈妈' },
  { id: 's6_12', text: 'my cat is red', meaningCn: '我的猫是红色的' },
  { id: 's6_13', text: 'blue sky', meaningCn: '蓝天' },
  { id: 's6_14', text: 'big tree', meaningCn: '大树' },
  { id: 's6_15', text: 'run fast', meaningCn: '快跑' },
  { id: 's6_16', text: 'jump high', meaningCn: '跳得高' },
  { id: 's6_17', text: 'sit down', meaningCn: '坐下' },
  { id: 's6_18', text: 'stand up', meaningCn: '站起来' },
  { id: 's6_19', text: 'I am happy', meaningCn: '我很开心' },
  { id: 's6_20', text: 'good morning', meaningCn: '早上好' },
  { id: 's6_21', text: 'thank you', meaningCn: '谢谢你' },
  { id: 's6_22', text: 'how are you', meaningCn: '你好吗' },
  { id: 's6_23', text: 'I love you', meaningCn: '我爱你' },
  { id: 's6_24', text: 'what is this', meaningCn: '这是什么' },
  { id: 's6_25', text: 'nice to meet you', meaningCn: '很高兴见到你' },
  { id: 's6_26', text: 'see you later', meaningCn: '回头见' },
  { id: 's6_27', text: 'have a good day', meaningCn: '祝你有美好的一天' },
  { id: 's6_28', text: 'where is the cat', meaningCn: '猫在哪里' },
  { id: 's6_29', text: 'I want to eat', meaningCn: '我想吃东西' },
  { id: 's6_30', text: 'it is very nice', meaningCn: '这非常好' },
  { id: 's6_31', text: 'do you like it', meaningCn: '你喜欢吗' },
  { id: 's6_32', text: 'can you help me', meaningCn: '你能帮我吗' },
  { id: 's6_33', text: 'let us play', meaningCn: '我们一起玩' },
  { id: 's6_34', text: 'good night', meaningCn: '晚安' },
  { id: 's6_35', text: 'be careful', meaningCn: '小心' },
  { id: 's6_36', text: 'well done', meaningCn: '做得好' },
  { id: 's6_37', text: 'come here', meaningCn: '过来' },
  { id: 's6_38', text: 'go away', meaningCn: '走开' },
  { id: 's6_39', text: 'hurry up', meaningCn: '快点' },
].map((p) => ({ ...p, type: 'phrase' as const, stage: 6 }));

// Stage 7: Longer sentences (20)
const stage7Phrases: ContentItem[] = [
  { id: 's7_0', text: 'the quick brown fox jumps', meaningCn: '那只敏捷的棕色狐狸跳了' },
  { id: 's7_1', text: 'I like to play computer games', meaningCn: '我喜欢玩电脑游戏' },
  { id: 's7_2', text: 'my favorite color is blue', meaningCn: '我最喜欢的颜色是蓝色' },
  { id: 's7_3', text: 'can we go to the park today', meaningCn: '我们今天能去公园吗' },
  { id: 's7_4', text: 'the sun is shining brightly', meaningCn: '阳光灿烂地照耀着' },
  { id: 's7_5', text: 'I have a big red balloon', meaningCn: '我有一个大红气球' },
  { id: 's7_6', text: 'my dog likes to run fast', meaningCn: '我的狗喜欢快跑' },
  { id: 's7_7', text: 'she is reading a good book', meaningCn: '她正在读一本好书' },
  { id: 's7_8', text: 'we are going to the zoo', meaningCn: '我们要去动物园' },
  { id: 's7_9', text: 'the baby is sleeping now', meaningCn: '宝宝正在睡觉' },
  { id: 's7_10', text: 'I can swim in the pool', meaningCn: '我能在游泳池里游泳' },
  { id: 's7_11', text: 'he likes to eat ice cream', meaningCn: '他喜欢吃冰淇淋' },
  { id: 's7_12', text: 'the rainbow is beautiful', meaningCn: '彩虹很美' },
  { id: 's7_13', text: 'my teacher is very kind', meaningCn: '我的老师很和蔼' },
  { id: 's7_14', text: 'I want to be a doctor', meaningCn: '我想成为一名医生' },
  { id: 's7_15', text: 'the train is coming soon', meaningCn: '火车马上就要来了' },
  { id: 's7_16', text: 'birds can fly in the sky', meaningCn: '鸟儿能在天空飞翔' },
  { id: 's7_17', text: 'I brush my teeth every day', meaningCn: '我每天刷牙' },
  { id: 's7_18', text: 'the flower smells so good', meaningCn: '这朵花闻起来很香' },
  { id: 's7_19', text: 'we had fun at the party', meaningCn: '我们在聚会上玩得很开心' },
].map((p) => ({ ...p, type: 'phrase' as const, stage: 7 }));

export const contentLibrary: ContentItem[] = [
  ...stage0Letters, ...stage1Letters, ...stage1BCombos, ...stage1CCombos,
  ...stage1DCombos, ...stage1ECombos, ...stage1FCombos, ...stage1GCombos,
  ...stage2Words, ...stage3Words, ...stage4Words, ...stage5Words,
  ...stage6Phrases, ...stage7Phrases,
];

export const keyboardLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

// ============ XP Level Table ============
export function xpForLevel(level: number): number {
  return Math.floor(100 + (level - 1) * 150 + Math.pow(level - 1, 2) * 50);
}

export function getPlayerLevel(xp: number): { level: number; maxHp: number; nextXp: number } {
  let level = 1;
  let next = xpForLevel(1);
  while (xp >= next) {
    level++;
    next += xpForLevel(level);
  }
  const maxHp = 100 + (level - 1) * 20;
  return { level, maxHp, nextXp: next };
}
// ============ Monsters - 15-20 rounds per battle ============
// Base damage lowered so each monster takes 15-20 correct answers to defeat
// Waves increased: 5+6+5 = 16 rounds minimum per battle
export const monsters: Monster[] = [
  // ===== World 1 - 字母草地: ONLY single letters (stage 0-1) =====
  {
    id: 'slime', name: 'Letter Slime', nameCn: '字母史莱姆', image: 'slime.png',
    hp: 80, maxHp: 80, attackDamage: 16, isBoss: false, baseXp: 15, baseCoins: 5,
    description: '软乎乎的字母史莱姆，从基准键开始',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 0, timeMultiplier: 1.3, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 0, timeMultiplier: 0.9, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.6, count: 5 },
    ],
  },
  {
    id: 'bug', name: 'J Bug', nameCn: 'J小虫', image: 'bug.png',
    hp: 100, maxHp: 100, attackDamage: 20, isBoss: false, baseXp: 25, baseCoins: 8,
    description: '蠕动的J小虫，覆盖所有单字母',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 0, timeMultiplier: 1.2, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.8, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.55, count: 5 },
    ],
  },
  {
    id: 'mushroom', name: 'Word Mushroom', nameCn: '单词蘑菇', image: 'mushroom.png',
    hp: 120, maxHp: 120, attackDamage: 20, isBoss: false, baseXp: 35, baseCoins: 10,
    description: '蘑菇头上长满了字母',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 0, timeMultiplier: 1.1, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.75, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.5, count: 5 },
    ],
  },
  {
    id: 'bat', name: 'Combo Bat', nameCn: '双键蝙蝠', image: 'bat.png',
    hp: 140, maxHp: 140, attackDamage: 24, isBoss: false, baseXp: 45, baseCoins: 12,
    description: '精英双键蝙蝠，快速字母连击',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 1.0, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.7, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.5, count: 5 },
    ],
  },
  {
    id: 'boss', name: 'Chaos Tree King', nameCn: '乱码树王', image: 'boss.png',
    hp: 200, maxHp: 200, attackDamage: 30, isBoss: true, baseXp: 80, baseCoins: 45,
    description: 'BOSS！森林中的字母王者，全字母混合',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 1.0, count: 6 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.65, count: 7 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 1, combo: 0, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.5, count: 6 },
    ],
  },

  // ===== World 2 - 组合森林: ONLY two-key combos (stage 1) =====
  {
    id: 'stump', name: 'Combo Stump', nameCn: '组合树桩', image: 'stump.png',
    hp: 160, maxHp: 160, attackDamage: 16, isBoss: false, baseXp: 40, baseCoins: 18,
    description: '树桩上刻满了相邻键组合',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 1.0, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.7, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.5, count: 5 },
    ],
  },
  {
    id: 'vine', name: 'Typing Vine', nameCn: '打字藤蔓', image: 'mushroom.png',
    hp: 180, maxHp: 180, attackDamage: 18, isBoss: false, baseXp: 50, baseCoins: 23,
    description: '缠绕在树上的打字藤蔓，快速组合',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.9, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.6, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.5, count: 5 },
    ],
  },
  {
    id: 'moss', name: 'Key Moss', nameCn: '按键苔藓', image: 'bug.png',
    hp: 200, maxHp: 200, attackDamage: 20, isBoss: false, baseXp: 60, baseCoins: 27,
    description: '覆盖键盘的苔藓怪物，各种组合混合',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.85, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.55, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.5, count: 5 },
    ],
  },
  {
    id: 'forest_boss', name: 'Ancient Oak', nameCn: '远古橡树', image: 'forest_boss.png',
    hp: 350, maxHp: 350, attackDamage: 30, isBoss: true, baseXp: 120, baseCoins: 83,
    description: 'BOSS！森林深处的远古守护者，全组合考验',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.9, count: 6 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.6, count: 7 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 1, word: 0, phrase: 0 }, maxStage: 1, timeMultiplier: 0.5, count: 6 },
    ],
  },

  // ===== World 3 - 短词小镇: ONLY 2-5 letter words (stage 2-3) =====
  {
    id: 'book', name: 'Flying Book', nameCn: '飞行书怪', image: 'book.png',
    hp: 200, maxHp: 200, attackDamage: 28, isBoss: false, baseXp: 50, baseCoins: 23,
    description: '书页飞舞的魔法书怪，小单词挑战',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 2, timeMultiplier: 0.9, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 3, timeMultiplier: 0.6, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 3, timeMultiplier: 0.5, count: 5 },
    ],
  },
  {
    id: 'town_boss', name: 'Grammar Dragon', nameCn: '语法巨龙', image: 'town_boss.png',
    hp: 350, maxHp: 350, attackDamage: 40, isBoss: true, baseXp: 120, baseCoins: 83,
    description: 'BOSS！镇守短词小镇的语法巨龙',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 3, timeMultiplier: 0.8, count: 6 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 3, timeMultiplier: 0.5, count: 7 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 3, timeMultiplier: 0.5, count: 6 },
    ],
  },

  // ===== World 4 - 海洋世界: ONLY 7-15 letter long words (stage 4-5) =====
  {
    id: 'jelly', name: 'Letter Jelly', nameCn: '字母水母', image: 'jelly.png',
    hp: 240, maxHp: 240, attackDamage: 32, isBoss: false, baseXp: 60, baseCoins: 27,
    description: '深海中漂浮的字母水母，长单词考验',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 4, timeMultiplier: 0.6, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 5, timeMultiplier: 0.5, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 5, timeMultiplier: 0.5, count: 5 },
    ],
  },
  {
    id: 'ocean_boss', name: 'Kraken Type', nameCn: '打字海怪', image: 'ocean_boss.png',
    hp: 420, maxHp: 420, attackDamage: 44, isBoss: true, baseXp: 150, baseCoins: 105,
    description: 'BOSS！深海中的打字海怪，超长单词',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 5, timeMultiplier: 0.6, count: 6 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 5, timeMultiplier: 0.4, count: 7 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 0, word: 1, phrase: 0 }, maxStage: 5, timeMultiplier: 0.5, count: 6 },
    ],
  },

  // ===== World 5 - 太空世界: ONLY phrases/sentences (stage 6-7) =====
  {
    id: 'robot', name: 'Type Bot', nameCn: '打字机器人', image: 'robot.png',
    hp: 300, maxHp: 300, attackDamage: 36, isBoss: false, baseXp: 75, baseCoins: 45,
    description: '来自太空的打字机器人，句子挑战',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 0, word: 0, phrase: 1 }, maxStage: 6, timeMultiplier: 0.55, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 0, word: 0, phrase: 1 }, maxStage: 6, timeMultiplier: 0.35, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 0, word: 0, phrase: 1 }, maxStage: 7, timeMultiplier: 0.38, count: 5 },
    ],
  },
  {
    id: 'space_boss', name: 'Galactic Overlord', nameCn: '银河霸主', image: 'space_boss.png',
    hp: 500, maxHp: 500, attackDamage: 50, isBoss: true, baseXp: 200, baseCoins: 150,
    description: 'BOSS！统治银河的终极打字霸主',
    waves: [
      { name: '热身', nameEn: 'Warm-up', typeWeights: { letter: 0, combo: 0, word: 0, phrase: 1 }, maxStage: 6, timeMultiplier: 0.5, count: 5 },
      { name: '主力', nameEn: 'Main', typeWeights: { letter: 0, combo: 0, word: 0, phrase: 1 }, maxStage: 7, timeMultiplier: 0.32, count: 6 },
      { name: '挑战', nameEn: 'Challenge', typeWeights: { letter: 0, combo: 0, word: 0, phrase: 1 }, maxStage: 7, timeMultiplier: 0.38, count: 5 },
    ],
  },
];

// ============ World & Level Config ============
export const worlds: WorldDef[] = [
  {
    id: 'world1', name: 'Letter Grassland', nameCn: '字母草地',
    description: '练习26个字母，从基准键开始', theme: 'grass',
    bgColor: 'from-green-400 to-emerald-600',
    locked: false,
    levels: [
      { id: 'l1', name: '第1关', monsterId: 'slime', unlockRequirement: null, worldId: 'world1', stage: 0 },
      { id: 'l2', name: '第2关', monsterId: 'bug', unlockRequirement: 'l1', worldId: 'world1', stage: 0 },
      { id: 'l3', name: '第3关', monsterId: 'mushroom', unlockRequirement: 'l2', worldId: 'world1', stage: 1 },
      { id: 'l4', name: '第4关', monsterId: 'bat', unlockRequirement: 'l3', worldId: 'world1', stage: 1 },
      { id: 'l5', name: 'Boss战', monsterId: 'boss', unlockRequirement: 'l4', worldId: 'world1', stage: 1 },
    ],
  },
  {
    id: 'world2', name: 'Combo Forest', nameCn: '组合森林',
    description: '练习键盘上两个连续字母的组合', theme: 'forest',
    bgColor: 'from-emerald-500 to-teal-700',
    locked: true,
    levels: [
      { id: 'l6', name: '第6关', monsterId: 'stump', unlockRequirement: 'l5', worldId: 'world2', stage: 1 },
      { id: 'l7', name: '第7关', monsterId: 'vine', unlockRequirement: 'l6', worldId: 'world2', stage: 1 },
      { id: 'l8', name: '第8关', monsterId: 'moss', unlockRequirement: 'l7', worldId: 'world2', stage: 1 },
      { id: 'l9', name: '第9关', monsterId: 'stump', unlockRequirement: 'l8', worldId: 'world2', stage: 1 },
      { id: 'l10', name: 'Boss战', monsterId: 'forest_boss', unlockRequirement: 'l9', worldId: 'world2', stage: 1 },
    ],
  },
  {
    id: 'world3', name: 'Short Word Town', nameCn: '短词小镇',
    description: '练习2-5个字母的短单词', theme: 'town',
    bgColor: 'from-blue-400 to-indigo-600',
    locked: true,
    levels: [
      { id: 'l11', name: '第11关', monsterId: 'book', unlockRequirement: 'l10', worldId: 'world3', stage: 2 },
      { id: 'l12', name: '第12关', monsterId: 'book', unlockRequirement: 'l11', worldId: 'world3', stage: 2 },
      { id: 'l13', name: '第13关', monsterId: 'book', unlockRequirement: 'l12', worldId: 'world3', stage: 3 },
      { id: 'l14', name: '第14关', monsterId: 'book', unlockRequirement: 'l13', worldId: 'world3', stage: 3 },
      { id: 'l15', name: 'Boss战', monsterId: 'town_boss', unlockRequirement: 'l14', worldId: 'world3', stage: 3 },
    ],
  },
  {
    id: 'world4', name: 'Ocean World', nameCn: '海洋世界',
    description: '挑战7-15个字母的长单词', theme: 'ocean',
    bgColor: 'from-cyan-400 to-blue-700',
    locked: true,
    levels: [
      { id: 'l16', name: '第16关', monsterId: 'jelly', unlockRequirement: 'l15', worldId: 'world4', stage: 4 },
      { id: 'l17', name: '第17关', monsterId: 'jelly', unlockRequirement: 'l16', worldId: 'world4', stage: 4 },
      { id: 'l18', name: '第18关', monsterId: 'jelly', unlockRequirement: 'l17', worldId: 'world4', stage: 5 },
      { id: 'l19', name: '第19关', monsterId: 'jelly', unlockRequirement: 'l18', worldId: 'world4', stage: 5 },
      { id: 'l20', name: 'Boss战', monsterId: 'ocean_boss', unlockRequirement: 'l19', worldId: 'world4', stage: 5 },
    ],
  },
  {
    id: 'world5', name: 'Space World', nameCn: '太空世界',
    description: '挑战短句和长句子', theme: 'space',
    bgColor: 'from-purple-500 to-pink-700',
    locked: true,
    levels: [
      { id: 'l21', name: '第21关', monsterId: 'robot', unlockRequirement: 'l20', worldId: 'world5', stage: 6 },
      { id: 'l22', name: '第22关', monsterId: 'robot', unlockRequirement: 'l21', worldId: 'world5', stage: 6 },
      { id: 'l23', name: '第23关', monsterId: 'robot', unlockRequirement: 'l22', worldId: 'world5', stage: 6 },
      { id: 'l24', name: '第24关', monsterId: 'robot', unlockRequirement: 'l23', worldId: 'world5', stage: 7 },
      { id: 'l25', name: 'Boss战', monsterId: 'space_boss', unlockRequirement: 'l24', worldId: 'world5', stage: 7 },
    ],
  },
];

// ============ Shop Items ============
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  effect: { type: string; value: number };
  purchased: boolean;
  consumable: boolean;
}

export const shopItems: ShopItem[] = [
  { id: 'potion', name: '生命药水', description: '恢复30HP', price: 15, icon: '🧪', effect: { type: 'heal', value: 30 }, purchased: false, consumable: true },
  { id: 'big_potion', name: '大瓶药水', description: '恢复60HP', price: 25, icon: '🧴', effect: { type: 'heal', value: 60 }, purchased: false, consumable: true },
  { id: 'revive', name: '复活卷轴', description: '战败时自动复活一次', price: 50, icon: '📜', effect: { type: 'revive', value: 1 }, purchased: false, consumable: true },
  { id: 'sword', name: '训练木剑', description: '打字伤害+20%', price: 80, icon: '🗡️', effect: { type: 'damage_boost', value: 0.2 }, purchased: false, consumable: false },
  { id: 'staff', name: '法师法杖', description: '打字伤害+40%', price: 150, icon: '🪄', effect: { type: 'damage_boost', value: 0.4 }, purchased: false, consumable: false },
  { id: 'crown', name: '勇者之冠', description: '打字伤害+60%', price: 250, icon: '👑', effect: { type: 'damage_boost', value: 0.6 }, purchased: false, consumable: false },
  { id: 'hourglass', name: '时间沙漏', description: '每场战斗+3秒，持续3场', price: 40, icon: '⏳', effect: { type: 'time_sand', value: 3 }, purchased: false, consumable: true },
  { id: 'ring', name: '连击戒指', description: 'Combo加成+30%', price: 100, icon: '💍', effect: { type: 'combo_boost', value: 0.3 }, purchased: false, consumable: false },
  { id: 'armor', name: '坚固铠甲', description: '受到的伤害-30%', price: 120, icon: '🛡️', effect: { type: 'defense_boost', value: 0.3 }, purchased: false, consumable: false },
  { id: 'hat', name: '冒险帽', description: '帅气外观，无属性加成', price: 30, icon: '🎩', effect: { type: 'cosmetic', value: 0 }, purchased: false, consumable: false },
];

// ============ Daily Missions ============
export interface DailyMission {
  id: string;
  description: string;
  target: number;
  reward: number;
  completed: boolean;
  progress: number;
}

export const dailyMissions: DailyMission[] = [
  { id: 'm1', description: '击败3只怪物', target: 3, reward: 20, completed: false, progress: 0 },
  { id: 'm2', description: '正确率达到80%', target: 80, reward: 30, completed: false, progress: 0 },
  { id: 'm3', description: '学习8个新单词', target: 8, reward: 25, completed: false, progress: 0 },
];

// ============ Map Layout ============
export const mapLayout: MapEntity[] = [
  { id: 'c1', type: 'coin', x: 200, y: 370 }, { id: 'c2', type: 'coin', x: 350, y: 350 },
  { id: 'c3', type: 'coin', x: 500, y: 370 }, { id: 'c4', type: 'coin', x: 700, y: 350 },
  { id: 'c5', type: 'coin', x: 900, y: 370 }, { id: 'c6', type: 'coin', x: 1100, y: 350 },
  { id: 'c7', type: 'coin', x: 1300, y: 370 }, { id: 'c8', type: 'coin', x: 1500, y: 350 },
  { id: 'c9', type: 'coin', x: 1700, y: 370 }, { id: 'c10', type: 'coin', x: 1900, y: 350 },
  { id: 'c11', type: 'coin', x: 2200, y: 370 }, { id: 'c12', type: 'coin', x: 2400, y: 350 },
  { id: 'c13', type: 'coin', x: 2600, y: 370 }, { id: 'c14', type: 'coin', x: 2800, y: 350 },
  { id: 'c15', type: 'coin', x: 3000, y: 370 }, { id: 'c16', type: 'coin', x: 3200, y: 350 },
  { id: 'm1', type: 'monster', x: 500, y: 350, monsterId: 'slime' },
  { id: 'm2', type: 'monster', x: 1000, y: 350, monsterId: 'bug' },
  { id: 'm3', type: 'monster', x: 1500, y: 350, monsterId: 'mushroom' },
  { id: 'm4', type: 'monster', x: 2100, y: 340, monsterId: 'bat' },
  { id: 'm5', type: 'monster', x: 2700, y: 320, monsterId: 'boss' },
  { id: 'ch1', type: 'chest', x: 750, y: 360 },
  { id: 'ch2', type: 'chest', x: 1800, y: 360 },
  { id: 'ch3', type: 'chest', x: 2500, y: 360 },
  { id: 'f1', type: 'flag', x: 3200, y: 330 },
];

// ============ Helper Functions ============
export function getContentById(id: string): ContentItem | undefined {
  return contentLibrary.find(c => c.id === id);
}

export function getRandomContent(
  wave: WaveConfig,
  usedTexts: string[] = [],
  currentStage: number
): ContentItem {
  const maxStage = Math.min(wave.maxStage, currentStage + 1);
  let pool = contentLibrary.filter(c => {
    if (c.stage > maxStage) return false;
    const weight = wave.typeWeights[c.type as keyof typeof wave.typeWeights];
    return weight > 0;
  });
  const weighted = pool.flatMap(c => {
    const weight = wave.typeWeights[c.type as keyof typeof wave.typeWeights];
    return Array(Math.ceil(weight * 10)).fill(c);
  });
  const available = weighted.filter(c => !usedTexts.includes(c.text));
  const finalPool = available.length > 3 ? available : weighted;
  return finalPool[Math.floor(Math.random() * finalPool.length)] || contentLibrary[0];
}

export function getMonsterById(id: string): Monster | undefined {
  return monsters.find(m => m.id === id);
}

export function getLevelById(id: string): LevelDef | undefined {
  for (const world of worlds) {
    const level = world.levels.find(l => l.id === id);
    if (level) return level;
  }
  return undefined;
}

export function calculateStars(accuracy: number, totalErrors: number, maxRounds: number): number {
  if (accuracy >= 95 && totalErrors <= Math.max(1, Math.floor(maxRounds * 0.1))) return 3;
  if (accuracy >= 80) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}

export function calculateDamage(
  timeLeft: number, timeLimit: number, errorCount: number, combo: number,
  playerLevel: number, damageBoost: number
): number {
  const timeRatio = timeLeft / timeLimit;
  const baseDamage = 4 + playerLevel;
  let multiplier = 1;
  if (timeRatio >= 0.5 && errorCount === 0) multiplier = 1.5;
  else if (errorCount <= 1) multiplier = 1.0 + timeRatio * 0.3;
  else if (errorCount <= 3) multiplier = 0.6 + timeRatio * 0.2;
  else multiplier = 0.4;
  const comboBonus = 1 + Math.min(combo, 10) * 0.05;
  return Math.max(3, Math.floor(baseDamage * multiplier * comboBonus * (1 + damageBoost)));
}

export function calculateMonsterDamage(attackDamage: number, defenseBoost: number): number {
  // Defense is now flat reduction (max 3), not percentage
  const reduction = Math.min(3, Math.floor(defenseBoost * 5));
  return Math.max(1, attackDamage - reduction);
}

export function getTimeLimit(text: string, type: string, waveMultiplier: number, levelId?: string | null): number {
  // Base times increased for 6-year-old beginners (needs time to locate keys)
  const baseTimes: Record<string, number> = { letter: 5, combo: 5, word: 7, phrase: 11 };
  const base = baseTimes[type] || 5;
  const lengthBonus = Math.max(0, text.length - 3) * 1.0;
  const rawTime = Math.round((base + lengthBonus) * waveMultiplier);
  const levelNumber = levelId?.startsWith('l') ? Number(levelId.slice(1)) : 0;
  if (levelNumber >= 1 && levelNumber <= 15) return Math.max(2, rawTime - 1);
  return rawTime;
}

export function getWaveForRound(monster: Monster, round: number): { wave: WaveConfig; waveIndex: number; roundInWave: number } {
  let cumulative = 0;
  for (let i = 0; i < monster.waves.length; i++) {
    const wave = monster.waves[i];
    if (round <= cumulative + wave.count) return { wave, waveIndex: i, roundInWave: round - cumulative };
    cumulative += wave.count;
  }
  const lastWave = monster.waves[monster.waves.length - 1];
  return { wave: lastWave, waveIndex: monster.waves.length - 1, roundInWave: round - cumulative };
}

export function getTotalRounds(monster: Monster): number {
  return monster.waves.reduce((sum, w) => sum + w.count, 0);
}

// ============ Free Challenge Mode Helpers ============
export function getRandomFreeContent(
  difficulty: string,
  usedTexts: string[] = []
): ContentItem {
  let pool: ContentItem[] = [];
  switch (difficulty) {
    case 'letter':
      // Only single letters (stage 0-1, type='letter')
      pool = contentLibrary.filter(c => c.type === 'letter' && c.stage <= 1);
      break;
    case 'combo':
      // Only adjacent key combos (stage 1, type='combo')
      pool = contentLibrary.filter(c => c.type === 'combo' && c.stage === 1);
      break;
    case 'word':
      // 2-letter to 6-letter words (stage 2-4, type='word')
      pool = contentLibrary.filter(c => c.type === 'word' && c.stage >= 2 && c.stage <= 4);
      break;
    case 'phrase':
      // 7-10 letter words + short phrases + longer sentences (stage 5-7)
      pool = contentLibrary.filter(c => (c.type === 'word' && c.stage === 5) || (c.type === 'phrase' && c.stage >= 6));
      break;
    default:
      pool = contentLibrary.filter(c => c.type === 'word');
  }
  const available = pool.filter(c => !usedTexts.includes(c.text));
  const finalPool = available.length > 0 ? available : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)] || contentLibrary[0];
}

export function getFreeContentReward(difficulty: string, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  // Free mode rewards are HIGHER than battle mode to encourage practice first
  switch (difficulty) {
    case 'letter': return 2;
    case 'combo': return 3;
    case 'word': return 5;
    case 'phrase': return 8;
    default: return 2;
  }
}

export function getFreeTimeLimit(content: ContentItem): number {
  const baseTimes: Record<string, number> = { letter: 5, combo: 5, word: 8, phrase: 15 };
  const base = baseTimes[content.type] || 8;
  const lengthBonus = Math.max(0, content.text.length - 3) * 1.2;
  return base + lengthBonus;
}

