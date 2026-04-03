const twilio = require('twilio');

// ── Twilio Config ──────────────────────────────────────────────────────────────
const accountSid  = process.env.TWILIO_ACCOUNT_SID || '';
const authToken   = process.env.TWILIO_AUTH_TOKEN  || '';
const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '';

// Detect if credentials look real (not placeholders)
const credentialsLookReal =
  accountSid.startsWith('AC') &&
  authToken.length >= 32 &&
  twilioPhone.startsWith('+') &&
  !twilioPhone.includes('X') &&
  twilioPhone.length >= 10;

let client = null;
if (credentialsLookReal) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized with real credentials');
  } catch (e) {
    console.warn('⚠️ Twilio client init failed:', e.message);
  }
} else {
  console.warn('⚠️ Twilio credentials missing or placeholder — calls will be mocked');
}

// ── Build TwiML voice message for patient calls ───────────────────────────────
function buildTwimletUrl(twimlString) {
  return `http://twimlets.com/echo?Twiml=${encodeURIComponent(twimlString)}`;
}

function buildTwiML(patientName, callType = 'follow-up') {
  // ── 1. Ultra-short English Messages
  const messagesEn = {
    'follow-up': `Hi ${patientName}. Swasthya Bandhu here. Take meds and rest. Contact doctor if unwell. Byee.`,
    'vaccination-reminder': `Hi from Swasthya Bandhu. Newborn vaccination due. Visit health centre. Thanks.`,
    'ipd-followup': `Hi ${patientName}, Swasthya Bandhu here. Care team arriving soon. Inform nurse for help.`,
    'recovery-followup': `Hi ${patientName}. Swasthya Bandhu checking in. Take meds. Contact doctor if issues.`,
  };

  // ── 2. Ultra-short Hindi Messages (Devanagari)
  const messagesHi = {
    'follow-up': `नमस्ते ${patientName}। स्वास्थ्य बंधु से। दवा लें। परेशानी में डॉक्टर से मिलें।`,
    'vaccination-reminder': `नमस्ते। शिशु का टीका होने वाला है। स्वास्थ्य केंद्र जाएँ। धन्यवाद।`,
    'ipd-followup': `नमस्ते ${patientName}। टीम आएगी। सहायता के लिए नर्स को बताएं।`,
    'recovery-followup': `नमस्ते ${patientName}। स्वास्थ्य बंधु हूँ। दवा लें। परेशानी पर डॉक्टर से बात करें।`
  };

  // ── 3. Ultra-short Tamil Messages (Romanized)
  const messagesTa = {
    'follow-up': `Vanakam ${patientName}. Swasthya Bandhu idhu. Marundhugala edu. Doctor-ai paar. Nandri.`,
    'vaccination-reminder': `Vanakam. Vaccination neram vandhachu. Clinic sellavum. Nandri.`,
    'ipd-followup': `Vanakam ${patientName}. Swasthya Bandhu idhu. Team varuvanga. Nurse-kitta sollavum.`,
    'recovery-followup': `Vanakam ${patientName}. Swasthya Bandhu idhu. Marundhugala nerathukku edu. Nandri.`
  };

  // ── 4. Ultra-short Telugu Messages (Romanized)
  const messagesTe = {
    'follow-up': `Namaskaram ${patientName}. Idi Swasthya Bandhu. Mandulu vesko. Doctor ni kaluvu. Dhanyavadalu.`,
    'vaccination-reminder': `Namaskaram. Vaccination samayam ayyindi. Hospital ki vellandi. Dhanyavadalu.`,
    'ipd-followup': `Namaskaram ${patientName}. Idi Swasthya Bandhu. Team vastaru. Nurse ki cheppu.`,
    'recovery-followup': `Namaskaram ${patientName}. Idi Swasthya Bandhu. Mandulu time ki vesko. Dhanyavadalu.`
  };

  const msgEn = messagesEn[callType] || messagesEn['follow-up'];
  const msgHi = messagesHi[callType] || messagesHi['follow-up'];
  const msgTa = messagesTa[callType] || messagesTa['follow-up'];
  const msgTe = messagesTe[callType] || messagesTe['follow-up'];

  // ── 5. Build Minimal XML Manually (Removes bulky XML headers)
  const makeSay = (lang, msg) => `<Response><Say voice="Polly.Aditi" language="${lang}">${msg}</Say></Response>`;
  
  const urlEn = buildTwimletUrl(makeSay('en-IN', msgEn));
  const urlHi = buildTwimletUrl(makeSay('hi-IN', msgHi));
  const urlTa = buildTwimletUrl(makeSay('en-IN', msgTa));
  const urlTe = buildTwimletUrl(makeSay('en-IN', msgTe));

  // ── 6. Build the Primary Language Selection Menu
  const menuActionUrl = `http://twimlets.com/menu?Options[1]=${encodeURIComponent(urlEn)}&Options[2]=${encodeURIComponent(urlHi)}&Options[3]=${encodeURIComponent(urlTa)}&Options[4]=${encodeURIComponent(urlTe)}`;
  
  // Create an ultra-compact initial Gather block manually
  // VERY IMPORTANT: XML attributes MUST have '&' escaped as '&amp;'
  const twiml = `<Response>
<Gather numDigits="1" action="${menuActionUrl.replace(/&/g, '&amp;')}" method="POST" timeout="8">
<Say voice="Polly.Aditi" language="en-IN">For English press 1. Thamizhuku 3. Teluguku 4 azhuthavum.</Say>
<Say voice="Polly.Aditi" language="hi-IN">हिंदी के लिए 2 दबाएं।</Say>
</Gather>
<Redirect>${urlEn.replace(/&/g, '&amp;')}</Redirect>
</Response>`;

  return twiml;
}

// ── Main function: Make an outbound call ──────────────────────────────────────
async function makeAutomatedCall(toPhoneNumber, patientName = 'Patient', callType = 'follow-up') {
  // Clean up phone number
  const cleanPhone = toPhoneNumber.trim().replace(/\s+/g, '');

  // ── MOCK mode: credentials are placeholder or missing ────────────────────────
  if (!credentialsLookReal || !client) {
    console.log(`[MOCK CALL] Would call ${patientName} at ${cleanPhone} (type: ${callType})`);
    console.log('[MOCK CALL] Set real TWILIO_PHONE_NUMBER in .env to enable real calls');
    return {
      success: true,
      mock: true,
      message: `Mock call placed to ${patientName} at ${cleanPhone}`,
    };
  }

  // ── REAL mode ────────────────────────────────────────────────────────────────
  try {
    // Use TwiML directly via a data URI so we don't need a public server
    const twimlXml = buildTwiML(patientName, callType);
    const twimlBase64 = Buffer.from(twimlXml).toString('base64');

    // Twilio supports inline TwiML via the `twiml` param
    const call = await client.calls.create({
      twiml: twimlXml,         // inline TwiML — no public URL needed
      to: cleanPhone,
      from: twilioPhone,
    });

    console.log(`✅ Twilio call initiated to ${cleanPhone} — SID: ${call.sid}`);
    return { success: true, callSid: call.sid, to: cleanPhone, patientName };
  } catch (err) {
    console.error('❌ Twilio Call Error:', err.message);

    // Give the user a human-friendly message based on error code
    let userMessage = err.message;

    if (err.code === 21608 || err.message.includes('unverified. Trial accounts')) {
      userMessage =
        `⚠️ Trial Account Restriction: The destination number "${cleanPhone}" is not verified. ` +
        `On a free Twilio trial, you can ONLY make calls to numbers you've personally verified. ` +
        `Go to console.twilio.com → "Verified Caller IDs" to add this number, or upgrade your account.`;
    } else if (err.code === 21212 || err.message.includes('not a valid phone number')) {
      userMessage = `⚠️ Invalid phone number format. Use international format like +91XXXXXXXXXX`;
    } else if (err.message.includes('not yet verified') || err.message.includes('source phone number')) {
      userMessage =
        `⚠️ TWILIO_PHONE_NUMBER in .env is not a verified/purchased Twilio number. ` +
        `Go to console.twilio.com → Phone Numbers → Buy a number, then update .env.`;
    }

    return { success: false, error: userMessage };
  }
}

module.exports = { makeAutomatedCall };
