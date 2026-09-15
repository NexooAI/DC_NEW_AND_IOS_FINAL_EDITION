# 4-Model Modern Bottom Navigation Bar & Dynamic Menu Ordering
## விரிவான திட்ட வரைவு (Comprehensive Implementation Plan)

---

## 1. அறிமுகம் மற்றும் நோக்கம் (Overview & Goal)

தற்போது மொபைல் செயலியில் உள்ள பழமையான பாட்டம் நேவிகேஷன் பாரை மாற்றி, 2025/2026 சொகுசு நகைக் கடை செயலிகளுக்கு ஏற்ற அதிநவீன **4 பாட்டம் நேவிகேஷன் மாடல்கள் (4 Styles)** மற்றும் **மெனு வரிசை (Dynamic Menu Order) & சென்டர் பட்டன் தேர்வு** அமைப்பை உருவாக்குதல்.

அனைத்து அமைப்புகளும் ஏற்கனவே பயன்பாட்டில் உள்ள **`app_visible_pages` (`/app-visible`) API** மூலமாகவே நிர்வகிக்கப்படும். அட்மின் பேனலில் இருந்து எந்த மாடலைத் தேர்ந்தெடுக்கிறோமோ, அது மொபைல் செயலியில் நேரலையாகப் பிரதிபலிக்கும்.

---

## 2. வடிவமைப்பு மாதிரிகள் (The 4 Bottom Bar Styles)

| மாடல் (Style ID) | பெயர் (Name) | தோற்றம் & சிறப்பம்சங்கள் (Features) |
| :--- | :--- | :--- |
| **Type 1** (`v1_classic`) | **Default Classic Bar** | தற்போதைய எக்ஸிஸ்டிங் பாட்டம் பார் (Full width flat bar with gold top border). |
| **Type 2** (`v2_floating`) | **Floating Glassmorphic Capsule** | திரையின் அடியில் ஒட்டாமல் மிதக்கும் கேப்ஸ்யூல் வடிவம் (`borderRadius: 28`), மெல்லிய கோல்ட் பார்டர் க்ளோ, டார்க் கிளாஸ் பேக்ரவுண்ட், தொடும் டேப்பிற்கு மென்மையான கோல்டன் பேக் டிராப். |
| **Type 3** (`v3_center_fab`) | **Elevated Center Gold FAB Hero** | நடுவில் உள்ள பட்டன் (எ.கா: Quick Join / Quick Gold Pay) பார்-க்கு மேல் 3D தங்க நாணயம் போல உயர்ந்து நிற்கும் (`translateY: -18`), தங்க ஒளி வட்டம் (Gold halo shadow). இடது மற்றும் வலது பக்கங்களில் சமச்சீரான ஐகான்கள். |
| **Type 4** (`v4_curved`) | **Minimalist Curved Gold Contour** | வளைந்த மேல் விளிம்பு (Curved concave contour), நேர்த்தியான மினிமல் ஐகான்கள், மற்றும் ஆக்டிவ் டேப்பின் கீழ் ஒளிரும் தங்கப் புள்ளி (Glowing Gold Dot). |

---

## 3. டைனமிக் மெனு ஆர்டர் & சென்டர் பட்டன் கன்ஃபிகரேஷன் (Menu Order & Center FAB)

### அ. மெனு வரிசை (Tab Ordering):
- பாட்டம் பாரில் உள்ள டேப்கள்: `home`, `savings`, `quick_join`, `rewards`, `profile`, `dashboard_tab`.
- அட்மின் பேனலில் இந்த டேப்களின் வரிசையை மாற்றியமைக்கலாம் (`bottomNavTabsOrder`).
- எந்த டேப்கள் தெரிய வேண்டும் / மறைய வேண்டும் என்ற விசிபிலிட்டி ஏற்கனவே உள்ள `showTab*` டாகிள்கள் மூலமாகவே கட்டுப்படுத்தப்படும்.

### ஆ. Type 3-க்கான சென்டர் பட்டன் தேர்வு (Center Hero FAB Selection):
- Type 3 (`v3_center_fab`)-ல் நடுவில் உயர்ந்து நிற்கும் பட்டன் எதுவாக இருக்க வேண்டும் (`bottomNavCenterTab`) என்பதை அட்மினில் தேர்வு செய்யலாம்:
  - **Quick Join / Pay** (டீஃபால்ட் - தங்க சேமிப்பு திட்டம்)
  - **Savings**
  - அல்லது விருப்பமான வேறு ஏதேனும் ஒரு டேப்.
- தேர்ந்தெடுக்கப்பட்ட சென்டர் பட்டனை நடுவில் வைத்துவிட்டு, மீதமுள்ள டேப்கள் தானாகவே இடதுபுறம் (Left side) மற்றும் வலதுபுறம் (Right side) என சமச்சீராகப் பிரித்து அடுக்கப்படும்.

---

## 4. கணினி கட்டமைப்பு மாற்றங்கள் (Technical Architecture & Changes)

### அ. பேக்கெண்ட் (Backend: `jewllery_api_core`)

#### 1. டேட்டாபேஸ் மைக்ரேஷன் (`config/migrations.js`):
- `app_visible_pages` அட்டவணையில் 3 புதிய காலம்கள் சேர்த்தல்:
  ```sql
  ALTER TABLE app_visible_pages ADD COLUMN bottomNavStyle VARCHAR(50) DEFAULT 'v1_classic';
  ALTER TABLE app_visible_pages ADD COLUMN bottomNavTabsOrder VARCHAR(500) DEFAULT 'home,savings,quick_join,rewards,profile';
  ALTER TABLE app_visible_pages ADD COLUMN bottomNavCenterTab VARCHAR(50) DEFAULT 'quick_join';
  ```

#### 2. மாடல் & கன்ட்ரோலர் (`appVisiblePagesModel.js` & `appVisiblePagesController.js`):
- `getConfig()` மற்றும் `updateConfig()` மெத்தட்களில் இந்த 3 புதிய ஃபீல்டுகளுக்கான ரீட்/ரைட் சப்போர்ட் உறுதி செய்தல்.
- டீஃபால்ட் வேல்யூ: `bottomNavStyle: 'v1_classic'`, `bottomNavCenterTab: 'quick_join'`.

---

### ஆ. அட்மின் பேனல் (Admin Panel: `digi_gold_admin_frontend`)

#### 1. இன்டர்ஃபேஸ் & ஸ்டேட் (`app-visual-status.component.ts`):
- `AppVisualStatus` இன்டர்ஃபேஸில் புதிய ஃபீல்டுகள் சேர்த்தல்:
  ```typescript
  bottomNavStyle?: 'v1_classic' | 'v2_floating' | 'v3_center_fab' | 'v4_curved';
  bottomNavTabsOrder?: string;
  bottomNavCenterTab?: string;
  ```
- மெனு வரிசையை மேலும் கீழும் நகர்த்துவதற்கான (Move Up / Move Down / Reorder) முறைகள்.
- சென்டர் பட்டனைத் தேர்ந்தெடுக்கும் முறை (`setCenterTab(tabName)`).
- மாடலைத் தேர்ந்தெடுக்கும் முறை (`setBottomNavStyle(style)`).

#### 2. பயனர் இடைமுகம் (`app-visual-status.component.html`):
- **Bottom Navigation Settings Accordion**-ல்:
  1. **Style Selection Cards**: 4 மாடல்களையும் விசுவலாகக் காட்டும் ரேடியோ கார்டுகள் (Classic, Floating Capsule, Center FAB Hero, Curved Contour).
  2. **Center Action Tab Selector**: Type 3 தேர்ந்தெடுக்கப்பட்டால், நடுவில் எந்த டேப் வர வேண்டும் என்ற ட்ராப்டவுன்.
  3. **Tab Ordering List**: டேப்களை வரிசைப்படுத்தும் விட்ஜெட் (Up/Down அம்புக்குறிகளுடன்).
  4. **Right Phone Mockup Preview**: அட்மினில் எந்த ஸ்டைல் மற்றும் ஆர்டரைத் தேர்வு செய்கிறோமோ, வலதுபுற போன் மாதிரியில் உடனடியாக அந்த ஸ்டைல் பாட்டம் பார் பிரதிபலிக்கும்.

---

### இ. மொபைல் ஆப் (Mobile App: `DC_NEW_AND_IOS_FINAL_EDITION`)

#### 1. `CustomBottomBar.tsx` மறுசீரமைப்பு:
- `useAppVisibility()` மூலமாக `bottomNavStyle`, `bottomNavTabsOrder`, `bottomNavCenterTab` ஆகியவற்றைப் பெறுதல்.
- **Dynamic Tab Sorting**:
  - `bottomNavTabsOrder`-ன் படி டேப்களை வரிசைப்படுத்துதல்.
  - Type 3 (`v3_center_fab`)-ஆக இருந்தால்: தேர்ந்தெடுக்கப்பட்ட சென்டர் டேப்பை பிரித்து நடுவில் வைத்துவிட்டு, மீதமுள்ளவற்றை இடது/வலது பக்கங்களில் சமமாக அமைத்தல்.
- **4 ரெண்டரிங் லேஅவுட்டுகள்**:
  - **`v1_classic`**: ஏற்கனவே உள்ள நிலையான பாட்டம் பார்.
  - **`v2_floating`**: திரை விளிம்பிலிருந்து 16px மேலே மிதக்கும் கிளாஸ்மார்ஃபிக் கேப்ஸ்யூல் கண்டெய்னர்.
  - **`v3_center_fab`**: சென்டர் பட்டன் `-18px` உயர்ந்து, கோல்டன் மெடாலியன் க்ரேடியன்ட் மற்றும் ஷேடோவுடன் கம்பீரமாக நிற்கும் அமைப்பு.
  - **`v4_curved`**: வளைந்த மேல் விளிம்பு மற்றும் மைக்ரோ-ஸ்பிரிங் கோல்டன் டாட் இன்டிகேட்டர்.
- **பாதுகாக்கப்படும் செயல்பாடுகள்**:
  - அனைத்து ரூட்டிங் (`navigate()`, `router.push()`)
  - அன்-ரீட் நோட்டிபிகேஷன் பேட்ஜ்கள் (`badgeAnimations`)
  - புரொஃபைல் அவதார் இமேஜ் / டீஃபால்ட் ஐகான்
  - Safe Area Insets (iOS Home Indicator & Android Navigation Bar)

---

## 5. செயல்பாட்டு வரிசை (Phase-wise Execution Steps)

1. **Step 1: Backend Migration & API Support**:
   - `jewllery_api_core/config/migrations.js` இல் புதிய காலம்களை சேர்த்தல்.
   - `appVisiblePagesModel.js` மற்றும் `appVisiblePagesController.js` அப்டேட் செய்தல்.
2. **Step 2: Admin Panel Controls & Live Preview**:
   - `app-visual-status.component.ts` மற்றும் `.html` இல் 4 ஸ்டைல் செலக்டர்கள், டேப் ஆர்டர் மற்றும் சென்டர் டேப் செலக்டர் சேர்த்தல்.
   - போன் மாக்-அப் பிரீவியூவில் 4 மாடல்களின் லைவ் காட்சியை இணைத்தல்.
3. **Step 3: Mobile App `CustomBottomBar.tsx` Implementation**:
   - 4 மாடல்களுக்கான ஸ்டைல்கள், எலிவேட்டட் சென்டர் FAB பட்டன், ஃப்ளோட்டிங் கேப்ஸ்யூல் ஆகியவற்றை துல்லியமாக உருவாக்குதல்.
   - விசிபிலிட்டி டேட்டாவுடன் இணைத்தல்.
4. **Step 4: Verification & Testing**:
   - அட்மினில் ஒவ்வொரு ஸ்டைலையும் மாற்றிப் பார்த்து, ஆப்பில் துல்லியமாக மாறுவதை உறுதி செய்தல்.
   - டேப் ஆர்டரை மாற்றிப் பார்த்து, வரிசை சரியாக அமைவதை உறுதி செய்தல்.
   - `npx tsc --noEmit` மூலம் எந்த பிழையும் இல்லை என்பதைச் சரிபார்த்தல்.

---

## 6. சரிபார்ப்பு திட்டம் (Verification Plan)

### Automated Tests:
- `npx tsc --noEmit` - மொபைல் ஆப்பில் டைப்ஸ்கிரிப்ட் கம்பைலேஷன் பாஸாக வேண்டும் (0 errors).
- பேக்கெண்ட் மைக்ரேஷன் டெஸ்ட் ரன் செய்தல்.

### Manual Verification:
- அட்மின் பேனலில் இருந்து 4 ஸ்டைல்களையும் மாற்றி, போனில் பாட்டம் பார் தோற்றம் மாறுவதை உறுதி செய்தல்.
- சென்டர் பட்டன் Quick Join, Savings ஆகியவற்றுக்கு மாறுவதையும், கிளிக் செய்தால் உரிய பக்கம் திறப்பதையும் உறுதி செய்தல்.
