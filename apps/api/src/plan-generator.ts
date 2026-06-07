// 定义类型
export interface UserAssessment {
  cardioEndurance: number; muscleStrength: number; flexibility: number; balance: number;
}

export interface UserProfile {
  age: number; gender: string; height: number; weight: number; bmi: number; bmr: number;
  weeklyWorkoutDays: number; workoutDuration: number; preferredWorkoutType: string; experienceLevel: string;
}

export interface WorkoutPlan { weeks: WeekPlan[]; summary: PlanSummary; }
export interface WeekPlan { week: number; focus: string; workouts: DailyWorkout[]; }
export interface DailyWorkout { day: number; warmup: string[]; main: string[]; coolDown: string[]; exercises?: Exercise[]; }
export interface Exercise { name: string; sets: number; reps: number; rest: number; notes: string; target?: string; difficulty?: string; icon?: string; }
export interface PlanSummary { weeklyDays: number; sessionDuration: number; primaryType: string; level: string; focusAreas: string[]; }

// 完整动作库 - Keep 风格
const exerciseLibrary = {
  cardio: [
    { name: '慢跑', sets: 1, reps: 1200, rest: 0, notes: '保持中等强度，心率在最大心率60-70%', target: '全身', difficulty: '初级', icon: '🏃' },
    { name: '快走', sets: 1, reps: 1800, rest: 0, notes: '大步快走，双臂有力摆动', target: '下肢', difficulty: '初级', icon: '🚶' },
    { name: '跳绳', sets: 3, reps: 100, rest: 30, notes: '落地轻盈，前脚掌着地，膝盖微屈', target: '全身', difficulty: '中级', icon: '🪢' },
    { name: '开合跳', sets: 3, reps: 40, rest: 25, notes: '跳起时手脚同时打开，落地轻稳', target: '全身', difficulty: '初级', icon: '⭐' },
    { name: '高抬腿', sets: 3, reps: 40, rest: 30, notes: '大腿抬至与地面平行，核心收紧', target: '核心+下肢', difficulty: '中级', icon: '🦵' },
    { name: '波比跳', sets: 3, reps: 12, rest: 45, notes: '俯卧撑位→收腿→跳起→重复，全身燃脂', target: '全身', difficulty: '高级', icon: '💥' },
    { name: '登山跑', sets: 3, reps: 40, rest: 30, notes: '平板支撑姿势，交替提膝靠近胸口', target: '核心', difficulty: '中级', icon: '⛰️' },
    { name: '战绳', sets: 3, reps: 30, rest: 45, notes: '双手交替或同步甩绳，保持核心稳定', target: '上肢+核心', difficulty: '高级', icon: '〰️' },
    { name: '原地冲刺', sets: 4, reps: 20, rest: 20, notes: '原地快速高抬腿冲刺，尽全力', target: '全身', difficulty: '高级', icon: '⚡' },
    { name: '滑冰跳', sets: 3, reps: 20, rest: 30, notes: '左右横向跳跃，模拟滑冰动作', target: '下肢', difficulty: '中级', icon: '⛸️' },
    { name: '踢臀跑', sets: 2, reps: 40, rest: 20, notes: '慢跑中脚跟踢向臀部，热身激活', target: '下肢', difficulty: '初级', icon: '🦿' },
    { name: '交叉跳', sets: 3, reps: 30, rest: 25, notes: '双脚交叉跳跃，锻炼协调性', target: '下肢', difficulty: '初级', icon: '✖️' },
  ],
  strength_upper: [
    { name: '标准俯卧撑', sets: 3, reps: 12, rest: 60, notes: '身体成直线，核心收紧，胸部触地', target: '胸+三头', difficulty: '中级', icon: '💪' },
    { name: '宽距俯卧撑', sets: 3, reps: 10, rest: 60, notes: '双手宽于肩，侧重胸大肌外侧', target: '胸', difficulty: '中级', icon: '🤲' },
    { name: '钻石俯卧撑', sets: 3, reps: 8, rest: 60, notes: '双手拇指食指相触成钻石形，锻炼三头肌', target: '三头', difficulty: '高级', icon: '💎' },
    { name: '哑铃弯举', sets: 3, reps: 12, rest: 45, notes: '上臂固定，前臂弯举，顶峰收缩', target: '二头', difficulty: '初级', icon: '💪' },
    { name: '锤式弯举', sets: 3, reps: 12, rest: 45, notes: '掌心相对握哑铃，锻炼肱肌', target: '二头+前臂', difficulty: '初级', icon: '🔨' },
    { name: '推举', sets: 3, reps: 10, rest: 60, notes: '坐姿或站姿，哑铃从肩部推至头顶', target: '肩', difficulty: '中级', icon: '🏋️' },
    { name: '侧平举', sets: 3, reps: 12, rest: 45, notes: '手臂微屈，从体侧上抬至肩高', target: '肩', difficulty: '初级', icon: '🦅' },
    { name: '前平举', sets: 3, reps: 12, rest: 45, notes: '手臂伸直前举至肩高，锻炼前束', target: '肩', difficulty: '初级', icon: '➡️' },
    { name: '俯身飞鸟', sets: 3, reps: 12, rest: 45, notes: '俯身，手臂向两侧打开，挤压后束', target: '肩后束', difficulty: '中级', icon: '🕊️' },
    { name: '臂屈伸', sets: 3, reps: 12, rest: 45, notes: '椅子边缘支撑，屈肘下放身体', target: '三头', difficulty: '中级', icon: '⬇️' },
  ],
  strength_lower: [
    { name: '自重深蹲', sets: 3, reps: 15, rest: 60, notes: '双脚与肩同宽，臀部后坐，膝盖不内扣', target: '臀+腿', difficulty: '初级', icon: '🪑' },
    { name: '负重深蹲', sets: 3, reps: 10, rest: 90, notes: '杠铃置于斜方肌上，保持背部挺直', target: '臀+腿', difficulty: '高级', icon: '🏋️' },
    { name: '弓步蹲', sets: 3, reps: 12, rest: 60, notes: '前后脚交替，双膝均呈90°，身体直立', target: '臀+腿', difficulty: '中级', icon: '🚶' },
    { name: '保加利亚分腿蹲', sets: 3, reps: 10, rest: 60, notes: '后脚抬高放在椅子上，前腿深蹲', target: '臀+股四', difficulty: '高级', icon: '🇧🇬' },
    { name: '臀桥', sets: 3, reps: 20, rest: 45, notes: '仰卧屈膝，臀部发力上推，顶峰收缩2秒', target: '臀', difficulty: '初级', icon: '🌉' },
    { name: '单腿臀桥', sets: 3, reps: 12, rest: 45, notes: '一腿伸直抬起，单侧臀桥', target: '臀+核心', difficulty: '中级', icon: '🏗️' },
    { name: '硬拉', sets: 3, reps: 8, rest: 120, notes: '保持背部挺直，髋部发力上拉', target: '后链', difficulty: '高级', icon: '⬆️' },
    { name: '罗马尼亚硬拉', sets: 3, reps: 10, rest: 90, notes: '膝微屈，髋部后推，感受腘绳肌拉伸', target: '腘绳肌', difficulty: '中级', icon: '📐' },
    { name: '提踵', sets: 3, reps: 20, rest: 30, notes: '脚尖站立，最大限度提起脚跟', target: '小腿', difficulty: '初级', icon: '🦶' },
    { name: '侧弓步', sets: 3, reps: 10, rest: 45, notes: '向一侧跨步下蹲，锻炼大腿内侧', target: '大腿内侧', difficulty: '中级', icon: '↔️' },
  ],
  core: [
    { name: '平板支撑', sets: 3, reps: 45, rest: 30, notes: '手肘撑地，身体成直线，核心收紧', target: '核心', difficulty: '初级', icon: '🪵' },
    { name: '侧平板', sets: 3, reps: 30, rest: 30, notes: '单侧手肘支撑，髋部抬起不沉', target: '侧腹', difficulty: '中级', icon: '📏' },
    { name: '卷腹', sets: 3, reps: 20, rest: 30, notes: '仰卧屈膝，肩胛骨离地，上腹发力', target: '上腹', difficulty: '初级', icon: '🔄' },
    { name: '仰卧举腿', sets: 3, reps: 15, rest: 30, notes: '双腿伸直上举至90°，缓慢下放', target: '下腹', difficulty: '中级', icon: '🔝' },
    { name: '俄罗斯转体', sets: 3, reps: 20, rest: 30, notes: '坐姿后仰，双手交握左右转体', target: '侧腹', difficulty: '中级', icon: '🇷🇺' },
    { name: '死虫式', sets: 3, reps: 12, rest: 30, notes: '仰卧对侧手脚交替伸展，核心稳定', target: '核心', difficulty: '初级', icon: '🐛' },
    { name: '鸟狗式', sets: 3, reps: 12, rest: 30, notes: '四足跪姿，对侧手脚同时伸展', target: '核心+平衡', difficulty: '初级', icon: '🐦' },
    { name: 'V字支撑', sets: 3, reps: 30, rest: 30, notes: '坐姿，身体呈V形保持，核心发力', target: '核心', difficulty: '高级', icon: '🔺' },
  ],
  flexibility: [
    { name: '全身静态拉伸', sets: 1, reps: 300, rest: 0, notes: '从头到脚依次拉伸，每个部位保持30秒', target: '全身', difficulty: '初级', icon: '🧘' },
    { name: '瑜伽-下犬式', sets: 2, reps: 45, rest: 15, notes: '手推地，坐骨上提，脚跟踩地', target: '全身', difficulty: '初级', icon: '🐕' },
    { name: '瑜伽-猫牛式', sets: 2, reps: 12, rest: 0, notes: '吸气抬头塌腰，呼气低头拱背', target: '脊柱', difficulty: '初级', icon: '🐱' },
    { name: '泡沫轴放松', sets: 1, reps: 300, rest: 0, notes: '大腿前后侧、背部、臀部各滚动60秒', target: '全身', difficulty: '初级', icon: '🫧' },
    { name: '蝴蝶拉伸', sets: 2, reps: 45, rest: 15, notes: '脚底相对，膝盖轻压向地面', target: '髋', difficulty: '初级', icon: '🦋' },
    { name: '坐姿体前屈', sets: 2, reps: 45, rest: 15, notes: '从髋部折叠前屈，感受腿后侧拉伸', target: '腿后侧', difficulty: '初级', icon: '📏' },
    { name: '鸽式', sets: 2, reps: 60, rest: 15, notes: '前腿弯曲横放，后腿伸直，髋部下沉', target: '髋+臀', difficulty: '中级', icon: '🕊️' },
    { name: '婴儿式', sets: 1, reps: 60, rest: 0, notes: '跪坐，上身前俯，额头贴地，放松全身', target: '放松', difficulty: '初级', icon: '👶' },
    { name: '眼镜蛇式', sets: 2, reps: 30, rest: 15, notes: '俯卧，手推地抬起上身，伸展腹肌', target: '腹部+脊柱', difficulty: '初级', icon: '🐍' },
    { name: '站姿腘绳肌拉伸', sets: 2, reps: 30, rest: 10, notes: '一脚前伸脚跟点地，俯身拉伸腿后侧', target: '腿后侧', difficulty: '初级', icon: '🦵' },
  ],
  balance: [
    { name: '单脚站立', sets: 2, reps: 45, rest: 15, notes: '目视前方固定点，保持平衡', target: '平衡', difficulty: '初级', icon: '🦩' },
    { name: '单腿硬拉', sets: 3, reps: 8, rest: 45, notes: '单腿站立俯身，另一腿后伸，保持平衡', target: '平衡+后链', difficulty: '中级', icon: '🎯' },
    { name: '树式', sets: 2, reps: 45, rest: 15, notes: '一脚掌贴于支撑腿内侧，双手合十', target: '平衡', difficulty: '初级', icon: '🌳' },
    { name: '波速球深蹲', sets: 3, reps: 10, rest: 45, notes: '站于不稳定平面深蹲，挑战平衡', target: '平衡+腿', difficulty: '高级', icon: '🏐' },
    { name: '闭眼单脚站立', sets: 2, reps: 30, rest: 20, notes: '闭眼状态下单脚站立，大幅提升难度', target: '平衡', difficulty: '高级', icon: '👁️' },
  ],
};

type ExerciseCategory = keyof typeof exerciseLibrary;

// 根据偏好类型映射到对应动作库分类
function categoryForType(type: string, dayRole: string): ExerciseCategory[] {
  switch (dayRole) {
    case 'cardio': return ['cardio'];
    case 'strength_upper': return ['strength_upper'];
    case 'strength_lower': return ['strength_lower'];
    case 'core': return ['core'];
    case 'flexibility': return ['flexibility'];
    case 'balance': return ['balance'];
    case 'mixed': return type === '有氧' ? ['cardio', 'core'] : type === '力量' ? ['strength_upper', 'strength_lower', 'core'] : type === '柔韧' ? ['flexibility', 'balance'] : ['strength_upper', 'cardio', 'core'];
    default: return ['strength_upper'];
  }
}

class PlanGenerator {
  getFullLibrary() {
    return exerciseLibrary;
  }

  generatePlan(assessment: UserAssessment, profile: UserProfile, feedbackBias = 0): WorkoutPlan {
    const { weeklyWorkoutDays, preferredWorkoutType, experienceLevel } = profile;
    const intensity = this.getIntensityMultiplier(experienceLevel) + feedbackBias;
    const focusAreas = this.identifyFocusAreas(assessment);

    const weeks: WeekPlan[] = [];
    for (let week = 1; week <= 4; week++) {
      const weekFocus = this.getWeekFocus(week, focusAreas, preferredWorkoutType);
      const progressiveOverload = 1 + (week - 1) * 0.08;
      const workouts: DailyWorkout[] = [];

      for (let day = 1; day <= weeklyWorkoutDays; day++) {
        const workout = this.generateDailyWorkout(assessment, profile, intensity * progressiveOverload, week, day, weeklyWorkoutDays);
        workouts.push(workout);
      }
      weeks.push({ week, focus: weekFocus, workouts });
    }

    return {
      weeks,
      summary: {
        weeklyDays: weeklyWorkoutDays,
        sessionDuration: profile.workoutDuration,
        primaryType: preferredWorkoutType,
        level: experienceLevel,
        focusAreas,
      },
    };
  }

  private generateDailyWorkout(assessment: UserAssessment, profile: UserProfile, intensityMultiplier: number, week: number, day: number, weeklyDays: number): DailyWorkout {
    const { preferredWorkoutType } = profile;
    const weakAreas = this.getWeakAreas(assessment);
    const dayRole = this.getDayRole(day, weeklyDays, preferredWorkoutType);

    const warmup = this.pickWarmup(week, day);
    const coolDown = this.pickCoolDown(day);
    const main: string[] = [];
    let exercises: Exercise[] = [];

    const cats = categoryForType(preferredWorkoutType, dayRole);
    const roleLabels: Record<string, string> = {
      cardio: '有氧燃脂日', strength_upper: '上肢力量日', strength_lower: '下肢力量日',
      core: '核心强化日', flexibility: '柔韧恢复日', balance: '平衡训练日', mixed: '综合训练日',
    };
    main.push(roleLabels[dayRole] || dayRole);

    const exerciseCount = Math.min(5, Math.floor(profile.workoutDuration / 10));
    for (const cat of cats) {
      exercises.push(...this.selectRandom(cat, intensityMultiplier, Math.ceil(exerciseCount / cats.length)));
    }

    if (weakAreas.length > 0 && day % 2 === 0) {
      exercises.push(...this.selectRandom(weakAreas[day % weakAreas.length] as ExerciseCategory, intensityMultiplier, 1));
    }

    return { day, warmup, main, coolDown, exercises };
  }

  private selectRandom(type: ExerciseCategory, multiplier: number, count: number): Exercise[] {
    const exercises = [...exerciseLibrary[type]];
    for (let i = exercises.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
    }
    return exercises.slice(0, Math.min(count, exercises.length)).map(ex => ({
      ...ex,
      sets: Math.max(1, Math.round(ex.sets * multiplier)),
      reps: Math.max(5, Math.round(ex.reps * multiplier)),
    }));
  }

  private pickWarmup(week: number, day: number): string[] {
    const options = [
      ['关节环绕 2分钟', '开合跳 30秒', '高抬腿 30秒', '肩部环绕'],
      ['跳绳 2分钟', '动态拉伸', '弓步转体', '踢臀跑 30秒'],
      ['泡沫轴激活 2分钟', '慢跑 3分钟', '深蹲 10次(无负重)', '手臂画圈'],
      ['快走 3分钟', '侧滑步 30秒', '登山跑 20秒', '髋关节环绕'],
    ];
    return options[(week * 7 + day) % options.length];
  }

  private pickCoolDown(day: number): string[] {
    const options = [
      ['静态拉伸：腿后侧 30秒', '深呼吸 2分钟', '肩部拉伸 30秒'],
      ['泡沫轴放松：背部', '婴儿式放松 1分钟', '髋屈肌拉伸 30秒'],
      ['坐姿体前屈 30秒', '蝴蝶拉伸 30秒', '仰卧扭转放松'],
    ];
    return options[day % options.length];
  }

  private getDayRole(day: number, weeklyDays: number, preferredType: string): string {
    if (preferredType === '有氧') {
      if (weeklyDays >= 4 && (day === 2 || day === 4)) return 'core';
      return 'cardio';
    }
    if (preferredType === '力量') {
      if (weeklyDays >= 5 && day === weeklyDays) return 'flexibility';
      if (day % 2 === 1) return 'strength_upper';
      if (day % 2 === 0) return 'strength_lower';
    }
    if (preferredType === '柔韧') {
      if (weeklyDays >= 3 && day === weeklyDays) return 'cardio';
      return 'flexibility';
    }
    if (weeklyDays <= 3) return 'mixed';
    if (day === 1 || day === 4) return 'strength_upper';
    if (day === 2 || day === 5) return 'strength_lower';
    if (day === 3 || day === 6) return 'cardio';
    return 'core';
  }

  private identifyFocusAreas(assessment: UserAssessment): string[] {
    const areas: string[] = [];
    const threshold = 5;
    if (assessment.cardioEndurance < threshold) areas.push('有氧耐力');
    if (assessment.muscleStrength < threshold) areas.push('肌肉力量');
    if (assessment.flexibility < threshold) areas.push('柔韧性');
    if (assessment.balance < threshold) areas.push('平衡能力');
    if (areas.length === 0) areas.push('综合强化');
    return areas;
  }

  private getWeakAreas(assessment: UserAssessment): ExerciseCategory[] {
    const weak: ExerciseCategory[] = [];
    if (assessment.cardioEndurance <= 4) weak.push('cardio');
    if (assessment.muscleStrength <= 4) weak.push('strength_upper');
    if (assessment.flexibility <= 4) weak.push('flexibility');
    if (assessment.balance <= 4) weak.push('balance');
    return weak;
  }

  private getWeekFocus(week: number, focusAreas: string[], preferredType: string): string {
    if (week === 1) return `适应期 · ${preferredType === '有氧' ? '建立有氧基础' : preferredType === '力量' ? '学习动作模式' : preferredType === '柔韧' ? '唤醒身体感知' : '全身激活'}`;
    if (week === 2) return `提升期 · ${focusAreas[0] || '综合体能'}`;
    if (week === 3) return `强化期 · ${focusAreas[focusAreas.length > 1 ? 1 : 0] || '体能突破'}`;
    return `冲刺期 · 综合突破`;
  }

  private getIntensityMultiplier(experienceLevel: string): number {
    switch (experienceLevel) {
      case '新手': return 0.7;
      case '进阶': return 1.0;
      case '高级': return 1.4;
      default: return 1.0;
    }
  }

  async generatePlanWithML(assessment: UserAssessment, profile: UserProfile): Promise<WorkoutPlan> {
    return this.generatePlan(assessment, profile);
  }
}

export const planGenerator = new PlanGenerator();

