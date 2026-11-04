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
  signedOutHere:'You were signed out on this phone. Please sign in again.',
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
  signedOutHere:'تم تسجيل خروجك على هذا الهاتف. يرجى تسجيل الدخول مرة أخرى.',
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
Object.assign(T.en, { appLoadFailed:'The app did not load completely. Close it and open it again. If this keeps happening, contact HR.' });
Object.assign(T.ar, { appLoadFailed:'لم يكتمل تحميل التطبيق. أغلقه وافتحه مرة أخرى، وإذا تكرر ذلك تواصل مع الموارد البشرية.' });
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
  if (APP.ready) renderAll(); else if (typeof PKM !== 'undefined') PKM.render();   // the sign-in screens are React too
}

// ═════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════
/** @type {(id: string) => any} — any page element (field, button, list …) by its id */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// num / pad / loc / fmt / fmtH (hours as "9 h 50 m") / todayStr (the PHONE's own date) / dObj / dStr / niceDate / toMin — and chip, friendly, the payroll
// calendar and the leave arithmetic below — moved to React on 3 Nov 2026 (react/src/phone/core/helpers.ts — proven to give the same answers by helpers.golden.json); the old names forward to it.
// react.js runs right after this file and the start-up (boot, below) waits for it, so it is there before any of them is asked.
// app.js and react.js must come from the SAME release (review 3 Nov 2026): react.js says which one it is (PKM.build); a react.js of
// another release (an old copy kept somewhere) is treated like a missing one — the plain "did not load" message, nothing half-started.
// Always the same as VERSION in sw.js (checked by tests/check-files.js).
const PKM_BUILD = 'pk-mobile-v85';
const pkmReady = () => typeof PKM !== 'undefined' && PKM.build === PKM_BUILD;
function pkm(){ if (!pkmReady()) throw new Error(t('appLoadFailed')); return /** @type {NonNullable<typeof PKM>} */ (PKM); }
const num = v => pkm().num(v);
const pad = n => pkm().pad(n);
const loc = () => pkm().loc();
const fmt = v => pkm().fmt(v);
const fmtH = v => pkm().fmtH(v);
function todayStr(){ return pkm().todayStr(); }
/** @param {string} s */
function dObj(s){ return pkm().dObj(s); }
/** @param {Date} o */
function dStr(o){ return pkm().dStr(o); }
function niceDate(s){ return pkm().niceDate(s); }
function toMin(x){ return pkm().toMin(x); }
// the message strip at the bottom is React (react/src/phone/shell, 4 Nov 2026): kept here only the latest message, which React shows for 3.2 s
/** @type {{ msg: string, bad: boolean, seq: number } | null} */
let TOAST = null;
function toast(msg, bad){ TOAST = { msg: msg == null ? '' : String(msg), bad: !!bad, seq: (TOAST ? TOAST.seq : 0) + 1 }; if (typeof PKM !== 'undefined') PKM.toastShown(); }
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on', s.id===id)); $('boot').style.display='none'; }
// one bottom window at a time: the old one (#sheet) or a React one (react/src/phone/reqwin — vacation, permission, HR request)
// every bottom window is React (react/src/phone — WindowHost); the old #sheet and sheet() were removed on 4 Nov 2026
function closeSheet(){ if (typeof PKM !== 'undefined') PKM.closeWindow(); }
function sheetOpen(){ return typeof PKM !== 'undefined' && PKM.windowOpen(); }
function chip(s){ return pkm().chip(s); }
/** the database's message in the phone's words @param {unknown} msg @returns {string} */
function friendly(msg){ return pkm().friendly(msg); }

// Payroll rules shared with the HR system
let S = { weekendDays:[5,6], cycleStartDay:21, permissionsPerMonth:2, permissionMaxHours:2, annualLeaveDefault:21, casualCountsAnnual:'yes', hoursPerDay:8 };
let HOL = new Set();
/** @param {string} s */
function isWorkday(s){ return pkm().isWorkday(s); }
/** @param {string} a @param {string} b */
function workdays(a,b){ return pkm().workdays(a, b); }
function cycleDay(){ return pkm().cycleDay(); }
/** @param {string} p */
function periodStart(p){ return pkm().periodStart(p); }
/** @param {string} p */
function periodEnd(p){ return pkm().periodEnd(p); }
function cycleOf(date){ return pkm().cycleOf(date); }
/** @param {string} p */
function periodLabel(p){ return pkm().periodLabel(p); }
function leaveDaysIn(l,a,b){ return pkm().leaveDaysIn(l, a, b); }

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
 *   mgrReqs?: { kind: string, r: any }[], cameBack?: boolean, msg?: { text: string, link: string | null } | null, firstSeq?: number, refreshing?: boolean, updateUrl?: string | null, missions?: Mission[],
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
const queue = () => pkm().queue();   // the check-in core moved to React on 3 Nov 2026 (react/src/phone/checkin/checkin.ts — proven to do the same by checkin.golden.json); the old names forward to it
const uid = () => pkm().uid();
const isNetErr = e => pkm().isNetErr(e);
// A server outage: no connection, no answer in time, or the server answers with an error page (5xx) — not a business rule refusing the check-in
const serverDown = r => pkm().serverDown(r);
// Never wait for ever: give up after `ms` and treat it as an outage (the request may still arrive — the check-in's unique id prevents doubles)
const withTimeout = (p, ms) => pkm().withTimeout(p, ms);
// send a check-in; if the database does not know the newer location fields yet, send it without them
function insertClock(rec){ return pkm().insertClock(rec); }   // (React — react/src/phone/checkin/checkin.ts)
// The server already has this check-in (it arrived earlier but the answer was lost)
const alreadyHave = e => pkm().alreadyHave(e);
// every request from the app gives up after 20 seconds instead of hanging
/** @param {any} input @param {any} [init] */
const timedFetch = (input, init) => pkm().timedFetch(input, init);
// A sign-in that ended (2 Nov 2026): signed out elsewhere, password reset, expired. The database then answers as to a visitor
// ("permission denied …", HTTP 401) — instead of showing that, the app goes back to the sign-in screen and says why.
const lostCheck = r => pkm().lostCheck(r);
let lostOnce = false;
function sessionLost(){ return pkm().sessionLost(); }   // moved to React on 3 Nov 2026 (react/src/phone/session/session.ts — proven to do the same by session.golden.json); the old names forward to it
function checkSession(){ return pkm().checkSession(); }
// the phone's own copy of the data — NO ID, bank or pay figures and no payslips (review fix) — cacheEmp / saveCache / useCache moved to React on 3 Nov 2026 (react/src/phone/data/load.ts — proven to ask the same questions and keep the same data by load.golden.json); the old names forward to it
const cacheEmp = e => pkm().cacheEmp(e);
function saveCache(){ return pkm().saveCache(); }
/** @param {string} [uid] */
function useCache(uid){ return pkm().useCache(uid); }
// Server time minus phone time, measured each time we are online
function clockOffset(){ return pkm().clockOffset(); }   // (React — react/src/phone/checkin/checkin.ts)
function serverNowMs(){ return pkm().serverNowMs(); }
/** @param {number} ms */
function localParts(ms){ return pkm().localParts(ms); }
// A random identity created once on this phone and kept in the app's storage
function deviceId(){ return pkm().deviceId(); }
function restoreDeviceId(){ return pkm().restoreDeviceId(); }
function deviceLabel(){ return pkm().deviceLabel(); }
const isIOS = () => pkm().isIOS();
// an Android phone using a browser (also when Chrome shows the "desktop site", which hides the word Android)
const ANDROID_APP_PAGE = 'https://download.petrokima-hr.com/';
const isAndroidWeb = () => pkm().isAndroidWeb();
// 92: the Android app's "time since switched on" counter + start count (the user cannot change them; the server uses them
// to find the real time of a check-in sent later). null on iPhone / web / older Android apps.
function upTime(){ return pkm().upTime(); }
const clientKind = () => pkm().clientKind();
const isStandalone = () => pkm().isStandalone();
function loginName(v){ return pkm().loginName(v); }
// ── CAPTCHA on every password sign-in (Cloudflare Turnstile, 25 Oct 2026) ──
//  TURNSTILE_SITE_KEY = the PUBLIC site key of the widget "Petrokima HR sign-in". Empty = no CAPTCHA (nothing is shown, nothing sent).
//  Supabase checks the token only once "CAPTCHA protection" is switched on (Authentication → Attack Protection); before that it is ignored.
//  Each token is good for one sign-in: a fresh one is taken for every attempt. Usually nothing is shown; Cloudflare shows a small box
//  to tick only when it is not sure the person is human.
const TURNSTILE_SITE_KEY = '0x4AAAAAAFkp9jltaXJo9weC';   // widget "Petrokima HR sign-in" (public key)
// loadTurnstile / captchaToken (a fresh Cloudflare token for every sign-in) — moved to React on 3 Nov 2026 (react/src/phone/session/session.ts — proven to do the same by session.golden.json); the old names forward to it
function loadTurnstile(){ return pkm().loadTurnstile(); }
/** @param {string} boxId @param {string} [lang] */
function captchaToken(boxId, lang){ return pkm().captchaToken(boxId, lang); }
// The sign-in form is React (react/src/phone/signin); signing in and the security check are React too (react/src/phone/session/session.ts).
/** Sign in: '' when signed in (signedIn() runs first — the form clears itself — then what follows: afterLogin), else the message
 *  (the code is already trimmed) @param {string} code @param {string} pass @param {() => void} signedIn @returns {Promise<string>} */
function signIn(code, pass, signedIn){ return pkm().signIn(code, pass, signedIn); }   // (React — react/src/phone/session/session.ts; tempPass stays here)
// the full-screen message is React (react/src/phone/signin) — it may be set before React has loaded (start-up), so it is kept in APP
// link: for the Android browser, the app's download page (the screen then has no Back)
/** @param {string} txt @param {string} [link] */
function message(txt, link){ APP.msg = { text: txt, link: link || null }; show('scr-msg'); if (typeof PKM !== 'undefined') PKM.render(); }
function afterLogin(user){ return pkm().afterLogin(user); }   // (React — react/src/phone/session/session.ts)
// The first-password screen is React (react/src/phone/firstpw), its checks too (react/src/phone/session/session.ts); the temporary password itself stays here (tempPass).
/** '' when saved (then signed in as usual), else the message @param {string} yearTyped @param {string} a @param {string} b @returns {Promise<string>} */
function firstPassword(yearTyped, a, b){ return pkm().firstPassword(yearTyped, a, b); }   // (React — react/src/phone/session/session.ts)
function signOut(){ return pkm().signOut(); }   // (React — react/src/phone/session/session.ts; this phone only)

// ── Documents HR asked for (61-document-requests.sql): the employee answers with a photo of the new card ──
function loadDocs(){ return pkm().loadDocs(); }   // moved to React on 3 Nov 2026 (react/src/phone/data/load.ts — proven to ask the same questions and keep the same data by load.golden.json); the old names forward to it
// the "📄 Documents HR asked for" card is React since 31 Oct 2026 — react/src/phone/reqcards (📎 keeps data-act="doc-answer" → the React window, submitDocument below)
function renderDocs(){ if (typeof PKM !== 'undefined') PKM.render(); }
// phone photos are made smaller (max 1600 px, JPEG) before sending; PDFs are sent as they are
function docShrink(file){ return pkm().docShrink(file); }   // (React — react/src/phone/send/send.ts)
// The "send HR your renewed card" window is React since 1 Nov 2026 — react/src/phone/slipdoc. It uploads through here.
/** @param {string} id — the document request @param {File} picked — the photo or PDF chosen @param {string} expiry — the new card's expiry */
function submitDocument(id, picked, expiry){ return pkm().submitDocument(id, picked, expiry); }   // (React — react/src/phone/send/send.ts)

// ── Data HR asks the employee to update + "My contact details" (77-data-update-requests.sql) ──
function loadDreqs(){ return pkm().loadDreqs(); }   // (moved to React — react/src/phone/data/load.ts)
// the "📝 HR asks you to update your data" card is React since 31 Oct 2026 — react/src/phone/reqcards (✏️ keeps data-act="dreq-answer" → the React answer window)
function renderDreqs(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The answer window and "✏️ Update my contact details" are React since 1 Nov 2026 — react/src/phone/mydata. They save through here.
/** @param {string} id @param {Record<string, string>} vals — every field asked, filled in */
function answerDataRequest(id, vals){ return pkm().answerDataRequest(id, vals); }   // (React — react/src/phone/send/send.ts)
/** @param {Record<string, string>} vals — only the changed contact details */
function saveContact(vals){ return pkm().saveContact(vals); }   // (React — react/src/phone/send/send.ts)

// ── Check-outs HR must record (80-checkout-requests.sql) ──
//  · a check-out refused away from the office/site → the try is sent to HR at once; he can add a message
//  · still checked in but away from his office (from 10 min after the check-in): Android background watch (LeaveWatch) +
//    a check each time the app is opened → "left without checking out" sent to HR
function loadCoReqs(){ return pkm().loadCoReqs(); }   // (moved to React — react/src/phone/data/load.ts)
function renderCoReqs(){ if (typeof PKM !== 'undefined') PKM.render(); }   // the 🚪 card is React (react/src/phone/homecards)
// The message to HR ("🚪 HR has been told" / "🚶 You are still checked in") is React (react/src/phone/comsg). head: null (from the card),
// { refusal, time, place } after a check-out refused away from the site, { left: true, time, place } after "left without checking out"
/** @param {any} head @param {any} c — the check-out sent to HR (or what the server answered about it) */
function coSheet(head, c){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('coMsg', { id: c.id, data: { c, head } }); }
/** Send: no internet → message; refused → message; sent → closed, the list read again @param {string} id @param {string} m */
function sendCoMessage(id, m){ return pkm().sendCoMessage(id, m); }   // (React — react/src/phone/send/send.ts)
function reportAwayCheckout(g, refusal){ return pkm().reportAwayCheckout(g, refusal); }   // (React — react/src/phone/checkin/checkin.ts)
const LW = () => pkm().LW();   // the background steps moved to React on 3 Nov 2026 (react/src/phone/watch/watch.ts — proven to do the same by watch.golden.json); the old names forward to it
/** @param {number} a @param {number} b @param {number} c @param {number} d */
function distM(a, b, c, d){ return pkm().distM(a, b, c, d); }
function stopWatch(){ return pkm().stopWatch(); }
function armWatch(){ return pkm().armWatch(); }
// "Open settings" on the Android ask: the phone's settings for the app (to choose "Allow all the time")
function openLeaveSettings(){ return pkm().openLeaveSettings(); }   // (React — react/src/phone/watch/watch.ts)
function locationAllowed(){ return pkm().locationAllowed(); }
function leftCheck(){ return pkm().leftCheck(); }
// ── 91: trusted employees (chosen by HR) save a project's map point where they stand ──
function loadSiteRight(){ return pkm().loadSiteRight(); }   // (React — react/src/phone/watch/watch.ts)
function renderSpCard(){ if (typeof PKM !== 'undefined') PKM.render(); }   // the 📍 card is React (react/src/phone/homecards)
// The 📍 windows are React (react/src/phone/sitepoint); kept here: opening them, the search and saving where I stand
function spSheet(){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('spFind'); }
/** the search: results, or a refusal / no answer in friendly words @param {string} q */
function findSitePoints(q){ return pkm().findSitePoints(q); }   // (React — react/src/phone/watch/watch.ts)
/** one project (also what "Try again" after the location help reopens, with only its code and name)
 *  @param {{ sp: string, name?: string, has?: string, by?: string, at?: string }} d */
function spPick(d){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('spPick', { id: d.sp, data: { ...d } }); }
/** save where I stand: a fresh GPS reading → set_site_point_here (accuracy, fake-location flag, note) → saved / refused
 *  @param {string} code @param {string} site @param {string} note @param {(p: '' | 'loc' | 'send') => void} phase */
function spSave(code, site, note, phase){ return pkm().spSave(code, site, note, phase); }   // (React — react/src/phone/watch/watch.ts)

function afterStatus(){ return pkm().afterStatus(); }   // (React — react/src/phone/watch/watch.ts)

// ── iPhone notifications (web app on the Home Screen; 60-push-iphone.sql + edge function send-push) ──
const webPushOK = () => pkm().webPushOK();   // (React — react/src/phone/watch/watch.ts)
/** @param {string} s */
const b64ToBytes = s => pkm().b64ToBytes(s);
function renderPushCard(){ if (typeof PKM !== 'undefined') PKM.render(); }   // the 🔔 card is React (react/src/phone/homecards)
/** @param {boolean} [ask] */
function webSubscribe(ask){ return pkm().webSubscribe(ask); }   // (React — react/src/phone/watch/watch.ts)
function enableWebPush(btn){ return pkm().enableWebPush(btn); }
function setupWebPush(){ return pkm().setupWebPush(); }
// a tapped notification opens the right tab (from the service worker, or a new window opened at #view=…)
function openViewFromLink(){ return pkm().openViewFromLink(); }   // (React — react/src/phone/watch/watch.ts)
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'open-view' || !APP.ready) return;
  if (document.getElementById('v-' + e.data.view)) go(e.data.view);
  loadAll().then(renderAll).catch(()=>{});
});

// ── Phone notifications (Android app only, 59-push-notifications.sql + edge function send-push) ──
// Asks once for permission, registers the phone with Firebase, saves its token for the signed-in user (with the app
// language), and opens the right tab when a notification is tapped. The web/iPhone version is not affected.
let pushReady = false;
function setupPush(){ return pkm().setupPush(); }   // (React — react/src/phone/watch/watch.ts)   (pushReady stays here)

// ═════════════════════════════════════════════════════════
//  DATA
// ═════════════════════════════════════════════════════════
// refreshSiteCache (the site list kept for offline check-ins), loadAll and loadStatus moved to React on 3 Nov 2026 (react/src/phone/data/load.ts — proven to ask the same questions and keep the same data by load.golden.json); the old names forward to it
/** @param {boolean} [force] */
function refreshSiteCache(force){ return pkm().refreshSiteCache(force); }
function loadAll(){ return pkm().loadAll(); }
function loadStatus(){ return pkm().loadStatus(); }

// ═════════════════════════════════════════════════════════
//  HOME — check in / out
// ═════════════════════════════════════════════════════════
function serverNowMin(){ return pkm().serverNowMin(); }   // (React — react/src/phone/checkin/checkin.ts)
// every 15 s (and after each redraw): the React clock card reads the time again — the big time, how long I have been in, and
// "undo check-out" disappearing when its 5 minutes are over (react/src/phone/clock)
function tick(){ if (typeof PKM !== 'undefined') PKM.render(); }
// until when the last check-out may still be undone (0 = not any more) — the React clock card shows ↩ while it is set
function undoUntil(st){ return pkm().undoUntil(st); }   // (React — react/src/phone/checkin/checkin.ts)
function undoCheckout(btn){ return pkm().undoCheckout(btn); }
// Home is React (react/src/phone: clock = the clock card, homecards = the cards around it, homelists = Today + This payroll month);
// it reads APP.status, APP.att, the queue and the flags below. Checking in / out, GPS and the queue are React too (react/src/phone/checkin/checkin.ts); the state stays here.
function renderHome(){ tick(); }
// site picker — the window is React (react/src/phone/sitepick: "Where are you working?"); kept here: which site was chosen (pickSel: its name
// goes with a check-in saved on the phone) and opening the window; the search and the check-in itself are in react/src/phone/checkin/checkin.ts
let pickSel = null;
function openSitePicker(mode){
  pickSel = null; closeSheet();
  if (typeof PKM !== 'undefined') PKM.openWindow('sitePick', { id: mode });
}
/** the site search: results, a refusal in friendly words, or "no internet" (no connection, a network failure, no answer in 8 s — the
 *  window then searches the list saved on the phone) @param {string} q @returns {Promise<{ data: any[] } | { error: string } | { offline: true }>} */
function findSites(q){ return pkm().findSites(q); }   // (React — react/src/phone/checkin/checkin.ts)
/** check in at the site chosen in the window (its name is kept for a check-in saved on the phone)
 *  @param {string} code @param {string} name @param {boolean} isSwitch @param {(p: '' | 'loc' | 'send') => void} phase */
function checkInAt(code, name, isSwitch, phase){ return pkm().checkInAt(code, name, isSwitch, phase); }   // (React — react/src/phone/checkin/checkin.ts)
/** @param {boolean} [fresh] */
function nativeLocation(fresh){ return pkm().nativeLocation(fresh); }
/** @param {boolean} [fresh] */
function getLocation(fresh){ return pkm().getLocation(fresh); }
// "📍 Location is required" is React (react/src/phone/sitepick); Try again runs the step that asked for the location
/** @param {number} code — 1 refused, 2 not available, 3 timed out @param {() => void} retry */
function locationHelp(code, retry){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('locHelp', { id: String(code), retry }); }
// phase: the React "check in without a project" button shows the progress (getting the location / sending), as an old button did
/** @param {'in' | 'out'} type @param {string | null} code @param {any} [btn] @param {boolean} [isSwitch] @param {(p: '' | 'loc' | 'send') => void} [phase] */
function clock(type, code, btn, isSwitch, phase){ return pkm().clock(type, code, btn, isSwitch, phase); }   // (React — react/src/phone/checkin/checkin.ts)
// Show saved-but-unsent check-ins on the home screen as if they were already recorded
// Apply ONE saved check-in to what the home screen shows
function applyEvent(st, ev){ return pkm().applyEvent(st, ev); }   // (React — react/src/phone/checkin/checkin.ts)
// After fresh data arrives from the server, re-apply everything still waiting to be sent
function applyQueueToStatus(){ return pkm().applyQueueToStatus(); }
let refreshing = false;
function doRefresh(){ return pkm().doRefresh(); }   // (React — react/src/phone/checkin/checkin.ts)
// Pull down on the screen to refresh (the iPhone home-screen app has no built-in one) — the strip is React (react/src/phone/pull);
// kept here: when a pull may start
function canPull(){ return pkm().canPull(); }   // (React — react/src/phone/checkin/checkin.ts)
let flushing = false;
function flushQueue(){ return pkm().flushQueue(); }   // (React — react/src/phone/checkin/checkin.ts)
// "Discard this saved check-in?" and "Check out now?" are React (react/src/phone/clockwin); kept here: removing a saved check-in
function discardSaved(id){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('discard', { id }); }
function confirmOut(){ closeSheet(); if (typeof PKM !== 'undefined') PKM.openWindow('confirmOut'); }
/** Discard: only that check-in leaves the phone (HR records it by hand); the status is read again @param {string} id */
function dropSaved(id){ return pkm().dropSaved(id); }   // (React — react/src/phone/checkin/checkin.ts)

// ═════════════════════════════════════════════════════════
//  REQUESTS
// ═════════════════════════════════════════════════════════
const annualTypes = () => pkm().annualTypes();
function yearDays(types, status){ return pkm().yearDays(types, status); }
function entitlement(){ return pkm().entitlement(); }
const reqStage = r => pkm().reqStage(r);
// when a request was sent, in the phone's language
const sentAt = ts => pkm().sentAt(ts);
// latest time to ask for a late-arrival permission: shift start + the allowed minutes (Settings)
function lateDeadline(){ return pkm().lateDeadline(); }
// The figures at the top of the Requests tab and "My requests" are React since 31 Oct 2026 — react/src/phone/requests. Kept here:
// the leave arithmetic above (also used by the request windows), the windows, Cancel (data-cancel → the React window, cancelRequest below) and the mission
// notice (renderMisAck, added by the wrapper below).
function renderRequests(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The vacation, permission and HR request windows are React since 1 Nov 2026 — react/src/phone/reqwin. They send through here.
/** @param {'attendance_permissions' | 'employee_leaves' | 'hr_requests'} table — where the request is saved @param {any} rec */
function sendRequest(table, rec){ return pkm().sendRequest(table, rec); }   // moved to React on 3 Nov 2026 (react/src/phone/send/send.ts — proven to do the same by send.golden.json); the old name forwards to it
// The "Cancel this request?", reject and HR-alert windows are React since 1 Nov 2026 — react/src/phone/decide. They act through here.
/** @param {string} key — leave:<id> / perm:<id> / req:<id> / mis:<id> */
function cancelRequest(key){ return pkm().cancelRequest(key); }   // (React — react/src/phone/send/send.ts)

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
function loadMissionsP(){ return pkm().loadMissionsP(); }   // (moved to React — react/src/phone/data/load.ts)
// the "your manager assigned you a mission" notice is React since 31 Oct 2026 — react/src/phone/reqcards (✋ calls misAck)
function renderMisAck(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The outside-mission window (ask for one / assign one to my team) is React since 1 Nov 2026 — react/src/phone/mission. It sends here.
/** @param {string[] | null} emps — the team members to assign (null = I ask for a mission myself)
 *  @param {{ p_from: string, p_to: string, p_time_from: string | null, p_time_to: string | null, p_place: string, p_purpose: string | null, p_project: string | null }} args */
function sendMission(emps, args){ return pkm().sendMission(emps, args); }   // (React — react/src/phone/send/send.ts)
function misAck(id){ return pkm().misAck(id); }   // (React — react/src/phone/send/send.ts)
function misDecide(id, ok, note){ return pkm().misDecide(id, ok, note); }   // (React — react/src/phone/send/send.ts)
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
/** @param {string} pw */
function payslipUnlock(pw){ return pkm().payslipUnlock(pw); }   // (React — react/src/phone/watch/watch.ts)
// The payslip window (a payslip row, data-slip) is React since 1 Nov 2026 — react/src/phone/slipdoc.
// The Profile tab (profile card + "install the app" card) is React since 31 Oct 2026 — react/src/phone/profile. The buttons keep
// data-act="my-contact" / "install" (handled below, as before).
function renderProfile(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The change-password window is React since 1 Nov 2026 — react/src/phone/slipdoc. It changes the password through here.
/** @param {string} pw — the new password (already checked: 8+ characters, typed twice the same) */
function changePassword(pw){ return pkm().changePassword(pw); }   // (React — react/src/phone/send/send.ts)
// The ✅ Approvals tab (its tab button + red number, HR alerts, team requests, missions, projects, allowances) is React since
// 1 Nov 2026 — react/src/phone/approvals. Kept here: the decisions (teamReqDecide, teamDecide, misDecide), the project window (teamProjSheet)
// and the data loading. The reject and HR-alert windows are React too (react/src/phone/decide).
function renderTeam(){ if (typeof PKM !== 'undefined') PKM.render(); }
/** @param {{ p_kind: string, p_emp: string, p_ref: string, p_due: string, p_decision: string, p_note: string | null }} args */
function hraRespond(args){ return pkm().hraRespond(args); }   // (React — react/src/phone/send/send.ts)
// The team-projects windows (one member's projects + search, "remove — why?") are React since 1 Nov 2026 — react/src/phone/teamproj.
// Kept here: reading his list (the window opens only once it is read, as before), the project search and the save step.
/** @param {string} empId */
function teamProjSheet(empId){ return pkm().teamProjSheet(empId); }   // (React — react/src/phone/send/send.ts)
/** @param {string} q — at least 2 letters @returns {Promise<any[]>} the projects found (none on an error, as before) */
function findProjects(q){ return pkm().findProjects(q); }   // (React — react/src/phone/send/send.ts)
// 100: nothing is deleted — a removed project is CLOSED with a reason and kept in the register of closed records
function teamProjChange(key, add, why){ return pkm().teamProjChange(key, add, why); }   // (React — react/src/phone/send/send.ts)
function teamReqDecide(key, approve, note){ return pkm().teamReqDecide(key, approve, note); }   // (React — react/src/phone/send/send.ts)
function teamDecide(id, approve, note){ return pkm().teamDecide(id, approve, note); }   // (React — react/src/phone/send/send.ts)
// newest Android build: read from our own download page (no limits), GitHub as a fallback
function latestBuild(){ return pkm().latestBuild(); }   // (React — react/src/phone/watch/watch.ts)
let updChecked = 0;
/** @param {boolean} [force] */
function checkAppUpdate(force){ return pkm().checkAppUpdate(force); }   // (React — react/src/phone/watch/watch.ts)   (updChecked stays here)
function renderAll(){ if(!APP.ready) return;
  // who I am (the top bar) is React: react/src/phone/frame
  renderHome(); renderCoReqs(); renderRequests(); renderDocs(); renderDreqs(); renderTeam(); renderPayslips(); renderProfile(); renderNews(); renderVoice(); }
// ═════════════════════════════════════════════════════════
//  NEWS · BIRTHDAY · COMPLAINTS & SUGGESTIONS · HIRING & TRAINING REQUESTS
// ═════════════════════════════════════════════════════════
const dShort = ts => pkm().dShort(ts);
// The News list and the red number on its tab are React since 31 Oct 2026 — react/src/phone/news. Kept here: marking read when
// the tab opens (markNewsRead) and opening an attachment (data-att, page-wide handler).
function renderNews(){ if (typeof PKM !== 'undefined') PKM.render(); }
function markNewsRead(){ return pkm().markNewsRead(); }   // (React — react/src/phone/send/send.ts)
function openAttachment(path){ return pkm().openAttachment(path); }   // (React — react/src/phone/send/send.ts)
// The voice cards — my complaints & suggestions, the manager's requests to HR, the board member's approvals and the complaints
// inbox — are React since 1 Nov 2026 (react/src/phone/voice). Their buttons keep the old data-… names handled below.
function renderVoice(){ if (typeof PKM !== 'undefined') PKM.render(); }
// The complaint / suggestion, new employees, training and penalty / element windows are React since 1 Nov 2026 —
// react/src/phone/voicewin. They send through here (the item goes to the top of my complaints / my requests to HR).
/** @param {'feedback' | 'hiring_requests' | 'training_requests' | 'manager_actions'} table — where the request is saved @param {any} rec */
function sendVoice(table, rec){ return pkm().sendVoice(table, rec); }   // (React — react/src/phone/send/send.ts)
// The board member's ✅ / ❌ windows (manager requests, basic-salary changes), a manager's "agree to close" a hiring request and the
// inbox answer are React since 1 Nov 2026 — react/src/phone/answers. They answer through these (the list row is changed here).
/** @param {{ p_id: string, p_approve: boolean, p_note: string | null }} args */
function boardDecide(args){ return pkm().boardDecide(args); }   // (React — react/src/phone/send/send.ts)
/** @param {{ p_id: string, p_approve: boolean, p_note: string | null }} args */
function salaryDecide(args){ return pkm().salaryDecide(args); }   // (React — react/src/phone/send/send.ts)
/** @param {{ p_id: string, p_note: string | null }} args */
function closeHire(args){ return pkm().closeHire(args); }   // (React — react/src/phone/send/send.ts)
/** @param {{ p_id: string, p_status: string, p_reply: string | null }} args */
function answerInbox(args){ return pkm().answerInbox(args); }   // (React — react/src/phone/send/send.ts)
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
function go(view, back){ if (!back && APP.view && APP.view !== view){ VSTACK.push(APP.view); if (VSTACK.length > 10) VSTACK.shift(); } if (view === 'news') setTimeout(markNewsRead, 1500); if (APP.view === 'pay' && view !== 'pay' && APP.payUnlocked){ APP.payUnlocked = false; APP.slips = []; } APP.view=view; if (typeof PKM !== 'undefined') PKM.tabShown(view); if (view === 'pay') renderPayslips(); document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on', v.id==='v-'+view)); window.scrollTo(0,0); }

// ═════════════════════════════════════════════════════════
//  EVENTS & START-UP
// ═════════════════════════════════════════════════════════
// the language button (Arabic ⇄ English; notifications follow the app language) — also the React sign-in screens' button
function switchLang(){ LANG = LANG==='ar' ? 'en' : 'ar'; localStorage.setItem('pk_lang', LANG);
    const tk = localStorage.getItem('pk_push_token'); if (tk && APP.ready) sb.rpc('save_push_token', { p_token: tk, p_platform: 'android', p_lang: LANG }).then(()=>{}, ()=>{});   // notifications follow the app language
    const ep = localStorage.getItem('pk_push_web'); if (ep && APP.ready) sb.rpc('set_push_lang', { p_token: ep, p_lang: LANG }).then(()=>{}, ()=>{});
    applyLang(); renderPushCard(); renderSpCard(); }
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (APP.ready) renderProfile(); });
document.addEventListener('click', async ev => {
  const x = /** @type {HTMLElement} */ (ev.target);
  if (x.closest('[data-lang]')) return switchLang();
  const tab = x.closest('[data-view]'); if (tab) return go(tab.dataset.view);
  if (x.closest('#sp-open')) return spSheet();                                       // 91: set a site's location
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
  if (act==='co-msg') { const c = (APP.coreqs || []).find(x => x.id === a.dataset.id); return c && coSheet(null, c); }
  if (act==='push-on') return enableWebPush(x.closest('[data-act]'));
  if (act==='install' && installEvt) { installEvt.prompt(); installEvt = null; return; }
});
// the "no internet" strip is React (react/src/phone/shell): it follows navigator.onLine; this tells it to look again
const net = () => { if (typeof PKM !== 'undefined') PKM.netChanged(); if (navigator.onLine && APP.ready) flushQueue().then(()=>{ if (APP.offline) loadAll().then(renderAll).catch(()=>{}); }); };
window.addEventListener('online', net); window.addEventListener('offline', net);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && APP.payUnlocked){ APP.payUnlocked = false; APP.slips = []; if (APP.ready) renderPayslips(); } });
document.addEventListener('visibilitychange', async () => { if (document.visibilityState==='visible' && APP.ready && navigator.onLine){ checkAppUpdate(); await flushQueue(); try { await loadStatus(); } catch(e){} renderHome(); try { await loadCoReqs(); renderCoReqs(); } catch(e){} afterStatus().catch(() => {}); } });
setInterval(() => { if (APP.ready) checkAppUpdate(); }, 60 * 60 * 1000);
setInterval(() => { if (APP.ready) tick(); }, 15000);
setInterval(() => { if (APP.ready && queue().length && navigator.onLine) flushQueue(); }, 30000);

// Safety net: the screens are drawn by react.js (loaded right after this file). If it did not load (a broken download, an old copy),
// say so in plain words instead of showing an empty screen.
window.addEventListener('load', () => { if (!pkmReady()) { const b = $('react-msg');
  if (b) { b.textContent = t('appLoadFailed'); b.style.cssText = 'padding:40px 20px;text-align:center;line-height:1.8'; } show('scr-msg'); } });
(async function boot(){
  // the screens and the helpers are react.js (loaded right after this file): wait until it has run; if it did not load, the safety net above
  // shows the plain message and the app does not start
  if (typeof PKM === 'undefined' && document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
  if (!pkmReady()) return;
  applyLang(); net();
  if (!NATIVE && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
  if (NATIVE) await restoreDeviceId();
  if (isAndroidWeb()) {                                   // Android phones must use the Petrokima app, not the browser
    return message(t('androidUseApp'), ANDROID_APP_PAGE);      // the download button, no Back
  }
  if (!window.supabase || !SUPABASE_KEY || SUPABASE_KEY.startsWith('PASTE')) return message(t('configMissing'));
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { global: { fetch: timedFetch } });
  try { sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') sessionLost(); }); } catch(e){}   // e.g. the renewal was refused
  if (isIOS() && !isStandalone()) { show('scr-install'); return; }
  try {
    const { data } = await sb.auth.getSession();
    if (data && data.session) await afterLogin(data.session.user);
    else { show('scr-login'); let lost = null; try { lost = sessionStorage.getItem('pk_lost'); sessionStorage.removeItem('pk_lost'); } catch(e){} if (lost) toast(t('signedOutHere'), true); }
  } catch(e){ console.warn('Petrokima start-up:', e && e.message); const c = store.get('pk_cache', null); if (c && useCache(c.uid)) { show('scr-main'); APP.ready=true; renderAll(); } else show('scr-login'); }
})();
