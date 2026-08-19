const fs = require('fs');
const babel = require('@babel/parser');

const filePath = 'c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/index.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
code = code.replace(/\r\n/g, '\n');

const searchBlock = `              {/* My Schemes Cards Section */}
              <MySchemesCards
                onGoldPress={() => router.push("/(app)/(tabs)/home/schemes")}
                onSilverPress={() => router.push("/(app)/(tabs)/home/schemes")}
              />`;

const replaceBlock = `              {/* My Schemes Cards Section */}
              <MySchemesCards
                onGoldPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "gold" } })}
                onSilverPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "silver" } })}
                onDiamondPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "diamond" } })}
                onPlatinumPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "platinum" } })}
                showGold={isVisible("showGoldScheme")}
                showSilver={isVisible("showSilverScheme")}
                showDiamond={isVisible("showDiamondScheme")}
                showPlatinum={isVisible("showPlatinumScheme")}
              />`;

if (code.includes(searchBlock)) {
  code = code.replace(searchBlock, replaceBlock);
  console.log('✔ Updated home page navigation with type parameters and visibility flags');
} else {
  console.error('❌ Could not find MySchemesCards render block in home/index.tsx');
  process.exit(1);
}

// Convert line endings back to original format (CRLF)
const finalCode = code.replace(/\n/g, '\r\n');

try {
  babel.parse(finalCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  fs.writeFileSync(filePath, finalCode, 'utf8');
  console.log('🎉 SUCCESS! Programmatically fixed home index navigation!');
} catch (err) {
  console.error('❌ JSX Validation Error in home/index.tsx:', err.message);
  process.exit(1);
}
