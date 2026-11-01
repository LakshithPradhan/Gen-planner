import { CelebrationPlan, EventType } from '../types/plan';
import { normalizeBudgetCategories } from './budget';
import { addDaysToDateOnly, getLocalDateOnly } from './dateOnly';

export function getBuiltinTemplate(
  eventType: EventType,
  customParams?: {
    eventName?: string;
    date?: string;
    guests?: number;
    currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
    totalBudget?: number;
    city?: string;
    vibeNotes?: string;
  }
): CelebrationPlan {
  const currency = customParams?.currency || 'INR';
  const city = customParams?.city || 'Jaipur';
  const targetDate =
    customParams?.date ||
    addDaysToDateOnly(getLocalDateOnly(), 90);

  if (eventType === 'wedding') {
    const totalBudget = customParams?.totalBudget || (currency === 'INR' ? 1800000 : 25000);
    const guests = customParams?.guests || 350;

    const rawCategories = [
      { id: 'cat-fnb', name: 'Catering & Mithai', percentage: 38, spent: Math.round(totalBudget * 0.12), color: '#0066ff', description: 'Multi-cuisine buffet, live chaat stalls, wedding sweets' },
      { id: 'cat-venue', name: 'Venue & Lawns', percentage: 22, spent: Math.round(totalBudget * 0.15), color: '#3b82f6', description: 'Multi-day rental (Sangeet + Wedding + Reception)' },
      { id: 'cat-decor', name: 'Decor & Mandap', percentage: 15, spent: 0, color: '#60a5fa', description: 'Floral mandap, fairy-light canopy, stage setup' },
      { id: 'cat-photo', name: 'Photo & Cinematic Video', percentage: 10, spent: Math.round(totalBudget * 0.05), color: '#10b981', description: 'Candid photographer, drone reel, 4K wedding film' },
      { id: 'cat-ent', name: 'Music, DJ & Dhol', percentage: 6, spent: 0, color: '#f59e0b', description: 'Live DJ console, Punjabi Dhol troupe, sound engineer' },
      { id: 'cat-attire', name: 'Bridal, Groom & HMU', percentage: 5, spent: 0, color: '#ec4899', description: 'Bridal lehenga, sherwani, bridal makeup artist' },
      { id: 'cat-misc', name: 'Favours & Contingency', percentage: 4, spent: 0, color: '#8b5cf6', description: 'Custom sweets boxes, welcome hampers, logistics' },
    ];

    return {
      id: `plan_wedding_${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventName: customParams?.eventName || `The Grand Wedding in ${city}`,
      eventType: 'wedding',
      targetDate,
      guestCount: guests,
      currency,
      totalBudget,
      city,
      vibeNotes: customParams?.vibeNotes || 'Royal, energetic, multi-day Indian celebration with Haldi, Sangeet & Reception',
      budgetCategories: normalizeBudgetCategories(rawCategories),
      timeline: [
        { id: 't1', title: 'Lock & book primary venue for Sangeet & Wedding', phase: 'Planning & Bookings', daysBeforeEvent: 90, dueDate: '', completed: true, isUrgent: false },
        { id: 't2', title: 'Finalize catering menu & conduct food tasting', phase: 'F&B Selection', daysBeforeEvent: 60, dueDate: '', completed: false, isUrgent: false },
        { id: 't3', title: 'Confirm Mehendi artist & bridal makeup package', phase: 'Vendor Booking', daysBeforeEvent: 45, dueDate: '', completed: false, isUrgent: true },
        { id: 't4', title: 'Finalize thematic floral mandap & entrance walkway', phase: 'Design & Decor', daysBeforeEvent: 30, dueDate: '', completed: false, isUrgent: false },
        { id: 't5', title: 'Send digital save-the-dates & collect RSVPs', phase: 'Guest Management', daysBeforeEvent: 25, dueDate: '', completed: false, isUrgent: false },
        { id: 't6', title: 'Curate Sangeet playlist & choreograph family dance', phase: 'Entertainment', daysBeforeEvent: 20, dueDate: '', completed: false, isUrgent: false },
        { id: 't7', title: 'Schedule guest airport shuttle & hotel room allocations', phase: 'Logistics', daysBeforeEvent: 10, dueDate: '', completed: false, isUrgent: true },
        { id: 't8', title: 'Final count check with caterer & assemble favours', phase: 'Final Run', daysBeforeEvent: 3, dueDate: '', completed: false, isUrgent: true },
      ],
      vendors: [
        { id: 'v1', name: `${city} Heritage Palace & Banquets`, category: 'Venue', estimatedCost: Math.round(totalBudget * 0.22), status: 'Booked', whatToConfirm: 'Confirm bridal suite access from 8am and generator backup.' },
        { id: 'v2', name: 'Shahi Rasoi Gourmet Caterers', category: 'Catering', estimatedCost: Math.round(totalBudget * 0.38), status: 'Contacted', whatToConfirm: 'Confirm live jalebi & chaat counters and exact plate count buffer (+10%).' },
        { id: 'v3', name: 'Kala & Sutra Wedding Studios', category: 'Photography', estimatedCost: Math.round(totalBudget * 0.10), status: 'Booked', whatToConfirm: 'Deliverable timeline for 60-second teaser reel and full cinematic film.' },
        { id: 'v4', name: 'Vibrant Petals Floral Designers', category: 'Decor', estimatedCost: Math.round(totalBudget * 0.15), status: 'To contact', whatToConfirm: 'Check whether seasonal marigolds & imported orchids are included.' },
        { id: 'v5', name: 'DJ Aryan & Beats of Punjab Dhol', category: 'Entertainment', estimatedCost: Math.round(totalBudget * 0.06), status: 'To contact', whatToConfirm: 'Verify sound level clearance permits after 10:00 PM.' },
        { id: 'v6', name: 'Zara Bridal Glamour & Mehendi', category: 'Hair & Makeup', estimatedCost: Math.round(totalBudget * 0.04), status: 'To contact', whatToConfirm: 'Confirm number of assistants for bridesmaids Mehendi.' },
        { id: 'v7', name: 'Royal Rajputana Pandit / Officiant', category: 'Ceremony Officiant', estimatedCost: Math.round(totalBudget * 0.02), status: 'Contacted', whatToConfirm: 'Provide puja samagri list 2 weeks prior.' },
        { id: 'v8', name: 'Speedway Luxury Shuttles', category: 'Logistics', estimatedCost: Math.round(totalBudget * 0.03), status: 'To contact', whatToConfirm: 'Dedicated driver contacts and airport pickup placards.' },
      ],
      ideas: [
        { id: 'i1', title: 'Live Jalebi & Rabri Station', tag: 'Culinary Delight', description: 'An interactive dessert station where fresh kesar jalebis are swirled and served with chilled saffron rabri.' },
        { id: 'i2', title: 'QR Code Guest Audio Guestbook', tag: 'Memory Keeper', description: 'Table cards allowing guests to record 30-second celebratory voice memos compiled into a timeless podcast.' },
        { id: 'i3', title: 'Colour-Coordinated Sangeet Flashmob', tag: 'Crowd Energy', description: 'Assign distinct jewel tones per family tier with a synchronised 3-minute opening medley.' },
        { id: 'i4', title: 'Eco-Friendly Seed Paper Favours', tag: 'Sustainable Touch', description: 'Seed-embedded thank you cards packaged with artisanal roasted dry fruits in jute bags.' },
        { id: 'i5', title: 'Sunrise Haldi with Brass URL Bowls', tag: 'Aesthetic Decor', description: 'Golden brass urli vessels filled with floating marigolds and rose petals for morning haldi portraits.' },
        { id: 'i6', title: 'Instant Polaroids & Wooden Peg Wall', tag: 'Interactive Fun', description: 'Selfie booth with instant cameras; guests peg their candid snapshots on a fairy-lit twine board.' },
      ],
      summaryNote: 'AI-curated celebration plan with multi-ceremony Indian wedding defaults. All costs are AI estimates.',
    };
  }

  if (eventType === 'birthday') {
    const totalBudget = customParams?.totalBudget || (currency === 'INR' ? 120000 : 3500);
    const guests = customParams?.guests || 45;

    const rawCategories = [
      { id: 'b-fnb', name: 'Food & Gourmet Bites', percentage: 40, spent: Math.round(totalBudget * 0.1), color: '#0066ff', description: 'Gourmet starters, sliders, mocktail bar' },
      { id: 'b-venue', name: 'Lounge / Rooftop Space', percentage: 25, spent: 0, color: '#3b82f6', description: 'Private party deck or cafe reservation' },
      { id: 'b-decor', name: 'Theme Decor & Backdrop', percentage: 15, spent: 0, color: '#60a5fa', description: 'Custom neon sign, balloon garland, photo booth' },
      { id: 'b-cake', name: 'Bespoke Designer Cake', percentage: 8, spent: 0, color: '#ec4899', description: 'Multi-tiered customized fondant or pull-me-up cake' },
      { id: 'b-ent', name: 'DJ & Fun Activities', percentage: 7, spent: 0, color: '#f59e0b', description: 'Party host/MC, interactive trivia, upbeat playlist' },
      { id: 'b-favours', name: 'Return Gifts & Goodies', percentage: 5, spent: 0, color: '#10b981', description: 'Personalized keepsakes for attendees' },
    ];

    return {
      id: `plan_bday_${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventName: customParams?.eventName || `The Milestone Birthday Bash`,
      eventType: 'birthday',
      targetDate,
      guestCount: guests,
      currency,
      totalBudget,
      city,
      vibeNotes: customParams?.vibeNotes || 'Vibrant, high-energy milestone birthday with custom neon aesthetic',
      budgetCategories: normalizeBudgetCategories(rawCategories),
      timeline: [
        { id: 'bt1', title: 'Select theme and finalize venue / rooftop reservation', phase: 'Concept', daysBeforeEvent: 30, dueDate: '', completed: true, isUrgent: false },
        { id: 'bt2', title: 'Order customized centerpiece cake & dessert jars', phase: 'Bakery', daysBeforeEvent: 14, dueDate: '', completed: false, isUrgent: false },
        { id: 'bt3', title: 'Design & send animated digital invites with RSVP deadline', phase: 'Invites', daysBeforeEvent: 12, dueDate: '', completed: false, isUrgent: false },
        { id: 'bt4', title: 'Coordinate custom neon sign & balloon installation', phase: 'Decor', daysBeforeEvent: 7, dueDate: '', completed: false, isUrgent: true },
        { id: 'bt5', title: 'Confirm final headcount with caterer and mixologist', phase: 'F&B', daysBeforeEvent: 3, dueDate: '', completed: false, isUrgent: true },
        { id: 'bt6', title: 'Pick up cake, setup photobooth props, party time!', phase: 'Day-Of', daysBeforeEvent: 0, dueDate: '', completed: false, isUrgent: true },
      ],
      vendors: [
        { id: 'bv1', name: `${city} Sky Lounge & Terrace`, category: 'Venue', estimatedCost: Math.round(totalBudget * 0.25), status: 'Booked', whatToConfirm: 'Corkage policy and outside dessert allowance.' },
        { id: 'bv2', name: 'Crumb & Frosting Artisan Bakery', category: 'Cake Artist', estimatedCost: Math.round(totalBudget * 0.08), status: 'Contacted', whatToConfirm: 'Delivery time slot 2 hours prior to guest arrival.' },
        { id: 'bv3', name: 'GlowCraft Balloon & Neon Styling', category: 'Decor', estimatedCost: Math.round(totalBudget * 0.15), status: 'To contact', whatToConfirm: 'Standee support and tear-down policy by midnight.' },
        { id: 'bv4', name: 'Urban Chef Grazing Tables', category: 'Catering', estimatedCost: Math.round(totalBudget * 0.40), status: 'To contact', whatToConfirm: 'Dietary restrictions (vegan/gluten-free options).' },
        { id: 'bv5', name: 'SnapShot 360 Video Booth', category: 'Entertainment', estimatedCost: Math.round(totalBudget * 0.07), status: 'To contact', whatToConfirm: 'Instant AirDrop sharing speed for guests.' },
        { id: 'bv6', name: 'Curated Gifts & Co', category: 'Favours', estimatedCost: Math.round(totalBudget * 0.05), status: 'To contact', whatToConfirm: 'Customized thank-you tags printing.' },
        { id: 'bv7', name: 'PixelPerfect Candid Moments', category: 'Photography', estimatedCost: Math.round(totalBudget * 0.08), status: 'To contact', whatToConfirm: '3-hour event coverage and digital drive delivery within 48h.' },
      ],
      ideas: [
        { id: 'bi1', title: '360 Spinning Video Glambot', tag: 'Viral Hit', description: 'A slow-motion 360 circular camera platform with glowing LED underlighting for Instagram reels.' },
        { id: 'bi2', title: 'Signature Mocktail / Cocktail Bar', tag: 'Beverage Concept', description: 'Curate 2 custom drinks named after the celebrant’s famous anecdotes or catchphrases.' },
        { id: 'bi3', title: 'Childhood vs Now Nostalgia Wall', tag: 'Sentimental', description: 'Grid of framed photographs recreating funny childhood poses next to modern portraits.' },
        { id: 'bi4', title: 'Live Acoustic Pop-Rock Set', tag: 'Atmosphere', description: 'A 45-minute golden-hour acoustic guitar set before the energetic dance playlist starts.' },
        { id: 'bi5', title: 'Customized Mini Scented Candle Favours', tag: 'Gifting', description: 'Hand-poured soy wax candles with a subtle bergamot scent and celebrant’s monogram.' },
        { id: 'bi6', title: 'Surprise Video Reel from Far-Away Friends', tag: 'Emotional Peak', description: 'Screen a secret 3-minute montage of video wishes from childhood friends overseas.' },
      ],
      summaryNote: 'AI-curated birthday bash plan tailored for maximum energy and memories. All costs are AI estimates.',
    };
  }

  // Community Event
  const totalBudget = customParams?.totalBudget || (currency === 'INR' ? 450000 : 8000);
  const guests = customParams?.guests || 400;

  const rawCategories = [
    { id: 'c-ground', name: 'Ground / Amphitheatre & Permits', percentage: 28, spent: Math.round(totalBudget * 0.1), color: '#0066ff', description: 'Municipal clearance, grounds, stage infrastructure' },
    { id: 'c-av', name: 'Sound, Stage, Screens & Lighting', percentage: 25, spent: 0, color: '#3b82f6', description: 'Line-array speakers, LED backdrop wall, generator set' },
    { id: 'c-fnb', name: 'Food Stalls & Refreshments', percentage: 22, spent: 0, color: '#60a5fa', description: 'Community snacks, tea/chai stalls, drinking water tanks' },
    { id: 'c-sec', name: 'Security, First Aid & Sanitation', percentage: 12, spent: 0, color: '#10b981', description: 'Licensed guards, barricades, ambulance on standby' },
    { id: 'c-pr', name: 'PR, Banners & Volunteer Kits', percentage: 8, spent: 0, color: '#f59e0b', description: 'Promotional posters, community flyers, ID lanyards' },
    { id: 'c-misc', name: 'Prizes & Contingency Fund', percentage: 5, spent: 0, color: '#8b5cf6', description: 'Trophies, guest mementos, emergency repairs' },
  ];

  return {
    id: `plan_community_${Date.now()}`,
    createdAt: new Date().toISOString(),
    eventName: customParams?.eventName || `Community Utsav & Cultural Carnival`,
    eventType: 'community',
    targetDate,
    guestCount: guests,
    currency,
    totalBudget,
    city,
    vibeNotes: customParams?.vibeNotes || 'Inclusive, festive community gathering with stage performances and food stalls',
    budgetCategories: normalizeBudgetCategories(rawCategories),
    timeline: [
      { id: 'ct1', title: 'Submit municipal ground & police permissions', phase: 'Permits', daysBeforeEvent: 60, dueDate: '', completed: true, isUrgent: false },
      { id: 'ct2', title: 'Publish call for local performers, dancers & cultural acts', phase: 'Programming', daysBeforeEvent: 45, dueDate: '', completed: false, isUrgent: false },
      { id: 'ct3', title: 'Contract professional Sound, Light & Stage vendor', phase: 'Production', daysBeforeEvent: 30, dueDate: '', completed: false, isUrgent: true },
      { id: 'ct4', title: 'Assign volunteer captains (Security, Stage, Hospitality)', phase: 'Volunteers', daysBeforeEvent: 20, dueDate: '', completed: false, isUrgent: false },
      { id: 'ct5', title: 'Inspect fire extinguishers & first-aid booth setup', phase: 'Safety', daysBeforeEvent: 7, dueDate: '', completed: false, isUrgent: true },
      { id: 'ct6', title: 'Full stage technical dry run with MC & artists', phase: 'Rehearsal', daysBeforeEvent: 1, dueDate: '', completed: false, isUrgent: true },
    ],
    vendors: [
      { id: 'cv1', name: `${city} City Council Grounds`, category: 'Ground / Venue', estimatedCost: Math.round(totalBudget * 0.28), status: 'Booked', whatToConfirm: 'Commercial noise curfew and clean-up deposit refund criteria.' },
      { id: 'cv2', name: 'SonicStage Audio-Visuals', category: 'AV & Lights', estimatedCost: Math.round(totalBudget * 0.25), status: 'Contacted', whatToConfirm: 'Verify wireless microphone battery count and dual backup console.' },
      { id: 'cv3', name: 'Desi Street Food Collective', category: 'Food Stalls', estimatedCost: Math.round(totalBudget * 0.22), status: 'To contact', whatToConfirm: 'FSSAI food safety licenses and waste management bins.' },
      { id: 'cv4', name: 'ShieldSafe Security Services', category: 'Security & Medical', estimatedCost: Math.round(totalBudget * 0.12), status: 'To contact', whatToConfirm: 'Station 6 guards at entry gates and 1 EMT nurse on site.' },
      { id: 'cv5', name: 'PrintCraft Community Banners', category: 'Signage & PR', estimatedCost: Math.round(totalBudget * 0.08), status: 'To contact', whatToConfirm: 'Weatherproof vinyl quality and volunteer badge printing.' },
      { id: 'cv6', name: 'Apex Power Generators', category: 'Utilities', estimatedCost: Math.round(totalBudget * 0.05), status: 'To contact', whatToConfirm: 'Diesel fuel reserve capacity for 8 continuous hours.' },
      { id: 'cv7', name: 'EchoMedia Documentaries', category: 'Event Recording', estimatedCost: Math.round(totalBudget * 0.05), status: 'To contact', whatToConfirm: 'Live stream capabilities to community YouTube channel.' },
    ],
    ideas: [
      { id: 'ci1', title: 'Community Talent Showcase & Awards', tag: 'Engagement', description: 'Segmented performances by local youth and seniors with public voting on mobile phones.' },
      { id: 'ci2', title: 'Artisanal Flea Market & Craft Stalls', tag: 'Local Commerce', description: 'Free or low-cost tables for local women entrepreneurs to display handcrafted festive goods.' },
      { id: 'ci3', title: 'Zero-Waste Organic Waste Segregation', tag: 'Green Initiative', description: 'Color-coded recycling zones managed by youth eco-volunteers, composting all food remnants.' },
      { id: 'ci4', title: 'Community Potluck / Chai Adda', tag: 'Bonding', description: 'A cozy tented lounge with piping hot cutting chai and samosas where neighbors can mingle.' },
      { id: 'ci5', title: 'Historical Photo Exhibition of the Locality', tag: 'Heritage', description: 'Archive photos showing the town/neighborhood 50 years ago alongside current drone panoramas.' },
      { id: 'ci6', title: 'Interactive Lantern Lighting & Wish Wall', tag: 'Highlight Moment', description: 'A collective evening ceremony where attendees pin personal wishes to an illuminated willow tree.' },
    ],
    summaryNote: 'AI-curated community fest framework with security, volunteer, and municipal guidelines. All costs are AI estimates.',
  };
}
