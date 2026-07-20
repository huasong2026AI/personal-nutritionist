import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserProfile, MealLog, MealRecommendation, SupplementRecommendation, MealType, HealthStatus, ApiConfig } from '../types';

// The priorities based on RPD size in the user's screenshot (gemini-2.5-flash removed)
const MODEL_PRIORITY = [
  'gemini-3.1-flash-lite', // 500 RPD
  'gemini-2.5-flash-lite', // 20 RPD
  'gemini-3-flash'         // 20 RPD
];

// Helper to convert base64 image data to the format Gemini expects safely
function handleBase64Image(dataUrl: string) {
  try {
    if (!dataUrl || !dataUrl.includes(';base64,')) return null;
    const parts = dataUrl.split(';base64,');
    const mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    const base64Data = parts[1];
    if (!base64Data) return null;
    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };
  } catch (e) {
    console.error("Error handling base64 image:", e);
    return null;
  }
}

/**
 * Execute a prompt against DeepSeek API (OpenAI compatible)
 */
async function callDeepSeek(
  apiKey: string,
  modelName: string,
  prompt: string,
  imageBase64?: string
): Promise<{ text: string; modelUsed: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  const messages: any[] = [];
  
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ]
    });
  } else {
    messages.push({
      role: 'user',
      content: prompt
    });
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelName,
      messages,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API 错误: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  const text = result.choices[0].message.content;
  return { text, modelUsed: modelName };
}

/**
 * Execute a prompt against Gemini models with automatic cascading fallback
 */
async function callGeminiCascade(
  apiKey: string,
  prompt: string,
  imagePart?: any
): Promise<{ text: string; modelUsed: string }> {
  let lastError = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const contents: any[] = [prompt];
      if (imagePart) {
        contents.push(imagePart);
      }

      const result = await model.generateContent(contents);
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        return { text, modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed or quota exceeded:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("所有谷歌 AI 模型调用均失败，请检查 API Key 或网络。");
}

/**
 * Analyze a meal from text description or image upload
 */
export async function analyzeMeal(
  apiConfig: ApiConfig | null,
  input: { text?: string; imageBase64?: string },
  healthStatus: string,
  commonFoods: string[]
): Promise<{ data: Omit<MealLog, 'id' | 'time'>; modelUsed: string }> {
  const activeKey = apiConfig?.provider === 'google' ? apiConfig.googleKey : apiConfig?.deepseekKey;
  if (!apiConfig || !activeKey || activeKey.trim() === '') {
    return { data: getMockMealAnalysis(input.text || "模拟膳食"), modelUsed: 'Mock-Local-Service' };
  }

  const basePrompt = `
    你是一个专业的私人智能营养师。请分析用户吃的内容，估算其卡路里(Calories)、蛋白质(Protein，克)以及以下8种微量元素(Micronutrients)的含量：
    1. 维生素C (Vitamin C, mg)
    2. 钙 (Calcium, mg)
    3. 铁 (Iron, mg)
    4. 锌 (Zinc, mg)
    5. 维生素D (Vitamin D, mcg)
    6. 维生素B12 (Vitamin B12, mcg)
    7. 镁 (Magnesium, mg)
    8. 钾 (Potassium, mg)
    
    用户当前的身体状况是: "${healthStatus}" (健康状况可能会影响消化吸收，请在 rawDetails 中给出贴心小建议)。
    用户常吃的食物有: [${commonFoods.join(', ')}]，如果识别的内容里有类似的，可以关联起来。
    
    分析内容：${input.text ? `"${input.text}"` : '请识别图片中的食物'}
    
    你必须返回以下 JSON 格式的字符串，不要有任何 Markdown 代码块包裹，不要返回除 JSON 以外的任何多余文字：
    {
      "foodName": "食物名称(中文)",
      "calories": 450, // 整数, 卡路里数(kcal)
      "protein": 22,   // 整数, 蛋白质克数(g)
      "micronutrients": {
        "vitaminC": 15, // 浮点数/整数, 毫克(mg)
        "calcium": 120, // 浮点数/整数, 毫克(mg)
        "iron": 1.8,    // 浮点数/整数, 毫克(mg)
        "zinc": 1.2,     // 浮点数/整数, 毫克(mg)
        "vitaminD": 1.5, // 浮点数/整数, 微克(mcg)
        "vitaminB12": 0.4, // 浮点数/整数, 微克(mcg)
        "magnesium": 45, // 浮点数/整数, 毫克(mg)
        "potassium": 280 // 浮点数/整数, 毫克(mg)
      },
      "rawDetails": "估算依据与营养评估(150字以内)，并结合用户的"${healthStatus}"状态提供一句话关怀提示"
    }
  `;

  let text = '';
  let modelUsed = '';

  if (apiConfig.provider === 'google') {
    let imagePart = null;
    if (input.imageBase64) {
      imagePart = handleBase64Image(input.imageBase64);
    }
    const result = await callGeminiCascade(apiConfig.googleKey, basePrompt, imagePart);
    text = result.text;
    modelUsed = result.modelUsed;
  } else {
    const modelName = input.imageBase64 ? 'deepseek-v4-pro' : 'deepseek-v4-flash';
    const result = await callDeepSeek(apiConfig.deepseekKey, modelName, basePrompt, input.imageBase64);
    text = result.text;
    modelUsed = result.modelUsed;
  }
  
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);
    return {
      data: {
        mealType: 'breakfast', 
        foodName: data.foodName || '未知膳食',
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        micronutrients: {
          vitaminC: Number(data.micronutrients?.vitaminC) || 0,
          calcium: Number(data.micronutrients?.calcium) || 0,
          iron: Number(data.micronutrients?.iron) || 0,
          zinc: Number(data.micronutrients?.zinc) || 0,
          vitaminD: Number(data.micronutrients?.vitaminD) || 0,
          vitaminB12: Number(data.micronutrients?.vitaminB12) || 0,
          magnesium: Number(data.micronutrients?.magnesium) || 0,
          potassium: Number(data.micronutrients?.potassium) || 0
        },
        rawDetails: data.rawDetails || '',
        imageUrl: input.imageBase64
      },
      modelUsed
    };
  } catch (e) {
    console.error("Failed to parse AI JSON response:", text);
    throw new Error("AI 返回数据格式解析失败，请重试。");
  }
}

/**
 * Recommend next meal based on dynamic conditions
 */
export async function recommendMeal(
  apiConfig: ApiConfig | null,
  mealType: MealType,
  profile: UserProfile,
  todayMeals: MealLog[]
): Promise<{ data: MealRecommendation; modelUsed: string }> {
  const eatenCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const eatenProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
  const eatenVitC = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminC || 0), 0);
  const eatenCalcium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.calcium || 0), 0);
  const eatenIron = todayMeals.reduce((sum, m) => sum + (m.micronutrients.iron || 0), 0);
  const eatenZinc = todayMeals.reduce((sum, m) => sum + (m.micronutrients.zinc || 0), 0);
  const eatenVitD = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminD || 0), 0);
  const eatenVitB12 = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminB12 || 0), 0);
  const eatenMagnesium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.magnesium || 0), 0);
  const eatenPotassium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.potassium || 0), 0);

  const remainingCalories = Math.max(0, profile.targetCalories - eatenCalories);
  const remainingProtein = Math.max(0, profile.targetProtein - eatenProtein);
  
  const remainingVitC = Math.max(0, profile.targetVitaminC - eatenVitC);
  const remainingCalcium = Math.max(0, profile.targetCalcium - eatenCalcium);
  const remainingIron = Math.max(0, profile.targetIron - eatenIron);
  const remainingZinc = Math.max(0, profile.targetZinc - eatenZinc);
  const remainingVitD = Math.max(0, profile.targetVitaminD - eatenVitD);
  const remainingVitB12 = Math.max(0, profile.targetVitaminB12 - eatenVitB12);
  const remainingMagnesium = Math.max(0, profile.targetMagnesium - eatenMagnesium);
  const remainingPotassium = Math.max(0, profile.targetPotassium - eatenPotassium);

  const eatenFoodsStr = todayMeals.map(m => m.foodName).join('、');

  const activeKey = apiConfig?.provider === 'google' ? apiConfig.googleKey : apiConfig?.deepseekKey;
  if (!apiConfig || !activeKey || activeKey.trim() === '') {
    return {
      data: getMockMealRecommendation(mealType, profile, remainingCalories, remainingProtein),
      modelUsed: 'Mock-Local-Service'
    };
  }

  const prompt = `
    你是一个专业的私人智能营养师。请根据以下用户的状态，推荐一顿符合健康原则的「${
      mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐'
    }」：
    
    【用户个人数据与偏好】
    - 年龄/性别：${profile.age}岁 / ${profile.gender === 'male' ? '男' : '女'}（如果年龄大于50岁，属于中老年群体，请特别关照其骨质流失、神经健康和心血管需求，多推荐富含钙、维D、镁、钾和B12的食物！）
    - 目标定位：${profile.goal === 'lose_weight' ? '减脂' : profile.goal === 'build_muscle' ? '增肌' : '维持健康体重'}
    - 当前身体健康状况：${profile.healthStatus}（如果是感冒、肠胃不适等，推荐必须清淡易消化）
    - 用户常吃的心仪食物：[${profile.commonFoods.join(', ')}]

    【今日摄入目标与缺口】
    - 全天卡路里目标：${profile.targetCalories} kcal，剩余配额：${remainingCalories} kcal
    - 全天蛋白质目标：${profile.targetProtein} g，剩余配额：${remainingProtein} g
    - 微量元素今日剩余缺口：
      * 维生素C: ${remainingVitC} mg
      * 钙: ${remainingCalcium} mg
      * 铁: ${remainingIron} mg
      * 锌: ${remainingZinc} mg
      * 维生素D: ${remainingVitD} mcg
      * 维生素B12: ${remainingVitB12} mcg
      * 镁: ${remainingMagnesium} mg
      * 钾: ${remainingPotassium} mg
    - 今日前面几餐已吃食物：${eatenFoodsStr ? `"${eatenFoodsStr}"` : '今天还没吃东西'}

    【推荐规则约束】
    1. 必须遵循【荤素搭配】原则，提供优质蛋白源与高膳食纤维蔬菜。
    2. 【避重规则】：推荐的食材绝对不能与今天前面已经吃过的食物 ["${eatenFoodsStr}"] 重复！
    3. 如果是【午餐】或【晚餐】，推荐的食物中必须包含【主食】（如米饭、馒头、面条、意面）。但若推荐了本身已含主食的主食混合餐（如饺子、汤面、炒饭），则不可再额外推荐主食。
    4. 如果是【早餐】，必须优先推荐中国人常吃的中式或常见早餐食物（如面包、牛奶、豆浆、鸡蛋、馒头、肉包、汤面、小米粥等）。
    5. 若用户年龄偏大，优先推荐易嚼碎、高营养密度的天然食物，并控制低盐低钠。

    你必须返回以下 JSON 格式的字符串，不要有任何 Markdown 代码块包裹，不要返回除 JSON 以外的任何多余文字：
    {
      "mealType": "${mealType}",
      "title": "推荐菜谱名称(如：高纤维护心益脑午餐 / 易消化高钙暖胃午餐)",
      "dishes": [
        {
          "name": "菜品名称(如：番茄慢炖豆腐鱼骨汤)",
          "portion": "分量建议(如：1大碗)",
          "description": "烹饪及营养描述(如：富含钙和维生素D，非常利于老年人骨骼强度)",
          "isCommon": false
        },
        {
          "name": "菜品名称(如：蒸紫薯糙米饭)",
          "portion": "分量建议(如：120克)",
          "description": "富含钾元素与膳食纤维，平稳血糖与血压",
          "isCommon": false
        }
      ],
      "calories": 480, 
      "protein": 32,   
      "micronutrients": {
        "vitaminC": 35, 
        "calcium": 250,   
        "iron": 2.2,     
        "zinc": 1.5,
        "vitaminD": 4.5,
        "vitaminB12": 0.8,
        "magnesium": 110,
        "potassium": 680
      },
      "rationale": "推荐依据分析，说明本餐如何契合荤素主食搭配、如何利用食材的钙/镁/钾/B12等来弥补中老年/当前状态的营养缺口(150字以内)"
    }
  `;

  let text = '';
  let modelUsed = '';

  if (apiConfig.provider === 'google') {
    const result = await callGeminiCascade(apiConfig.googleKey, prompt);
    text = result.text;
    modelUsed = result.modelUsed;
  } else {
    const result = await callDeepSeek(apiConfig.deepseekKey, 'deepseek-v4-flash', prompt);
    text = result.text;
    modelUsed = result.modelUsed;
  }

  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);
    return { data, modelUsed };
  } catch (e) {
    console.error("Failed to parse recommended meal JSON:", text);
    throw new Error("AI 推荐返回格式异常，已启用安全本地生成。");
  }
}

/**
 * Recommend Supplements based on daily/weekly nutrition gap and health status
 */
export async function recommendSupplements(
  apiConfig: ApiConfig | null,
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
  },
  healthStatus: HealthStatus
): Promise<{ data: SupplementRecommendation; modelUsed: string }> {
  const activeKey = apiConfig?.provider === 'google' ? apiConfig.googleKey : apiConfig?.deepseekKey;
  if (!apiConfig || !activeKey || activeKey.trim() === '') {
    return {
      data: getMockSupplementRecommendation(gapAnalysis, healthStatus),
      modelUsed: 'Mock-Local-Service'
    };
  }

  const prompt = `
    你是一个专业的私人智能营养师。请评估以下营养摄入缺口，并给出是否需要服用特定「补充剂(Supplements)」的建议（请特别针对中老年人群易缺乏的维生素D、B12、钙、镁进行评估）：
    
    【营养素缺口（负数代表吃不够，正数代表已达标或超标）】
    - 卡路里缺口: ${gapAnalysis.calories} kcal
    - 蛋白质缺口: ${gapAnalysis.protein} g
    - 维生素C缺口: ${gapAnalysis.vitaminC} mg
    - 钙缺口: ${gapAnalysis.calcium} mg
    - 铁缺口: ${gapAnalysis.iron} mg
    - 锌缺口: ${gapAnalysis.zinc} mg
    - 维生素D缺口: ${gapAnalysis.vitaminD} mcg
    - 维生素B12缺口: ${gapAnalysis.vitaminB12} mcg
    - 镁缺口: ${gapAnalysis.magnesium} mg
    - 钾缺口: ${gapAnalysis.potassium} mg
    
    用户当前的健康状态：${healthStatus}
    
    【推荐建议逻辑】
    - 钙与维生素D属于协同吸收微量元素。如果钙缺口大于200mg，或维生素D缺口大于5mcg，建议补充“碳酸钙D3片”或“柠檬酸钙 + 维生素D3滴剂”。对于中老年人，这是强力推荐的。
    - 维生素B12对于红细胞生成及防止老年神经退化极度关键，若缺口大于0.5mcg，建议补充“复合维生素B族”或“维生素B12口服补充剂”。
    - 镁和钾有利于平稳心率、保护肾脏并稳定血压，若缺口严重（镁缺口 > 100mg，钾缺口 > 800mg），可以建议补充“天门冬氨酸钾镁”或特定矿物质补剂，但同时提醒优先多吃天然绿叶蔬菜、香蕉等。
    - 若蛋白质缺口较大（> 15g），建议补充乳清蛋白粉。

    你必须返回以下 JSON 格式的字符串，不要有任何 Markdown 代码块包裹，不要返回除 JSON 以外 of any extra texts:
    {
      "gapAnalysis": {
        "calories": ${gapAnalysis.calories},
        "protein": ${gapAnalysis.protein},
        "vitaminC": ${gapAnalysis.vitaminC},
        "calcium": ${gapAnalysis.calcium},
        "iron": ${gapAnalysis.iron},
        "zinc": ${gapAnalysis.zinc},
        "vitaminD": ${gapAnalysis.vitaminD},
        "vitaminB12": ${gapAnalysis.vitaminB12},
        "magnesium": ${gapAnalysis.magnesium},
        "potassium": ${gapAnalysis.potassium}
      },
      "suggestions": [
        {
          "name": "建议补剂名称(如：柠檬酸钙维生素D3片)",
          "dose": "服用剂量建议(如：每日1片，随晚餐服用)",
          "reason": "针对中老年人骨质流失与今日维D、钙双重缺口，进行高效协同补充"
        }
      ],
      "generalAdvice": "今日整体膳食总结与中老年人特有的健康指导，结合生病或疲劳状况进行温和的人文关怀(150字以内)"
    }
  `;

  let text = '';
  let modelUsed = '';

  if (apiConfig.provider === 'google') {
    const result = await callGeminiCascade(apiConfig.googleKey, prompt);
    text = result.text;
    modelUsed = result.modelUsed;
  } else {
    const result = await callDeepSeek(apiConfig.deepseekKey, 'deepseek-v4-flash', prompt);
    text = result.text;
    modelUsed = result.modelUsed;
  }

  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);
    return { data, modelUsed };
  } catch (e) {
    console.error("Failed to parse supplement recommendation JSON:", text);
    throw new Error("补剂建议 AI 生成失败。");
  }
}

// ==========================================
// LOCAL MOCK IMPLEMENTATIONS (OFFLINE MODE)
// ==========================================

function getMockMealAnalysis(text: string): Omit<MealLog, 'id' | 'time'> {
  const normText = text.toLowerCase();
  
  if (normText.includes("蛋") || normText.includes("牛奶") || normText.includes("面包")) {
    return {
      mealType: 'breakfast',
      foodName: '切片面包、牛奶与煎鸡蛋',
      calories: 380,
      protein: 18,
      micronutrients: { 
        vitaminC: 2, 
        calcium: 240, 
        iron: 1.5, 
        zinc: 1.1,
        vitaminD: 2.2, // mcg
        vitaminB12: 0.6, // mcg
        magnesium: 35, // mg
        potassium: 320 // mg
      },
      rawDetails: "【本地模拟】估算：2片面包 + 煎蛋 + 1杯牛奶。富含钙、B12，提供元气中老年健康早餐。"
    };
  }
  
  if (normText.includes("鸡") || normText.includes("米饭") || normText.includes("肉") || normText.includes("牛")) {
    return {
      mealType: 'lunch',
      foodName: '黑米饭配鸡胸肉炒西兰花',
      calories: 550,
      protein: 38,
      micronutrients: { 
        vitaminC: 45, 
        calcium: 60, 
        iron: 2.1, 
        zinc: 2.5,
        vitaminD: 0,
        vitaminB12: 0.4,
        magnesium: 85,
        potassium: 540
      },
      rawDetails: "【本地模拟】估算：鸡胸肉 + 黑米饭 + 炒西兰花。高蛋白、高钾中式健康主食午餐。"
    };
  }

  if (normText.includes("鱼") || normText.includes("菜") || normText.includes("豆腐") || normText.includes("粥")) {
    return {
      mealType: 'dinner',
      foodName: '清蒸鲈鱼配大米饭与炒时蔬',
      calories: 420,
      protein: 26,
      micronutrients: { 
        vitaminC: 15, 
        calcium: 110, 
        iron: 3.2, 
        zinc: 1.8,
        vitaminD: 3.8, // 鱼肉富含维D
        vitaminB12: 1.2, // 鱼肉富含B12
        magnesium: 60,
        potassium: 420
      },
      rawDetails: "【本地模拟】估算：清蒸鲈鱼 + 碗装大米饭 + 白灼时蔬。荤素搭配，富含维D与B12，有利于保护心脑健康。"
    };
  }

  return {
    mealType: 'lunch',
    foodName: text.slice(0, 15) || '混合营养工作餐',
    calories: 450,
    protein: 20,
    micronutrients: { 
      vitaminC: 15, 
      calcium: 80, 
      iron: 1.5, 
      zinc: 1.0,
      vitaminD: 1.0,
      vitaminB12: 0.3,
      magnesium: 45,
      potassium: 300
    },
    rawDetails: `【本地模拟】已根据输入食物进行老年友好型日常膳食常规配比估算。`
  };
}

function getMockMealRecommendation(
  mealType: MealType,
  profile: UserProfile,
  remCal: number,
  remProt: number
): MealRecommendation {
  const isCold = profile.healthStatus === 'cold';
  const isInd = profile.healthStatus === 'indigestion';
  
  if (isCold) {
    return {
      mealType,
      title: '清淡温润感冒康复餐',
      dishes: [
        { name: '生滚山药瘦肉粥', portion: '1大碗', description: '温热软烂，本身已含大米粥（主食），易消化补充电解质与镁钾', isCommon: false },
        { name: '清蒸手撕鲈鱼', portion: '100克', description: '提供优质鱼蛋白与天然维生素D，助力免疫系统恢复', isCommon: profile.commonFoods.includes('鱼') },
        { name: '白灼西兰花', portion: '120克', description: '富含维生素 C，补充抗氧化微量元素', isCommon: false }
      ],
      calories: Math.min(400, remCal > 0 ? remCal : 400),
      protein: Math.min(22, remProt > 0 ? remProt : 22),
      micronutrients: { 
        vitaminC: 50, 
        calcium: 70, 
        iron: 2.0, 
        zinc: 1.8,
        vitaminD: 3.5,
        vitaminB12: 0.9,
        magnesium: 55,
        potassium: 480
      },
      rationale: "针对您感冒的状况，推荐温热易消化的瘦肉山药粥与清蒸鲈鱼，补充高维C，鱼肉中的维生素D与钾元素有助于快速康复。"
    };
  }

  if (isInd) {
    return {
      mealType,
      title: '肠胃调理温和发酵餐',
      dishes: [
        { name: '苏打发面馒头', portion: '1个', description: '发酵主食，极易消化并中和胃酸', isCommon: profile.commonFoods.includes('面包') },
        { name: '温热蒸蛋羹', portion: '1碗', description: '细滑温和的卵清蛋白，易吸收且富含维生素B12', isCommon: profile.commonFoods.includes('鸡蛋') },
        { name: '鸡汁煨冬瓜', portion: '150克', description: '低油脂，补钾并促进胃肠极慢蠕动', isCommon: false }
      ],
      calories: Math.min(380, remCal > 0 ? remCal : 380),
      protein: Math.min(18, remProt > 0 ? remProt : 18),
      micronutrients: { 
        vitaminC: 10, 
        calcium: 60, 
        iron: 1.2, 
        zinc: 0.9,
        vitaminD: 0.8,
        vitaminB12: 0.5,
        magnesium: 30,
        potassium: 310
      },
      rationale: "针对您消化不良的状况，推荐馒头（发酵主食）与滑嫩蒸蛋羹，少油少盐，极速减轻胃肠道负荷，并稳定微量元素电解质平衡。"
    };
  }

  if (mealType === 'breakfast') {
    return {
      mealType,
      title: '高钙健康中老年早餐',
      dishes: [
        { name: '常见热牛奶 / 高钙豆浆', portion: '1杯 (250ml)', description: '补钙补水，强健骨骼', isCommon: true },
        { name: '水煮蛋', portion: '1个', description: '补充优质蛋白质与维生素B12', isCommon: true },
        { name: '黑芝麻馒头 / 花卷', portion: '1个', description: '国人常用淀粉主食，黑芝麻可补充矿物质镁和钙', isCommon: true },
        { name: '熟香蕉', portion: '半根', description: '香甜易嚼，富含钾元素以平稳清晨血压', isCommon: false }
      ],
      calories: 360,
      protein: 17,
      micronutrients: { 
        vitaminC: 5, 
        calcium: 290, 
        iron: 1.8, 
        zinc: 1.2,
        vitaminD: 2.5,
        vitaminB12: 0.7,
        magnesium: 60,
        potassium: 380
      },
      rationale: "专为中老年设计的日常早餐。采用热牛奶搭配黑芝麻馒头带来双重钙质与镁，香蕉提供优质高钾，利于晨起血压稳定。"
    };
  } else if (mealType === 'lunch') {
    return {
      mealType,
      title: '高钾护心益脑中式午餐',
      dishes: [
        { name: '彩椒炒牛肉片', portion: '120克', description: '富含优质血红素铁、锌及大量维生素 C', isCommon: true },
        { name: '大米藜麦饭', portion: '1碗 (150克)', description: '藜麦富含镁元素与膳食纤维，是极好的复合主食', isCommon: false },
        { name: '香菇烩油菜', portion: '150克', description: '油菜和香菇是补钙、补钾、补充天然维生素 D 的黄金组合', isCommon: false }
      ],
      calories: 530,
      protein: 32,
      micronutrients: { 
        vitaminC: 45, 
        calcium: 180, 
        iron: 4.2, 
        zinc: 3.5,
        vitaminD: 3.2,
        vitaminB12: 1.1,
        magnesium: 110,
        potassium: 620
      },
      rationale: "这顿午餐为中老年特意定制。以藜麦饭为主食，提供丰富的镁；香菇烩油菜与彩椒牛肉提供大量的钾、钙、铁以及协同吸收的维生素 D 与 C。"
    };
  } else {
    return {
      mealType,
      title: '温和低脂高营养晚餐',
      dishes: [
        { name: '清蒸鲈鱼豆腐羹', portion: '160克', description: '高钙鱼肉加嫩豆腐，极易吞咽消化，富含天然维生素 D3', isCommon: false },
        { name: '蒸紫薯', portion: '100克', description: '晚餐易消化优质主食，饱含花青素与高钾', isCommon: false },
        { name: '白灼菠菜', portion: '150克', description: '草酸已焯水去除，保留极高叶酸、钾与镁元素', isCommon: false }
      ],
      calories: 390,
      protein: 26,
      micronutrients: { 
        vitaminC: 25, 
        calcium: 210, 
        iron: 2.8, 
        zinc: 1.8,
        vitaminD: 4.2,
        vitaminB12: 1.5,
        magnesium: 95,
        potassium: 580
      },
      rationale: "晚餐主打软烂、低脂、高微量元素。鲈鱼豆腐提供极佳的钙质与维生素 D，紫薯和菠菜富含镁和钾，可平稳安神、改善睡眠。"
    };
  }
}

function getMockSupplementRecommendation(
  gap: { 
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
  },
  healthStatus: HealthStatus
): SupplementRecommendation {
  const suggestions = [];
  
  if (gap.protein < -12) {
    suggestions.push({
      name: "乳清蛋白粉",
      dose: "约1勺 (25克)，建议配合200ml温水冲服",
      reason: `今日蛋白质缺口为 ${Math.abs(Math.round(gap.protein))}g。老年人容易肌肉流失，适量蛋白粉有利于肌肉维持。`
    });
  }

  // Calcium + Vit D synergic suggestion
  if (gap.calcium < -200 || gap.vitaminD < -5) {
    suggestions.push({
      name: "柠檬酸钙 + 维生素 D3 软胶囊",
      dose: "每日1粒 (含钙250mg，D3 5mcg)，随晚餐服用",
      reason: `今日钙缺口 ${Math.abs(Math.round(gap.calcium))}mg，维D缺口 ${Math.abs(Math.round(gap.vitaminD))}mcg。中老年人肠道吸收率下降，柠檬酸钙温和不刺激胃，搭配D3可协同促进骨骼矿化。`
    });
  }

  if (gap.vitaminB12 < -0.5) {
    suggestions.push({
      name: "甲钴胺片 (维生素 B12)",
      dose: "每日1片 (约500mcg)，饭后温水服用",
      reason: `今日维生素B12缺口达 ${Math.abs(gap.vitaminB12).toFixed(1)}mcg。中老年人由于胃酸分泌减少极易缺乏B12，补充B12可以防范巨幼红细胞贫血及周围神经退化。`
    });
  }

  if (gap.magnesium < -80 || gap.potassium < -600) {
    suggestions.push({
      name: "天门冬氨酸钾镁片",
      dose: "每日1-2片，饭后服用",
      reason: `今日镁缺口 ${Math.abs(Math.round(gap.magnesium))}mg，钾缺口 ${Math.abs(Math.round(gap.potassium))}mg。钾镁合剂对平稳中老年血压、缓解肌肉抽筋及保养心肌动力大有裨益。`
    });
  }

  if (gap.vitaminC < -20 || healthStatus === 'cold') {
    suggestions.push({
      name: "维生素 C 咀嚼片",
      dose: "1片 (100mg)，直接嚼服",
      reason: healthStatus === 'cold' 
        ? "感冒期间身体处于高免疫激活状态，补充维生素C有利于支持粘膜修复。"
        : `今日膳食维C未达标，补充有助于促进铁吸收和胶原合成。`
    });
  }

  let generalAdvice = "今天整体饮食搭配很用心！建议中老年人每日保持30分钟左右慢走或太极，并晒太阳15分钟以促进自体产生维生素D。";
  if (healthStatus === 'cold') {
    generalAdvice = "中老年人感冒易诱发并发症，建议密切监测体温，大量饮温水，停下一切劳务，保证睡眠在8小时以上！";
  } else if (healthStatus === 'indigestion') {
    generalAdvice = "胃肠动力随年龄增长变慢，饮食应细软，烹饪多用蒸、煨、煮，饭后可散步以促消化。";
  }

  return {
    gapAnalysis: gap,
    suggestions,
    generalAdvice
  };
}

/**
 * Analyze weekly or monthly trend data using AI
 */
export async function analyzeTrend(
  apiConfig: ApiConfig | null,
  records: any[],
  trendType: 'weekly' | 'monthly'
): Promise<{ data: string; modelUsed: string }> {
  const activeKey = apiConfig?.provider === 'google' ? apiConfig.googleKey : apiConfig?.deepseekKey;
  if (!apiConfig || !activeKey || activeKey.trim() === '') {
    return {
      data: getMockTrendAnalysis(records, trendType),
      modelUsed: 'Mock-Local-Service'
    };
  }

  // Pre-process records to create a small text summary to conserve tokens
  const summaryStr = records.map(r => {
    const eatenCal = r.meals.reduce((sum: number, m: any) => sum + m.calories, 0);
    const eatenProt = r.meals.reduce((sum: number, m: any) => sum + m.protein, 0);
    const calTarget = r.targetCalories + r.activities.reduce((sum: number, a: any) => sum + a.caloriesBurned, 0);
    return `日期:${r.date}(${r.dayName}), 状态:${r.healthStatus}, 摄入卡路里:${eatenCal}/${calTarget}kcal, 蛋白质:${eatenProt}/${r.targetProtein}g`;
  }).join('\n');

  const prompt = `
    你是一个专业的私人智能营养师。请分析用户过去这一个【${trendType === 'weekly' ? '周 (7天)' : '月 (30天)'}】的饮食打卡趋势数据：
    
    【打卡数据明细】
    ${summaryStr}
    
    【分析要求】
    1. **饮食规律度评估**：分析其每日卡路里和蛋白质的起伏变化，是否存在暴饮暴食或长时间摄入严重不足的规律度问题。
    2. **中老年健康针对性指导**：由于用户年龄偏大，请特别评估钙、蛋白质、镁、钾等对于防止肌肉流失（肌少症）、骨质疏松的完成水平。
    3. **生病日（如感冒、胃胀等）恢复质量分析**：如果打卡数据中有 "cold" (感冒) 或 "indigestion" (消化不良) 状态，分析他们当时的进食调理是否符合清淡、流质的身体康复原则，并说明他们后期是如何平稳恢复的。
    4. **下一阶段改善建议**：提出 2-3 条针对性强、切实可行的日常饮食结构调优方案。
    
    请用中文分段回答，字数控制在350字以内，逻辑清晰，语气贴心专业。不要带有任何 markdown 包装，直接返回文字。
  `;

  let text = '';
  let modelUsed = '';

  try {
    if (apiConfig.provider === 'google') {
      const result = await callGeminiCascade(apiConfig.googleKey, prompt);
      text = result.text;
      modelUsed = result.modelUsed;
    } else {
      const result = await callDeepSeek(apiConfig.deepseekKey, 'deepseek-v4-flash', prompt);
      text = result.text;
      modelUsed = result.modelUsed;
    }
  } catch (e: any) {
    console.error("AI trend analysis failed:", e);
    // Fallback to local mock analysis if AI call fails
    return {
      data: getMockTrendAnalysis(records, trendType) + "\n\n(提示: AI分析暂时连接失败，已为您启用本地模拟器诊断评估)",
      modelUsed: 'Mock-Local-Service'
    };
  }

  return { data: text, modelUsed };
}

function getMockTrendAnalysis(records: any[], _trendType: string): string {
  const daysCount = records.length;
  const sickDays = records.filter(r => r.healthStatus !== 'healthy').length;
  
  let totalDeficitDays = 0;
  records.forEach(r => {
    const eatenCal = r.meals.reduce((sum: number, m: any) => sum + m.calories, 0);
    const target = r.targetCalories;
    if (eatenCal < target * 0.8) totalDeficitDays++;
  });

  let analysis = `📈 【本地模拟分析】过去 ${daysCount} 天趋势洞察：\n\n`;
  analysis += `1. **饮食规律度**：您的能量摄入起伏在合理范围内，但在过去有 ${totalDeficitDays} 天卡路里摄入偏低。对于上了年纪的群体，长期能量和蛋白质不足容易加速肌肉流失，需注意三餐主食的定量规律。\n\n`;
  
  if (sickDays > 0) {
    analysis += `2. **生病状态复盘**：监测到您有 ${sickDays} 天身体状况为感冒或胃胀。在生病期间，您选择了清淡软烂的中式流食，这是一个非常正确的保护机制，有利于胃肠粘膜修复和免疫系统快速激活。\n\n`;
  } else {
    analysis += `2. **微量元素与中老年健康**：在这段周期中您的钙质和维生素D摄入基本保持稳定，这对于强健骨骼关节、预防中老年骨量流失非常有益。建议继续保持高钙牛奶或高钙豆腐的摄入频率。\n\n`;
  }

  analysis += `3. **后续调理指导**：建议下阶段增加优质膳食纤维（如麦片、紫薯等粗粮主食），以促进肠道蠕动；同时保证每天 1 杯高钙奶并多晒太阳，协同促进维生素 D 自体合成，护航骨密度。`;
  
  return analysis;
}
