import express from 'express';
import fetch from 'node-fetch';
import supabase from './supabaseClient.js';

const router = express.Router();

// Simple in-memory conversation state. For production, persist this.
const convoState = new Map();

function formatQuickReplies(text, replies) {
  return {
    text,
    quick_replies: replies.map(r => ({
      content_type: 'text',
      title: r.title,
      payload: r.payload
    }))
  };
}

async function sendMessage(recipientId, messagePayload) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  if (!PAGE_ACCESS_TOKEN) {
    console.error('PAGE_ACCESS_TOKEN not set');
    return;
  }

  const body = {
    recipient: { id: recipientId },
    message: messagePayload
  };

  console.log('Sending message to:', recipientId);
  console.log('Message payload:', JSON.stringify(messagePayload, null, 2));

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const responseText = await res.text();
    
    if (!res.ok) {
      console.error('Send API error:', {
        status: res.status,
        statusText: res.statusText,
        response: responseText
      });
    } else {
      console.log('Message sent successfully:', responseText);
    }
  } catch (error) {
    console.error('Network error sending message:', error);
  }
}

// Verify webhook
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.object === 'page') {
      for (const entry of body.entry) {
        const event = (entry.messaging && entry.messaging[0]) || entry.messaging;
        if (!event) continue;
        const sender = event.sender.id;

        // Handle postbacks
        if (event.postback && event.postback.payload) {
          await handlePayload(sender, event.postback.payload);
          continue;
        }

        // Quick reply
        if (event.message && event.message.quick_reply && event.message.quick_reply.payload) {
          await handlePayload(sender, event.message.quick_reply.payload);
          continue;
        }

        // Regular message text
        if (event.message && event.message.text) {
          const text = event.message.text.trim();
          await handleTextMessage(sender, text);
          continue;
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('Webhook processing error', err);
    res.sendStatus(500);
  }
});

async function handlePayload(sender, payload) {
  const lower = payload.toLowerCase();
  if (lower === 'report_incident' || lower === 'report_start') {
    // Begin report flow
    convoState.set(sender, { step: 'category' });
    const qr = formatQuickReplies('What type of incident?', [
      { title: 'Flood', payload: 'CATEGORY_Flood' },
      { title: 'Fire', payload: 'CATEGORY_Fire' },
      { title: 'Accident', payload: 'CATEGORY_Accident' },
      { title: 'Other', payload: 'CATEGORY_Other' }
    ]);
    await sendMessage(sender, qr);
    return;
  }

  if (payload.startsWith('CATEGORY_')) {
    const cat = payload.replace('CATEGORY_', '');
    convoState.set(sender, { step: 'description', category: cat });
    await sendMessage(sender, { text: `You selected *${cat}*. Please describe what happened.` });
    return;
  }

  if (lower === 'view_updates') {
    // Query Supabase for latest non-pending reports
    const { data, error } = await supabase
      .from('reports')
      .select('category,description,location,status,created_at')
      .neq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) {
      console.error('Supabase query error', error);
      await sendMessage(sender, { text: 'Sorry, I could not fetch updates right now.' });
      return;
    }
    if (!data || data.length === 0) {
      await sendMessage(sender, { text: 'No updates available at the moment.' });
      return;
    }
    const lines = data.map(r => `• ${r.category} — ${r.status}${r.location ? ` at ${r.location}` : ''}`);
    await sendMessage(sender, { text: `📰 Latest Updates:\n${lines.join('\n')}` });
    return;
  }

  if (lower === 'contact_barangay' || lower === 'emergency_hotlines') {
    // Start municipality selection flow
    convoState.set(sender, { step: 'municipality_selection' });
    await sendMessage(sender, { 
      text: `🏘️ Please type the name of your municipality to get the correct emergency hotlines.

Available municipalities:

  Anini-y\n
  Barbaza\n
  Belison\n
  Bugasong\n
  Caluya\n
  Culasi\n
  Hamtic\n
  Laua-an\n
  Libertad\n
  Pandan\n
  Patnongon\n
  San Jose\n
  San Remegio\n
  Sebaste\n
  Sibalom\n
  Tibiao\n
  Tobias Fornier\n
  Valderrama

Or type "ALL" to see all hotlines.` 
    });
    return;
  }

  if (payload.startsWith('MUNICIPALITY_')) {
    const municipality = payload.replace('MUNICIPALITY_', '');
    const municipalityHotlines = {
      'Anini-y': '📞 MDRRMO ANINI-Y:\n09456009363',
      'Barbaza': '📞 MDRRMO BARBAZA:\n09630356439 | 09366594189',
      'Belison': '📞 MDRRMO BELISON:\n09177068793',
      'Bugasong': '📞 MDRRMO BUGASONG:\n09064437973',
      'Caluya': '📞 MDRRMO CALUYA:\n09108621478',
      'Culasi': '📞 MDRRMO CULASI:\n09060439444 | 09612435152',
      'Hamtic': '📞 MDRRMO HAMTIC:\n09359298423 | 09067203929',
      'Laua-an': '📞 MDRRMO LAUA-AN:\n09260364499 | 09630334491',
      'Libertad': '📞 MDRRMO LIBERTAD:\n09511304178 | (036)2781686',
      'Pandan': '📞 MDRRMO PANDAN:\n09234774774 | (036)2789068',
      'Patnongon': '📞 MDRRMO PATNONGON:\n09560441742',
      'San Jose': '📞 MDRRMO SAN JOSE:\n09273875772 | 09192868863',
      'San Remegio': '📞 MDRRMO SAN REMEGIO:\n09056756684 | 09957481064',
      'Sebaste': '📞 MDRRMO SEBASTE:\n09778513357',
      'Sibalom': '📞 MDRRMO SIBALOM:\n09485475457 | 09354031071',
      'Tibiao': '📞 MDRRMO TIBIAO:\n09778035582',
      'Tobias Fornier': '📞 MDRRMO TOBIAS FORNIER:\n09997774775 | 09156322110',
      'Valderrama': '📞 MDRRMO VALDERRAMA:\n09177145517',
      'All': `🚨 ANTIQUE EMERGENCY HOTLINES 🚨

📞 PDRRMO ANTIQUE:
0917335763 | 09611543688 | (036) 6410185

🏘️ ALL MUNICIPAL DRRMO CONTACTS:
ANINI-Y: 09456009363\n
BARBAZA: 09630356439 | 09366594189\n
BELISON: 09177068793\n
BUGASONG: 09064437973\n
CALUYA: 09108621478\n
CULASI: 09060439444 | 09612435152\n
HAMTIC: 09359298423 | 09067203929\n
LAUA-AN: 09260364499 | 09630334491\n
LIBERTAD: 09511304178 | (036)2781686\n
PANDAN: 09234774774 | (036)2789068\n
PATNONGON: 09560441742\n
SAN JOSE: 09273875772 | 09192868863\n
SAN REMEGIO: 09056756684 | 09957481064\n
SEBASTE: 09778513357\n
SIBALOM: 09485475457 | 09354031071\n
TIBIAO: 09778035582\n
TOBIAS FORNIER: 09997774775 | 09156322110\n
VALDERRAMA: 09177145517`
    };

    const hotlineInfo = municipalityHotlines[municipality];
    if (hotlineInfo) {
      const message = municipality === 'All' ? hotlineInfo : 
        `🚨 EMERGENCY HOTLINES FOR ${municipality.toUpperCase()} 🚨\n\n${hotlineInfo}\n\n📞 PDRRMO ANTIQUE (Provincial):\n0917335763 | 09611543688 | (036) 6410185\n\n⚠️ Save these numbers for emergencies!`;
      
      await sendMessage(sender, { text: message });
    } else {
      await sendMessage(sender, { text: 'Sorry, I couldn\'t find hotlines for that municipality. Please select from the available options.' });
    }
    
    // Clear conversation state
    convoState.delete(sender);
    return;
  }

  // Fallback
  await sendMessage(sender, { text: "I didn't understand that. You can type 'Report' or use the quick replies." });
}

async function handleTextMessage(sender, text) {
  const state = convoState.get(sender) || null;

  if (!state) {
    // send greeting with quick replies
    const qr = formatQuickReplies('Hi! 👋 I\'m Bantay Barangay, your disaster and incident reporting assistant. What would you like to do today?', [
      { title: 'Report an Incident', payload: 'report_incident' },
      { title: 'View Updates', payload: 'view_updates' },
      { title: 'Emergency Hotlines', payload: 'contact_barangay' }
    ]);
    await sendMessage(sender, qr);
    return;
  }

  if (state.step === 'municipality_selection') {
    // Handle municipality input
    const input = text.toLowerCase().trim();
    const municipalityMap = {
      'anini-y': 'Anini-y',
      'aniniy': 'Anini-y',
      'barbaza': 'Barbaza',
      'belison': 'Belison',
      'bugasong': 'Bugasong',
      'caluya': 'Caluya',
      'culasi': 'Culasi',
      'hamtic': 'Hamtic',
      'laua-an': 'Laua-an',
      'lauaan': 'Laua-an',
      'libertad': 'Libertad',
      'pandan': 'Pandan',
      'patnongon': 'Patnongon',
      'san jose': 'San Jose',
      'sanjose': 'San Jose',
      'san remegio': 'San Remegio',
      'sanremegio': 'San Remegio',
      'sebaste': 'Sebaste',
      'sibalom': 'Sibalom',
      'tibiao': 'Tibiao',
      'tobias fornier': 'Tobias Fornier',
      'tobiasfornier': 'Tobias Fornier',
      'valderrama': 'Valderrama',
      'all': 'All'
    };

    const municipality = municipalityMap[input];
    if (municipality) {
      const municipalityHotlines = {
        'Anini-y': '📞 MDRRMO ANINI-Y:\n09456009363',
        'Barbaza': '📞 MDRRMO BARBAZA:\n09630356439 | 09366594189',
        'Belison': '📞 MDRRMO BELISON:\n09177068793',
        'Bugasong': '📞 MDRRMO BUGASONG:\n09064437973',
        'Caluya': '📞 MDRRMO CALUYA:\n09108621478',
        'Culasi': '📞 MDRRMO CULASI:\n09060439444 | 09612435152',
        'Hamtic': '📞 MDRRMO HAMTIC:\n09359298423 | 09067203929',
        'Laua-an': '📞 MDRRMO LAUA-AN:\n09260364499 | 09630334491',
        'Libertad': '📞 MDRRMO LIBERTAD:\n09511304178 | (036)2781686',
        'Pandan': '📞 MDRRMO PANDAN:\n09234774774 | (036)2789068',
        'Patnongon': '📞 MDRRMO PATNONGON:\n09560441742',
        'San Jose': '📞 MDRRMO SAN JOSE:\n09273875772 | 09192868863',
        'San Remegio': '📞 MDRRMO SAN REMEGIO:\n09056756684 | 09957481064',
        'Sebaste': '📞 MDRRMO SEBASTE:\n09778513357',
        'Sibalom': '📞 MDRRMO SIBALOM:\n09485475457 | 09354031071',
        'Tibiao': '📞 MDRRMO TIBIAO:\n09778035582',
        'Tobias Fornier': '📞 MDRRMO TOBIAS FORNIER:\n09997774775 | 09156322110',
        'Valderrama': '📞 MDRRMO VALDERRAMA:\n09177145517',
        'All': `🚨 ANTIQUE EMERGENCY HOTLINES 🚨

📞 PDRRMO ANTIQUE:
0917335763 | 09611543688 | (036) 6410185

🏘️ ALL MUNICIPAL DRRMO CONTACTS:
ANINI-Y: 09456009363
BARBAZA: 09630356439 | 09366594189
BELISON: 09177068793
BUGASONG: 09064437973
CALUYA: 09108621478
CULASI: 09060439444 | 09612435152
HAMTIC: 09359298423 | 09067203929
LAUA-AN: 09260364499 | 09630334491
LIBERTAD: 09511304178 | (036)2781686
PANDAN: 09234774774 | (036)2789068
PATNONGON: 09560441742
SAN JOSE: 09273875772 | 09192868863
SAN REMEGIO: 09056756684 | 09957481064
SEBASTE: 09778513357
SIBALOM: 09485475457 | 09354031071
TIBIAO: 09778035582
TOBIAS FORNIER: 09997774775 | 09156322110
VALDERRAMA: 09177145517`
      };

      const hotlineInfo = municipalityHotlines[municipality];
      const message = municipality === 'All' ? hotlineInfo : 
        `🚨 EMERGENCY HOTLINES FOR ${municipality.toUpperCase()} 🚨\n\n${hotlineInfo}\n\n📞 PDRRMO ANTIQUE (Provincial):\n0917335763 | 09611543688 | (036) 6410185\n\n⚠️ Save these numbers for emergencies!`;
      
      await sendMessage(sender, { text: message });
    } else {
      await sendMessage(sender, { text: 'Sorry, I didn\'t recognize that municipality. Please type the exact name from the list, or type "all" to see all hotlines.' });
    }
    
    // Clear conversation state
    convoState.delete(sender);
    return;
  }

  if (state.step === 'description') {
    // Save description and ask for location
    state.description = text;
    state.step = 'location';
    convoState.set(sender, state);
    await sendMessage(sender, { text: 'Where did this happen? (Please provide brgy/landmark/address)' });
    return;
  }

  if (state.step === 'location') {
    state.location = text;

    // Upsert user (basic)
    const fb_id = sender;
    const name = null; // We could call Graph API to get name if needed
    let userId = null;
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('fb_id', fb_id).limit(1).maybeSingle();
      if (existing && existing.id) userId = existing.id;
      else {
        const { data: inserted } = await supabase.from('users').insert([{ fb_id, name }]).select('id').single();
        userId = inserted.id;
      }
    } catch (err) {
      console.error('User upsert error', err);
    }

    // Insert report
    try {
      await supabase.from('reports').insert([{
        user_id: userId,
        category: state.category,
        description: state.description,
        location: state.location,
        status: 'Pending'
      }]);

      await sendMessage(sender, { text: '✅ Your report has been received. The response team will review it shortly. Thank you!' });
    } catch (err) {
      console.error('Report insert error', err);
      await sendMessage(sender, { text: 'Sorry, we could not save your report. Please try again later.' });
    }

    convoState.delete(sender);
    return;
  }

  // Default fallback
  await sendMessage(sender, { text: "I didn't understand that. Use the quick replies to start a report or view updates." });
}

export default router;
