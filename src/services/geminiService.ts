import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ADMETProperties {
  logP: number;
  mw: number;
  hbd: number;
  hba: number;
  tpsa: number;
  drugLikenessScore: number;
  absorption: string;
  metabolism: string;
  toxicity: string;
  biointerpretation: string;
  shapExplanations: { feature: string; impact: number }[];
  limeExplanations: { feature: string; probability_change: number; description: string }[];
  featureDistributions: { feature: string; value: number; population_mean: number; distribution_data: { x: number; y: number }[] }[];
  modelComparisons: { model: string; accuracy: number; f1_score: number; status: "Recommended" | "Alternative" }[];
  dataValidation: { check: string; status: "Passed" | "Warning" | "Failed"; detail: string }[];
}

export async function interpretCompound(smiles: string, name: string) {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-pro",
    contents: `Analyze the following chemical compound (SMILES: ${smiles}, Name: ${name}) for ADMET properties and biological relevance. 
    Provide a detailed prediction for its pharmacokinetic profile and drug-likeness.
    Include Local Interpretable Model-agnostic Explanations (LIME) for local behavior.
    Provide a comparison between different models (XGBoost, Random Forest, Neural Net).
    Include typical feature distributions for similar compounds.
    Verify data integrity (Lipinski compliance, SMILES validity).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          logP: { type: Type.NUMBER },
          mw: { type: Type.NUMBER },
          hbd: { type: Type.NUMBER },
          hba: { type: Type.NUMBER },
          tpsa: { type: Type.NUMBER },
          drugLikenessScore: { type: Type.NUMBER },
          absorption: { type: Type.STRING },
          metabolism: { type: Type.STRING },
          toxicity: { type: Type.STRING },
          biointerpretation: { type: Type.STRING },
          shapExplanations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feature: { type: Type.STRING },
                impact: { type: Type.NUMBER }
              }
            }
          },
          limeExplanations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feature: { type: Type.STRING },
                probability_change: { type: Type.NUMBER },
                description: { type: Type.STRING }
              }
            }
          },
          featureDistributions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feature: { type: Type.STRING },
                value: { type: Type.NUMBER },
                population_mean: { type: Type.NUMBER },
                distribution_data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          },
          modelComparisons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                model: { type: Type.STRING },
                accuracy: { type: Type.NUMBER },
                f1_score: { type: Type.NUMBER },
                status: { type: Type.STRING, enum: ["Recommended", "Alternative"] }
              }
            }
          },
          dataValidation: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                check: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Passed", "Warning", "Failed"] },
                detail: { type: Type.STRING }
              }
            }
          }
        },
        required: [
          "logP", "mw", "hbd", "hba", "tpsa", "drugLikenessScore", "absorption", 
          "metabolism", "toxicity", "biointerpretation", "shapExplanations",
          "limeExplanations", "featureDistributions", "modelComparisons", "dataValidation"
        ]
      }
    }
  });

  try {
    return JSON.parse(response.text) as ADMETProperties;
  } catch (e) {
    console.error("Error parsing Gemini response:", e);
    return null;
  }
}
