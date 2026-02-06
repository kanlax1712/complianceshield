
import { GoogleGenAI, Type } from "@google/genai";
import { ComplianceResult } from "../types";

// Note: instantiate GoogleGenAI inside the function to ensure an API key is present
// at runtime (set via .env.local as GEMINI_API_KEY and wired in vite.config.ts).


export const analyzeProductImage = async (
  base64Image: string
): Promise<ComplianceResult> => {
  const model = 'gemini-3-flash-preview';

  const systemInstruction = `
    You are a Senior Regulatory Compliance Auditor & Clinical Nutritionist.
    Analyze the provided label for autonomous compliance auditing and clinical health sensitivity.

    DEEP REGULATORY KNOWLEDGE BASE:
    1. INDIA (FSSAI): Check license, Veg/Non-Veg dots, Expiry, Care contact.
    2. USA (FDA): Check Nutrition Facts, Net weight, Allergen FALCPA compliance.
    3. EU/UK: Check highlighted allergens, QUID percentages, Nutri-score markers.

    CLINICAL SENSITIVITY AUDIT:
    For every product, assess risk for:
    - [DIABETES]: High Sugar, Refined Carbs, High Glycemic Additives.
    - [BP (Blood Pressure)]: High Sodium (Salt), Monosodium Glutamate, Licorice extract.
    - [HEART]: Trans fats, Saturated fats (>20% DV), High Cholesterol, Palm oil, Partially Hydrogenated oils.

    AUDIT LOGIC:
    - Step 1: Detect Region.
    - Step 2: Categorize Audience.
    - Step 3: Run Regulatory checklist.
    - Step 4: Verify Expiry.
    - Step 5: Assign clinical health risk levels (Low/Medium/High) based on ingredient concentration.
    - Step 6: Assign safetyScore.

    Return the data in strict JSON format.
  `;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Create a .env.local with GEMINI_API_KEY and restart the dev server.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: `Perform a deep dive regulatory and clinical health audit. Identify violations and specific risks for Diabetes, BP, and Heart patients.` }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          brand: { type: Type.STRING },
          expiryDate: { type: Type.STRING },
          isExpired: { type: Type.BOOLEAN },
          targetAudience: { type: Type.STRING, enum: ["BABY", "ELDER", "GENERAL"] },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskyIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                reason: { type: Type.STRING }
              },
              required: ["name", "riskLevel", "reason"]
            }
          },
          healthSensitivity: {
            type: Type.OBJECT,
            properties: {
              diabetes: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  reason: { type: Type.STRING }
                },
                required: ["risk", "reason"]
              },
              bp: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  reason: { type: Type.STRING }
                },
                required: ["risk", "reason"]
              },
              heart: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  reason: { type: Type.STRING }
                },
                required: ["risk", "reason"]
              }
            },
            required: ["diabetes", "bp", "heart"]
          },
          safetyScore: { type: Type.NUMBER },
          recommendation: { type: Type.STRING },
          detectedRegion: { type: Type.STRING },
          regulatoryMarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
          complianceViolations: { type: Type.ARRAY, items: { type: Type.STRING } },
          isRegulatorilyCompliant: { type: Type.BOOLEAN },
          detailedChecklist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                requirement: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Passed", "Failed", "Missing"] },
                regulationId: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["requirement", "status", "regulationId", "details"]
            }
          }
        },
        required: [
          "productName", "brand", "expiryDate", "isExpired", "targetAudience",
          "ingredients", "riskyIngredients", "healthSensitivity", "safetyScore", 
          "recommendation", "detectedRegion", "regulatoryMarkers", 
          "complianceViolations", "isRegulatorilyCompliant",
          "detailedChecklist"
        ]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (e) {
    throw new Error("Failed to parse compliance audit. Ensure the label is clearly visible.");
  }
};

export interface BarcodeProductInfo {
  barcode: string;
  productName: string;
  brand: string;
  ingredientsText: string;
  categories: string;
  imageUrl?: string;
  expirationDate?: string;
  quantity?: string;
  countries?: string;
}

export const analyzeProductInfo = async (
  productInfo: BarcodeProductInfo
): Promise<ComplianceResult> => {
  const model = 'gemini-3-flash-preview';

  const systemInstruction = `
    You are a Senior Regulatory Compliance Auditor & Clinical Nutritionist.
    Analyze the provided product data (from barcode lookup) for autonomous compliance auditing and clinical health sensitivity.

    DEEP REGULATORY KNOWLEDGE BASE:
    1. INDIA (FSSAI): Check license, Veg/Non-Veg dots, Expiry, Care contact.
    2. USA (FDA): Check Nutrition Facts, Net weight, Allergen FALCPA compliance.
    3. EU/UK: Check highlighted allergens, QUID percentages, Nutri-score markers.

    CLINICAL SENSITIVITY AUDIT:
    For every product, assess risk for:
    - [DIABETES]: High Sugar, Refined Carbs, High Glycemic Additives.
    - [BP (Blood Pressure)]: High Sodium (Salt), Monosodium Glutamate, Licorice extract.
    - [HEART]: Trans fats, Saturated fats (>20% DV), High Cholesterol, Palm oil, Partially Hydrogenated oils.

    AUDIT LOGIC:
    - Step 1: Detect Region.
    - Step 2: Categorize Audience.
    - Step 3: Run Regulatory checklist.
    - Step 4: Verify Expiry.
    - Step 5: Assign clinical health risk levels (Low/Medium/High) based on ingredient concentration.
    - Step 6: Assign safetyScore.

    Return the data in strict JSON format.
  `;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Create a .env.local with GEMINI_API_KEY and restart the dev server.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          text: `Product data from barcode lookup (may be incomplete): ${JSON.stringify(
            productInfo
          )}`
        },
        {
          text: "Perform a deep dive regulatory and clinical health audit using the provided product data."
        }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          brand: { type: Type.STRING },
          expiryDate: { type: Type.STRING },
          isExpired: { type: Type.BOOLEAN },
          targetAudience: { type: Type.STRING, enum: ["BABY", "ELDER", "GENERAL"] },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskyIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                reason: { type: Type.STRING }
              },
              required: ["name", "riskLevel", "reason"]
            }
          },
          healthSensitivity: {
            type: Type.OBJECT,
            properties: {
              diabetes: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  reason: { type: Type.STRING }
                },
                required: ["risk", "reason"]
              },
              bp: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  reason: { type: Type.STRING }
                },
                required: ["risk", "reason"]
              },
              heart: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  reason: { type: Type.STRING }
                },
                required: ["risk", "reason"]
              }
            },
            required: ["diabetes", "bp", "heart"]
          },
          safetyScore: { type: Type.NUMBER },
          recommendation: { type: Type.STRING },
          detectedRegion: { type: Type.STRING },
          regulatoryMarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
          complianceViolations: { type: Type.ARRAY, items: { type: Type.STRING } },
          isRegulatorilyCompliant: { type: Type.BOOLEAN },
          detailedChecklist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                requirement: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Passed", "Failed", "Missing"] },
                regulationId: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["requirement", "status", "regulationId", "details"]
            }
          }
        },
        required: [
          "productName",
          "brand",
          "expiryDate",
          "isExpired",
          "targetAudience",
          "ingredients",
          "riskyIngredients",
          "healthSensitivity",
          "safetyScore",
          "recommendation",
          "detectedRegion",
          "regulatoryMarkers",
          "complianceViolations",
          "isRegulatorilyCompliant",
          "detailedChecklist"
        ]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (e) {
    throw new Error("Failed to parse compliance audit. Ensure the barcode data is accurate.");
  }
};
