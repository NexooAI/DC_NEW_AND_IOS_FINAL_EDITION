# 📱 Android Local Build Guide (Development | Preview | Production)

Sri Thanga Thamarai (STT) மொபைல் செயலியை EAS Cloud கோட்டா எதுவும் இல்லாமல், உங்கள் கணினியிலேயே (Locally) **Development**, **Preview**, மற்றும் **Production** பில்ட்கள் எடுப்பதற்கான முழுமையான வழிகாட்டி.

---

## ⚙️ 1. அடிப்படை கட்டமைப்பு (Prerequisites)

எந்த பில்டை எடுப்பதற்கு முன்பும், PowerShell டெர்மினலில் சூழல் மாறிகளை (Environment Variables) செட் செய்தல் வேண்டும்:

```powershell
$env:JAVA_HOME = "C:\Users\nithy\Downloads\jdk-17.0.12+7"
$env:ANDROID_HOME = "C:\Users\nithy\AppData\Local\Android\Sdk"
$env:Path = "C:\Users\nithy\Downloads\jdk-17.0.12+7\bin;C:\Users\nithy\AppData\Local\Android\Sdk\platform-tools;" + $env:Path
Set-Location C:\stt\android
```
> **குறிப்பு:** Windows 260-character மற்றும் அடைப்புக்குறி (`()`) பிழைகளைத் தவிர்க்க நாம் உருவாக்கியுள்ள `C:\stt` (NTFS Junction) பாத்தில் இருந்தே எப்போதும் பில்ட் இயக்க வேண்டும்.

---

## 🛠️ 2. Development Build (Debug APK)

* **நோக்கம்:** தினசரி டெவலப்மெண்ட், கோட் மாற்றங்களை உடனுக்குடன் Metro வழியே டெஸ்ட் செய்ய.
* **கீ (Signing):** `debug.keystore`
* **பில்ட் கமாண்ட்:**
  ```powershell
  .\gradlew.bat assembleDebug
  ```
* **வெளியீடு (Output File):**  
  `C:\stt\android\app\build\outputs\apk\debug\app-debug.apk`
* **மொபைலில் இன்ஸ்டால் செய்ய:**
  ```powershell
  adb -s c975eb96 install -r "C:\stt\android\app\build\outputs\apk\debug\app-debug.apk"
  ```

---

## 🔍 3. Preview Build (Standalone Release APK)

* **நோக்கம்:** Metro Server தேவையின்றி கிளையன்ட் அல்லது டெஸ்டர்களுக்கு WhatsApp / Drive வழியாக அனுப்பி நேரடியாக போனில் இன்ஸ்டால் செய்து பார்க்க.
* **கீ (Signing):** `debug.keystore` (or `release.keystore`)
* **பில்ட் கமாண்ட்:**
  ```powershell
  .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --stacktrace
  ```
* **வெளியீடு (Output File):**  
  `C:\stt\android\app\build\outputs\apk\release\app-release.apk` (~50 MB)
* **மொபைலில் இன்ஸ்டால் செய்ய:**
  ```powershell
  adb -s c975eb96 install -r "C:\stt\android\app\build\outputs\apk\release\app-release.apk"
  ```

---

## 🚀 4. Production Build (Google Play Store `.aab` Bundle)

* **நோக்கம்:** Google Play Console-ல் அதிகாரப்பூர்வமாக அப்லோட் செய்து பயனர்களுக்கு ரிலீஸ் செய்ய.
* **கீ (Signing):** `credentials/android/keystore.jks` (Official Production Keystore)
* **முன் தயாரிப்பு (Pre-requisite):**  
  `app.config.ts` மற்றும் `android/app/build.gradle`-ல் `versionCode` முந்தைய வெர்ஷனை விட அதிகமாக உள்ளதா என உறுதி செய்யவும் (உதாரணம்: `versionCode 10`, `versionName "1.0.9"`).
* **பில்ட் கமாண்ட்:**
  ```powershell
  .\gradlew.bat bundleRelease -PreactNativeArchitectures=arm64-v8a --stacktrace
  ```
* **வெளியீடு (Output File):**  
  `C:\stt\android\app\build\outputs\bundle\release\app-release.aab`
* **ப்ளே ஸ்டோரில் பதிவேற்ற:**  
  இந்த `app-release.aab` கோப்பை நேரடியாக Google Play Console -> Production / Internal Track-ல் அப்லோட் செய்யலாம்.

---

## ⚡ 5. Quick Reference Table (விரைவு அட்டவணை)

| வகை (Build Type) | ஃபார்மேட் (Format) | பயன்படுத்தும் கீ | Gradle Command | அவுட்புட் இடம் |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | `.apk` | Debug Key | `.\gradlew.bat assembleDebug` | `app/build/outputs/apk/debug/` |
| **Preview** | `.apk` | Release Key / Standalone | `.\gradlew.bat assembleRelease` | `app/build/outputs/apk/release/` |
| **Production** | `.aab` | Official Keystore (`keystore.jks`) | `.\gradlew.bat bundleRelease` | `app/build/outputs/bundle/release/` |

---

## 🧹 6. மெமரி கிளீனப் (Disk Space Clean Command)

பில்ட் முடிந்த பிறகு கேச் ஃபைல்களை கிளீன் செய்து C: Drive மெமரியை மீட்க:
```powershell
Set-Location C:\stt\android
.\gradlew.bat clean
```
