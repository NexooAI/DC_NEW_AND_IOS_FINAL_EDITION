const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src', 'locales');
const languages = ['en', 'ta', 'te', 'mal', 'hi'];

const newTranslations = {
    premium_reward_tiers: "Premium Reward Tiers",
    premium_reward_tiers_desc: "Your rewards scale with your friend's first payment amount",
    tier_1_amount: "₹100 to ₹1,000",
    tier_2_amount: "₹1,000 to ₹10,000",
    tier_3_amount: "Above ₹10,000",
};

languages.forEach(lang => {
    const filePath = path.join(localesPath, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let json = JSON.parse(fileContent);

        let updated = false;
        for (const [key, value] of Object.entries(newTranslations)) {
            if (!json[key]) {
                json[key] = value;
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
            console.log(`Updated translations for ${lang}.json`);
        } else {
            console.log(`No new keys needed for ${lang}.json`);
        }
    } else {
        console.error(`File not found: ${filePath}`);
    }
});

console.log('Finished updating translation keys.');
