export type HealthStatus = 'healthy' | 'cold' | 'indigestion' | 'fatigue';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type DietGoal = 'lose_weight' | 'maintain' | 'build_muscle';
export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  goal: DietGoal;
  healthStatus: HealthStatus;
  commonFoods: string[]; // e.g. ["鸡蛋", "牛奶", "燕麦", "鸡胸肉"]
  targetCalories: number;
  targetProtein: number;
  // Micronutrient daily targets
  targetVitaminC: number;
  targetCalcium: number;
  targetIron: number;
  targetZinc: number;
  targetVitaminD: number;   // mcg
  targetVitaminB12: number; // mcg
  targetMagnesium: number;  // mg
  targetPotassium: number;  // mg
}

export interface Micronutrients {
  vitaminC: number;   // mg
  calcium: number;    // mg
  iron: number;       // mg
  zinc: number;       // mg
  vitaminD: number;   // mcg (维D)
  vitaminB12: number; // mcg (维B12)
  magnesium: number;  // mg (镁)
  potassium: number;  // mg (钾)
}

export interface MealRecommendation {
  mealType: MealType;
  title: string;
  dishes: {
    name: string;
    portion: string;
    description: string;
    isCommon: boolean;
  }[];
  calories: number;
  protein: number; // g
  micronutrients: Micronutrients;
  rationale: string; // Explanation based on healthStatus, meat-veg combo, and non-repetition
}

export interface MealLog {
  id: string;
  mealType: MealType;
  time: string; // HH:MM
  foodName: string;
  calories: number;
  protein: number;
  micronutrients: Micronutrients;
  rawDetails: string;
  imageUrl?: string;
}

export interface ActivityLog {
  id: string;
  name: string; // e.g. "跑步", "力量训练", "步行"
  duration: number; // minutes
  caloriesBurned: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  healthStatus: HealthStatus;
  meals: MealLog[];
  activities: ActivityLog[];
  // Calculated summaries
  totalCalories: number;
  totalProtein: number;
  micronutrients: Micronutrients;
  caloriesBurned: number;
}

export interface SupplementRecommendation {
  gapAnalysis: {
    calories: number;
    protein: number;
    vitaminC: number;
    calcium: number;
    iron: number;
    zinc: number;
    vitaminD: number;
    vitaminB12: number;
    magnesium: number;
    potassium: number;
  };
  suggestions: {
    name: string;
    dose: string;
    reason: string;
  }[];
  generalAdvice: string;
}

export interface ApiConfig {
  provider: 'google' | 'deepseek';
  googleKey: string;
  deepseekKey: string;
}

export interface SupplementLog {
  id: string;
  name: string;
  dosage: string;
  time: string;
  protein?: number;
  calories?: number;
  micronutrients?: Partial<Micronutrients>;
}
