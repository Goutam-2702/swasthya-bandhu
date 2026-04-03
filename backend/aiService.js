const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

async function generateRecoveryPlan(patientData) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    let extractedInfo = "";
    if (patientData.hospitalVitals) {
      extractedInfo = `IMPORTANT: This patient has an updated OPD hospital dataset profile. Ensure the recovery plan incorporates these conditions as their most recent status: ${JSON.stringify(patientData.hospitalVitals)}`;
    }

    const prompt = `
      Generate a personalized recovery plan for a patient with illness: ${patientData.illness}, age: ${patientData.age}, weight: ${patientData.weight}kg.
      Dietary Preference: ${patientData.foodPreference || 'Any'}. Ensure the meal plan strictly adheres to this preference (Veg or Non-Veg) if specified.
      ${extractedInfo}
      
      Include meal plan (breakfast, lunch, dinner), hydration schedule, medicine timing, sleep recommendations, and daily routine.
      Return the response ONLY as a structured JSON object with the following schema:
      {
        "mealPlan": [{ "time": "String", "meal": "String", "details": "String" }],
        "hydrationSchedule": { "dailyTarget": "String", "reminders": ["String"] },
        "medicineTiming": [{ "time": "String", "medicine": "String", "purpose": "String", "dosage": "String" }],
        "sleepRecommendations": { "duration": "String", "bedtime": "String", "wakeupTime": "String" },
        "dailyRoutine": [{ "time": "String", "activity": "String" }]
      }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Error in generateRecoveryPlan:', error);
    // FALLBACK for Missing/Dummy API keys in Demo / Rate limits
    return {
      mealPlan: [
        { time: "08:00 AM", meal: "Oatmeal with Almonds", details: "Fibrous and light on stomach" },
        { time: "01:00 PM", meal: "Lentil Dal & Brown Rice", details: "High protein, easy to digest" },
        { time: "07:30 PM", meal: "Vegetable Soup", details: "Hydrating and warm before bed" }
      ],
      hydrationSchedule: { dailyTarget: "2 Liters", reminders: ["10:00 AM", "02:00 PM"] },
      medicineTiming: [
        { time: "09:00 AM", medicine: "Antibiotic", purpose: "Infection Control", dosage: "1 Tablet" },
        { time: "08:00 PM", medicine: "Painkiller", purpose: "Relief", dosage: "1 Tablet" }
      ],
      sleepRecommendations: { duration: "8 Hours", bedtime: "10:30 PM", wakeupTime: "06:30 AM" },
      dailyRoutine: [{ time: "05:00 PM", activity: "15 min light walking" }]
    };
  }
}

// ==========================================
// ARCHITECTURE: Voice/AI Engine -> FHIR mapping
// Extracts intent from raw speech transcript
// mapping "Yes/No/Haan" into a JSON FHIR QuestionnaireResponse
// ==========================================
async function extractVoiceIntentToFHIR(transcript) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const prompt = `
      You are processing a post-discharge patient voice transcript. 
      Analyze the transcript and determine if they have completed their medical action (e.g., took medicine, drank water).
      Patient Transcript: "${transcript}"
      
      Return ONLY a pure JSON object structured exactly like a FHIR QuestionnaireResponse:
      {
        "resourceType": "QuestionnaireResponse",
        "status": "completed",
        "subject": { "reference": "Patient/123" },
        "item": [
          {
            "linkId": "medication_adherence",
            "text": "Did the patient confirm taking their medication?",
            "answer": [{ "valueBoolean": true or false based on intent }]
          }
        ]
      }
    `;
    const res = await model.generateContent(prompt);
    return JSON.parse(res.response.text());
  } catch (err) {
    console.error("LLM Intent/FHIR extraction error:", err);
    // Silent fallback
    const isYes = ['yes', 'yeah', 'yep', 'done', 'taken', 'haan', 'ha'].some(w => transcript.toLowerCase().includes(w));
    return {
      resourceType: "QuestionnaireResponse",
      status: "completed",
      item: [{ linkId: "medication_adherence", answer: [{ valueBoolean: isYes }] }]
    };
  }
}

async function handleVoiceInteraction(speechText, language = 'English') {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ]
    });

    const prompt = `
      ${speechText}
      
      CRITICAL INSTRUCTION: You MUST generate your exact final response entirely in the following language: ${language}.
      Do NOT include any English translations if the chosen language is not English. Output ONLY the words you will speak.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error in handleVoiceInteraction:', error);
    throw error;
  }
}

// ==========================================
// ARCHITECTURE: FHIR Assembly Layer (CarePlan)
// Maps the proprietary plan output to FHIR standard
// ==========================================
function convertPlanToFHIR(patientId, plan, patientData) {
  try {
    const carePlan = {
      resourceType: "CarePlan",
      status: "active",
      intent: "plan",
      subject: {
        reference: `Patient/${patientId}`
      },
      title: `${patientData?.illness || 'General'} Recovery Plan`,
      description: "AI-Generated Personalized Recovery Protocol",
      activity: []
    };

    // 1. Map Medications to FHIR Activity (MedicationRequest intent)
    if (plan.medicineTiming && Array.isArray(plan.medicineTiming)) {
      plan.medicineTiming.forEach(med => {
        carePlan.activity.push({
          detail: {
            kind: "MedicationRequest",
            status: "scheduled",
            description: `Take ${med.medicine} (${med.dosage}) for ${med.purpose}`,
            scheduledTiming: {
              event: [med.time]
            }
          }
        });
      });
    }

    // 2. Map Nutrition/Diet to FHIR Activity (NutritionOrder intent)
    if (plan.mealPlan && Array.isArray(plan.mealPlan)) {
      plan.mealPlan.forEach(meal => {
        carePlan.activity.push({
          detail: {
            kind: "NutritionOrder",
            status: "scheduled",
            description: `${meal.meal} - ${meal.details}`,
            scheduledTiming: {
              event: [meal.time]
            }
          }
        });
      });
    }

    // 3. Map Hydration to Activity
    if (plan.hydrationSchedule && plan.hydrationSchedule.dailyTarget) {
       carePlan.activity.push({
          detail: {
            kind: "ServiceRequest",
            status: "scheduled",
            description: `Hydration Goal: ${plan.hydrationSchedule.dailyTarget}`,
            scheduledTiming: {
              event: plan.hydrationSchedule.reminders || []
            }
          }
       });
    }

    // 4. Map Sleep/Routine
    if (plan.sleepRecommendations) {
       carePlan.activity.push({
          detail: {
            kind: "ServiceRequest",
            status: "scheduled",
            description: `Sleep Target: ${plan.sleepRecommendations.duration}. Bedtime: ${plan.sleepRecommendations.bedtime}`
          }
       });
    }

    return carePlan;
  } catch (err) {
    console.error("Failed to assemble FHIR CarePlan:", err);
    return null;
  }
}

module.exports = {
  generateRecoveryPlan,
  handleVoiceInteraction,
  extractVoiceIntentToFHIR,
  convertPlanToFHIR
};
