// Language dictionary + toggle. Mirrors theme.js: reads/writes localStorage,
// applied before render(). Screens call t("some.key") instead of hardcoding
// English text, so switching language is just "re-render with the other
// dictionary" — no page reload, no live translation calls.
//
// To add a new string: add the key to BOTH `en` and `ta` below, then use
// t("your.key") in app.js. If a `ta` key is ever missing, t() silently
// falls back to the `en` value so the UI never shows a blank string.

const LANG_DICT = {
  en: {
    "brand.tagline": "Every signature is a risk nobody explained.",
    "nav.back": "Back",

    "input.title": "Check your agreement",
    "input.subtitle": "Paste a clause, or upload a photo of the whole document. We'll check it against Tamil Nadu law and tell you plainly what it means.",
    "input.modeText": "Paste text",
    "input.modeImage": "Upload photo",
    "input.docType": "Document type",
    "input.docType.rental": "Rental agreement",
    "input.docType.loan": "Loan / borrowing note",
    "input.district": "Your district",
    "input.analyzeText": "Check this clause",
    "input.analyzeImage": "Check this document",
    "input.disclaimer": "This tool is not a substitute for legal advice. For serious or urgent situations, contact your nearest District Legal Services Authority or call the free Tamil Nadu legal aid helpline: 15100.",
    "input.clauseLabel": "Paste your clause here",
    "input.clausePlaceholder": "Example: The tenant shall pay 6 months rent as security deposit...",
    "input.tryASample": "Try a sample clause",
    "input.sampleRental": "Load rental sample",
    "input.sampleLoan": "Load loan sample",
    "input.imageLabel": "Photo of your document",
    "input.imageHint": "Tap to take a photo or choose one from your gallery. Make sure the text is readable — good lighting, not too angled.",
    "input.imageAlt": "Selected document photo",
    "input.errNoText": "Please enter a clause first.",
    "input.errNoImage": "Please choose a photo first.",
    "input.checkingText": "Checking against Tamil Nadu law...",
    "input.checkingImage": "Reading the document and checking every clause — this can take a bit longer...",

    "err.generic": "Something went wrong: {msg}",
    "err.noClausesTitle": "No clauses found",
    "err.noClausesBody": "We couldn't confidently match any clauses in this photo to our rule base. Try a clearer photo — good lighting, the page flat and not angled — or paste the text instead.",

    "result.errTitle": "Something went wrong",
    "result.retry": "Try again",
    "result.highStamp": "High risk",
    "result.highIntro": "This clause appears to violate Tamil Nadu law.",
    "result.whatItMeansFor": "What this means for you",
    "result.legalBasis": "Legal basis: {v}",
    "result.legalLimit": "What the law allows: {v}",
    "result.whatNext": "What do you want to do?",
    "result.optionA": "Option A — send a counter-message to your landlord or lender.",
    "result.sendCounter": "Send counter-message",
    "result.optionB": "Option B — report to free legal aid (DLSA).",
    "result.reportDlsa": "Report to DLSA",
    "result.disclaimer": "This is not legal advice. For complex or urgent situations, contact your nearest DLSA or call the free helpline: 15100.",
    "result.lowStamp": "Standard clause",
    "result.lowIntro": "No major legal violations were detected in this clause.",
    "result.whatItMeans": "What this means",
    "result.reference": "Reference: {v}",
    "result.stillWrong": "If something still feels wrong, or wasn't covered here, call the free Tamil Nadu legal aid helpline: {num}.",
    "result.checkAnother": "Check another clause",

    "verdict.allClear": "None of the clauses checked appear to violate Tamil Nadu law. This agreement looks reasonably standard — read it in full before signing, but nothing here needs a fight.",
    "verdict.allBad": "All {total} clauses checked appear to violate Tamil Nadu law. We would not recommend signing this as-is — push back or escalate using the options below first.",
    "verdict.someBad": "{high} of {total} clauses checked appear to violate Tamil Nadu law. Don't sign yet — get those flagged clauses corrected or escalated first; the rest look standard.",

    "imgResult.title": "{n} clauses found",
    "imgResult.standard": "Standard",
    "imgResult.legalBasis": "Legal basis: {v}",
    "imgResult.counter": "Counter-message",
    "imgResult.dlsa": "Report to DLSA",
    "imgResult.bulkTitle": "Deal with all {n} risky clauses at once",
    "imgResult.bulkBody": "Instead of going one by one, you can send a single combined counter-message or a single combined DLSA complaint that covers every risky clause.",
    "imgResult.bulkCounter": "Counter-message for all",
    "imgResult.bulkDlsa": "Escalate all to DLSA",
    "imgResult.checkAnother": "Check another document",

    "counter.titleBulk": "Counter-message for all risky clauses",
    "counter.title": "Counter-message",
    "counter.subtitleBulk": "Drafted based on Tamil Nadu law, one section per risky clause. Edit it before sending via WhatsApp, SMS, or in person.",
    "counter.subtitle": "Drafted based on Tamil Nadu law. Edit it before sending via WhatsApp, SMS, or in person.",
    "counter.copy": "Copy text",
    "counter.copied": "Copied",
    "counter.download": "Download",
    "counter.escalateHintBulk": "If the other party refuses to change these clauses, you can escalate to free legal aid.",
    "counter.escalateHint": "If the other party refuses to change this clause, you can escalate to free legal aid.",
    "counter.escalateBulk": "Escalate all to DLSA",
    "counter.escalate": "Escalate to DLSA",
    "counter.another": "Check another clause",
    "counter.helpline": "Free Legal Aid Helpline: 15100",

    "dlsa.title": "Report to free legal aid",
    "dlsa.subtitleBulk": "A single formal complaint covering every risky clause will be drafted for the DLSA office in your district.",
    "dlsa.subtitle": "A formal complaint will be drafted for the DLSA office in your district.",
    "dlsa.loading": "Loading office details…",
    "dlsa.loadFailed": "Could not load office details, but you can still continue.",
    "dlsa.address": "Address: {v}",
    "dlsa.phone": "Phone: {v}",
    "dlsa.nameLabel": "Your full name",
    "dlsa.namePlaceholder": "As it should appear in the complaint",
    "dlsa.emailLabel": "Your email address",
    "dlsa.emailPlaceholder": "You'll get a copy of the complaint here",
    "dlsa.emailNote": "Used only to send you a copy. Not stored or shared.",
    "dlsa.draftBtn": "Draft the complaint email",
    "dlsa.errNoName": "Please enter your name.",
    "dlsa.errBadEmail": "Please enter a valid email address.",
    "dlsa.drafting": "Drafting formal complaint...",

    "email.title": "Review your complaint email",
    "email.subtitle": "This will be sent to the DLSA office. You'll receive a copy. Please read it carefully first.",
    "email.toLabel": "To",
    "email.ccLabel": "Cc",
    "email.subjectLabel": "Subject",
    "email.subjectLineSingle": "Legal Complaint - Illegal Clause in Agreement - {district}",
    "email.subjectLineBulk": "Legal Complaint - Illegal Clauses in Agreement - {district}",
    "email.send": "Send this email",
    "email.downloadSelf": "Download and send yourself",
    "email.sending": "Sending complaint to DLSA...",
    "email.disclaimer": "Verify DLSA email addresses at tnsla.tn.gov.in if you don't hear back within 7 working days. Free helpline: 15100.",
    "email.note": "This complaint email is always sent in English, since it goes to a government office. Everything else in the app follows your language setting.",

    "confirm.sentTitle": "Complaint sent",
    "confirm.failedTitle": "Could not send automatically",
    "confirm.sentTo": "Sent to: {v}",
    "confirm.ccTo": "A copy was sent to: {v}",
    "confirm.eta": "Expected response time is 3 to 7 working days.",
    "confirm.unknownError": "Unknown error.",
    "confirm.sendManually": "Please download the complaint and send it manually.",
    "confirm.downloadLetter": "Download complaint letter",
    "confirm.officeDetails": "DLSA office details",
    "confirm.address": "Address: {v}",
    "confirm.phone": "Phone: {v}",
    "confirm.email": "Email: {v}",
    "confirm.helpline": "Free Legal Aid Helpline: 15100 (available across Tamil Nadu)",
    "confirm.website": "Website: tnsla.tn.gov.in",
    "confirm.another": "Check another clause",
    "confirm.disclaimer": "This tool is not a substitute for legal counsel. For urgent situations, call 15100 immediately.",
  },

  ta: {
    "brand.tagline": "விளக்கப்படாத ஒவ்வொரு கையொப்பமும் ஒரு ஆபத்து.",
    "nav.back": "பின் செல்",

    "input.title": "உங்கள் ஒப்பந்தத்தை சரிபார்க்கவும்",
    "input.subtitle": "ஒரு விதியை ஒட்டவும், அல்லது முழு ஆவணத்தின் புகைப்படத்தை பதிவேற்றவும். தமிழ்நாடு சட்டத்தின்படி சரிபார்த்து, அதன் பொருளை எளிமையாக விளக்குவோம்.",
    "input.modeText": "உரையை ஒட்டவும்",
    "input.modeImage": "புகைப்படம் பதிவேற்று",
    "input.docType": "ஆவண வகை",
    "input.docType.rental": "வாடகை ஒப்பந்தம்",
    "input.docType.loan": "கடன் / கையெழுத்து குறிப்பு",
    "input.district": "உங்கள் மாவட்டம்",
    "input.analyzeText": "இந்த விதியை சரிபார்",
    "input.analyzeImage": "இந்த ஆவணத்தை சரிபார்",
    "input.disclaimer": "இந்தக் கருவி சட்ட ஆலோசனைக்கு மாற்றாக இல்லை. தீவிரமான அல்லது அவசர நிலைமைகளுக்கு, உங்கள் அருகிலுள்ள மாவட்ட சட்ட சேவைகள் ஆணையத்தை தொடர்பு கொள்ளவும் அல்லது இலவச தமிழ்நாடு சட்ட உதவி எண்ணை அழைக்கவும்: 15100.",
    "input.clauseLabel": "உங்கள் விதியை இங்கே ஒட்டவும்",
    "input.clausePlaceholder": "உதாரணம்: வாடகைதாரர் 6 மாத வாடகையை பாதுகாப்பு வைப்புத்தொகையாக செலுத்த வேண்டும்...",
    "input.tryASample": "ஒரு மாதிரி விதியை முயற்சிக்கவும்",
    "input.sampleRental": "வாடகை மாதிரியை ஏற்று",
    "input.sampleLoan": "கடன் மாதிரியை ஏற்று",
    "input.imageLabel": "உங்கள் ஆவணத்தின் புகைப்படம்",
    "input.imageHint": "புகைப்படம் எடுக்க தட்டவும் அல்லது கேலரியிலிருந்து தேர்ந்தெடுக்கவும். உரை தெளிவாக தெரிய வேண்டும் — நல்ல வெளிச்சம், அதிக கோணம் இல்லாமல்.",
    "input.imageAlt": "தேர்ந்தெடுக்கப்பட்ட ஆவணப் புகைப்படம்",
    "input.errNoText": "முதலில் ஒரு விதியை உள்ளிடவும்.",
    "input.errNoImage": "முதலில் ஒரு புகைப்படத்தை தேர்ந்தெடுக்கவும்.",
    "input.checkingText": "தமிழ்நாடு சட்டத்தின்படி சரிபார்க்கிறோம்...",
    "input.checkingImage": "ஆவணத்தை படித்து ஒவ்வொரு விதியையும் சரிபார்க்கிறோம் — இதற்கு சிறிது நேரம் ஆகலாம்...",

    "err.generic": "ஏதோ தவறு நடந்தது: {msg}",
    "err.noClausesTitle": "விதிகள் எதுவும் கிடைக்கவில்லை",
    "err.noClausesBody": "இந்த புகைப்படத்தில் உள்ள விதிகளை எங்கள் விதி தளத்துடன் நம்பிக்கையுடன் பொருத்த முடியவில்லை. தெளிவான புகைப்படத்தை முயற்சிக்கவும் — நல்ல வெளிச்சம், பக்கம் நேராக — அல்லது உரையை ஒட்டவும்.",

    "result.errTitle": "ஏதோ தவறு நடந்தது",
    "result.retry": "மீண்டும் முயற்சிக்கவும்",
    "result.highStamp": "அதிக ஆபத்து",
    "result.highIntro": "இந்த விதி தமிழ்நாடு சட்டத்தை மீறுவதாக தெரிகிறது.",
    "result.whatItMeansFor": "இது உங்களுக்கு என்ன அர்த்தம்",
    "result.legalBasis": "சட்ட அடிப்படை: {v}",
    "result.legalLimit": "சட்டம் அனுமதிப்பது: {v}",
    "result.whatNext": "நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?",
    "result.optionA": "விருப்பம் A — உங்கள் வீட்டு உரிமையாளர் அல்லது கடன் வழங்குபவருக்கு எதிர் செய்தி அனுப்பவும்.",
    "result.sendCounter": "எதிர் செய்தி அனுப்பு",
    "result.optionB": "விருப்பம் B — இலவச சட்ட உதவிக்கு (DLSA) புகார் அளிக்கவும்.",
    "result.reportDlsa": "DLSA-வுக்கு புகார் அளி",
    "result.disclaimer": "இது சட்ட ஆலோசனை அல்ல. சிக்கலான அல்லது அவசர நிலைமைகளுக்கு, உங்கள் அருகிலுள்ள DLSA-ஐ தொடர்பு கொள்ளவும் அல்லது இலவச உதவி எண்ணை அழைக்கவும்: 15100.",
    "result.lowStamp": "வழக்கமான விதி",
    "result.lowIntro": "இந்த விதியில் பெரிய சட்ட மீறல்கள் எதுவும் கண்டறியப்படவில்லை.",
    "result.whatItMeans": "இதன் பொருள் என்ன",
    "result.reference": "குறிப்பு: {v}",
    "result.stillWrong": "ஏதேனும் தவறாக தெரிந்தால், அல்லது இங்கே சொல்லப்படாவிட்டால், இலவச தமிழ்நாடு சட்ட உதவி எண்ணை அழைக்கவும்: {num}.",
    "result.checkAnother": "மற்றொரு விதியை சரிபார்",

    "verdict.allClear": "சரிபார்க்கப்பட்ட எந்த விதியும் தமிழ்நாடு சட்டத்தை மீறுவதாக தெரியவில்லை. இந்த ஒப்பந்தம் பொதுவாக வழக்கமானதாக தெரிகிறது — கையொப்பமிடும் முன் முழுவதும் படிக்கவும், ஆனால் இதில் போராட வேண்டியது ஏதும் இல்லை.",
    "verdict.allBad": "சரிபார்க்கப்பட்ட எல்லா {total} விதிகளும் தமிழ்நாடு சட்டத்தை மீறுவதாக தெரிகிறது. இதை இப்படியே கையொப்பமிட பரிந்துரைக்கவில்லை — முதலில் கீழே உள்ள விருப்பங்களைப் பயன்படுத்தி எதிர்க்கவும் அல்லது புகார் அளிக்கவும்.",
    "verdict.someBad": "சரிபார்க்கப்பட்ட {total} விதிகளில் {high} தமிழ்நாடு சட்டத்தை மீறுவதாக தெரிகிறது. இன்னும் கையொப்பமிட வேண்டாம் — முதலில் அந்த விதிகளை சரிசெய்யவும் அல்லது புகார் அளிக்கவும்; மற்றவை வழக்கமானதாக தெரிகிறது.",

    "imgResult.title": "{n} விதிகள் கண்டறியப்பட்டன",
    "imgResult.standard": "வழக்கமானது",
    "imgResult.legalBasis": "சட்ட அடிப்படை: {v}",
    "imgResult.counter": "எதிர் செய்தி",
    "imgResult.dlsa": "DLSA-வுக்கு புகார் அளி",
    "imgResult.bulkTitle": "அனைத்து {n} ஆபத்தான விதிகளையும் ஒரே முறையில் கையாளவும்",
    "imgResult.bulkBody": "ஒவ்வொன்றாக செல்வதற்கு பதிலாக, அனைத்து ஆபத்தான விதிகளையும் உள்ளடக்கிய ஒரு ஒருங்கிணைந்த எதிர் செய்தி அல்லது ஒரு ஒருங்கிணைந்த DLSA புகாரை அனுப்பலாம்.",
    "imgResult.bulkCounter": "அனைத்திற்கும் எதிர் செய்தி",
    "imgResult.bulkDlsa": "அனைத்தையும் DLSA-வுக்கு அனுப்பு",
    "imgResult.checkAnother": "மற்றொரு ஆவணத்தை சரிபார்",

    "counter.titleBulk": "அனைத்து ஆபத்தான விதிகளுக்கான எதிர் செய்தி",
    "counter.title": "எதிர் செய்தி",
    "counter.subtitleBulk": "தமிழ்நாடு சட்டத்தின் அடிப்படையில் வரையப்பட்டது, ஒவ்வொரு ஆபத்தான விதிக்கும் ஒரு பகுதி. அனுப்பும் முன் WhatsApp, SMS, அல்லது நேரடியாக திருத்தவும்.",
    "counter.subtitle": "தமிழ்நாடு சட்டத்தின் அடிப்படையில் வரையப்பட்டது. அனுப்பும் முன் WhatsApp, SMS, அல்லது நேரடியாக திருத்தவும்.",
    "counter.copy": "உரையை நகலெடு",
    "counter.copied": "நகலெடுக்கப்பட்டது",
    "counter.download": "பதிவிறக்கு",
    "counter.escalateHintBulk": "மற்ற தரப்பினர் இந்த விதிகளை மாற்ற மறுத்தால், இலவச சட்ட உதவிக்கு புகார் அளிக்கலாம்.",
    "counter.escalateHint": "மற்ற தரப்பினர் இந்த விதியை மாற்ற மறுத்தால், இலவச சட்ட உதவிக்கு புகார் அளிக்கலாம்.",
    "counter.escalateBulk": "அனைத்தையும் DLSA-வுக்கு அனுப்பு",
    "counter.escalate": "DLSA-வுக்கு அனுப்பு",
    "counter.another": "மற்றொரு விதியை சரிபார்",
    "counter.helpline": "இலவச சட்ட உதவி எண்: 15100",

    "dlsa.title": "இலவச சட்ட உதவிக்கு புகார் அளிக்கவும்",
    "dlsa.subtitleBulk": "ஒவ்வொரு ஆபத்தான விதியையும் உள்ளடக்கிய ஒரு முறையான புகார் உங்கள் மாவட்ட DLSA அலுவலகத்திற்கு வரையப்படும்.",
    "dlsa.subtitle": "உங்கள் மாவட்ட DLSA அலுவலகத்திற்கு ஒரு முறையான புகார் வரையப்படும்.",
    "dlsa.loading": "அலுவலக விவரங்கள் ஏற்றப்படுகின்றன…",
    "dlsa.loadFailed": "அலுவலக விவரங்களை ஏற்ற முடியவில்லை, ஆனாலும் தொடரலாம்.",
    "dlsa.address": "முகவரி: {v}",
    "dlsa.phone": "தொலைபேசி: {v}",
    "dlsa.nameLabel": "உங்கள் முழு பெயர்",
    "dlsa.namePlaceholder": "புகாரில் தோன்ற வேண்டியபடி",
    "dlsa.emailLabel": "உங்கள் மின்னஞ்சல் முகவரி",
    "dlsa.emailPlaceholder": "புகாரின் நகல் இங்கே கிடைக்கும்",
    "dlsa.emailNote": "உங்களுக்கு ஒரு நகல் அனுப்ப மட்டுமே பயன்படுத்தப்படும். சேமிக்கப்படாது, பகிரப்படாது.",
    "dlsa.draftBtn": "புகார் மின்னஞ்சலை வரைவு செய்",
    "dlsa.errNoName": "தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.",
    "dlsa.errBadEmail": "தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
    "dlsa.drafting": "முறையான புகார் வரையப்படுகிறது...",

    "email.title": "உங்கள் புகார் மின்னஞ்சலை மதிப்பாய்வு செய்யவும்",
    "email.subtitle": "இது DLSA அலுவலகத்திற்கு அனுப்பப்படும். உங்களுக்கு ஒரு நகல் கிடைக்கும். முதலில் கவனமாக படிக்கவும்.",
    "email.toLabel": "பெறுநர்",
    "email.ccLabel": "நகல்",
    "email.subjectLabel": "பொருள்",
    "email.subjectLineSingle": "Legal Complaint - Illegal Clause in Agreement - {district}",
    "email.subjectLineBulk": "Legal Complaint - Illegal Clauses in Agreement - {district}",
    "email.send": "இந்த மின்னஞ்சலை அனுப்பு",
    "email.downloadSelf": "பதிவிறக்கி நீங்களே அனுப்பவும்",
    "email.sending": "DLSA-வுக்கு புகார் அனுப்பப்படுகிறது...",
    "email.disclaimer": "7 வேலை நாட்களுக்குள் பதில் வரவில்லை என்றால், tnsla.tn.gov.in-இல் DLSA மின்னஞ்சல் முகவரிகளை சரிபார்க்கவும். இலவச உதவி எண்: 15100.",
    "email.note": "இந்த புகார் மின்னஞ்சல் எப்போதும் ஆங்கிலத்தில் அனுப்பப்படும், ஏனெனில் இது ஒரு அரசு அலுவலகத்திற்கு செல்கிறது. மற்ற அனைத்தும் உங்கள் மொழி அமைப்பைப் பின்பற்றும்.",

    "confirm.sentTitle": "புகார் அனுப்பப்பட்டது",
    "confirm.failedTitle": "தானாக அனுப்ப முடியவில்லை",
    "confirm.sentTo": "அனுப்பப்பட்டது: {v}",
    "confirm.ccTo": "நகல் அனுப்பப்பட்டது: {v}",
    "confirm.eta": "எதிர்பார்க்கப்படும் பதில் நேரம் 3 முதல் 7 வேலை நாட்கள்.",
    "confirm.unknownError": "அறியப்படாத பிழை.",
    "confirm.sendManually": "புகாரை பதிவிறக்கி நீங்களே அனுப்பவும்.",
    "confirm.downloadLetter": "புகார் கடிதத்தை பதிவிறக்கு",
    "confirm.officeDetails": "DLSA அலுவலக விவரங்கள்",
    "confirm.address": "முகவரி: {v}",
    "confirm.phone": "தொலைபேசி: {v}",
    "confirm.email": "மின்னஞ்சல்: {v}",
    "confirm.helpline": "இலவச சட்ட உதவி எண்: 15100 (தமிழ்நாடு முழுவதும் கிடைக்கும்)",
    "confirm.website": "இணையதளம்: tnsla.tn.gov.in",
    "confirm.another": "மற்றொரு விதியை சரிபார்",
    "confirm.disclaimer": "இந்தக் கருவி சட்ட ஆலோசகருக்கு மாற்றாக இல்லை. அவசர நிலைமைகளுக்கு, உடனடியாக 15100-ஐ அழைக்கவும்.",
  },
};

function currentLang() {
  return localStorage.getItem("lang") || "en";
}

// t("key") -> string in the current language.
// t("key", {name: value}) -> replaces {name} placeholders in the string.
// Falls back en -> raw key, so a missing translation never renders blank.
function t(key, vars) {
  const dict = LANG_DICT[currentLang()] || LANG_DICT.en;
  let str = dict[key] ?? LANG_DICT.en[key] ?? key;
  if (vars) {
    for (const k in vars) {
      str = str.replaceAll(`{${k}}`, vars[k]);
    }
  }
  return str;
}

(function () {
  const button = document.getElementById("langToggle");

  function updateLabel() {
    // Button always shows the *other* language's name, in that language's
    // own script — "தமிழ்" while in English mode, "English" while in Tamil
    // mode — same convention as most Indian government/bank apps.
    button.textContent = currentLang() === "ta" ? "English" : "தமிழ்";

    const tagline = document.getElementById("brandTagline");
    if (tagline) tagline.textContent = t("brand.tagline");
  }

  button.addEventListener("click", () => {
    const next = currentLang() === "ta" ? "en" : "ta";
    localStorage.setItem("lang", next);
    updateLabel();
    // app.js's render() redraws the current screen with the new dictionary.
    // Guarded because lang.js loads before app.js defines it.
    if (typeof render === "function") render();
  });

  updateLabel();
})();