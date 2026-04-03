<div align="center">
  <h1>🏥 Swasthya Bandhu</h1>
  <p><strong>Next-Generation Multilingual AI Follow-up & Patient Care Platform</strong></p>
</div>

---

## 📖 Overview

**Swasthya Bandhu** is a comprehensive, AI-driven healthcare platform designed to bridge the communication gap between hospitals and patients. We leverage advanced Generative AI and automated voice calling to handle post-discharge follow-ups, monitor real-time clinical vitals, predict health risks, and generate highly personalized, localized recovery and diet plans. 

Our system removes the manual bottleneck of patient communication, allowing hospitals to ensure maximum post-visit adherence natively in 9 different regional languages.

## ✨ Key Features

- **🗣️ Multilingual Voice AI Caller**: Fully autonomous conversational AI agent over traditional phone lines (Powered by Twilio and Amazon/Google TTS). Supports native interactive follow-ups in **English, Hindi, Marathi, Malayalam, Telugu, Kannada, Gujarati, Odia, and Urdu**. 
- **⚡ Serverless Edge Architecture**: Ultra-fast global webhook execution via **Supabase Edge Functions** (Deno + Hono) managing AI conversation state machines. Real-time integration without managing legacy servers.
- **🧠 Generative Care Plans**: Automatically analyzes real-time hospital vitals (heart risk, blood pressure, etc.) locally against patient symptom history to architect localized **Gemini 2.5 Flash** powered recovery and diet regimens.
- **📊 Interactive Provider Dashboard**: Empowering hospital admins to track active patients across wards, initiate real-time outbound Twilio voice campaigns, and review AI-summarized patient interactions directly from a sleek React dashboard.
- **🔐 Secure ABHA Auth Compliance**: Architecture ready for decentralized and demo health token-based authentication workflows.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS (or Vanilla CSS tokens), Vite
- **Backend Infrastructure**: Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- **API Routing**: Hono Web Framework
- **Telephony & TTS**: Twilio Programmable Voice, Amazon Polly Neural, Google Standard Text-to-Speech
- **Intelligence Engine**: Google Gemini 2.5 Flash API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase CLI
- Twilio Account with Voice capable phone number
- Google Gemini API Key

### Infrastructure Setup
1. Clone the repository and install dependencies in `/frontend` and `/backend`.
2. Configure your Supabase project keys in a `.env` file within the root directories.
3. Deploy your database schema and edge functions:
   ```bash
   cd backend
   npx supabase functions deploy api --project-ref [YOUR_SUPABASE_ID]
   ```
4. Configure your Twilio Webhook to point to your Supabase Edge Function `.../functions/v1/api/twilio/conversation-start`.

## 👨‍💻 Contributors

This project is proudly built and maintained by a dedicated team of four collaborating developers:

* **Gautam Kumar Ghosal**
* **Harsh Kumar Singh**
* **Garvit Sharma**
* **Harshil Jain**

---
<div align="center">
  <i>Built with ❤️ for transforming modern healthcare.</i>
</div>
