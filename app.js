// Petrokima phone app — all its code (moved out of index.html on 30 Oct 2026: the security policy forbids code inside pages).
// The SAME file ships in the Android app (native-app/web/app.js). Keep the ?v= in index.html equal to VERSION in sw.js.
// ═════════════════════════════════════════════════════════
//  CONFIGURATION — the only lines to fill in before publishing
// ═════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://hckkrzghxxhauotyqlqr.supabase.co';
const SUPABASE_KEY = 'PASTE-YOUR-ANON-KEY-HERE';
const LOGIN_DOMAIN = 'petrokima.local';
const APP_BUILD = 0;            // set automatically by the Android / iPhone build — 0 on the web
// ═════════════════════════════════════════════════════════
//  ERROR REPORTING (30 Oct 2026) — keep IDENTICAL in desktop/src/part0err.js and mobile/index.html (checked automatically)
//  Unexpected errors on staff PCs and phones are reported to Sentry (EU), the standard error-monitoring service, through
//  our Supabase function error-report (it adds the real Sentry address; until Mohammed sets it, reports are dropped).
//  No personal data: no names, no e-mails, no ID numbers, no typed text, no page content; web addresses without their
//  query part; the login is sent only as its internal number (UUID) and role. Off when the library is missing (on-prem copy).
// ═════════════════════════════════════════════════════════
const PK_ERR = (function(){
  const lib = window.Sentry, off = { user(){}, capture(){} };
  if (!lib || typeof lib.init !== 'function' || !/^https:$/.test(location.protocol) && location.hostname !== 'localhost') return off;
  const scrub = s => typeof s !== 'string' ? s : s
    .replace(/\b[23]\d{13}\b/g, '[id]').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, '[token]').replace(/sb_(publishable|secret)_[\w-]+/g, '[key]');
  const bare = u => { try { const x = new URL(u, location.href); return x.origin + x.pathname; } catch(e){ return ''; } };
  try {
    lib.init({
      dsn: 'https://public@o0.ingest.sentry.io/0',                       // placeholder — the real address is added by error-report
      tunnel: 'https://hckkrzghxxhauotyqlqr.supabase.co/functions/v1/error-report',
      release: typeof APP_BUILD !== 'undefined' ? 'pk-phone@' + (APP_BUILD ? 'android-' + APP_BUILD : 'web') : 'pk-desktop@web',
      environment: location.hostname === 'localhost' ? 'android-app' : location.hostname,
      sendDefaultPii: false, maxBreadcrumbs: 30, attachStacktrace: true,
      beforeBreadcrumb(b){
        if (b.category === 'console' || b.category === 'ui.input') return null;          // never what people type or logs
        if (b.data){ if (b.data.url) b.data.url = bare(b.data.url); if (b.data.from) b.data.from = bare(b.data.from); if (b.data.to) b.data.to = bare(b.data.to); }
        if (b.message) b.message = scrub(b.message);
        return b;
      },
      beforeSend(e){
        if (e.request){ e.request = { url: bare(e.request.url || '') }; }
        if (e.message) e.message = scrub(e.message);
        (e.exception && e.exception.values || []).forEach(v => { v.value = scrub(v.value); });
        if (e.user) e.user = { id: e.user.id };
        delete e.extra;
        return e;
      }
    });
  } catch(e){ return off; }
  // a page part blocked by the browser security policy is reported too (once per kind), so a blocked feature is noticed at once
  const seenCsp = new Set();
  document.addEventListener('securitypolicyviolation', ev => {
    const k = ev.violatedDirective + ' ' + bare(ev.blockedURI || 'inline'); if (seenCsp.has(k) || seenCsp.size > 20) return; seenCsp.add(k);
    try { lib.withScope(s => { s.setTag('where', 'security-policy'); s.setLevel('warning'); lib.captureMessage('Blocked by the security policy: ' + k); }); } catch(e){}
  });
  return {
    user(u){ try { lib.setUser(u && u.id ? { id: u.id } : null); lib.setTag('role', (u && u.role) || 'none'); } catch(e){} },
    capture(err, where){ try { lib.withScope(s => { if (where) s.setTag('where', String(where)); lib.captureException(err); }); } catch(e){} }
  };
})();
/** @type {string} */
const APK_REPO  = '';           // GitHub repository that publishes the Android app (owner/name)
/** @type {string} */
const APK_DOWNLOAD = '';        // your own download address for the Android app (set by the build) — empty = GitHub's link
// Running inside the Android or iPhone app?
const NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
const PLATFORM = NATIVE ? window.Capacitor.getPlatform() : 'web';
const nativePlugin = name => (NATIVE && window.Capacitor.registerPlugin) ? (window.Capacitor.Plugins[name] || window.Capacitor.registerPlugin(name)) : null;

// ═════════════════════════════════════════════════════════
//  LANGUAGE (Arabic / English)
// ═════════════════════════════════════════════════════════
const T = {
 en:{appName:'Petrokima',loginSub:'Attendance & HR requests',empCode:'Employee code',password:'Password',signIn:'Sign in',forgot:'Forgot your password? Ask HR to reset it.',
  wrongLogin:'Wrong employee code or password.',fillLogin:'Enter your employee code and password.',
  firstTitle:'Welcome',firstSub:'This is your first sign-in. Confirm who you are and choose your own password.',nid4:'Last 4 digits of your national ID',
  newPass:'New password (at least 8 characters)',repeatPass:'Repeat the new password',savePass:'Save my password',signOut:'Sign out',docTitle:'📄 Documents HR asked for',docNid:'Your renewed national ID card',docAttach:'📎 Attach a photo of the new card',docExpiry:'Expiry date written on the NEW card',docSend:'Send to HR',docSent:'Sent to HR ✓ — waiting for review',docAccepted:'Received by HR ✓',docReturned:'Returned by HR — please send again',docNeedFile:'Attach the photo first',docNeedDate:'Enter the expiry date of the new card',docTooBig:'The file is too large (max 10 MB)',docUploading:'Sending…',docAnswer:'Answer',pushWhy:'Get a notification when your request is decided, a new announcement is published, or a request is waiting for you.',pushOnBtn:'🔔 Turn on notifications',pushDone:'Notifications are on ✓',pushBlocked:'Notifications are turned off for Petrokima. To allow them: iPhone Settings → Notifications → Petrokima → Allow Notifications.',pushNotReady:'Notifications are being prepared — please try again in a minute.',
  need4:'Enter the last 4 digits of your national ID.',short:'The password must be at least 8 characters.',nomatch:'The two passwords do not match.',sameTemp:'Choose a password different from the temporary one.',
  nidWrong:'The national ID digits do not match HR records.',locked:'Your account is locked. Ask HR to reset it.',passSet:'Password saved — welcome!',
  noRole:'This account has no access yet. Please contact HR.',notLinked:'This account is not linked to an employee record.',inactive:'This account is locked or deactivated. Please contact HR.',
  offline:'No internet — check-ins are saved on your phone and sent later; requests need a connection',
  home:'Attendance',requests:'Requests',payslips:'Payslips',profile:'Profile',
  notIn:'You are not checked in.',checkedIn:'Checked in at',since:'since',hSince:'for',checkIn:'Check in',checkOut:'Check out',switchSite:'Switch site',
  openFrom:'You checked in on {d} at {t} and have not checked out yet.',
  locNote:'Your time comes from the company server. Your location is recorded with each check-in.',
  today:'Today',noToday:'Nothing recorded today yet.',openLine:'still on site',noOut:'no check-out',hraTitle:'HR alerts',hraNoteHR:'Contracts, probation, IDs, certificates and disability cards that need attention. Renewing a contract is done on the desktop.',hraNoteMgr:'Your team: contracts and probation periods ending soon. Give your recommendation — HR decides.',hraNone:'Nothing needs attention',hk_contract:'Contract ends',hk_probation:'Probation ends',hk_id:'National ID expires',hk_cert:'Certificate expires',hk_disability:'Disability card expires',hraIn:'in {n} days',hraAgo:'{n} days ago',hraToday:'today',hraDone:'Done',hraNoteL:'Note (optional)',hraSaved:'Saved',hraMgr:'Manager',hraHR:'HR',dec_seen:'Seen',dec_renew:'Recommend renewal',dec_not_renew:'Do not renew',dec_confirm:'Confirm',dec_not_confirm:'Do not confirm',tooEarlyErr:'You can request annual or emergency leave from {d} (after {m} months of service). Ask HR if you need an exception.',emergLimitErr:'Emergency leave allowed this year: {cap} days — you have already used or requested {used}.',emergLeft:'Emergency leave left this year',leaveFrom:'Annual and emergency leave can be requested from {d}',totalToday:'Total today',hours:'h',mins:'m',
  thisCycle:'This payroll month',noMonth:'No attendance recorded this payroll month.',
  whereWork:'Where are you working?',recent:'Recent sites',searchSite:'Type the site code or name',typeMore:'Type at least 2 letters or numbers',noSites:'No site found',
  confirmIn:'Check in at',gettingLoc:'Getting your location…',noLoc:'Location not available — saved without it',
  doneIn:'Checked in ✓',doneOut:'Checked out ✓',doneSwitch:'Site changed ✓',confirmOut:'Check out now?',yes:'Yes',cancel:'Cancel',
  alreadyIn:'You are already checked in at this site.',notInErr:'You are not checked in.',lockedPeriod:'This payroll month is approved and locked. Contact HR.',
  annualLeft:'Annual leave left',permsUsed:'Permissions this month',openReq:'Waiting for HR',
  reqLeave:'Request vacation',reqPerm:'Late arrival / early leave',reqOther:'Other HR request',myRequests:'My requests',noRequests:'You have not made any requests yet.',
  cancelReq:'Cancel',cancelQ:'Cancel this request?',cancelled:'Request cancelled',cantCancel:'This request can no longer be cancelled.',
  type:'Type',from:'From',to:'To',days:'Working days',reason:'Reason',date:'Date',hoursL:'Hours',details:'Details',send:'Send request',sent:'Request sent to HR ✓',
  wd:'{c} calendar days · {w} working days (weekends and holidays not counted)',balAfter:'Annual balance after this request',over:'More than your balance — HR may reject it',
  overlap:'These dates overlap another vacation of yours.',past:'These dates are in the past — HR will review them.',unpaidNote:'Unpaid leave is deducted from your salary.',sickNote:'Keep your medical report — HR may ask for it.',
  noDays:'The request has no working days — check the dates.',toBefore:'“To” is before “From”.',
  permCycle:'Payroll month {p}: {u} of {l} permissions approved',permFull:'You have used all permissions for this month — the request would be rejected.',
  hoursRange:'Hours must be between 0.25 and {m}.',dupPerm:'You already have this request for that date.',needDetails:'Please add the details HR will need.',
  noSlips:'No approved payslips yet. They appear here once payroll is approved.',gross:'Gross',ded:'Deductions',net:'Net pay',additions:'Additions',deductions:'Deductions',approvedSlip:'Approved payslip',
  code:'Employee code',job:'Job',dept:'Department',unit:'Unit',manager:'Direct manager',hired:'Employment date',mobile:'Mobile',email:'Email',entity:'Company',nidL:'National ID',
  changePass:'Change password',passChanged:'Password changed ✓',install:'Install the app',installAndroid:'Add Petrokima to your home screen for one-tap access.',installBtn:'Install',
  installIos:'On iPhone: tap the Share button, then “Add to Home Screen”.',
  androidUseApp:'On Android phones, Petrokima works only in the Petrokima app — not in the internet browser.\n\nDownload and install the app, then sign in there with your employee code and password.',
  androidGetApp:'Download the Petrokima app',configMissing:'The app is not configured yet. The administrator must add the Supabase key.',
  st:{Pending:'Pending',Approved:'Approved',Rejected:'Rejected',Cancelled:'Cancelled','In progress':'In progress',Completed:'Completed','Waiting for manager':'Waiting for your manager','Waiting for HR':'Manager approved — waiting for HR'},
  lt:{Annual:'Annual',Casual:'Casual',Sick:'Sick',Unpaid:'Unpaid','Other paid':'Other paid'},
  pt:{'Late arrival':'Late arrival','Early leave':'Early leave'},
  ht:{'HR letter':'HR letter','Salary certificate':'Salary certificate','Experience certificate':'Experience certificate','Update my personal data':'Update my personal data','Payslip copy':'Payslip copy','Loan request':'Loan request','Other':'Other'},
  leaveTitle:'{t} leave',attempts:'({n} attempts left)',langBtn:'العربية',
  noProject:'No project',inNoProject:'Check in without a project',inSite:'Check in at a site',orSite:'Or choose a site',
  installTitle:'Install the app first',installText:'For security, Petrokima must be installed on your home screen before you sign in.',
  iosSteps:'1. Tap the Share button ⬆︎ at the bottom of Safari\n2. Choose “Add to Home Screen”\n3. Open Petrokima from your home screen and sign in',
  otherDevice:'Your employee code is registered to another phone. If you changed your phone, ask HR to reset your registered phone.',
  deviceTaken:'This phone is already registered to another employee. Each phone can be used by one employee only.',
  attemptLogged:'This attempt has been recorded and HR has been notified.',
  deviceMismatch:'This phone is not the phone registered to your employee code. Contact HR.',
  mockLoc:'A fake-location app is active on this phone. Turn it off (and remove it from Developer options → Select mock location app), then try again.',
  outsideSite:'You are about {d} from {site}. Check in when you arrive at the site.',
  outsideSiteOut:'You are about {d} from {site}. Check-out is only allowed there — if you have already left, ask HR to add your check-out.',
  spTitle:"Set a site's location",spHint:'HR has allowed you to save project locations. Stand at the site (in the open, not deep inside a building) and save it.',
  spBtn:"Set a site's location",spPickHint:'Choose the project you are standing at now.',spHas:'Has a location — set by {by} on {d}',spNone:'No location yet',
  spSaveHere:'📍 Save my current location for this site',spReplace:'This project already has a location (set by {by} on {d}). Saving replaces it.',
  spNote:'Note (optional, e.g. main gate)',spGetting:'Getting an accurate location…',spSaved:'Location of {site} saved (±{acc} m). HR has been told.',
  spAccuracy:'Your location is only accurate to ±{n} m (needed: {max} m or better). Go outside, wait a few seconds and try again.',
  spNotAllowed:'HR has not given you the right to set site locations.',
  appRequired:'Please check in with the Petrokima app, not the internet browser. Download it from download.petrokima-hr.com',
  updateRequired:'Your Petrokima app is out of date. Install the new version (download.petrokima-hr.com), then check in again.',
  badDevice:'This phone could not be identified. Close the app and open it again.',
  phoneReg:'Registered phone',thisPhone:'This phone is registered to you',back:'Back',
  locTitle:'Location is required',locDenied:'Check-in needs your location, and this phone is not sharing it with Petrokima.',
  locIos:'iPhone — check both:\n1. Settings → Privacy & Security → Location Services → ON → “Safari Websites” → “While Using the App”.\n2. Settings → Apps → Safari → Settings for Websites → Location → set app.petrokima-hr.com (and “Other Websites”) to Allow or Ask.\nThen close Petrokima completely (swipe it away) and open it again. Still blocked? Ask HR — the app may need to be added to the home screen again.',
  locAndroid:'Android: open the phone Settings → Location → turn it ON. Then in Chrome tap ⋮ → Settings → Site settings → Location → allow this site (or long-press the Petrokima icon → App info → Permissions → Location → Allow).',
  locTimeout:'Your location could not be found. Move near a window or outside, wait a few seconds and try again.',tryAgain:'Try again',
  queued:'Saved on your phone ✓ — it will be sent automatically as soon as the connection works',sending:'Sending…',
  serverDown:'The server cannot be reached right now. Please try again in a few minutes.',
  waiting:'{n} check-in(s) saved on this phone, waiting for internet',waitingOne:'waiting to send',
  sentNow:'{n} saved check-in(s) sent ✓',notRecorded:'A saved check-in could not be recorded — see the details on the home screen',
  failedItem:'Not recorded',discard:'Discard',discardQ:'Discard this saved check-in? HR will need to record it manually.',sendNow:'Send now',
  tooOld:'More than 72 hours old — HR must record it.',wrongOrder:'Earlier than a check-in already recorded — HR must review it.',
  offlineMode:'Offline — showing the last saved information',offlineSites:'No internet: choose a recent site or search the saved list',
  noCache:'No internet connection. Connect once to sign in.',
  approvals:'Approvals',teamReqTitle:'Vacation and permission requests from your team',noTeamReq:'No requests from your team',salLine:'💼 Basic salary — {emp}',salFromTo:'{cur} → {new} EGP from {d}',salBy:'Requested by {by}',offlineList:'No internet — searching the saved project list',noSiteCache:'No internet and no saved project list yet — open the app once with internet',reqElement:'Request a variable element',element:'Element',reqType:'By',byAmount:'Amount (EGP)',byDays:'Days',byHours:'Hours',elLine:'💰 {el} — {emp}: {q} {u}',anonymous:'Anonymous',sendAnon:'Send anonymously — HR and the board member will not see your name',anonMine:'🕶 Sent anonymously',
  reqPenalty:'Request a penalty',reqIncentive:'Request an incentive',employee:'Employee',penType:'Penalty type',penAmount:'Fixed amount (EGP)',penHours:'Hours of pay',penDays:'Days of pay',
  quantity:'Quantity',incAmount:'Incentive amount (EGP)',payMonth:'Payroll month',incDate:'Date of the incident',needReason:'Choose the employee, enter the quantity and write the reason',
  actFlow:'Goes to the board member for approval, then HR.',penLine:'⚖️ Penalty — {emp}: {q} {u}',incLine:'🏅 Incentive — {emp}: {q} EGP',u_Amount:'EGP',u_Hours:'hour(s)',u_Days:'day(s)',
  boardTitle:'⚖️ Penalties & incentives — your approval',noBoard:'Nothing waiting for your approval',
  approve:'Approve',reject:'Reject',noteOpt:'Note (optional)',reqBy:'Requested by',stWB:'Waiting for board member',stWHR:'Waiting for HR',
  agreeClose:'✔ Agree to close',closeNote:'Closing note (optional)',closedBoth:'Closed by HR and you',waitHrClose:'You agreed — waiting for HR to confirm',waitMgrClose:'HR wants to close it — confirm if you agree',news:'News',newsTitle:'Announcements & decisions',noNews:'No announcements yet',annKind:'Announcement',decKind:'Administrative decision',openAtt:'Open attachment',
  bday:'Petrokima family wishes you a happy birthday 🎉',bdaySub:'Wishing you a wonderful year ahead.',
  complaint:'Complaint',suggestion:'Suggestion',fbNote:'Seen only by HR and the board member.',subject:'Subject',myFeedback:'My complaints & suggestions',noFeedback:'Nothing sent yet',
  fbSent:'Sent to HR and the board member ✓',needSubject:'Write a subject and the details',reply:'Reply',
  hrReqTitle:'Requests to HR',reqHire:'Request new employees',reqTrain:'Request training',howMany:'Number of employees',jobName:'Job name',jobDesc:'Job description',
  neededBy:'Needed by (optional)',notes:'Notes (optional)',needJob:'Job name and job description are required',topic:'Training topic',whoTrain:'Who needs the training',
  prefDate:'Preferred date (optional)',needTrain:'Choose at least one employee and write the training topic',sentHR:'Sent to HR ✓',noMgrReq:'No requests sent yet',
  hireLine:'{n} × {job}',trainLine:'{topic} — {n} employee(s)',inboxTitle:'📥 Complaints & suggestions',noInbox:'Nothing received',status:'Status',saveReply:'Save',birthYear:'Your year of birth',yearWrong:'The year of birth does not match our records ({n} left).',acctLockedYear:'Too many wrong answers — your account is locked. Ask HR to reset it.',needYear:'Enter the year you were born (4 digits, e.g. 1988).',firstHint:'First time? Use the temporary password HR gave you. If your account is locked, contact HR.',
  payLockTitle:'Your payslips are protected',payLockSub:'Enter your password to view them.',payUnlock:'Show my payslips',payWrongPass:'Wrong password',payNeedNet:'Connect to the internet to view your payslips.',payLock:'🔒 Lock',
  firstMustChange:'Choose your own password now. It must be at least 8 characters and different from your first password.',myProjects:'Your projects',notAllowed:'You are not allowed to do this.',filterProj:'Filter your projects…',notAssigned:'You are not assigned to this project. Ask your direct manager to add it.',
  teamProj:'Your team\'s projects',teamProjNote:'Employees with projects can check in only at those projects. Your changes apply immediately.',manage:'Manage',
  projectsN:'{n} project(s)',noProjAssigned:'No projects — can check in at any project',addProject:'Add a project — type code or name…',projAdded:'Project added ✓',projRemoved:'Project removed',
  removeProjQ:'Remove this project from {name}?',sentMgr:'Request sent to your direct manager ✓',
  sentAt:'Sent',lateRule:'Late arrival must be requested before {time} on the same day.',
  leaveRules:'Annual leave: request at least {n} day(s) before it starts. Emergency (casual) leave: the same day is fine.',
  lateReqErr:'Too late — a late-arrival permission must be requested before {time} on that day.',
  annualNoticeErr:'Annual leave must be requested at least {n} day(s) before it starts. For today, choose emergency (casual) leave.',
  pastDateErr:'Emergency leave can be requested for today or a later day, not for past days.',mgrNote:'Your note',
  approvedFinal:'Approved ✓',teamTitle:'Project Allowance for your team',teamNote:'Calculated from their attendance at projects. Nothing is paid until you approve and HR then approves.',
  rejectWhy:'Reason for rejecting',removeProj:'Remove this project',removeWhy:'Reason for removing (required)',needWhy:'Write the reason (at least 3 characters)',approvedMsg:'Approved — sent to HR ✓',rejectedMsg:'Rejected',noTeam:'Nothing to approve',
  aaWait:'Waiting for you',aaHR:'Approved by you — waiting for HR',aaOk:'Approved — will be paid',aaNo:'Rejected',day:'day',daysW:'days',at:'at',
  locAppAndroid:'Android: open the phone Settings → Apps → Petrokima → Permissions → Location → “Allow only while using the app”. Also make sure Location is switched ON in the quick settings.',
  locAppIos:'iPhone: open Settings → Petrokima → Location → “While Using the App”, and switch Precise Location on.',
  updateAvail:'A new version of the app is available',updateBtn:'Download update',
  refresh:'Refresh',refreshed:'Up to date ✓',updated:'Updated {t}',pull:'Pull down to refresh',release:'Release to refresh',refreshing:'Refreshing…'},
 ar:{appName:'بتروكيما',loginSub:'الحضور وطلبات الموارد البشرية',empCode:'كود الموظف',password:'كلمة المرور',signIn:'تسجيل الدخول',forgot:'نسيت كلمة المرور؟ اطلب من الموارد البشرية إعادة تعيينها.',
  wrongLogin:'كود الموظف أو كلمة المرور غير صحيحة.',fillLogin:'أدخل كود الموظف وكلمة المرور.',
  firstTitle:'مرحباً بك',firstSub:'هذا أول تسجيل دخول لك. أكّد هويتك واختر كلمة مرور خاصة بك.',nid4:'آخر ٤ أرقام من الرقم القومي',
  newPass:'كلمة المرور الجديدة (٨ أحرف على الأقل)',repeatPass:'أعد كتابة كلمة المرور الجديدة',savePass:'حفظ كلمة المرور',signOut:'تسجيل الخروج',docTitle:'📄 مستندات تطلبها الموارد البشرية',docNid:'بطاقة الرقم القومي الجديدة',docAttach:'📎 أرفق صورة البطاقة الجديدة',docExpiry:'تاريخ الانتهاء المكتوب على البطاقة الجديدة',docSend:'إرسال إلى الموارد البشرية',docSent:'تم الإرسال ✓ — في انتظار المراجعة',docAccepted:'استلمتها الموارد البشرية ✓',docReturned:'أعادتها الموارد البشرية — يرجى الإرسال مرة أخرى',docNeedFile:'أرفق الصورة أولاً',docNeedDate:'اكتب تاريخ انتهاء البطاقة الجديدة',docTooBig:'الملف كبير جداً (الحد ١٠ ميجابايت)',docUploading:'جارٍ الإرسال…',docAnswer:'رد',pushWhy:'استقبل إشعاراً عند البت في طلبك أو نشر إعلان جديد أو عند وجود طلب ينتظرك.',pushOnBtn:'🔔 تفعيل الإشعارات',pushDone:'تم تفعيل الإشعارات ✓',pushBlocked:'الإشعارات مغلقة لتطبيق بتروكيما. للسماح بها: الإعدادات ← الإشعارات ← Petrokima ← السماح بالإشعارات.',pushNotReady:'جارٍ تجهيز الإشعارات — يرجى المحاولة بعد دقيقة.',
  need4:'أدخل آخر ٤ أرقام من الرقم القومي.',short:'يجب ألا تقل كلمة المرور عن ٨ أحرف.',nomatch:'كلمتا المرور غير متطابقتين.',sameTemp:'اختر كلمة مرور مختلفة عن كلمة المرور المؤقتة.',
  nidWrong:'أرقام الرقم القومي لا تطابق سجلات الموارد البشرية.',locked:'تم قفل حسابك. اطلب من الموارد البشرية إعادة تعيينه.',passSet:'تم حفظ كلمة المرور — مرحباً بك!',
  noRole:'هذا الحساب ليس له صلاحية بعد. يرجى التواصل مع الموارد البشرية.',notLinked:'هذا الحساب غير مرتبط بملف موظف.',inactive:'هذا الحساب مقفل أو موقوف. يرجى التواصل مع الموارد البشرية.',
  offline:'لا يوجد إنترنت — يتم حفظ تسجيلات الحضور على هاتفك وإرسالها لاحقاً، والطلبات تحتاج إلى اتصال',
  home:'الحضور',requests:'الطلبات',payslips:'الرواتب',profile:'حسابي',
  notIn:'لم تسجّل حضورك بعد.',checkedIn:'مسجّل حضور في',since:'منذ',hSince:'مدة',checkIn:'تسجيل حضور',checkOut:'تسجيل انصراف',switchSite:'تغيير الموقع',
  openFrom:'سجّلت حضورك يوم {d} الساعة {t} ولم تسجّل الانصراف بعد.',
  locNote:'الوقت يُؤخذ من خادم الشركة، ويتم تسجيل موقعك مع كل تسجيل حضور.',
  today:'اليوم',noToday:'لم يُسجَّل شيء اليوم بعد.',openLine:'ما زال في الموقع',noOut:'لم يُسجَّل انصراف',hraTitle:'تنبيهات الموارد البشرية',hraNoteHR:'العقود وفترات الاختبار والبطاقات الشخصية والشهادات وبطاقات ذوي الإعاقة التي تحتاج إلى متابعة. تجديد العقد يتم من برنامج الكمبيوتر.',hraNoteMgr:'فريقك: عقود وفترات اختبار تنتهي قريباً. أبدِ توصيتك — والقرار للموارد البشرية.',hraNone:'لا يوجد ما يحتاج إلى متابعة',hk_contract:'انتهاء العقد',hk_probation:'انتهاء فترة الاختبار',hk_id:'انتهاء البطاقة الشخصية',hk_cert:'انتهاء شهادة',hk_disability:'انتهاء بطاقة ذوي الإعاقة',hraIn:'بعد {n} يوم',hraAgo:'منذ {n} يوم',hraToday:'اليوم',hraDone:'تم',hraNoteL:'ملاحظة (اختياري)',hraSaved:'تم الحفظ',hraMgr:'المدير',hraHR:'الموارد البشرية',dec_seen:'تم الاطلاع',dec_renew:'أوصي بالتجديد',dec_not_renew:'لا أوصي بالتجديد',dec_confirm:'تثبيت',dec_not_confirm:'عدم التثبيت',tooEarlyErr:'يمكنك طلب إجازة سنوية أو عارضة اعتباراً من {d} (بعد {m} أشهر من تاريخ التعيين). تواصل مع الموارد البشرية إذا احتجت استثناءً.',emergLimitErr:'المسموح من الإجازة العارضة هذا العام: {cap} يوم — استخدمت أو طلبت {used} يوم.',emergLeft:'المتبقي من الإجازة العارضة هذا العام',leaveFrom:'يمكن طلب الإجازة السنوية والعارضة اعتباراً من {d}',totalToday:'إجمالي اليوم',hours:'س',mins:'د',
  thisCycle:'شهر الرواتب الحالي',noMonth:'لا يوجد حضور مسجل في شهر الرواتب الحالي.',
  whereWork:'أين تعمل الآن؟',recent:'المواقع الأخيرة',searchSite:'اكتب كود أو اسم الموقع',typeMore:'اكتب حرفين أو رقمين على الأقل',noSites:'لم يتم العثور على موقع',
  confirmIn:'تسجيل الحضور في',gettingLoc:'جارٍ تحديد موقعك…',noLoc:'تعذّر تحديد الموقع — تم الحفظ بدونه',
  doneIn:'تم تسجيل الحضور ✓',doneOut:'تم تسجيل الانصراف ✓',doneSwitch:'تم تغيير الموقع ✓',confirmOut:'تسجيل الانصراف الآن؟',yes:'نعم',cancel:'إلغاء',
  alreadyIn:'أنت مسجّل حضور في هذا الموقع بالفعل.',notInErr:'أنت غير مسجّل حضور.',lockedPeriod:'تم اعتماد وقفل رواتب هذا الشهر. تواصل مع الموارد البشرية.',
  annualLeft:'رصيد الإجازة السنوية',permsUsed:'الأذونات هذا الشهر',openReq:'قيد المراجعة',
  reqLeave:'طلب إجازة',reqPerm:'إذن تأخير / انصراف مبكر',reqOther:'طلب آخر من الموارد البشرية',myRequests:'طلباتي',noRequests:'لم تقدّم أي طلبات بعد.',
  cancelReq:'إلغاء',cancelQ:'هل تريد إلغاء هذا الطلب؟',cancelled:'تم إلغاء الطلب',cantCancel:'لم يعد بالإمكان إلغاء هذا الطلب.',
  type:'النوع',from:'من',to:'إلى',days:'أيام العمل',reason:'السبب',date:'التاريخ',hoursL:'عدد الساعات',details:'التفاصيل',send:'إرسال الطلب',sent:'تم إرسال الطلب إلى الموارد البشرية ✓',
  wd:'{c} يوم تقويمي · {w} يوم عمل (لا تُحتسب العطلات الأسبوعية والرسمية)',balAfter:'رصيد الإجازة السنوية بعد هذا الطلب',over:'أكثر من رصيدك — قد يتم رفض الطلب',
  overlap:'هذه التواريخ تتداخل مع إجازة أخرى لك.',past:'هذه التواريخ في الماضي — ستراجعها الموارد البشرية.',unpaidNote:'الإجازة بدون أجر تُخصم من راتبك.',sickNote:'احتفظ بالتقرير الطبي — قد تطلبه الموارد البشرية.',
  noDays:'لا توجد أيام عمل في هذا الطلب — راجع التواريخ.',toBefore:'تاريخ «إلى» قبل تاريخ «من».',
  permCycle:'شهر الرواتب {p}: تم اعتماد {u} من {l} أذونات',permFull:'استخدمت كل الأذونات المتاحة هذا الشهر — سيتم رفض الطلب.',
  hoursRange:'يجب أن يكون عدد الساعات بين ٠٫٢٥ و{m}.',dupPerm:'لديك نفس الطلب لهذا التاريخ بالفعل.',needDetails:'يرجى كتابة التفاصيل التي تحتاجها الموارد البشرية.',
  noSlips:'لا توجد قسائم رواتب معتمدة بعد. ستظهر هنا بعد اعتماد الرواتب.',gross:'الإجمالي',ded:'الاستقطاعات',net:'صافي الراتب',additions:'الإضافات',deductions:'الاستقطاعات',approvedSlip:'قسيمة راتب معتمدة',
  code:'كود الموظف',job:'الوظيفة',dept:'الإدارة',unit:'الوحدة',manager:'المدير المباشر',hired:'تاريخ التعيين',mobile:'الموبايل',email:'البريد الإلكتروني',entity:'الشركة',nidL:'الرقم القومي',
  changePass:'تغيير كلمة المرور',passChanged:'تم تغيير كلمة المرور ✓',install:'تثبيت التطبيق',installAndroid:'أضف تطبيق بتروكيما إلى الشاشة الرئيسية لفتحه بضغطة واحدة.',installBtn:'تثبيت',
  installIos:'على الآيفون: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».',
  androidUseApp:'على هواتف أندرويد يعمل نظام بتروكيما من خلال تطبيق بتروكيما فقط — وليس من متصفح الإنترنت.\n\nحمّل التطبيق وثبّته، ثم سجّل الدخول فيه بكود الموظف وكلمة المرور.',
  androidGetApp:'تحميل تطبيق بتروكيما',configMissing:'التطبيق غير مُعدّ بعد. يجب على المسؤول إضافة مفتاح Supabase.',
  st:{Pending:'قيد المراجعة',Approved:'مقبول',Rejected:'مرفوض',Cancelled:'ملغي','In progress':'جارٍ التنفيذ',Completed:'تم','Waiting for manager':'في انتظار مديرك المباشر','Waiting for HR':'وافق المدير — في انتظار الموارد البشرية'},
  lt:{Annual:'سنوية',Casual:'عارضة',Sick:'مرضية',Unpaid:'بدون أجر','Other paid':'أخرى مدفوعة'},
  pt:{'Late arrival':'تأخير صباحي','Early leave':'انصراف مبكر'},
  ht:{'HR letter':'خطاب من الموارد البشرية','Salary certificate':'شهادة راتب','Experience certificate':'شهادة خبرة','Update my personal data':'تحديث بياناتي الشخصية','Payslip copy':'نسخة قسيمة راتب','Loan request':'طلب سلفة','Other':'أخرى'},
  leaveTitle:'إجازة {t}',attempts:'(متبقي {n} محاولات)',langBtn:'English',
  noProject:'بدون مشروع',inNoProject:'تسجيل حضور بدون مشروع',inSite:'تسجيل حضور في مشروع',orSite:'أو اختر موقعاً',
  installTitle:'ثبّت التطبيق أولاً',installText:'لأسباب أمنية، يجب تثبيت تطبيق بتروكيما على الشاشة الرئيسية قبل تسجيل الدخول.',
  iosSteps:'١. اضغط زر المشاركة ⬆︎ أسفل متصفح سفاري\n٢. اختر «إضافة إلى الشاشة الرئيسية»\n٣. افتح بتروكيما من الشاشة الرئيسية وسجّل الدخول',
  otherDevice:'كود الموظف الخاص بك مسجّل على هاتف آخر. إذا غيّرت هاتفك، اطلب من الموارد البشرية إعادة تعيين الهاتف المسجّل.',
  deviceTaken:'هذا الهاتف مسجّل بالفعل لموظف آخر. كل هاتف يُستخدم لموظف واحد فقط.',
  attemptLogged:'تم تسجيل هذه المحاولة وإبلاغ الموارد البشرية.',
  deviceMismatch:'هذا الهاتف ليس الهاتف المسجّل لكود الموظف الخاص بك. تواصل مع الموارد البشرية.',
  mockLoc:'يوجد تطبيق لتزييف الموقع يعمل على هذا الهاتف. أوقفه (واحذفه من خيارات المطوّر ← تطبيق الموقع الوهمي) ثم حاول مرة أخرى.',
  outsideSite:'أنت على بعد حوالي {d} من {site}. سجّل الحضور عند وصولك إلى الموقع.',
  outsideSiteOut:'أنت على بعد حوالي {d} من {site}. لا يُسمح بتسجيل الانصراف إلا من هناك — إذا كنت قد غادرت بالفعل، اطلب من الموارد البشرية إضافة انصرافك.',
  spTitle:'تحديد موقع مشروع',spHint:'سمحت لك الموارد البشرية بحفظ مواقع المشروعات. قف في الموقع (في مكان مفتوح وليس داخل مبنى) واحفظه.',
  spBtn:'تحديد موقع مشروع',spPickHint:'اختر المشروع الذي تقف فيه الآن.',spHas:'له موقع — حدده {by} في {d}',spNone:'لا يوجد موقع بعد',
  spSaveHere:'📍 حفظ موقعي الحالي لهذا المشروع',spReplace:'هذا المشروع له موقع بالفعل (حدده {by} في {d}). الحفظ سيستبدله.',
  spNote:'ملاحظة (اختيارية، مثل: البوابة الرئيسية)',spGetting:'جارٍ تحديد موقع دقيق…',spSaved:'تم حفظ موقع {site} (±{acc} م). تم إبلاغ الموارد البشرية.',
  spAccuracy:'دقة موقعك ±{n} م فقط (المطلوب {max} م أو أفضل). اخرج إلى مكان مفتوح وانتظر ثواني ثم حاول مرة أخرى.',
  spNotAllowed:'لم تمنحك الموارد البشرية صلاحية تحديد مواقع المشروعات.',
  appRequired:'من فضلك سجّل الحضور من تطبيق بتروكيما وليس من متصفح الإنترنت. حمّله من download.petrokima-hr.com',
  updateRequired:'إصدار تطبيق بتروكيما لديك قديم. ثبّت الإصدار الجديد (download.petrokima-hr.com) ثم سجّل الحضور مرة أخرى.',
  badDevice:'تعذّر التعرّف على هذا الهاتف. أغلق التطبيق وافتحه مرة أخرى.',
  phoneReg:'الهاتف المسجّل',thisPhone:'هذا الهاتف مسجّل باسمك',back:'رجوع',
  locTitle:'تحديد الموقع مطلوب',locDenied:'تسجيل الحضور يتطلب موقعك، وهذا الهاتف لا يشارك موقعه مع تطبيق بتروكيما.',
  locIos:'آيفون — راجع الإعدادين:\n١. الإعدادات ← الخصوصية والأمان ← خدمات الموقع ← تشغيل ← «مواقع سفاري» ← «أثناء استخدام التطبيق».\n٢. الإعدادات ← التطبيقات ← سفاري ← إعدادات المواقع ← الموقع ← اجعل app.petrokima-hr.com (و«مواقع أخرى») على «السماح» أو «السؤال».\nثم أغلق بتروكيما تماماً (اسحبه لأعلى) وافتحه مرة أخرى. ما زال محظوراً؟ تواصل مع الموارد البشرية — قد يلزم إضافة التطبيق إلى الشاشة الرئيسية من جديد.',
  locAndroid:'أندرويد: افتح إعدادات الهاتف ← الموقع ← شغّله. ثم في كروم اضغط ⋮ ← الإعدادات ← إعدادات المواقع ← الموقع ← اسمح لهذا الموقع (أو اضغط مطولاً على أيقونة بتروكيما ← معلومات التطبيق ← الأذونات ← الموقع ← سماح).',
  locTimeout:'تعذّر تحديد موقعك. اقترب من نافذة أو اخرج إلى مكان مفتوح، انتظر قليلاً ثم حاول مرة أخرى.',tryAgain:'حاول مرة أخرى',
  queued:'تم الحفظ على هاتفك ✓ — سيتم الإرسال تلقائياً فور عودة الاتصال',sending:'جارٍ الإرسال…',
  serverDown:'لا يمكن الوصول إلى الخادم الآن. يرجى المحاولة بعد دقائق.',
  waiting:'{n} تسجيل محفوظ على هذا الهاتف في انتظار الإنترنت',waitingOne:'في انتظار الإرسال',
  sentNow:'تم إرسال {n} تسجيل محفوظ ✓',notRecorded:'تعذّر تسجيل أحد التسجيلات المحفوظة — راجع التفاصيل في الشاشة الرئيسية',
  failedItem:'لم يُسجَّل',discard:'حذف',discardQ:'حذف هذا التسجيل المحفوظ؟ ستحتاج الموارد البشرية إلى تسجيله يدوياً.',sendNow:'إرسال الآن',
  tooOld:'مضى عليه أكثر من ٧٢ ساعة — يجب أن تسجّله الموارد البشرية.',wrongOrder:'أقدم من تسجيل موجود بالفعل — يجب أن تراجعه الموارد البشرية.',
  offlineMode:'بدون إنترنت — يتم عرض آخر بيانات محفوظة',offlineSites:'لا يوجد إنترنت: اختر موقعاً حديثاً أو ابحث في القائمة المحفوظة',
  noCache:'لا يوجد اتصال بالإنترنت. اتصل مرة واحدة لتسجيل الدخول.',
  approvals:'الموافقات',teamReqTitle:'طلبات الإجازات والأذونات من فريقك',noTeamReq:'لا توجد طلبات من فريقك',salLine:'💼 الراتب الأساسي — {emp}',salFromTo:'{cur} ← {new} جنيه اعتباراً من {d}',salBy:'مقدم من {by}',offlineList:'لا يوجد إنترنت — البحث في قائمة المشروعات المحفوظة',noSiteCache:'لا يوجد إنترنت ولا توجد قائمة مشروعات محفوظة بعد — افتح التطبيق مرة مع الإنترنت',reqElement:'طلب عنصر متغير',element:'العنصر',reqType:'بالـ',byAmount:'مبلغ (جنيه)',byDays:'أيام',byHours:'ساعات',elLine:'💰 {el} — {emp}: {q} {u}',anonymous:'مجهول',sendAnon:'إرسال دون ذكر اسمي — لن تعرف الموارد البشرية ولا عضو مجلس الإدارة من أرسلها',anonMine:'🕶 أُرسلت دون ذكر الاسم',
  reqPenalty:'طلب جزاء',reqIncentive:'طلب حافز',employee:'الموظف',penType:'نوع الجزاء',penAmount:'مبلغ ثابت (جنيه)',penHours:'ساعات من الأجر',penDays:'أيام من الأجر',
  quantity:'الكمية',incAmount:'قيمة الحافز (جنيه)',payMonth:'شهر الرواتب',incDate:'تاريخ الواقعة',needReason:'اختر الموظف وأدخل الكمية واكتب السبب',
  actFlow:'يُرسل إلى عضو مجلس الإدارة للموافقة ثم الموارد البشرية.',penLine:'⚖️ جزاء — {emp}: {q} {u}',incLine:'🏅 حافز — {emp}: {q} جنيه',u_Amount:'جنيه',u_Hours:'ساعة',u_Days:'يوم',
  boardTitle:'⚖️ الجزاءات والحوافز — بانتظار موافقتك',noBoard:'لا توجد طلبات بانتظار موافقتك',
  approve:'موافقة',reject:'رفض',noteOpt:'ملاحظة (اختياري)',reqBy:'مقدم من',stWB:'بانتظار عضو مجلس الإدارة',stWHR:'بانتظار الموارد البشرية',
  agreeClose:'✔ أوافق على الإغلاق',closeNote:'ملاحظة الإغلاق (اختياري)',closedBoth:'أُغلق بموافقة الموارد البشرية وموافقتك',waitHrClose:'وافقت — بانتظار تأكيد الموارد البشرية',waitMgrClose:'الموارد البشرية تطلب الإغلاق — أكّد إن كنت موافقاً',news:'الأخبار',newsTitle:'الإعلانات والقرارات',noNews:'لا توجد إعلانات بعد',annKind:'إعلان',decKind:'قرار إداري',openAtt:'فتح المرفق',
  bday:'عائلة بتروكيما تتمنى لك عيد ميلاد سعيد 🎉',bdaySub:'نتمنى لك عاماً رائعاً.',
  complaint:'شكوى',suggestion:'اقتراح',fbNote:'لا يطّلع عليها إلا الموارد البشرية وعضو مجلس الإدارة.',subject:'الموضوع',myFeedback:'شكاواي واقتراحاتي',noFeedback:'لم ترسل شيئاً بعد',
  fbSent:'تم الإرسال إلى الموارد البشرية وعضو مجلس الإدارة ✓',needSubject:'اكتب الموضوع والتفاصيل',reply:'الرد',
  hrReqTitle:'طلبات إلى الموارد البشرية',reqHire:'طلب تعيين موظفين جدد',reqTrain:'طلب تدريب',howMany:'عدد الموظفين',jobName:'المسمى الوظيفي',jobDesc:'الوصف الوظيفي',
  neededBy:'مطلوب قبل (اختياري)',notes:'ملاحظات (اختياري)',needJob:'المسمى الوظيفي والوصف الوظيفي مطلوبان',topic:'موضوع التدريب',whoTrain:'من يحتاج التدريب',
  prefDate:'التاريخ المفضل (اختياري)',needTrain:'اختر موظفاً واحداً على الأقل واكتب موضوع التدريب',sentHR:'تم الإرسال إلى الموارد البشرية ✓',noMgrReq:'لم ترسل طلبات بعد',
  hireLine:'{n} × {job}',trainLine:'{topic} — {n} موظف',inboxTitle:'📥 الشكاوى والاقتراحات',noInbox:'لا يوجد شيء',status:'الحالة',saveReply:'حفظ',birthYear:'سنة ميلادك',yearWrong:'سنة الميلاد غير مطابقة لسجلاتنا (متبقٍ {n} محاولات).',acctLockedYear:'تجاوزت عدد المحاولات — تم قفل حسابك. اطلب من الموارد البشرية إعادة تعيينه.',needYear:'أدخل سنة ميلادك (٤ أرقام، مثال: 1988).',firstHint:'أول مرة؟ استخدم كلمة المرور المؤقتة التي أعطتها لك الموارد البشرية. إذا كان حسابك مقفلاً، تواصل مع الموارد البشرية.',
  payLockTitle:'مفرداتك محمية',payLockSub:'أدخل كلمة المرور لعرضها.',payUnlock:'عرض مفرداتي',payWrongPass:'كلمة المرور غير صحيحة',payNeedNet:'اتصل بالإنترنت لعرض مفرداتك.',payLock:'🔒 قفل',
  firstMustChange:'اختر كلمة مرور خاصة بك الآن، ٨ أحرف على الأقل ومختلفة عن كلمة المرور الأولى.',myProjects:'مشروعاتك',notAllowed:'غير مسموح لك بهذا الإجراء.',filterProj:'ابحث في مشروعاتك…',notAssigned:'أنت غير مكلّف بهذا المشروع. اطلب من مديرك المباشر إضافته.',
  teamProj:'مشروعات فريقك',teamProjNote:'الموظف المكلّف بمشروعات يسجّل الحضور فيها فقط. تعديلاتك تُطبَّق فوراً.',manage:'إدارة',
  projectsN:'{n} مشروع',noProjAssigned:'بدون مشروعات — يسجّل في أي مشروع',addProject:'أضف مشروعاً — اكتب الكود أو الاسم…',projAdded:'تمت إضافة المشروع ✓',projRemoved:'تمت إزالة المشروع',
  removeProjQ:'حذف هذا المشروع من {name}؟',sentMgr:'تم إرسال الطلب إلى مديرك المباشر ✓',
  sentAt:'أُرسل',lateRule:'إذن التأخير الصباحي يُطلب قبل الساعة {time} من نفس اليوم.',
  leaveRules:'الإجازة السنوية: تُطلب قبل بدايتها بـ {n} يوم على الأقل. الإجازة العارضة: يمكن طلبها في نفس اليوم.',
  lateReqErr:'انتهى وقت الطلب — إذن التأخير يُطلب قبل الساعة {time} من نفس اليوم.',
  annualNoticeErr:'الإجازة السنوية تُطلب قبل بدايتها بـ {n} يوم على الأقل. لليوم نفسه اختر إجازة عارضة.',
  pastDateErr:'الإجازة العارضة تُطلب لليوم أو لأيام قادمة، وليس لأيام سابقة.',mgrNote:'ملاحظتك',
  approvedFinal:'تمت الموافقة ✓',teamTitle:'بدل المشروع لفريقك',teamNote:'محسوب من حضورهم في المشروعات. لا يُصرف أي مبلغ إلا بعد موافقتك ثم موافقة الموارد البشرية.',
  rejectWhy:'سبب الرفض',removeProj:'إزالة هذا المشروع',removeWhy:'سبب الإزالة (مطلوب)',needWhy:'اكتب السبب (3 أحرف على الأقل)',approvedMsg:'تمت الموافقة — أُرسل إلى الموارد البشرية ✓',rejectedMsg:'تم الرفض',noTeam:'لا توجد طلبات للموافقة',
  aaWait:'في انتظار موافقتك',aaHR:'وافقت عليه — في انتظار الموارد البشرية',aaOk:'معتمد — سيُصرف',aaNo:'مرفوض',day:'يوم',daysW:'أيام',at:'في',
  locAppAndroid:'أندرويد: افتح إعدادات الهاتف ← التطبيقات ← بتروكيما ← الأذونات ← الموقع ← «السماح فقط أثناء استخدام التطبيق». وتأكد أيضاً من تشغيل الموقع من الإعدادات السريعة.',
  locAppIos:'آيفون: افتح الإعدادات ← بتروكيما ← الموقع ← «أثناء استخدام التطبيق»، وشغّل «الموقع الدقيق».',
  updateAvail:'يتوفر إصدار جديد من التطبيق',updateBtn:'تنزيل التحديث',
  refresh:'تحديث',refreshed:'تم التحديث ✓',updated:'آخر تحديث {t}',pull:'اسحب للأسفل للتحديث',release:'اترك للتحديث',refreshing:'جارٍ التحديث…'}
};
let LANG = localStorage.getItem('pk_lang') || 'ar';   // Arabic by default; one tap switches to English
const t = (k, vars) => { let s = (T[LANG][k] ?? T.en[k] ?? k); if (vars) Object.entries(vars).forEach(([a,b]) => s = s.replace('{'+a+'}', b)); return s; };
const tm = (group, k) => (T[LANG][group] && T[LANG][group][k]) || k;
// outside missions (66)
Object.assign(T.en, { reqMission:'Outside mission', misTitle:'🚗 Outside mission', misAssign:'Assign a mission', misTeamTitle:'🚗 Outside missions — your team',
  misFull:'Full day(s)', misPart:'Part of a day', misFrom:'From date', misTo:'To date', misDate:'Date', misTimeFrom:'From time', misTimeTo:'To time',
  misPlace:'Place (where)', misPurpose:'Purpose', misProject:'Project code (optional)', misWho:'Employees', misNoWho:'Choose at least one employee',
  misNeedPlace:'Write where the mission is', misBadDates:'The end date must be on or after the start date', misBadTimes:'The end time must be after the start time',
  misAckTitle:'Your manager assigned you a mission', misAckBtn:'✋ I undertake this mission', misAcked:'Thank you — your manager and HR are notified ✓',
  misSentMgr:'Mission request sent to your direct manager ✓', misSentHR:'Mission request sent to HR ✓', misAssigned:'Mission sent ✓ — app users acknowledge it; the others go straight to HR',
  misNone:'No missions', misAssignedBy:'Assigned by your manager', misAskedBy:'Requested by {n}', misAckNote:'You still check in and out on the phone during the mission.',
  misOverlap:'There is already a mission on these dates', misLocked:'That payroll month is already approved', misNotTeam:'This employee is not in your team',
  misIAssigned:'Assigned by you', misSelAll:'Select all ({n})', misChosen:'{n} chosen', misAckedHR:'Acknowledged — waiting for HR', misMyAckedHR:'You acknowledged — waiting for HR',
  misNoAppHR:'Sent to HR — employee does not use the app', misNoAppNote:'Employees who do not use the app yet (no login or first sign-in not finished) go straight to HR without acknowledging.' });
Object.assign(T.en, { dreqTitle:'📝 HR asks you to update your data', dreqFill:'✏️ Fill in', dreqSend:'Send to HR', dreqSentHR:'Sent — waiting for HR to check it',
  dreqSaved:'Saved ✓', dreqAccepted:'✅ HR saved your data', dreqReturned:'↩ HR returned it — please correct and send again', dreqNeed:'Fill in every field',
  dreqDirectNote:'Personal mobile, e-mail and address are saved at once; other data is saved after HR checks it.', choose:'— choose —',
  myContact:'✏️ Update my contact details', myContactTitle:'My contact details', contactSaved:'Your contact details are saved ✓',
  screenFail:'This part could not be shown. Close the app and open it again. The problem was reported automatically.',
  personalEmail:'Personal e-mail', personalMobile:'Personal mobile', addressL:'Address', saveL:'Save', noChange:'Nothing changed' });
Object.assign(T.ar, { dreqTitle:'📝 الموارد البشرية تطلب تحديث بياناتك', dreqFill:'✏️ إدخال البيانات', dreqSend:'إرسال للموارد البشرية', dreqSentHR:'تم الإرسال — في انتظار مراجعة الموارد البشرية',
  dreqSaved:'تم الحفظ ✓', dreqAccepted:'✅ تم حفظ بياناتك', dreqReturned:'↩ أعادته الموارد البشرية — برجاء التصحيح والإرسال مرة أخرى', dreqNeed:'برجاء ملء كل الخانات',
  dreqDirectNote:'الموبايل والبريد الإلكتروني الشخصي والعنوان تُحفظ فوراً؛ باقي البيانات تُحفظ بعد مراجعة الموارد البشرية.', choose:'— اختر —',
  myContact:'✏️ تحديث بيانات الاتصال', myContactTitle:'بيانات الاتصال الخاصة بي', contactSaved:'تم حفظ بيانات الاتصال ✓',
  screenFail:'تعذّر عرض هذا الجزء. أغلق التطبيق وافتحه من جديد. تم الإبلاغ عن المشكلة تلقائياً.',
  personalEmail:'البريد الإلكتروني الشخصي', personalMobile:'الموبايل الشخصي', addressL:'العنوان', saveL:'حفظ', noChange:'لم يتغير شيء' });
Object.assign(T.en, { captchaFail:'The security check did not load. Check your internet and try again.' });
Object.assign(T.ar, { captchaFail:'لم يكتمل فحص الأمان. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.' });
Object.assign(T.en, { coTitle:'🚪 Check-outs sent to HR', coTitleSheet:'🚪 HR has been told', coLeftTitle:'🚶 You are still checked in',
  coTriedAt:'tried to check out at {t} away from {place}', coLeftAt:'away from {place} at {t}, still checked in',
  coWaiting:'Waiting for HR to record it', coRecorded:'✅ HR recorded your check-out at {t}', coRejected:'❌ HR did not record it',
  coAddMsg:'💬 Message to HR', coEditMsg:'💬 Change my message', coMsgLabel:'Message to HR (when did you leave, and why?)',
  coMsgPh:'Example: I finished work and left the office at {t}. Please record my check-out.', coLater:'Later', coSendMsg:'Send message',
  coNeedMsg:'Write your message first', coMsgSent:'Message sent to HR ✓',
  coToldHR:'HR has been told that you tried to check out at {t} away from {place}. HR will record your check-out by hand — you can add a message below.',
  coLeftNow:'You are away from {place} and still checked in. HR has been told ({t}). If you have finished work, send HR a message asking them to record your check-out.',
  coTooSoon:'(Less than 10 minutes since your check-in — nothing was sent to HR.)',
  lwTitle:'🚶 You left without checking out', lwBody:'You are away from your office and still checked in. HR has been told — open the app to send HR a message.',
  lwAskTitle:'Allow location “All the time”', lwOpenSettings:'Open settings',
  lwAskBody:'While you are checked in, the app checks from time to time that you are still at your office, so HR knows if you left without checking out.\n\nOn the next screen choose: Permissions → Location → “Allow all the time”.' });
Object.assign(T.ar, { coTitle:'🚪 طلبات انصراف أُرسلت للموارد البشرية', coTitleSheet:'🚪 تم إبلاغ الموارد البشرية', coLeftTitle:'🚶 ما زلت مسجّل حضور',
  coTriedAt:'حاولت تسجيل الانصراف الساعة {t} بعيداً عن {place}', coLeftAt:'بعيداً عن {place} الساعة {t} دون تسجيل انصراف',
  coWaiting:'في انتظار تسجيل الموارد البشرية', coRecorded:'✅ سجّلت الموارد البشرية انصرافك الساعة {t}', coRejected:'❌ لم تسجّله الموارد البشرية',
  coAddMsg:'💬 رسالة للموارد البشرية', coEditMsg:'💬 تعديل رسالتي', coMsgLabel:'رسالة للموارد البشرية (متى غادرت؟ ولماذا؟)',
  coMsgPh:'مثال: أنهيت العمل وغادرت المكتب الساعة {t}. برجاء تسجيل انصرافي.', coLater:'لاحقاً', coSendMsg:'إرسال الرسالة',
  coNeedMsg:'اكتب رسالتك أولاً', coMsgSent:'تم إرسال الرسالة للموارد البشرية ✓',
  coToldHR:'تم إبلاغ الموارد البشرية بأنك حاولت تسجيل الانصراف الساعة {t} بعيداً عن {place}. ستسجّل الموارد البشرية انصرافك يدوياً — يمكنك إضافة رسالة بالأسفل.',
  coLeftNow:'أنت بعيد عن {place} وما زلت مسجّل حضور. تم إبلاغ الموارد البشرية ({t}). إذا أنهيت عملك، أرسل رسالة للموارد البشرية لتسجيل انصرافك.',
  coTooSoon:'(أقل من 10 دقائق منذ تسجيل الحضور — لم يُرسل شيء للموارد البشرية.)',
  lwTitle:'🚶 غادرت دون تسجيل الانصراف', lwBody:'أنت بعيد عن مكتبك وما زلت مسجّل حضور. تم إبلاغ الموارد البشرية — افتح التطبيق لإرسال رسالة لهم.',
  lwAskTitle:'اسمح بالموقع «طوال الوقت»', lwOpenSettings:'فتح الإعدادات',
  lwAskBody:'أثناء تسجيل حضورك، يتحقق التطبيق من وقت لآخر أنك ما زلت في مكتبك، حتى تعرف الموارد البشرية إذا غادرت دون تسجيل الانصراف.\n\nفي الشاشة التالية اختر: الأذونات ← الموقع ← «السماح طوال الوقت».' });
Object.assign(T.en, { dayEnded:'Day ended at {t}', dayTotal:'Worked today: {h}', cameBack:'I came back — check in again',
  cameBackNote:'Your check-out stays recorded. The time you were away is not counted, and HR can see it.',
  undoOut:'↩ Undo check-out (until {t})', undoneOut:'Check-out undone — you are checked in again ✓', undoLate:'More than 5 minutes have passed — check in again instead',
  undoNotLast:'Something was recorded after this check-out — check in again instead', undoLocked:'This day is in an approved payroll month', undoGone:'This check-out can no longer be undone' });
Object.assign(T.ar, { dayEnded:'انتهى يومك في {t}', dayTotal:'ساعات العمل اليوم: {h}', cameBack:'رجعت — تسجيل حضور مرة أخرى',
  cameBackNote:'يبقى وقت انصرافك مسجلاً. وقت غيابك لا يُحتسب، وتراه الموارد البشرية.',
  undoOut:'↩ إلغاء الانصراف (حتى {t})', undoneOut:'تم إلغاء الانصراف — أنت مسجل حضور مرة أخرى ✓', undoLate:'مرت أكثر من 5 دقائق — سجل حضورك مرة أخرى',
  undoNotLast:'تم تسجيل شيء بعد هذا الانصراف — سجل حضورك مرة أخرى', undoLocked:'هذا اليوم ضمن شهر رواتب معتمد', undoGone:'لم يعد ممكناً إلغاء هذا الانصراف' });
Object.assign(T.ar, { reqMission:'مأمورية خارجية', misTitle:'🚗 مأمورية خارجية', misAssign:'تكليف بمأمورية', misTeamTitle:'🚗 المأموريات الخارجية — فريقك',
  misFull:'يوم كامل أو أكثر', misPart:'جزء من اليوم', misFrom:'من تاريخ', misTo:'إلى تاريخ', misDate:'التاريخ', misTimeFrom:'من الساعة', misTimeTo:'إلى الساعة',
  misPlace:'المكان', misPurpose:'الغرض', misProject:'كود المشروع (اختياري)', misWho:'الموظفون', misNoWho:'اختر موظفاً واحداً على الأقل',
  misNeedPlace:'اكتب مكان المأمورية', misBadDates:'تاريخ النهاية يجب أن يكون في أو بعد تاريخ البداية', misBadTimes:'وقت النهاية يجب أن يكون بعد وقت البداية',
  misAckTitle:'كلفك مديرك بمأمورية', misAckBtn:'✋ أتعهد بتنفيذ المأمورية', misAcked:'شكراً — تم إبلاغ مديرك والموارد البشرية ✓',
  misSentMgr:'تم إرسال طلب المأمورية إلى مديرك المباشر ✓', misSentHR:'تم إرسال طلب المأمورية إلى الموارد البشرية ✓', misAssigned:'تم إرسال المأمورية ✓ — مستخدمو التطبيق يؤكدونها، والباقون تذهب مأمورياتهم مباشرة للموارد البشرية',
  misNone:'لا توجد مأموريات', misAssignedBy:'تكليف من مديرك', misAskedBy:'طلب من {n}', misAckNote:'تسجل الحضور والانصراف من الهاتف كالمعتاد أثناء المأمورية.',
  misOverlap:'توجد مأمورية بالفعل في هذه التواريخ', misLocked:'رواتب هذا الشهر معتمدة بالفعل', misNotTeam:'هذا الموظف ليس من فريقك',
  misIAssigned:'تكليف منك', misSelAll:'اختيار الكل ({n})', misChosen:'تم اختيار {n}', misAckedHR:'أكد الموظف — في انتظار الموارد البشرية', misMyAckedHR:'أكدت المأمورية — في انتظار الموارد البشرية',
  misNoAppHR:'أُرسلت للموارد البشرية — الموظف لا يستخدم التطبيق', misNoAppNote:'الموظفون الذين لا يستخدمون التطبيق بعد (بدون حساب أو لم يكملوا أول دخول) تُرسل مأمورياتهم مباشرة إلى الموارد البشرية دون تأكيد.' });
T.en.st['Waiting for employee'] = 'Waiting for the employee to acknowledge'; T.ar.st['Waiting for employee'] = 'في انتظار تأكيد الموظف';
function applyLang(){
  document.documentElement.lang = LANG; document.documentElement.dir = LANG==='ar' ? 'rtl' : 'ltr';
  (/** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-t]'))).forEach(el => el.textContent = t(el.dataset.t));
  document.querySelectorAll('[data-lang]').forEach(el => el.textContent = t('langBtn'));
  if ($('ios-steps')) $('ios-steps').textContent = t('iosSteps');
  if (APP.ready) renderAll();
}

// ═════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════
/** @type {(id: string) => any} — any page element (field, button, list …) by its id */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
const pad = n => String(n).padStart(2,'0');
const loc = () => LANG==='ar' ? 'ar-EG' : 'en-GB';
const fmt = v => num(v).toLocaleString(loc(), { maximumFractionDigits:2 });
// hours shown as hours and minutes for employees (9.83 → "9 h 50 m" / "٩ س ٥٠ د"); payroll keeps decimal hours
const fmtH = v => { const tm = Math.round(num(v) * 60), h = Math.floor(tm / 60), m = tm % 60, n = x => x.toLocaleString(loc());
  return h && m ? `${n(h)} ${t('hours')} ${n(m)} ${t('mins')}` : h ? `${n(h)} ${t('hours')}` : `${n(m)} ${t('mins')}`; };
function todayStr(){ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function dObj(s){ const [y,m,d]=String(s).split('-').map(Number); return new Date(y, m-1, d); }
function dStr(o){ return `${o.getFullYear()}-${pad(o.getMonth()+1)}-${pad(o.getDate())}`; }
function niceDate(s){ return s ? dObj(s).toLocaleDateString(loc(), { weekday:'short', day:'numeric', month:'short' }) : ''; }
function toMin(x){ const [h,m]=String(x||'0:0').split(':').map(Number); return h*60+m; }
let toastT;
function toast(msg, bad){ const el=$('toast'); el.textContent=msg; el.className = 'on' + (bad?' bad':''); clearTimeout(toastT); toastT=setTimeout(()=>el.className='',3200); }
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on', s.id===id)); $('boot').style.display='none'; }
// one bottom window at a time: the old one (#sheet) or a React one (react/src/phone/reqwin — vacation, permission, HR request)
function sheet(html){ if (typeof PKM !== 'undefined') PKM.closeWindow(); $('sheet-body').innerHTML = html; $('sheet').classList.add('on'); }
function closeSheet(){ $('sheet').classList.remove('on'); if (typeof PKM !== 'undefined') PKM.closeWindow(); }
function sheetOpen(){ return $('sheet').classList.contains('on') || (typeof PKM !== 'undefined' && PKM.windowOpen()); }
function chip(s){ const c={Pending:'c-orange','Waiting for manager':'c-orange','Waiting for employee':'c-orange','Waiting for HR':'c-blue',Approved:'c-green',Completed:'c-green','In progress':'c-blue',Rejected:'c-red',Cancelled:'c-grey'}[s]||'c-grey'; return `<span class="chip ${c}">${esc(tm('st',s))}</span>`; }
function friendly(msg){
  msg = String(msg||'');
  if (/year of birth does not match/i.test(msg)) return t('yearWrong', { n: (msg.match(/\((\d+)/) || [])[1] || '' });
  if (/Too many wrong answers|account is (now )?locked/i.test(msg)) return t('acctLockedYear');
  if (/NOT_ASSIGNED/.test(msg)) return t('notAssigned');
  if (/LATE_REQUEST/.test(msg)) return t('lateReqErr', { time: (msg.match(/before (\d\d:\d\d)/) || [])[1] || lateDeadline() });
  if (/ADVANCE_NOTICE/.test(msg)) return t('annualNoticeErr', { n: Number(S.annualNoticeDays) || 1 });
  if (/PAST_DATE/.test(msg)) return t('pastDateErr');
  if (/TOO_EARLY/.test(msg)) { const m = msg.match(/from (\d{4}-\d\d-\d\d) \((\d+) months/) || []; return t('tooEarlyErr', { d: m[1] ? dShort(m[1]) : '', m: m[2] || 6 }); }
  if (/EMERGENCY_LIMIT/.test(msg)) { const m = msg.match(/this year: ([\d.]+) days; already used or requested: ([\d.]+)/) || []; return t('emergLimitErr', { cap: m[1] || '', used: m[2] || '' }); }
  if (/OFFLINE_TOO_OLD/.test(msg)) return t('tooOld');
  if (/OFFLINE_ORDER/.test(msg)) return t('wrongOrder');
  if (/ALREADY_IN/.test(msg)) return t('alreadyIn');
  if (/^(DATA_VALUE|DATA_FIELD|DATA_CLOSED|DATA_NOT_FOUND|EMAIL): ?/.test(msg)) return msg.replace(/^[A-Z_]+: ?/, '');
  if (/UNDO_TOO_LATE/.test(msg)) return t('undoLate');
  if (/UNDO_NOT_LAST/.test(msg)) return t('undoNotLast');
  if (/UNDO_LOCKED/.test(msg)) return t('undoLocked');
  if (/UNDO_NOT_FOUND/.test(msg)) return t('undoGone');
  if (/captcha/i.test(msg)) return t('captchaFail');
  if (/ACCURACY:/.test(msg)) { const m = msg.match(/±(\S+) m \(needed: (\d+)/) || []; return t('spAccuracy', { n: m[1] || '?', max: m[2] || 50 }); }
  if (/NOT_ALLOWED:/.test(msg)) return t('spNotAllowed');
  if (/TOO_SOON/.test(msg)) return t('coTooSoon');
  if (/NOT_IN/.test(msg)) return t('notInErr');
  if (/DEVICE/.test(msg)) return t('deviceMismatch');
  if (/NO_LOCATION/.test(msg)) return t('locDenied');
  if (/MOCK_LOCATION/.test(msg)) return t('mockLoc');
  if (/APP_REQUIRED/.test(msg)) return t('appRequired');
  if (/UPDATE_REQUIRED/.test(msg)) { setTimeout(() => checkAppUpdate(true), 0); return t('updateRequired'); }
  if (/OUTSIDE_SITE/.test(msg)) { const m = msg.match(/about (.+?) from (.+?)\. Check/) || []; return t(/Check-out is only allowed/.test(msg) ? 'outsideSiteOut' : 'outsideSite', { d: m[1] || '', site: m[2] || '' }); }
  if (/MISSION_OVERLAP/.test(msg)) return t('misOverlap');
  if (/MISSION_LOCKED/.test(msg)) return t('misLocked');
  if (/MISSION_NOT_TEAM/.test(msg)) return t('misNotTeam');
  if (/MISSION_PLACE/.test(msg)) return t('misNeedPlace');
  if (/MISSION_TIMES/.test(msg)) return t('misBadTimes');
  if (/MISSION_DATES/.test(msg) && /after the start/.test(msg)) return t('misBadDates');
  if (/approved and locked/i.test(msg)) return t('lockedPeriod');
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return t('offline');
  return msg.replace(/^[A-Z_]+:\s*/, '');
}

// Payroll rules shared with the HR system
let S = { weekendDays:[5,6], cycleStartDay:21, permissionsPerMonth:2, permissionMaxHours:2, annualLeaveDefault:21, casualCountsAnnual:'yes', hoursPerDay:8 };
let HOL = new Set();
function isWorkday(s){ return !(S.weekendDays||[]).includes(dObj(s).getDay()) && !HOL.has(s); }
function workdays(a,b){ if(!a||!b||b<a) return 0; let n=0,d=dObj(a),e=dObj(b),g=0; while(d<=e && g++<800){ if(isWorkday(dStr(d))) n++; d.setDate(d.getDate()+1); } return n; }
function cycleDay(){ const d=Math.round(num(S.cycleStartDay)); return (d>=2&&d<=28)?d:1; }
function periodStart(p){ const sd=cycleDay(),[y,m]=p.split('-').map(Number); if(sd===1) return `${p}-01`; const d=new Date(y,m-2,sd); return dStr(d); }
function periodEnd(p){ const sd=cycleDay(),[y,m]=p.split('-').map(Number); return sd===1 ? `${p}-${pad(new Date(y,m,0).getDate())}` : `${p}-${pad(sd-1)}`; }
function cycleOf(date){ const sd=cycleDay(),[y,m,d]=String(date).split('-').map(Number); if(sd===1||d<sd) return `${y}-${pad(m)}`; const n=new Date(y,m,1); return `${n.getFullYear()}-${pad(n.getMonth()+1)}`; }
function periodLabel(p){ const [y,m]=p.split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString(loc(),{month:'long',year:'numeric'}); }
function leaveDaysIn(l,a,b){ const s=l.date_from>a?l.date_from:a, e=l.date_to<b?l.date_to:b; if(e<s) return 0; const full=workdays(l.date_from,l.date_to); if(!full) return 0; return Math.round(num(l.days)*workdays(s,e)/full*100)/100; }

// ═════════════════════════════════════════════════════════
//  SIGN-IN
// ═════════════════════════════════════════════════════════
/** Everything the app has loaded for the signed-in employee (types: types/globals.d.ts and the database description).
 * @type {{ ready: boolean, me: Row<'app_users'> & { emp_id: string }, emp: Employee | null, status: ClockStatus | null, statusAt: number,
 *   leaves: Leave[], perms: Permission[], reqs: HrRequest[], slips: any[], att: AttendanceRow[],
 *   manager: FnResult<'my_manager'>[number] | null, view: string,
 *   offline?: boolean, updatedAt?: number, team?: AllowanceApproval[], teamReq?: { kind: string, r: any }[],
 *   myProjects?: FnResult<'my_projects'>, myTeam?: FnResult<'my_team'>, hra?: any[], lbal?: any,
 *   docs?: Row<'doc_requests'>[], dreqs?: Row<'data_requests'>[], dfields?: any[] | null, coreqs?: Row<'checkout_requests'>[],
 *   watch?: any, canSetSite?: boolean, varElements?: FnResult<'variable_elements'>, salReqs?: Row<'salary_change_requests'>[],
 *   news?: Row<'announcements'>[], newsRead?: Set<string>, birthday?: boolean, myFeedback?: Row<'feedback'>[],
 *   inbox?: FnResult<'feedback_inbox'>, myActions?: Row<'manager_actions'>[], boardActions?: Row<'manager_actions'>[],
 *   mgrReqs?: { kind: string, r: any }[], cameBack?: boolean, missions?: Mission[],
 *   teamMissions?: Mission[], payUnlocked?: boolean }}
 *   me: the sign-in record — set at sign-in (which stops for a login without an employee code: emp_id is always there),
 *       and every screen that reads it opens only after that.
 *   r in teamReq / mgrReqs: one of several kinds of request (see kind); slips: payslip packages (my_payslips). */
const APP = { ready:false, me:/** @type {any} — set at sign-in */ (null), emp:null, status:null, statusAt:0, leaves:[], perms:[], reqs:[], slips:[], att:[], manager:null, view:'home' };
/** @type {PhoneDb} — the database connection (typed: every table, column and database function is checked) */
let sb = /** @type {any} — set at start-up, before anything reads from the database */ (null);
let tempPass = '';
// ── things kept on the phone so the app works without internet ──
const store = { get:(k,d)=>{ try { const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch(e){ return d; } }, set:(k,v)=>{ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };
const queue = () => store.get('pk_queue', []);
const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
const isNetErr = e => !navigator.onLine || /Failed to fetch|NetworkError|network|Load failed|fetch|abort|timeout|timed out|upstream|bad gateway|gateway time|service unavailable|<!doctype|<html/i.test(String((e && (e.message || e.details)) || e || ''));
// A server outage: no connection, no answer in time, or the server answers with an error page (5xx) — not a business rule refusing the check-in
const serverDown = r => !!r && (isNetErr(r.error) || r.status === 0 || r.status === 408 || r.status === 429 || r.status >= 500);
// Never wait for ever: give up after `ms` and treat it as an outage (the request may still arrive — the check-in's unique id prevents doubles)
const withTimeout = (p, ms) => Promise.race([ Promise.resolve(p), new Promise(res => setTimeout(() => res({ data:null, status:0, error:{ message:'timeout: no answer from the server' } }), ms)) ]);
// The server already has this check-in (it arrived earlier but the answer was lost)
// send a check-in; if the database does not know the newer location fields yet, send it without them
async function insertClock(rec){
  const r = await sb.from('clock_events').insert(rec);
  if (r.error && /mock_location|client_kind|is_switch|mono_|boot_/.test(String(r.error.message || '')) && /column|schema/i.test(String(r.error.message || ''))) {
    const { mock_location, client_kind, is_switch, mono_tap_ms, mono_send_ms, boot_tap, boot_send, ...old } = rec; return sb.from('clock_events').insert(old);
  }
  return r;
}
const alreadyHave = e => !!e && (e.code === '23505' || /duplicate key/i.test(String(e.message||''))) && /client_id/i.test(String((e.message||'') + ' ' + (e.details||'')));
// every request from the app gives up after 20 seconds instead of hanging
const timedFetch = (input, init = {}) => {
  if (init.signal) return fetch(input, init);
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20000);
  return fetch(input, { ...init, signal: ac.signal }).finally(() => clearTimeout(t));
};
// review fix: no payslips and no ID / bank / pay figures are kept on the phone
const cacheEmp = e => { if (!e) return e; const { national_id, bank_account, bank_branch, salary, housing, transport, daily_pay, hour_pay, delay_hour_pay, insurance_amount, insurance_number, ...rest } = e; return rest; };
function saveCache(){ store.set('pk_cache', { uid:APP.me && APP.me.id, updatedAt:APP.updatedAt, team:APP.team, teamReq:APP.teamReq, myProjects:APP.myProjects, myTeam:APP.myTeam, me:APP.me, emp:cacheEmp(APP.emp), status:APP.status, statusAt:APP.statusAt, S, hol:[...HOL], leaves:APP.leaves, perms:APP.perms, reqs:APP.reqs, att:APP.att, manager:APP.manager, hra:APP.hra, lbal:APP.lbal }); }
function useCache(uid){
  const c = store.get('pk_cache', null); if (!c || (uid && c.uid !== uid)) return false;
  APP.me=c.me; APP.emp=c.emp; APP.status=c.status; APP.statusAt=c.statusAt||Date.now(); S={...S,...(c.S||{})}; HOL=new Set(c.hol||[]);
  APP.leaves=c.leaves||[]; APP.perms=c.perms||[]; APP.reqs=c.reqs||[]; APP.slips=[]; APP.att=c.att||[]; APP.manager=c.manager; APP.offline=true; APP.updatedAt=c.updatedAt; APP.team=c.team||[]; APP.teamReq=c.teamReq||[]; APP.myProjects=c.myProjects||[]; APP.myTeam=c.myTeam||[]; APP.hra=c.hra||[]; APP.lbal=c.lbal||null;
  return true;
}
// Server time minus phone time, measured each time we are online
function clockOffset(){ return store.get('pk_offset', { off:0 }).off || 0; }
function serverNowMs(){ return Date.now() + clockOffset(); }
function localParts(ms){
  const tz = (APP.status && APP.status.tz) || 'Africa/Cairo';
  const f = new Intl.DateTimeFormat('en-GB', { timeZone:tz, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(new Date(ms));
  const g = k => (f.find(p=>p.type===k)||{}).value;
  return { date:`${g('year')}-${g('month')}-${g('day')}`, time:`${g('hour')==='24'?'00':g('hour')}:${g('minute')}` };
}
// A random identity created once on this phone and kept in the app's storage
function deviceId(){
  let id = localStorage.getItem('pk_device');
  if (!id || id.length < 16){
    id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'd-' + Date.now().toString(36) + '-' + Array.from({length:4},()=>Math.random().toString(36).slice(2,10)).join('');
    localStorage.setItem('pk_device', id);
    const P = nativePlugin('Preferences'); if (P) P.set({ key:'pk_device', value:id }).catch(()=>{});
  }
  return id;
}
async function restoreDeviceId(){
  const P = nativePlugin('Preferences'); if (!P) return;
  try {
    const { value } = await P.get({ key:'pk_device' });
    const local = localStorage.getItem('pk_device');
    if (value && value !== local) localStorage.setItem('pk_device', value);
    else if (!value && local) await P.set({ key:'pk_device', value:local });
  } catch(e){}
}
function deviceLabel(){
  const u = navigator.userAgent || '';
  if (/iPhone/.test(u)) return 'iPhone'; if (/iPad/.test(u)) return 'iPad';
  const m = u.match(/Android [\d.]+;\s*([^;)]+)/); if (m) return 'Android · ' + m[1].trim();
  if (/Android/.test(u)) return 'Android'; if (/Windows/.test(u)) return 'Windows PC'; if (/Macintosh/.test(u)) return 'Mac';
  return 'Browser';
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// an Android phone using a browser (also when Chrome shows the "desktop site", which hides the word Android)
const ANDROID_APP_PAGE = 'https://download.petrokima-hr.com/';
const isAndroidWeb = () => !NATIVE && !isIOS() && (/android/i.test(navigator.userAgent || '')
  || /android/i.test(((navigator.userAgentData || {}).platform) || '')
  || ((navigator.maxTouchPoints || 0) > 0 && /linux/i.test(navigator.userAgent || '')));
// 92: the Android app's "time since switched on" counter + start count (the user cannot change them; the server uses them
// to find the real time of a check-in sent later). null on iPhone / web / older Android apps.
async function upTime(){
  if (!NATIVE || PLATFORM !== 'android') return null;
  const LG = nativePlugin('LocationGuard'); if (!LG || typeof LG.uptime !== 'function') return null;
  try { const r = await Promise.race([ LG.uptime(), new Promise(res => setTimeout(() => res(null), 1500)) ]);
        return r && typeof r.ms === 'number' ? { ms: Math.round(r.ms), boot: typeof r.boot === 'number' ? r.boot : -1 } : null; } catch(e) { return null; }
}
const clientKind = () => NATIVE ? PLATFORM + '-app' + (APP_BUILD ? ':' + APP_BUILD : '') : 'web-' + (isIOS() ? 'ios' : isAndroidWeb() ? 'android' : 'other');
const isStandalone = () => NATIVE || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
function loginName(v){ v=String(v||'').trim(); return v.includes('@') ? v.toLowerCase() : v.toLowerCase().replace(/[^a-z0-9._-]/g,'') + '@' + LOGIN_DOMAIN; }
// ── CAPTCHA on every password sign-in (Cloudflare Turnstile, 25 Oct 2026) ──
//  TURNSTILE_SITE_KEY = the PUBLIC site key of the widget "Petrokima HR sign-in". Empty = no CAPTCHA (nothing is shown, nothing sent).
//  Supabase checks the token only once "CAPTCHA protection" is switched on (Authentication → Attack Protection); before that it is ignored.
//  Each token is good for one sign-in: a fresh one is taken for every attempt. Usually nothing is shown; Cloudflare shows a small box
//  to tick only when it is not sure the person is human.
const TURNSTILE_SITE_KEY = '0x4AAAAAAFkp9jltaXJo9weC';   // widget "Petrokima HR sign-in" (public key)
let tsLoad = null;
function loadTurnstile(){
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (tsLoad) return tsLoad;
  tsLoad = new Promise((res, rej) => {
    const s = document.createElement('script'); s.async = true;
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.onload = () => window.turnstile ? res(window.turnstile) : rej(new Error('captcha-load'));
    s.onerror = () => { tsLoad = null; rej(new Error('captcha-load')); };
    document.head.appendChild(s);
    setTimeout(() => { if (!window.turnstile) { tsLoad = null; rej(new Error('captcha-load-timeout')); } }, 15000);   // never wait for ever
  });
  return tsLoad;
}
async function captchaToken(boxId, lang){
  if (!TURNSTILE_SITE_KEY) return undefined;
  const box = document.getElementById(boxId); if (!box) return undefined;
  const ts = await loadTurnstile();
  return new Promise((resolve, reject) => {
    let id = null, done = false;
    const finish = (fn, v) => { if (done) return; done = true; clearTimeout(timer); setTimeout(() => { try { ts.remove(id); } catch(e){} box.style.display = 'none'; }, 0); fn(v); };
    const timer = setTimeout(() => finish(reject, new Error('captcha-timeout')), 90000);
    box.innerHTML = ''; box.style.display = 'block';
    id = ts.render(box, { sitekey: TURNSTILE_SITE_KEY, action: 'signin', appearance: 'interaction-only', language: lang || 'auto',
      callback: tok => finish(resolve, tok),
      'error-callback': code => { finish(reject, new Error('captcha-failed ' + code)); return true; },
      'timeout-callback': () => finish(reject, new Error('captcha-timeout')) });
  });
}
function errBox(id, msg){ const e=$(id); if(!msg){ e.style.display='none'; return; } e.textContent=msg; e.style.display='block'; }
async function doLogin(){
  const code=$('li-code').value.trim(), pass=$('li-pass').value;
  if (!code || !pass) return errBox('li-err', t('fillLogin'));
  const b=$('li-go'); b.disabled=true; b.innerHTML='<div class="spin"></div>';
  let cap; try { cap = await captchaToken('li-cap', LANG === 'ar' ? 'ar' : 'en'); } catch(e){ cap = undefined; }   // check unavailable: Supabase decides (works while its CAPTCHA switch is off)
  const { data, error } = await sb.auth.signInWithPassword({ email: loginName(code), password: pass, options: cap ? { captchaToken: cap } : undefined });
  b.disabled=false; b.textContent=t('signIn');
  if (error) return errBox('li-err', /invalid/i.test(error.message) ? t('wrongLogin') : friendly(error.message));
  errBox('li-err'); tempPass = pass; $('li-pass').value=''; localStorage.setItem('pk_code', code);
  await afterLogin(data.user);
}
function message(txt){ $('msg-body').textContent = txt; $('msg-body').style.whiteSpace = 'pre-line'; show('scr-msg'); }
async function afterLogin(user){
  if (!navigator.onLine){ if (useCache(user.id)) { show('scr-main'); APP.ready=true; renderAll(); return; } return message(t('noCache')); }
  const meRes = await withTimeout(sb.from('app_users').select('*').eq('id', user.id), 15000);
  const { data, error: meErr } = meRes;
  if (serverDown(meRes)) { if (useCache(user.id)) { show('scr-main'); APP.ready=true; renderAll(); return; } return message(t('serverDown')); }
  const me = data && data[0];
  if (!me || !me.role) return message(t('noRole'));
  if (!me.active) return message(t('inactive'));
  if (!me.emp_id) return message(t('notLinked'));
  APP.me = me; PK_ERR.user(me);
  if (me.must_change_password){ ['fl-year','fl-p1','fl-p2'].forEach(i=>$(i).value=''); errBox('fl-err'); show('scr-first'); return; }
  const { data: reg, error: regErr } = await sb.rpc('register_device', { p_device: deviceId(), p_label: deviceLabel() });
  if (regErr || !['ok','registered'].includes(reg)){
    const txt = reg==='other_device' ? t('otherDevice') + '\n\n' + t('attemptLogged') : reg==='device_taken' ? t('deviceTaken') + '\n\n' + t('attemptLogged') : reg==='bad_device' ? t('badDevice') : friendly(regErr ? regErr.message : reg);
    try { await sb.auth.signOut(); } catch(e){}
    return message(txt);
  }
  show('scr-main');
  try { await loadAll(); } catch(e){ if (!useCache(user.id)) throw e; }
  APP.ready = true; renderAll(); flushQueue(); checkAppUpdate(); setTimeout(() => refreshSiteCache(false), 3000); loadSiteRight();
  setupPush(); setupWebPush(); openViewFromLink();
}
async function firstLogin(){
  const yr=$('fl-year').value.trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), a=$('fl-p1').value, b=$('fl-p2').value;
  if (!/^\d{4}$/.test(yr)) return errBox('fl-err', t('needYear'));
  if (a.length < 8) return errBox('fl-err', t('short'));
  if (a !== b) return errBox('fl-err', t('nomatch'));
  if (a === tempPass) return errBox('fl-err', t('sameTemp'));
  const btn=$('fl-go'); btn.disabled=true;
  const { data, error } = await sb.rpc('complete_first_login', { p_nid_last4:null, p_new_password:a, p_birth_year:yr });
  btn.disabled=false;
  if (error) return errBox('fl-err', friendly(error.message));
  if (data !== 'ok' && /year of birth|wrong answers|year you were born/i.test(data)) return errBox('fl-err', friendly(data).replace(/^Enter the year.*$/, t('needYear')));
  if (data !== 'ok') return errBox('fl-err', /do not match/.test(data) ? `${t('nidWrong')} ${t('attempts',{ n: (data.match(/(\d+) attempt/)||[])[1] || '' })}` : /locked/i.test(data) ? t('locked') : /different/.test(data) ? t('sameTemp') : data);
  tempPass=''; toast(t('passSet'));
  const { data: s } = await sb.auth.getSession(); await afterLogin(/** @type {NonNullable<typeof s.session>} — signed in a moment ago */ (s.session).user);
}
async function signOut(){
  try { const tk = localStorage.getItem('pk_push_token'); if (tk) { await sb.rpc('remove_push_token', { p_token: tk }); localStorage.removeItem('pk_push_token'); } } catch(e){}
  try { const ep = localStorage.getItem('pk_push_web'); if (ep) { await sb.rpc('remove_push_token', { p_token: ep }); localStorage.removeItem('pk_push_web');
        const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); } } catch(e){}
  try { if (navigator.onLine) await flushQueue(); } catch(e){}
  try { stopWatch(); } catch(e){}                                           // review fix: background watch ends with the sign-out
  ['pk_cache','pk_watch','pk_leftchk','pk_bgask','pk_sites','pk_offset'].forEach(k => { try { localStorage.removeItem(k); } catch(e){} });
  try { await sb.auth.signOut(); } catch(e){} APP.ready=false; APP.slips = []; location.reload(); }

// ── Documents HR asked for (61-document-requests.sql): the employee answers with a photo of the new card ──
async function loadDocs(){
  try { const r = await sb.from('doc_requests').select('*').eq('emp_id', APP.me.emp_id).neq('status', 'Cancelled').order('requested_at', { ascending:false }).limit(10);
        APP.docs = r.error ? [] : (r.data || []); } catch(e){ APP.docs = []; }
}
// the "📄 Documents HR asked for" card is React since 31 Oct 2026 — react/src/phone/reqcards (📎 keeps data-act="doc-answer" → the React window, submitDocument below)
function renderDocs(){ if (typeof PKM !== 'undefined') PKM.render(); }
// phone photos are made smaller (max 1600 px, JPEG) before sending; PDFs are sent as they are
async function docShrink(file){
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type) || file.size < 900000) return file;
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); /** @type {CanvasRenderingContext2D} — always available for a new canvas */ (c.getContext('2d')).drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type:'image/jpeg' }) : file;
  } catch(e){ return file; }
}
// The "send HR your renewed card" window is React since 1 Nov 2026 — react/src/phone/slipdoc. It uploads through here.
/** @param {string} id — the document request @param {File} picked — the photo or PDF chosen @param {string} expiry — the new card's expiry */
async function submitDocument(id, picked, expiry){
  if (!navigator.onLine) return toast(t('offline'), true);
  try {
    const f = await docShrink(picked);
    if (f.size > 10 * 1024 * 1024) throw new Error(t('docTooBig'));
    const ext = (f.name.match(/\.(\w+)$/) || [, f.type === 'application/pdf' ? 'pdf' : 'jpg'])[1].toLowerCase();
    const path = `${APP.me.emp_id}/${id}/${Date.now()}.${ext}`;
    const up = await sb.storage.from('employee-docs').upload(path, f, { contentType: f.type || undefined, upsert:false });
    if (up.error) throw up.error;
    const { error } = await sb.rpc('submit_document', { p_id: id, p_path: path, p_name: f.name, p_new_expiry: expiry });
    if (error) throw error;
    closeSheet(); toast(t('docSent')); await loadDocs(); renderDocs();
  } catch(e){ toast(friendly(e.message || String(e)), true); }
}

// ── Data HR asks the employee to update + "My contact details" (77-data-update-requests.sql) ──
async function loadDreqs(){
  try { const r = await sb.from('data_requests').select('*').eq('emp_id', APP.me.emp_id).neq('status', 'Cancelled').order('requested_at', { ascending:false }).limit(10);
        APP.dreqs = r.error ? [] : (r.data || []); } catch(e){ APP.dreqs = []; }
  if (!APP.dfields) { try { const f = await sb.rpc('data_fields'); APP.dfields = f.error ? null : /** @type {any[]} — the list of fields employees may update */ (f.data); } catch(e){} }
}
// the "📝 HR asks you to update your data" card is React since 31 Oct 2026 — react/src/phone/reqcards (✏️ keeps data-act="dreq-answer" → the React answer window)
function renderDreqs(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The answer window and "✏️ Update my contact details" are React since 1 Nov 2026 — react/src/phone/mydata. They save through here.
/** @param {string} id @param {Record<string, string>} vals — every field asked, filled in */
async function answerDataRequest(id, vals){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { data, error } = await sb.rpc('answer_data_request', { p_id: id, p_vals: vals });
  if (error) return toast(friendly(error.message), true);
  closeSheet(); toast(data === 'saved' ? t('dreqSaved') : t('dreqSentHR'));
  try { await loadAll(); renderAll(); } catch(e){ await loadDreqs(); renderDreqs(); }
}
/** @param {Record<string, string>} vals — only the changed contact details */
async function saveContact(vals){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('update_my_contact', { p_vals: vals });
  if (error) return toast(friendly(error.message), true);
  closeSheet(); toast(t('contactSaved'));
  try { const r = await sb.from('employees').select('*').eq('id', APP.me.emp_id); if (r.data && r.data[0]) { APP.emp = r.data[0]; saveCache && saveCache(); } } catch(x){}
  renderProfile();
}

// ── Check-outs HR must record (80-checkout-requests.sql) ──
//  · a check-out refused away from the office/site → the try is sent to HR at once; he can add a message
//  · still checked in but away from his office (from 10 min after the check-in): Android background watch (LeaveWatch) +
//    a check each time the app is opened → "left without checking out" sent to HR
async function loadCoReqs(){
  try { const r = await sb.from('checkout_requests').select('*').eq('emp_id', APP.me.emp_id).order('tried_at', { ascending:false }).limit(5);
        APP.coreqs = r.error ? [] : (r.data || []); } catch(e){ APP.coreqs = []; }
}
function renderCoReqs(){ if (typeof PKM !== 'undefined') PKM.render(); }   // the 🚪 card is React (react/src/phone/homecards)
function coSheet(head, c){
  sheet(`<h2>${esc(t(c.kind === 'left' ? 'coLeftTitle' : 'coTitleSheet'))}</h2>${head || ''}
    <div class="field"><label>${esc(t('coMsgLabel'))}</label><textarea id="co-msg" maxlength="500" placeholder="${esc(t('coMsgPh', { t: c.local_time || '' }))}">${esc(c.message || '')}</textarea></div>
    <div class="row"><button class="btn ghost" data-act="close">${esc(t('coLater'))}</button><button class="btn" id="co-go">${esc(t('coSendMsg'))}</button></div>`);
  $('co-go').onclick = async () => {
    const m = $('co-msg').value.trim(); if (!m) return toast(t('coNeedMsg'), true);
    if (!navigator.onLine) return toast(t('offline'), true);
    const b = $('co-go'); b.disabled = true;
    const { error } = await sb.rpc('checkout_request_message', { p_id: c.id, p_message: m });
    b.disabled = false; if (error) return toast(friendly(error.message), true);
    closeSheet(); toast(t('coMsgSent')); await loadCoReqs(); renderCoReqs();
  };
}
async function reportAwayCheckout(g, refusal){
  let r;
  try { r = await sb.rpc('report_away_checkout', { p_lat: g.lat, p_lng: g.lng, p_acc: g.accuracy, p_kind: 'tried' }); } catch(e){ r = { error: e }; }
  if (!r || r.error || !r.data) return toast(refusal + (r && r.error && /TOO_SOON/.test(String(r.error.message || '')) ? ' ' + t('coTooSoon') : ''), true);
  await loadCoReqs(); renderCoReqs();
  const rd = /** @type {CheckoutReport} — checked two lines above */ (r.data);
  const c = (APP.coreqs || []).find(x => x.id === rd.id) || { id: rd.id, kind: rd.kind || 'tried', local_time: rd.time, place: rd.place };
  coSheet(`<div class="hint" style="color:var(--text)">${esc(refusal)}</div><div class="state on" style="text-align:start;margin-bottom:12px">✅ ${esc(t('coToldHR', { t: r.data.time || '', place: r.data.place || '' }))}</div>`, c);
}
const LW = () => PLATFORM === 'android' ? nativePlugin('LeaveWatch') : null;
function distM(a, b, c, d){ const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 2 * 6371000 * Math.asin(Math.sqrt(h)); }
function stopWatch(){ APP.watch = null; store.set('pk_watch', null); const P = LW(); if (P) { try { P.stop(); } catch(e){} } }
async function armWatch(){
  const o = APP.status && APP.status.open; if (!o || !navigator.onLine || !sb || !APP.me) return;
  const key = `${o.date} ${o.in}`, w = store.get('pk_watch', null);
  if (APP.watch && w && w.period === key && w.uid === APP.me.id && Date.now() - w.at < 6 * 3600e3) return;
  let r; try { r = await sb.rpc('checkout_watch'); } catch(e){ return; }
  if (!r || r.error || !r.data) { APP.watch = null; return; }
  APP.watch = r.data; store.set('pk_watch', { period: key, uid: APP.me.id, at: Date.now() });
  const P = LW(); if (!P) return;
  try {
    await P.start({ token: r.data.token, url: SUPABASE_URL, key: SUPABASE_KEY, offices: JSON.stringify(r.data.offices || []),
                    fromMs: Number(r.data.from_ms), untilMs: Number(r.data.until_ms), title: t('lwTitle'), body: t('lwBody') });
    const s = await P.status();
    if (s && !s.background && !sheetOpen() && Date.now() - store.get('pk_bgask', 0) > 3 * 864e5) {
      store.set('pk_bgask', Date.now());
      sheet(`<h2>📍 ${esc(t('lwAskTitle'))}</h2><div class="hint" style="color:var(--text);white-space:pre-line">${esc(t('lwAskBody'))}</div>
        <div class="row"><button class="btn ghost" data-act="close">${esc(t('coLater'))}</button><button class="btn" id="lw-set">${esc(t('lwOpenSettings'))}</button></div>`);
      $('lw-set').onclick = async () => { closeSheet(); try { await P.openSettings(); } catch(e){} };
    }
  } catch(e){}
}
async function locationAllowed(){
  try {
    if (NATIVE) { const G = nativePlugin('Geolocation'); const p = G && await G.checkPermissions(); return !!p && p.location === 'granted'; }
    if (navigator.permissions && navigator.permissions.query) { const p = await navigator.permissions.query({ name: 'geolocation' }); return p.state === 'granted'; }
  } catch(e){}
  return false;
}
async function leftCheck(){
  const o = APP.status && APP.status.open, w = APP.watch;
  if (!o || !w || !navigator.onLine || Date.now() < Number(w.from_ms) || Date.now() > Number(w.until_ms)) return;
  if ((APP.coreqs || []).some(c => c.status === 'Waiting' && c.att_date === o.date && c.seg_in === o.in)) return;
  if (Date.now() - store.get('pk_leftchk', 0) < 20 * 60e3) return;
  if (!(await locationAllowed())) return;                    // never ask for the location just for this
  store.set('pk_leftchk', Date.now());
  const g = await getLocation(); if (g.err || g.lat == null) return;
  const near = Math.min(...(w.offices || []).map(f => distM(g.lat, g.lng, f.lat, f.lng) - f.radius - Math.min(g.accuracy || 0, 150)));
  if (!(near > 0)) return;
  let r; try { r = await sb.rpc('report_away_checkout', { p_lat: g.lat, p_lng: g.lng, p_acc: g.accuracy, p_kind: 'left' }); } catch(e){ return; }
  if (!r || r.error || !r.data) return;
  await loadCoReqs(); renderCoReqs();
  if (sheetOpen()) return;
  const c = (APP.coreqs || []).find(x => x.id === r.data.id) || { id: r.data.id, kind: 'left', local_time: r.data.time, place: r.data.place };
  coSheet(`<div class="state warn" style="text-align:start;margin-bottom:12px">🚶 ${esc(t('coLeftNow', { place: r.data.place || '', t: r.data.time || '' }))}</div>`, c);
}
// ── 91: trusted employees (chosen by HR) save a project's map point where they stand ──
async function loadSiteRight(){
  if (!navigator.onLine || !APP.ready) return;
  try { const { data, error } = await withTimeout(sb.rpc('can_set_site_points'), 8000); if (!error) APP.canSetSite = data === true; } catch(e) {}
  renderSpCard();
}
function renderSpCard(){ if (typeof PKM !== 'undefined') PKM.render(); }   // the 📍 card is React (react/src/phone/homecards)
let spT;
function spSheet(){
  sheet(`<h2>📍 ${esc(t('spTitle'))}</h2><div class="hint">${esc(t('spPickHint'))}</div>
    <div class="field" style="margin-top:10px"><input id="sp-q" placeholder="${esc(t('searchSite'))}" autocomplete="off"></div>
    <div id="sp-res"><div class="hint">${esc(t('typeMore'))}</div></div>`);
  $('sp-q').addEventListener('input', () => { clearTimeout(spT); spT = setTimeout(spSearch, 300); });
}
async function spSearch(){
  const q = $('sp-q').value.trim(), box = $('sp-res');
  if (q.length < 2) { box.innerHTML = `<div class="hint">${esc(t('typeMore'))}</div>`; return; }
  let data, error;
  try { ({ data, error } = await withTimeout(sb.rpc('site_point_search', { p_q: q }), 8000)); } catch(e) { error = { message: t('serverDown') }; }
  if (error) { box.innerHTML = `<div class="hint neg">${esc(friendly(error.message))}</div>`; return; }
  box.innerHTML = (data || []).map(p => `<button class="site" data-sp="${esc(p.id)}" data-name="${esc(p.name || '')}" data-has="${p.has_point ? 1 : ''}" data-by="${esc(p.set_by || '')}" data-at="${esc(String(p.set_at || '').slice(0, 10))}">
      <b>${esc(p.name || p.id)}</b><span>${esc(p.id)} · ${p.has_point ? '📍 ' + esc(t('spHas', { by: p.set_by || '—', d: p.set_at ? dShort(String(p.set_at).slice(0, 10)) : '—' })) : esc(t('spNone'))}</span></button>`).join('')
    || `<div class="hint">${esc(t('noSites'))}</div>`;
}
function spPick(d){
  const site = d.name || d.sp;
  sheet(`<h2>📍 ${esc(site)}</h2><div class="hint">${esc(d.sp)}</div>
    ${d.has ? `<div class="hint" style="color:var(--warn,#b45309);margin-top:8px">⚠ ${esc(t('spReplace', { by: d.by || '—', d: d.at ? dShort(d.at) : '—' }))}</div>` : ''}
    <div class="field" style="margin-top:12px"><input id="sp-note" maxlength="300" placeholder="${esc(t('spNote'))}"></div>
    <button class="btn green big" id="sp-save">${esc(t('spSaveHere'))}</button>`);
  $('sp-save').onclick = () => spSave(d.sp, site);
}
async function spSave(code, site){
  const btn = $('sp-save'), label = btn.textContent;
  btn.disabled = true; btn.innerHTML = `<div class="spin"></div> ${esc(t('spGetting'))}`;
  const g = await getLocation(true);
  if (g.err) { btn.disabled = false; btn.textContent = label; return locationHelp(g.err, () => spPick({ sp: code, name: site })); }
  btn.innerHTML = `<div class="spin"></div> ${esc(t('sending'))}`;
  let res;
  try { res = await withTimeout(sb.rpc('set_site_point_here', { p_project: code, p_lat: g.lat, p_lng: g.lng, p_accuracy: g.accuracy,
          p_mock: typeof g.mock === 'boolean' ? g.mock : null, p_client_kind: clientKind(), p_note: ($('sp-note') && $('sp-note').value.trim()) || null }), 15000); }
  catch(e) { res = { error: { message: t('serverDown') } }; }
  if (res.error) { btn.disabled = false; btn.textContent = label; return toast(friendly(res.error.message), true); }
  closeSheet(); toast(t('spSaved', { site, acc: g.accuracy }));
}

async function afterStatus(){
  const o = APP.status && APP.status.open;
  if (!o) { if (APP.watch || store.get('pk_watch', null)) stopWatch(); return; }
  await armWatch(); await leftCheck();
}

// ── iPhone notifications (web app on the Home Screen; 60-push-iphone.sql + edge function send-push) ──
const webPushOK = () => !NATIVE && location.protocol === 'https:' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && isStandalone();
const b64ToBytes = s => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, c => c.charCodeAt(0)); };
function renderPushCard(){ if (typeof PKM !== 'undefined') PKM.render(); }   // the 🔔 card is React (react/src/phone/homecards)
async function webSubscribe(ask){
  const { data: key } = await sb.rpc('push_web_key');
  if (!key) { if (ask) toast(t('pushNotReady')); return false; }
  if (ask && Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  const want = b64ToBytes(key), have = sub && sub.options && sub.options.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
  if (sub && have && (have.length !== want.length || have.some((b, i) => b !== want[i]))) { await sub.unsubscribe(); sub = null; }   // key changed
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: want });
  const { error } = await sb.rpc('save_push_web', { p_sub: /** @type {Json} */ (sub.toJSON()), p_lang: LANG });
  if (error) throw error;
  localStorage.setItem('pk_push_web', sub.endpoint);
  return true;
}
async function enableWebPush(btn){
  if (btn) btn.disabled = true;
  try { if (await webSubscribe(true)) toast(t('pushDone')); } catch(e){ toast(friendly(e.message || String(e))); }
  if (btn) btn.disabled = false;
  renderPushCard();
}
async function setupWebPush(){
  if (!webPushOK()) return;
  try { if (Notification.permission === 'granted') await webSubscribe(false); } catch(e){ console.warn('web push', e); }
  renderPushCard();
}
// a tapped notification opens the right tab (from the service worker, or a new window opened at #view=…)
function openViewFromLink(){
  const m = /#view=(\w+)/.exec(location.hash || ''); if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (document.getElementById('v-' + m[1])) go(m[1]);
}
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'open-view' || !APP.ready) return;
  if (document.getElementById('v-' + e.data.view)) go(e.data.view);
  loadAll().then(renderAll).catch(()=>{});
});

// ── Phone notifications (Android app only, 59-push-notifications.sql + edge function send-push) ──
// Asks once for permission, registers the phone with Firebase, saves its token for the signed-in user (with the app
// language), and opens the right tab when a notification is tapped. The web/iPhone version is not affected.
let pushReady = false;
async function setupPush(){
  if (pushReady || !NATIVE || PLATFORM !== 'android') return;
  const P = nativePlugin('PushNotifications'); if (!P) return;
  pushReady = true;
  try {
    try { await P.createChannel({ id:'petrokima', name:'Petrokima HR', description:'Requests, approvals and announcements', importance:5, visibility:1, sound:'default', vibration:true }); } catch(e){}
    await P.addListener('registration', async t => {
      try { const r = await sb.rpc('save_push_token', { p_token: t.value, p_platform: 'android', p_lang: LANG }); if (!r.error) localStorage.setItem('pk_push_token', t.value); } catch(e){}
    });
    await P.addListener('registrationError', e => console.warn('push registration', e && e.error));
    await P.addListener('pushNotificationReceived', n => {                           // app open: show it inside the app
      toast(((n && n.title) || '') + (n && n.body ? ' — ' + n.body : ''));
      if (APP.ready) loadAll().then(renderAll).catch(()=>{});
    });
    await P.addListener('pushNotificationActionPerformed', a => {                    // notification tapped
      const v = a && a.notification && a.notification.data && a.notification.data.view;
      const open = () => { if (v && document.getElementById('v-' + v)) go(v); loadAll().then(renderAll).catch(()=>{}); };
      if (APP.ready) open(); else setTimeout(() => { if (APP.ready) open(); }, 2500);
    });
    let perm = await P.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') perm = await P.requestPermissions();
    if (perm.receive !== 'granted') return;
    await P.register();
  } catch(e){ console.warn('push setup', e); }
}

// ═════════════════════════════════════════════════════════
//  DATA
// ═════════════════════════════════════════════════════════
async function refreshSiteCache(force){
  try {
    const c = store.get('pk_sites', null), uid = APP.me && APP.me.id;
    if (!force && c && c.uid === uid && Date.now() - (c.at || 0) < 24 * 3600 * 1000) return;
    const list = [];
    for (let from = 0; from < 50000; from += 1000){
      const { data, error } = await sb.rpc('sites_for_offline').range(from, from + 999);
      if (error) return; (data || []).forEach(p => list.push([p.id, p.name || '']));
      if (!data || data.length < 1000) break;
    }
    store.set('pk_sites', { uid, at: Date.now(), list });
  } catch(e) { /* keep the previous list */ }
}
async function loadAll(){
  const id = APP.me.emp_id;
  const all = async (q) => { const r = await q; return r.data || []; };
  const [set, hol, emp, lv, pm, rq, sl, mg, tm, tlv, tpm, myp, myt, ann, rd, fb, hire, train, bday, inbox, acts, vels, sal, hra, lbal] = await Promise.all([
    all(sb.from('settings').select('*').eq('key','payroll')),
    all(sb.from('public_holidays').select('date')),
    all(sb.from('employees').select('*').eq('id', id)),
    all(sb.from('employee_leaves').select('*').eq('emp_id', id).order('date_from', { ascending:false })),
    all(sb.from('attendance_permissions').select('*').eq('emp_id', id).order('date', { ascending:false })),
    all(sb.from('hr_requests').select('*').eq('emp_id', id).order('created_at', { ascending:false })),
    Promise.resolve([]),                                   // payslips are loaded only after the password (payslipUnlock)
    sb.rpc('my_manager').then(r => r.data || [], () => []),
    all(sb.from('allowance_approvals').select('*').eq('manager_id', id).order('submitted_at', { ascending:false })),
    all(sb.from('employee_leaves').select('*').eq('manager_id', id).order('date_from', { ascending:false }).limit(60)),
    all(sb.from('attendance_permissions').select('*').eq('manager_id', id).order('date', { ascending:false }).limit(60)),
    sb.rpc('my_projects').then(r => r.data || [], () => []),
    sb.rpc('my_team').then(r => r.data || [], () => []),
    all(sb.from('announcements').select('*').order('created_at', { ascending:false }).limit(60)),
    all(sb.from('announcement_reads').select('ann_id').eq('emp_id', id)),
    all(sb.from('feedback').select('*').eq('emp_id', id).order('created_at', { ascending:false }).limit(100)),
    all(sb.from('hiring_requests').select('*').eq('manager_emp', id).order('created_at', { ascending:false })),
    all(sb.from('training_requests').select('*').eq('manager_emp', id).order('created_at', { ascending:false })),
    sb.rpc('my_birthday_today').then(r => !!r.data, () => false),
    APP.me.receives_feedback ? sb.rpc('feedback_inbox').then(r => r.data || [], () => []) : Promise.resolve([]),
    all(sb.from('manager_actions').select('*').order('created_at', { ascending:false }).limit(100)),
    sb.rpc('variable_elements').then(r => r.data || [], () => []),
    APP.me.board_approver ? all(sb.from('salary_change_requests').select('*').order('created_at', { ascending:false }).limit(50)) : Promise.resolve([]),
    sb.rpc('hr_alerts').then(r => Array.isArray(r.data) ? r.data : [], () => []),
    sb.rpc('leave_balance').then(r => r.error ? null : r.data, () => null) ]);
  if (set[0] && set[0].value) S = { ...S, ...set[0].value };
  HOL = new Set(hol.map(h => h.date));
  APP.emp = emp[0] || null; APP.leaves = lv; APP.perms = pm; APP.reqs = rq; if (!APP.payUnlocked) APP.slips = []; APP.manager = mg[0] || null; APP.team = tm || []; APP.myProjects = myp || []; APP.myTeam = myt || [];
  APP.varElements = vels || []; APP.salReqs = (sal || []).filter(r => r.emp_id !== id);
  APP.hra = hra || []; APP.lbal = lbal || null;
  APP.news = ann || []; APP.newsRead = new Set((rd || []).map(x => x.ann_id)); APP.birthday = !!bday;
  APP.myFeedback = fb || []; APP.inbox = inbox || [];
  APP.myActions = (acts || []).filter(a => a.manager_emp === id); APP.boardActions = APP.me.board_approver ? (acts || []).filter(a => a.manager_emp !== id && a.emp_id !== id) : [];
  APP.mgrReqs = [...(hire || []).map(r => ({ kind:'hire', r })), ...(train || []).map(r => ({ kind:'train', r })), ...(APP.myActions || []).map(r => ({ kind:'act', r }))].sort((a,b) => String(b.r.created_at).localeCompare(String(a.r.created_at)));
  APP.teamReq = [...(tlv||[]).filter(l => l.emp_id !== id).map(r => ({ kind:'leave', r })), ...(tpm||[]).filter(p => p.emp_id !== id).map(r => ({ kind:'perm', r }))];
  await loadDocs();
  await loadDreqs();
  await loadCoReqs();
  await loadMissionsP();
  await loadStatus();
  afterStatus().catch(() => {});
}
async function loadStatus(){
  const { data, error } = await sb.rpc('my_clock_status');
  if (error) throw error;
  APP.status = data; APP.statusAt = Date.now(); APP.offline = false; APP.updatedAt = Date.now();
  if (data && data.server_ts) store.set('pk_offset', { off: Number(data.server_ts) - Date.now(), at: Date.now() });
  applyQueueToStatus();
  const cyc = cycleOf(APP.status ? APP.status.date : todayStr());
  const r = await sb.from('attendance').select('*').eq('emp_id', APP.me.emp_id).gte('date', periodStart(cyc)).lte('date', periodEnd(cyc)).order('date', { ascending:false });
  APP.att = r.data || [];
  saveCache();
}

// ═════════════════════════════════════════════════════════
//  HOME — check in / out
// ═════════════════════════════════════════════════════════
function serverNowMin(){ const st=APP.status; if(!st) return null; if (APP.offline) { const p=localParts(serverNowMs()); return toMin(p.time) + new Date().getSeconds()/60; } return toMin(st.now) + (Date.now()-APP.statusAt)/60000; }
// every 15 s (and after each redraw): the React clock card reads the time again — the big time, how long I have been in, and
// "undo check-out" disappearing when its 5 minutes are over (react/src/phone/clock)
function tick(){ if (typeof PKM !== 'undefined') PKM.render(); }
// until when the last check-out may still be undone (0 = not any more) — the React clock card shows ↩ while it is set
function undoUntil(st){ return st && st.undo && Number(st.undo.until_ms) > serverNowMs() ? Number(st.undo.until_ms) : 0; }
async function undoCheckout(btn){
  const st = APP.status || /** @type {ClockStatus} */ ({}); if (!st.undo) return;
  if (btn){ btn.disabled = true; btn.innerHTML = `<div class="spin"></div>`; }
  const { error } = await sb.rpc('undo_checkout', { p_event: st.undo.id });
  try { await loadStatus(); } catch(e){}
  renderHome();
  if (error) return toast(friendly(error.message), true);
  toast(t('undoneOut'));
}
// Home is React (react/src/phone: clock = the clock card, homecards = the cards around it, homelists = Today + This payroll month);
// it reads APP.status, APP.att, the queue and the flags below. Checking in / out, GPS, the queue and reading stay here.
function renderHome(){ tick(); }
// site picker — the window is React (react/src/phone/sitepick: "Where are you working?"); kept here: which site was chosen (pickSel: its name
// goes with a check-in saved on the phone), the server search and starting the check-in
let pickSel = null;
function openSitePicker(mode){
  pickSel = null; closeSheet();
  if (typeof PKM !== 'undefined') PKM.openWindow('sitePick', { id: mode });
}
/** the site search: results, a refusal in friendly words, or "no internet" (no connection, a network failure, no answer in 8 s — the
 *  window then searches the list saved on the phone) @param {string} q @returns {Promise<{ data: any[] } | { error: string } | { offline: true }>} */
async function findSites(q){
  if (!navigator.onLine) return { offline: true };
  let data, error;
  try { ({ data, error } = await withTimeout(sb.rpc('search_sites', { p_q:q }), 8000)); } catch(e) { return { offline: true }; }
  if (error && /load failed|failed to fetch|network|timeout|timed out|fetch/i.test(error.message || '')) return { offline: true };
  if (error) return { error: friendly(error.message) };
  return { data: data || [] };
}
/** check in at the site chosen in the window (its name is kept for a check-in saved on the phone)
 *  @param {string} code @param {string} name @param {boolean} isSwitch @param {(p: '' | 'loc' | 'send') => void} phase */
function checkInAt(code, name, isSwitch, phase){ pickSel = { code, name }; return clock('in', code, null, isSwitch, phase); }
async function nativeLocation(fresh){
  const G = nativePlugin('Geolocation');
  try {
    let perm = await G.checkPermissions();
    if (perm.location !== 'granted') perm = await G.requestPermissions({ permissions:['location'] });
    if (perm.location === 'denied') return { err:1 };
    const p = await G.getCurrentPosition({ enableHighAccuracy:true, timeout: navigator.onLine ? 15000 : 30000, maximumAge: fresh ? 0 : 60000 });
    const out = { lat:p.coords.latitude, lng:p.coords.longitude, accuracy:Math.round(p.coords.accuracy), mock:null };
    // Android app: ask the phone whether this location came from a fake-location app
    const LG = PLATFORM === 'android' ? nativePlugin('LocationGuard') : null;
    if (LG) { try { const r = await Promise.race([ LG.inspect(), new Promise(res => setTimeout(() => res(null), 3000)) ]); if (r && typeof r.mock === 'boolean' && r.checked !== 0) out.mock = r.mock; /* nothing inspected = unknown */ } catch(e) {} }
    return out;
  } catch(e){
    const m = String((e && (e.message || e.code)) || e);
    return { err: /denied|permission/i.test(m) ? 1 : /disabled|services|not enabled/i.test(m) ? 1 : /time/i.test(m) ? 3 : 2 };
  }
}
function getLocation(fresh){
  if (NATIVE && nativePlugin('Geolocation')) return nativeLocation(fresh);
  return new Promise(res => {
    if (!navigator.geolocation) return res({ err:1 });
    navigator.geolocation.getCurrentPosition(p => res({ lat:p.coords.latitude, lng:p.coords.longitude, accuracy:Math.round(p.coords.accuracy) }),
      e => res({ err: (e && e.code) || 2 }), { enableHighAccuracy:true, timeout: navigator.onLine ? 15000 : 30000, maximumAge: fresh ? 0 : 60000 });
  });
}
// "📍 Location is required" is React (react/src/phone/sitepick); Try again runs the step that asked for the location
/** @param {number} code — 1 refused, 2 not available, 3 timed out @param {() => void} retry */
function locationHelp(code, retry){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('locHelp', { id: String(code), retry }); }
// phase: the React "check in without a project" button shows the progress (getting the location / sending), as an old button did
/** @param {'in' | 'out'} type @param {string | null} code @param {any} [btn] @param {boolean} [isSwitch] @param {(p: '' | 'loc' | 'send') => void} [phase] */
async function clock(type, code, btn, isSwitch, phase){
  const wasOpen = !!(APP.status && APP.status.open), label = btn ? btn.textContent : '';
  if (btn){ btn.disabled=true; btn.innerHTML = `<div class="spin"></div> ${esc(t('gettingLoc'))}`; }
  const g = await getLocation();
  if (btn){ btn.disabled=false; btn.textContent = label; }
  if (phase) phase('');
  if (g.err && !(APP.status && APP.status.no_location_ok)) return locationHelp(g.err, () => { closeSheet(); clock(type, code, null, isSwitch); });
  if (g.err) { g.lat = null; g.lng = null; g.accuracy = null; }       // allowed by an exception the admin set — the server marks it
  const tapAt = new Date().toISOString();          // the moment the employee checked in (not when the server answered)
  const upTap = await upTime();                     // 92: the phone's counter at the same moment
  const rec = { client_id: uid(), emp_id: APP.me.emp_id, event_type:type, project_code: code || null, device_id: deviceId(), lat:g.lat, lng:g.lng, accuracy:g.accuracy,
                device: (navigator.userAgent || '').slice(0, 150), mock_location: typeof g.mock === 'boolean' ? g.mock : null, client_kind: clientKind(), ...(isSwitch ? { is_switch:true } : {}) };   // review: switch flag (night shift)
  const pendingBefore = queue().length;
  if (navigator.onLine && !pendingBefore){
    if (btn){ btn.disabled = true; btn.innerHTML = `<div class="spin"></div> ${esc(t('sending'))}`; }
    if (phase) phase('send');
    const res = await withTimeout(insertClock(rec), 15000);
    if (btn){ btn.disabled = false; btn.textContent = label; }
    if (phase) phase('');
    if (!res.error){ closeSheet(); if (type === 'in') APP.cameBack = false; try { await loadStatus(); } catch(e){} renderHome(); afterStatus().catch(() => {}); return toast(type==='out' ? t('doneOut') : wasOpen ? t('doneSwitch') : t('doneIn')); }
    if (!serverDown(res)) {                                                         // a real refusal (wrong site, no location…) — tell the employee
      const msg = friendly(res.error.message);
      if (type === 'out' && /OUTSIDE_SITE/.test(String(res.error.message || '')) && g.lat != null) { closeSheet(); return reportAwayCheckout(g, msg); }   // 80: HR is told at once
      return toast(msg, true);
    }
  }
  // no internet, server not reachable, or older check-ins still waiting: keep it on the phone, in order
  const q = queue();
  q.push({ ...rec, offline:true, client_at: tapAt, ...(upTap ? { mono_tap_ms: upTap.ms, boot_tap: upTap.boot } : {}), _name: code ? ((pickSel && pickSel.name) || code) : '' });
  store.set('pk_queue', q);
  if (type === 'in') APP.cameBack = false;
  applyEvent(APP.status, q[q.length-1]); saveCache(); closeSheet(); renderHome();
  if (type === 'out') stopWatch();
  toast(t('queued'));
  if (navigator.onLine) flushQueue();
}
// Show saved-but-unsent check-ins on the home screen as if they were already recorded
// Apply ONE saved check-in to what the home screen shows
function applyEvent(st, ev){
  if (!st) return; st.today = st.today || [];
  const p = localParts(new Date(ev.client_at).getTime() + clockOffset());
  const close = () => { if (st.open){ const seg = st.today.find(x => x.in === st.open.in && (x.code||'') === (st.open.code||'') && !x.out); if (seg){ seg.out = p.time; seg.hours = Math.max(0, (toMin(p.time)-toMin(seg.in))/60); } st.open = null; } };
  if (ev.event_type === 'in'){ close(); const seg = { code: ev.project_code || '', name: ev._name || null, in: p.time, out: null, hours: 0, pending: true };
    st.today.push(seg); st.open = { ...seg, date: p.date }; }
  else close();
}
// After fresh data arrives from the server, re-apply everything still waiting to be sent
function applyQueueToStatus(){ queue().forEach(ev => applyEvent(APP.status, ev)); }
let refreshing = false;
async function doRefresh(){
  if (refreshing || !APP.ready) return;
  if (!navigator.onLine) return toast(t('offline'), true);
  refreshing = true; $('rf-ic').classList.add('spinning');
  try { await flushQueue(); await loadAll(); renderAll(); toast(t('refreshed')); }
  catch(e){ toast(friendly(e.message), true); }
  refreshing = false; $('rf-ic').classList.remove('spinning');
}
// Pull down on the screen to refresh (the iPhone home-screen app has no built-in pull-to-refresh)
(function pullToRefresh(){
  let y0 = null, dy = 0;
  const ptr = () => $('ptr');
  document.addEventListener('touchstart', e => { if (!APP.ready || sheetOpen() || window.scrollY > 0 || !$('scr-main').classList.contains('on')) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; }, { passive:true });
  document.addEventListener('touchmove', e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy <= 0) { ptr().style.height='0'; return; }
    const h = Math.min(70, dy * 0.5); ptr().style.height = h + 'px'; $('ptr-tx').textContent = dy > 110 ? t('release') : t('pull'); $('ptr-ic').style.transform = `rotate(${dy*2}deg)`; }, { passive:true });
  document.addEventListener('touchend', async () => { if (y0 === null) return; const go = dy > 110; y0 = null;
    if (!go) { ptr().style.height='0'; return; }
    $('ptr-tx').textContent = t('refreshing'); $('ptr-ic').classList.add('spinning');
    await doRefresh(); $('ptr-ic').classList.remove('spinning'); ptr().style.height='0'; });
})();
let flushing = false;
async function flushQueue(){
  if (flushing || !navigator.onLine || !sb || !APP.me) return;
  let q = queue(); if (!q.length || q[0]._err) return;
  flushing = true; let sent = 0, failed = false;
  try {
    while (q.length && !q[0]._err){
      const { _name, _err, _off, _applied, ...rec } = q[0];
      const upSend = rec.mono_tap_ms != null ? await upTime() : null;          // 92: counter again at sending → real tap time
      const res = await withTimeout(insertClock({ ...rec, device_now: new Date().toISOString(), ...(upSend ? { mono_send_ms: upSend.ms, boot_send: upSend.boot } : {}) }), 15000);   // the server compares the clocks
      const error = res.error;
      // review fix: always work on the CURRENT saved queue (a tap made while sending must not be lost)
      const dropQ = id => { const cur = queue().filter(e => e.client_id !== id); store.set('pk_queue', cur); return cur; };
      if (error && alreadyHave(error)) { q = dropQ(rec.client_id); sent++; continue; }   // it arrived earlier — the answer was lost
      if (error && serverDown(res)) break;                                  // still no connection / server still down: try later
      if (error){ const cur = queue(), it = cur.find(e => e.client_id === rec.client_id); if (it) it._err = friendly(error.message); store.set('pk_queue', cur); q = cur; failed = true; break; }   // keep it visible, stop here
      q = dropQ(rec.client_id); sent++;
    }
  } catch(e){ /* offline again — everything stays saved */ }
  flushing = false;
  if (sent || failed){
    try { await loadStatus(); } catch(e){}
    renderHome();
    toast(failed ? t('notRecorded') : t('sentNow', { n: sent }), failed);
  }
}
// "Discard this saved check-in?" and "Check out now?" are React (react/src/phone/clockwin); kept here: removing a saved check-in
function discardSaved(id){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('discard', { id }); }
function confirmOut(){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('confirmOut'); }
/** Discard: only that check-in leaves the phone (HR records it by hand); the status is read again @param {string} id */
async function dropSaved(id){ store.set('pk_queue', queue().filter(ev => ev.client_id !== id)); closeSheet(); try { await loadStatus(); } catch(e){} renderHome(); }

// ═════════════════════════════════════════════════════════
//  REQUESTS
// ═════════════════════════════════════════════════════════
const annualTypes = () => S.casualCountsAnnual==='no' ? ['Annual'] : ['Annual','Casual'];
function yearDays(types, status){ const y=todayStr().slice(0,4); return APP.leaves.filter(l=>types.includes(l.leave_type)&&l.status===status).reduce((s,l)=>s+leaveDaysIn(l,`${y}-01-01`,`${y}-12-31`),0); }
function entitlement(){ const e=APP.emp; return (e && e.annual_leave_days!==null && e.annual_leave_days!==undefined) ? num(e.annual_leave_days) : num(S.annualLeaveDefault); }
const reqStage = r => r.status==='Pending' && r.manager_status==='Pending' ? 'Waiting for manager' : r.status==='Pending' && r.manager_status==='Approved' ? 'Waiting for HR' : r.status;
// when a request was sent, in the phone's language
const sentAt = ts => ts ? new Date(ts).toLocaleString(LANG==='ar' ? 'ar-EG' : 'en-GB', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '';
// latest time to ask for a late-arrival permission: shift start + the allowed minutes (Settings)
function lateDeadline(){ const [h,m] = String(S.shiftStart || '08:00').split(':').map(Number); const tot = h*60 + m + (Number(S.permDeadlineMin) || 30);
  return `${String(Math.floor(tot/60)%24).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`; }
// The figures at the top of the Requests tab and "My requests" are React since 31 Oct 2026 — react/src/phone/requests. Kept here:
// the leave arithmetic above (also used by the request windows), the windows, Cancel (data-cancel → the React window, cancelRequest below) and the mission
// notice (renderMisAck, added by the wrapper below).
function renderRequests(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The vacation, permission and HR request windows are React since 1 Nov 2026 — react/src/phone/reqwin. They send through here.
/** @param {'attendance_permissions' | 'employee_leaves' | 'hr_requests'} table — where the request is saved @param {any} rec */
async function sendRequest(table, rec){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { data, error } = await sb.from(table).insert(rec).select();
  if (error || !(data && data.length)) return toast(friendly(error ? error.message : 'Not allowed'), true);
  closeSheet(); toast((table==='employee_leaves' || table==='attendance_permissions') && /** @type {{ manager_status?: string }} — only leaves and permissions have a manager step */ (data[0]).manager_status==='Pending' ? t('sentMgr') : t('sent')); await loadAll(); renderAll();
}
// The "Cancel this request?", reject and HR-alert windows are React since 1 Nov 2026 — react/src/phone/decide. They act through here.
/** @param {string} key — leave:<id> / perm:<id> / req:<id> / mis:<id> */
async function cancelRequest(key){
  const [k,id]=key.split(':'), table=/** @type {Record<string, 'employee_leaves' | 'attendance_permissions' | 'hr_requests'>} */ ({ leave:'employee_leaves', perm:'attendance_permissions', req:'hr_requests' })[k];
  if (k === 'mis') { const { error } = await sb.rpc('cancel_mission', { p_id:id }); if (error) return toast(friendly(error.message), true); closeSheet(); toast(t('cancelled')); await loadAll(); renderAll(); return; }
  const { data, error } = await sb.from(table).update({ status:'Cancelled' }).eq('id', id).select();
  if (error || !(data && data.length)) return toast(t('cantCancel'), true);
  closeSheet(); toast(t('cancelled')); await loadAll(); renderAll();
}

// ═════════════════════════════════════════════════════════
//  OUTSIDE MISSIONS (66) — employee → manager → HR · manager assigns → employee acknowledges → HR
// ═════════════════════════════════════════════════════════
function misChip(m, asManager){
  if (m.origin === 'manager' && m.status === 'Waiting for HR')
    return `<span class="chip c-blue">${esc(m.no_app ? t('misNoAppHR') : asManager ? t('misAckedHR') : t('misMyAckedHR'))}</span>`;
  return chip(asManager && m.status === 'Waiting for manager' ? 'Pending' : m.status);
}
const misName = m => (LANG === 'ar' ? (m.emp_name_ar || m.emp_name) : (m.emp_name || m.emp_name_ar))
  || (((APP.myTeam || []).find(x => String(x.id) === String(m.emp_id)) || {})[LANG === 'ar' ? 'name_ar' : 'name_en']) || '';
const misWhen = m => `${niceDate(m.date_from)}${m.date_to !== m.date_from ? ' → ' + niceDate(m.date_to) : ''}${m.time_from ? ' · ' + String(m.time_from).slice(0,5) + '–' + String(m.time_to).slice(0,5) : ''}`;
async function loadMissionsP(){
  const id = APP.me && APP.me.emp_id; if (!id) return;
  try {
    const [mine, team] = await Promise.all([
      sb.from('employee_missions').select('*').eq('emp_id', id).order('created_at', { ascending:false }).limit(60),
      sb.from('employee_missions').select('*').eq('manager_id', id).neq('emp_id', id).order('created_at', { ascending:false }).limit(80)]);
    APP.missions = mine.data || []; APP.teamMissions = team.data || [];
  } catch(e) { APP.missions = APP.missions || []; APP.teamMissions = APP.teamMissions || []; }
}
// the "your manager assigned you a mission" notice is React since 31 Oct 2026 — react/src/phone/reqcards (✋ calls misAck)
function renderMisAck(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The outside-mission window (ask for one / assign one to my team) is React since 1 Nov 2026 — react/src/phone/mission. It sends here.
/** @param {string[] | null} emps — the team members to assign (null = I ask for a mission myself)
 *  @param {{ p_from: string, p_to: string, p_time_from: string | null, p_time_to: string | null, p_place: string, p_purpose: string | null, p_project: string | null }} args */
async function sendMission(emps, args){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = emps ? await sb.rpc('assign_mission', { p_emps:emps, ...args }) : await sb.rpc('request_mission', args);
  if (error) return toast(friendly(error.message), true);
  closeSheet(); toast(emps ? t('misAssigned') : (APP.manager ? t('misSentMgr') : t('misSentHR')));
  await loadMissionsP(); renderAll();
}
async function misAck(id){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('acknowledge_mission', { p_id:id });
  if (error) return toast(friendly(error.message), true);
  toast(t('misAcked')); await loadMissionsP(); renderAll();
}
async function misDecide(id, ok, note){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('manager_decide_mission', { p_id:id, p_approve:ok, p_note: note || null });
  if (error) return toast(friendly(error.message), true);
  closeSheet(); toast(ok ? t('approvedMsg') : t('rejectedMsg')); await loadMissionsP(); renderAll();
}
const _renderRequestsMis = renderRequests;
// @ts-expect-error — renderRequests is deliberately extended here (mission notices)
renderRequests = function(){ _renderRequestsMis.apply(this, arguments); renderMisAck(); };

// ═════════════════════════════════════════════════════════
//  PAYSLIPS & PROFILE
// ═════════════════════════════════════════════════════════
// The Payslips tab (lock screen and list) is React since 31 Oct 2026 — react/src/phone/payslips. Kept here: the password check and
// the reading of the payslips (payslipUnlock, through the React bridge), locking again (lockPayslips; also when the tab is left
// or the screen turns off — go() / visibilitychange) and the payslip window (React since 1 Nov, opened by the data-slip page-wide handler).
function renderPayslips(){ if (typeof PKM !== 'undefined') PKM.render(); }
function lockPayslips(){ APP.payUnlocked = false; APP.slips = []; renderPayslips(); }
/** the payslips need the password every time they are opened: '' = opened, otherwise the message to show @param {string} pw */
async function payslipUnlock(pw){
  if (!navigator.onLine) return t('payNeedNet');
  const email = ((((await sb.auth.getSession()).data || {}).session || {}).user || {}).email || (APP.me && APP.me.email);   // the account signed in right now
  let cap; try { cap = await captchaToken('pay-cap', LANG === 'ar' ? 'ar' : 'en'); } catch(e){ cap = undefined; }
  const { error } = await withTimeout(sb.auth.signInWithPassword({ email: /** @type {string} — if missing, the sign-in simply fails with a message */ (email), password: pw, options: cap ? { captchaToken: cap } : undefined }), 15000);
  if (error) return /invalid|credentials/i.test(error.message) ? t('payWrongPass') : friendly(error.message);
  const r = await withTimeout(sb.from('payroll_run_lines').select('*').eq('emp_id', APP.me.emp_id).order('period', { ascending:false }), 15000);
  if (r.error) return friendly(r.error.message);
  APP.slips = r.data || []; APP.payUnlocked = true; renderPayslips(); return '';
}
// The payslip window (a payslip row, data-slip) is React since 1 Nov 2026 — react/src/phone/slipdoc.
// The Profile tab (profile card + "install the app" card) is React since 31 Oct 2026 — react/src/phone/profile. The buttons keep
// data-act="my-contact" / "install" (handled below, as before).
function renderProfile(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The change-password window is React since 1 Nov 2026 — react/src/phone/slipdoc. It changes the password through here.
/** @param {string} pw — the new password (already checked: 8+ characters, typed twice the same) */
async function changePassword(pw){
  const { error } = await sb.auth.updateUser({ password:pw });
  if (error) return toast(friendly(error.message), true);
  closeSheet(); toast(t('passChanged'));
}
// The ✅ Approvals tab (its tab button + red number, HR alerts, team requests, missions, projects, allowances) is React since
// 1 Nov 2026 — react/src/phone/approvals. Kept here: the decisions (teamReqDecide, teamDecide, misDecide), the project window (teamProjSheet)
// and the data loading. The reject and HR-alert windows are React too (react/src/phone/decide).
function renderTeam(){ if (typeof PKM !== 'undefined') PKM.render(); }
/** @param {{ p_kind: string, p_emp: string, p_ref: string, p_due: string, p_decision: string, p_note: string | null }} args */
async function hraRespond(args){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('hr_alert_respond', args);
  if (error) return toast(friendly(error.message), true);
  const r = await sb.rpc('hr_alerts'); if (Array.isArray(r.data)) APP.hra = r.data;
  closeSheet(); toast(t('hraSaved')); renderTeam(); saveCache();
}
// The team-projects windows (one member's projects + search, "remove — why?") are React since 1 Nov 2026 — react/src/phone/teamproj.
// Kept here: reading his list (the window opens only once it is read, as before), the project search and the save step.
/** @param {string} empId */
async function teamProjSheet(empId){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { data, error } = await sb.rpc('team_projects', { p_emp: empId });
  if (error) return toast(friendly(error.message), true);
  if (typeof PKM !== 'undefined') PKM.openWindow('teamProjects', { id: empId, list: data || [] });
}
/** @param {string} q — at least 2 letters @returns {Promise<any[]>} the projects found (none on an error, as before) */
async function findProjects(q){ const r = await sb.rpc('find_projects', { p_q:q }); return r.data || []; }
// 100: nothing is deleted — a removed project is CLOSED with a reason and kept in the register of closed records
async function teamProjChange(key, add, why){
  const [empId, code] = key.split('|');
  if (!navigator.onLine) return toast(t('offline'), true);
  const res = add ? await sb.from('employee_projects').insert({ emp_id: empId, project_code: code }).select()
                  : await sb.rpc('close_records', { p_tbl: 'employee_projects', p_keys: [{ emp_id: empId, project_code: code }], p_reason: why || '' });
  if (res.error) { return toast(friendly(String(res.error.message).replace(/^.*?\b(NO_DELETE|CLOSE_REASON|NOT_CLOSED|CLOSE_KEYS|CLOSE_TABLE): ?/, '')), true); }
  if (add ? !(Array.isArray(res.data) && res.data.length) : !res.data) return toast(t('notAllowed'), true);
  toast(add ? t('projAdded') : t('projRemoved'));
  const r = await sb.rpc('my_team'); APP.myTeam = r.data || APP.myTeam; saveCache(); renderTeam(); teamProjSheet(empId);
}
async function teamReqDecide(key, approve, note){
  if (!navigator.onLine) return toast(t('offline'), true);
  const [kind, id] = key.split(':');
  const { data, error } = await sb.rpc('manager_decide_request', { p_kind:kind, p_id:id, p_approve:approve, p_note: note || null });
  if (error) return toast(friendly(error.message), true);
  closeSheet(); toast(!approve ? t('rejectedMsg') : /final/.test(data||'') ? t('approvedFinal') : t('approvedMsg'));
  await loadAll(); renderAll();
}
async function teamDecide(id, approve, note){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('manager_decide_allowance', { p_id:id, p_approve:approve, p_note: note || null });
  if (error) return toast(friendly(error.message), true);
  closeSheet(); toast(approve ? t('approvedMsg') : t('rejectedMsg'));
  const r = await sb.from('allowance_approvals').select('*').eq('manager_id', APP.me.emp_id).order('submitted_at', { ascending:false });
  APP.team = r.data || APP.team; saveCache(); renderTeam();
}
// newest Android build: read from our own download page (no limits), GitHub as a fallback
async function latestBuild(){
  if (APK_DOWNLOAD) {
    try { const r = await fetch(APK_DOWNLOAD.replace(/[^/]*$/, '') + '?v=' + Date.now(), { cache:'no-store' });
      if (r.ok) { const m = (await r.text()).match(/1\.0\.(\d+)/); if (m) return Number(m[1]); } } catch(e){}
  }
  if (!APK_REPO) return 0;
  const r = await fetch(`https://api.github.com/repos/${APK_REPO}/releases/latest`, { headers:{ Accept:'application/vnd.github+json' }, cache:'no-store' });
  if (!r.ok) return 0;
  const j = await r.json(); return Number(String(j.tag_name || '').split('.').pop()) || 0;
}
let updChecked = 0;
async function checkAppUpdate(force){
  if (!NATIVE || PLATFORM !== 'android' || !(APK_REPO || APK_DOWNLOAD) || !APP_BUILD || !navigator.onLine) return;
  if (!force && Date.now() - updChecked < 15 * 60 * 1000) return;       // at most every 15 minutes
  updChecked = Date.now();
  try {
    const latest = await latestBuild();
    if (latest > APP_BUILD && !$('upd-bar')){
      document.body.insertAdjacentHTML('afterbegin', `<div id="upd-bar" style="background:var(--brand);color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center;font-size:14px;font-weight:700;padding-top:calc(10px + env(safe-area-inset-top,0px))">
        <span style="flex:1">⬆ ${esc(t('updateAvail'))}</span><a href="${APK_DOWNLOAD || `https://github.com/${APK_REPO}/releases/latest/download/Petrokima.apk`}" style="background:#fff;color:var(--brand);padding:7px 12px;border-radius:10px;text-decoration:none">${esc(t('updateBtn'))}</a></div>`);
    }
  } catch(e){}
}
function renderAll(){ if(!APP.ready) return; const e=APP.emp||/** @type {Employee} */ ({});
  $('me-name').textContent = LANG==='ar' ? (e.name_ar||e.name_en||APP.me.full_name||'') : (e.name_en||e.name_ar||APP.me.full_name||'');
  $('me-meta').textContent = `${APP.me.emp_id}${e.job_name?' · '+e.job_name:''}`;
  renderHome(); renderCoReqs(); renderRequests(); renderDocs(); renderDreqs(); renderTeam(); renderPayslips(); renderProfile(); renderNews(); renderVoice(); }
// ═════════════════════════════════════════════════════════
//  NEWS · BIRTHDAY · COMPLAINTS & SUGGESTIONS · HIRING & TRAINING REQUESTS
// ═════════════════════════════════════════════════════════
const dShort = ts => ts ? new Date(ts).toLocaleDateString(LANG==='ar' ? 'ar-EG' : 'en-GB', { day:'numeric', month:'short', year:'numeric' }) : '';
// The News list and the red number on its tab are React since 31 Oct 2026 — react/src/phone/news. Kept here: marking read when
// the tab opens (markNewsRead) and opening an attachment (data-att, page-wide handler).
function renderNews(){ if (typeof PKM !== 'undefined') PKM.render(); }
async function markNewsRead(){
  const unread = (APP.news || []).filter(a => !APP.newsRead?.has(a.id)); if (!unread.length || !navigator.onLine) return;
  unread.forEach(a => APP.newsRead?.add(a.id)); renderNews();
  await sb.from('announcement_reads').insert(unread.map(a => ({ ann_id:a.id, emp_id:APP.me.emp_id }))).then(() => {}, () => {});
}
async function openAttachment(path){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { data, error } = await sb.storage.from('announcements').createSignedUrl(path, 600);
  if (error || !data) return toast(friendly(error ? error.message : 'Not allowed'), true);
  window.open(data.signedUrl, '_blank');
}
// The voice cards — my complaints & suggestions, the manager's requests to HR, the board member's approvals and the complaints
// inbox — are React since 1 Nov 2026 (react/src/phone/voice). Their buttons keep the old data-… names handled below.
function renderVoice(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The complaint / suggestion, new employees, training and penalty / element windows are React since 1 Nov 2026 —
// react/src/phone/voicewin. They send through here (the item goes to the top of my complaints / my requests to HR).
/** @param {'feedback' | 'hiring_requests' | 'training_requests' | 'manager_actions'} table — where the request is saved @param {any} rec */
async function sendVoice(table, rec){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { data, error } = await sb.from(table).insert(rec).select();
  if (error || !(data && data.length)) return toast(friendly(error ? error.message : 'Not allowed'), true);
  const row = /** @type {any} — the saved row of whichever table */ (data[0]);
  closeSheet();
  if (table === 'feedback') { toast(t('fbSent')); APP.myFeedback = [row, ...(APP.myFeedback || [])]; }
  else { toast(t('sentHR')); APP.mgrReqs = [{ kind: table==='hiring_requests' ? 'hire' : table==='training_requests' ? 'train' : 'act', r:row }, ...(APP.mgrReqs || [])]; }
  renderVoice();
}
// The board member's ✅ / ❌ windows (manager requests, basic-salary changes), a manager's "agree to close" a hiring request and the
// inbox answer are React since 1 Nov 2026 — react/src/phone/answers. They answer through these (the list row is changed here).
/** @param {{ p_id: string, p_approve: boolean, p_note: string | null }} args */
async function boardDecide(args){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('decide_manager_action', args);
  if (error) return toast(friendly(error.message), true);
  const a = (APP.boardActions || []).find(x => x.id === args.p_id); if (a) a.status = args.p_approve ? 'Waiting for HR' : 'Rejected';
  closeSheet(); toast('✓'); renderVoice();
}
/** @param {{ p_id: string, p_approve: boolean, p_note: string | null }} args */
async function salaryDecide(args){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('decide_salary_change', args);
  if (error) return toast(friendly(error.message), true);
  const r = (APP.salReqs || []).find(x => x.id === args.p_id); if (r) r.status = args.p_approve ? 'Approved' : 'Rejected';
  closeSheet(); toast('✓'); renderVoice();
}
/** @param {{ p_id: string, p_note: string | null }} args */
async function closeHire(args){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { data, error } = await sb.rpc('close_hiring_request', args);
  if (error) return toast(friendly(error.message), true);
  const x = (APP.mgrReqs || []).find(m => m.kind==='hire' && m.r.id === args.p_id); if (x){ x.r.mgr_closed = true; if (data === 'Closed') x.r.status = 'Closed'; }
  closeSheet(); toast(data === 'Closed' ? t('closedBoth') : t('waitHrClose')); renderVoice();
}
/** @param {{ p_id: string, p_status: string, p_reply: string | null }} args */
async function answerInbox(args){
  if (!navigator.onLine) return toast(t('offline'), true);
  const { error } = await sb.rpc('answer_feedback', args);
  if (error) return toast(friendly(error.message), true);
  const f = (APP.inbox || []).find(x => x.id === args.p_id); if (f) Object.assign(f, { status:args.p_status, reply:args.p_reply });
  closeSheet(); toast('✓'); renderVoice();
}
document.addEventListener('click', async e => {
  const b = /** @type {HTMLElement} */ (e.target).closest('[data-board]'); if (b) return typeof PKM !== 'undefined' && PKM.openWindow('board', { id: /** @type {string} */ (b.dataset.board), ok: b.dataset.ok === '1' });
  const sb2 = /** @type {HTMLElement} */ (e.target).closest('[data-salb]'); if (sb2) return typeof PKM !== 'undefined' && PKM.openWindow('salary', { id: /** @type {string} */ (sb2.dataset.salb), ok: sb2.dataset.ok === '1' });
  const c = /** @type {HTMLElement} */ (e.target).closest('[data-close-hire]'); if (c) return typeof PKM !== 'undefined' && PKM.openWindow('closeHire', { id: /** @type {string} */ (c.dataset.closeHire) });
  const x = /** @type {HTMLElement} */ (e.target).closest('[data-cancel-act]'); if (x){
    const { error } = await sb.rpc('cancel_manager_action', { p_id:/** @type {string} */ (x.dataset.cancelAct) }); if (error) return toast(friendly(error.message), true);
    const m = (APP.mgrReqs || []).find(m => m.kind==='act' && m.r.id === x.dataset.cancelAct); if (m) m.r.status = 'Cancelled'; toast(t('cancelled')); renderVoice(); }
});
document.addEventListener('click', e => {
  const a = /** @type {HTMLElement} */ (e.target).closest('[data-att]'); if (a) return openAttachment(a.dataset.att);
  const ib = /** @type {HTMLElement} */ (e.target).closest('[data-inbox]'); if (ib) return typeof PKM !== 'undefined' && PKM.openWindow('inbox', { id: /** @type {string} */ (ib.dataset.inbox) });
});
// Android back button (the app calls window.pkBack() first; false = nothing left to go back to → the app goes to the background)
//   1) an open window (bottom sheet) closes  2) the previous tab opens  3) from another tab with no history → Home
const VSTACK = [];
window.pkBack = function(){
  if (sheetOpen()) { closeSheet(); return true; }
  if (!APP.ready || !$('scr-main').classList.contains('on')) return false;
  while (VSTACK.length){ const v = VSTACK.pop(); if (v !== APP.view && document.getElementById('v-' + v)) { go(v, true); return true; } }
  if (APP.view !== 'home') { go('home', true); return true; }
  return false;
};
function go(view, back){ if (!back && APP.view && APP.view !== view){ VSTACK.push(APP.view); if (VSTACK.length > 10) VSTACK.shift(); } if (view === 'news') setTimeout(markNewsRead, 1500); if (APP.view === 'pay' && view !== 'pay' && APP.payUnlocked){ APP.payUnlocked = false; APP.slips = []; } APP.view=view; if (typeof PKM !== 'undefined') PKM.tabShown(view); if (view === 'pay') renderPayslips(); document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on', v.id==='v-'+view)); (/** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.tab'))).forEach(b=>b.classList.toggle('on', b.dataset.view===view)); window.scrollTo(0,0); }

// ═════════════════════════════════════════════════════════
//  EVENTS & START-UP
// ═════════════════════════════════════════════════════════
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (APP.ready) renderProfile(); });
document.addEventListener('click', async ev => {
  const x = /** @type {HTMLElement} */ (ev.target);
  if (x.closest('[data-lang]')) { LANG = LANG==='ar' ? 'en' : 'ar'; localStorage.setItem('pk_lang', LANG);
    const tk = localStorage.getItem('pk_push_token'); if (tk && APP.ready) sb.rpc('save_push_token', { p_token: tk, p_platform: 'android', p_lang: LANG }).then(()=>{}, ()=>{});   // notifications follow the app language
    const ep = localStorage.getItem('pk_push_web'); if (ep && APP.ready) sb.rpc('set_push_lang', { p_token: ep, p_lang: LANG }).then(()=>{}, ()=>{});
    applyLang(); renderPushCard(); renderSpCard(); return; }
  const tab = x.closest('[data-view]'); if (tab) return go(tab.dataset.view);
  if (x === $('sheet')) return closeSheet();
  if (x.closest('#sp-open')) return spSheet();                                       // 91: set a site's location
  const sp = x.closest('.site[data-sp]'); if (sp) return spPick(sp.dataset);
  const sl = x.closest('[data-slip]'); if (sl) return typeof PKM !== 'undefined' && PKM.openWindow('slip', { id: /** @type {string} */ (sl.dataset.slip) });
  const cx = x.closest('[data-cancel]'); if (cx) return typeof PKM !== 'undefined' && PKM.openWindow('cancel', { id: /** @type {string} */ (cx.dataset.cancel) });
  const tp = x.closest('[data-tproj]'); if (tp) return teamProjSheet(/** @type {string} */ (tp.dataset.tproj));
  const rno = x.closest('[data-treq-no]'); if (rno) return typeof PKM !== 'undefined' && PKM.openWindow('rejectRequest', { id: /** @type {string} */ (rno.dataset.treqNo) });
  const hr1 = x.closest('[data-hra]'); if (hr1) return typeof PKM !== 'undefined' && PKM.openWindow('alert', { id: /** @type {string} */ (hr1.dataset.hra) });
  const tno = x.closest('[data-team-no]'); if (tno) return typeof PKM !== 'undefined' && PKM.openWindow('rejectAllowance', { id: /** @type {string} */ (tno.dataset.teamNo) });
  const dsc = x.closest('[data-discard]'); if (dsc) return discardSaved(dsc.dataset.discard);
  const rty = x.closest('[data-retry]'); if (rty) { const cur = queue(); cur.forEach(e => { if (e.client_id === rty.dataset.retry) delete e._err; }); store.set('pk_queue', cur); renderHome(); return flushQueue(); }
  const mno = x.closest('[data-mis-no]'); if (mno) return typeof PKM !== 'undefined' && PKM.openWindow('rejectMission', { id: /** @type {string} */ (mno.dataset.misNo) });
  const a = x.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (act==='req-mission' || act==='mis-assign') return typeof PKM !== 'undefined' && PKM.openWindow(act==='req-mission' ? 'missionAsk' : 'missionAssign');
  if (act==='in' || act==='switch') return openSitePicker(act);
  if (act==='out') return confirmOut();
  if (act==='came-back') { APP.cameBack = true; return renderHome(); }
  if (act==='close') return closeSheet();
  if (act==='sync') return flushQueue();
  if (act==='refresh') return doRefresh();
  if (act==='req-leave' || act==='req-perm' || act==='req-hr') return typeof PKM !== 'undefined' && PKM.openWindow(act === 'req-leave' ? 'leave' : act === 'req-perm' ? 'perm' : 'hr');
  if (act==='fb-complaint' || act==='fb-suggestion' || act==='req-hire' || act==='req-train' || act==='req-penalty' || act==='req-incentive' || act==='req-element')
    return typeof PKM !== 'undefined' && PKM.openWindow(act==='fb-complaint' ? 'complaint' : act==='fb-suggestion' ? 'suggestion' : act==='req-hire' ? 'hire'
      : act==='req-train' ? 'train' : act==='req-penalty' ? 'penalty' : 'element');
  if (act==='chpass') return typeof PKM !== 'undefined' && PKM.openWindow('password');
  if (act==='signout') return signOut();
  if (act==='doc-answer') return typeof PKM !== 'undefined' && PKM.openWindow('document', { id: /** @type {string} */ (a.dataset.id) });
  if (act==='dreq-answer') return typeof PKM !== 'undefined' && PKM.openWindow('dataAnswer', { id: /** @type {string} */ (a.dataset.id) });
  if (act==='my-contact') return typeof PKM !== 'undefined' && PKM.openWindow('contact');
  if (act==='co-msg') { const c = (APP.coreqs || []).find(x => x.id === a.dataset.id); return c && coSheet('', c); }
  if (act==='push-on') return enableWebPush(x.closest('[data-act]'));
  if (act==='install' && installEvt) { installEvt.prompt(); installEvt = null; return; }
});
$('li-go').addEventListener('click', doLogin);
['li-code','li-pass'].forEach(i => $(i).addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); }));
$('fl-go').addEventListener('click', firstLogin);
const net = () => { $('offline').style.display = navigator.onLine ? 'none' : 'block'; if (navigator.onLine && APP.ready) flushQueue().then(()=>{ if (APP.offline) loadAll().then(renderAll).catch(()=>{}); }); };
window.addEventListener('online', net); window.addEventListener('offline', net);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && APP.payUnlocked){ APP.payUnlocked = false; APP.slips = []; if (APP.ready) renderPayslips(); } });
document.addEventListener('visibilitychange', async () => { if (document.visibilityState==='visible' && APP.ready && navigator.onLine){ checkAppUpdate(); await flushQueue(); try { await loadStatus(); } catch(e){} renderHome(); try { await loadCoReqs(); renderCoReqs(); } catch(e){} afterStatus().catch(() => {}); } });
setInterval(() => { if (APP.ready) checkAppUpdate(); }, 60 * 60 * 1000);
setInterval(() => { if (APP.ready) tick(); }, 15000);
setInterval(() => { if (APP.ready && queue().length && navigator.onLine) flushQueue(); }, 30000);

(async function boot(){
  applyLang(); net();
  if (!NATIVE && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
  if (NATIVE) await restoreDeviceId();
  if (isAndroidWeb()) {                                   // Android phones must use the Petrokima app, not the browser
    message(t('androidUseApp'));
    $('msg-body').insertAdjacentHTML('beforeend', `<a class="btn" style="display:block;text-align:center;text-decoration:none;margin-top:16px" href="${ANDROID_APP_PAGE}">⬇ ${esc(t('androidGetApp'))}</a>`);
    const back = /** @type {HTMLElement | null} */ (document.querySelector('#scr-msg [data-act="signout"]')); if (back) back.style.display = 'none';
    return;
  }
  if (!window.supabase || !SUPABASE_KEY || SUPABASE_KEY.startsWith('PASTE')) return message(t('configMissing'));
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { global: { fetch: timedFetch } });
  $('li-code').value = localStorage.getItem('pk_code') || '';
  if (isIOS() && !isStandalone()) { $('ios-steps').textContent = t('iosSteps'); show('scr-install'); return; }
  try {
    const { data } = await sb.auth.getSession();
    if (data && data.session) await afterLogin(data.session.user); else show('scr-login');
  } catch(e){ console.warn('Petrokima start-up:', e && e.message); const c = store.get('pk_cache', null); if (c && useCache(c.uid)) { show('scr-main'); APP.ready=true; renderAll(); } else show('scr-login'); }
})();
