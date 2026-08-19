const fs = require('fs');
const path = require('path');
const babel = require('@babel/parser');

const filePath = 'c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/schemes.tsx';
let originalCode = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
let code = originalCode.replace(/\r\n/g, '\n');

// 1. Add Svg imports at the top
const importSearch = 'import { LinearGradient } from "expo-linear-gradient";';
const importReplace = `import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';`;

if (code.includes(importSearch)) {
  code = code.replace(importSearch, importReplace);
  console.log('✔ Added Svg imports');
} else {
  console.error('❌ Could not find import statement');
  process.exit(1);
}

// 2. Add state declarations inside SchemeList
const stateSearch = `export default function SchemeList({ isNested = false }: { isNested?: boolean }) {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { schemeId, schemeType, mode } = useLocalSearchParams();`;

const stateReplace = `export default function SchemeList({ isNested = false }: { isNested?: boolean }) {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const params = useLocalSearchParams<{ schemeId?: string; schemeType?: string; mode?: string; type?: string; category?: string }>();
  const { schemeId, schemeType, mode } = params;

  const [selectedMetal, setSelectedMetal] = useState<string>(() => {
    const tParam = (params.type || params.category || "").toLowerCase();
    return ["gold", "silver", "diamond", "platinum"].includes(tParam) ? tParam : "gold";
  });

  useEffect(() => {
    const tParam = (params.type || params.category || "").toLowerCase();
    if (["gold", "silver", "diamond", "platinum"].includes(tParam)) {
      setSelectedMetal(tParam);
    }
  }, [params.type, params.category]);

  const [schemePlanType, setSchemePlanType] = useState<"fixed" | "flexi">("fixed");`;

if (code.includes(stateSearch)) {
  code = code.replace(stateSearch, stateReplace);
  console.log('✔ Added selectedMetal & schemePlanType states');
} else {
  console.error('❌ Could not find SchemeList state declaration signature');
  process.exit(1);
}

// 3. Add availableMetals, hasFlexiSchemes, hasFixedSchemes memo hooks and selection adjustments
const adjustSearch = `  const [refreshing, setRefreshing] = useState(false);`;
const adjustReplace = `  const [refreshing, setRefreshing] = useState(false);

  const availableMetals = useMemo(() => {
    const metals = { gold: false, silver: false, diamond: false, platinum: false };
    if (!allSchemes || allSchemes.length === 0) return { gold: true, silver: false, diamond: false, platinum: false };

    allSchemes.forEach((scheme) => {
      if (scheme.ACTIVE !== "Y") return;
      const schemeNameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
      const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
      const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();
      const savingTypeLower = (scheme.savingType || "").toLowerCase();
      const descLower = (getTranslatedText(scheme.DESCRIPTION as any, "en") || "").toLowerCase();
      const combined = \`\${schemeNameLower} \${schemeTypeLower} \${insTypeLower} \${savingTypeLower} \${descLower}\`;

      if (combined.includes("silver") || combined.includes("வெள்ளி")) {
        metals.silver = true;
      } else if (combined.includes("diamond") || combined.includes("வைரம்")) {
        metals.diamond = true;
      } else if (combined.includes("platinum") || combined.includes("பிளாட்டினம்")) {
        metals.platinum = true;
      } else {
        metals.gold = true;
      }
    });

    if (!metals.gold && !metals.silver && !metals.diamond && !metals.platinum) {
      metals.gold = true;
    }
    return metals;
  }, [allSchemes]);

  useEffect(() => {
    if (!allSchemes || allSchemes.length === 0) return;
    const current = selectedMetal.toLowerCase();
    if (current === "all") return;
    
    if (current === "gold" && !availableMetals.gold) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    } else if (current === "silver" && !availableMetals.silver) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    } else if (current === "diamond" && !availableMetals.diamond) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    } else if (current === "platinum" && !availableMetals.platinum) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    }
  }, [allSchemes, availableMetals, selectedMetal]);`;

if (code.includes(adjustSearch)) {
  code = code.replace(adjustSearch, adjustReplace);
  console.log('✔ Added availableMetals hook');
} else {
  console.error('❌ Could not find setRefreshing signature');
  process.exit(1);
}

// 4. Update the tab selection effect (handling fixed vs flexi plan types)
const tabEffectSearch = `  useEffect(() => {
    const tabs = getAvailableTabTypes(allSchemes);
    setAvailableTabs(tabs);
    logger.log("Tab selection effect:", {
      tabs,
      schemeType,
      activeTab,
      allSchemesLength: allSchemes.length,
    });

    if (tabs.length > 0) {
      let targetTab = tabs[0];

      if (schemeType && tabs.includes(schemeType as string) && !userSelectedTab) {
        targetTab = schemeType as string;
        logger.log("Using provided schemeType:", targetTab);
      } else if (activeTab && tabs.includes(activeTab)) {
        targetTab = activeTab;
        logger.log("Keeping current active tab:", targetTab);
      } else {
        logger.log("Using default first tab:", targetTab);
      }

      if (targetTab !== activeTab && (!activeTab || !tabs.includes(activeTab)) && !userSelectedTab) {
        logger.log("Setting active tab to:", targetTab);
        setActiveTab(targetTab);
      }
    } else if (tabs.length === 0) {
      setActiveTab("");
    }
  }, [allSchemes, getAvailableTabTypes, schemeType, userSelectedTab]);`;

const tabEffectReplace = `  const hasFlexiSchemes = useMemo(() => {
    return availableTabs.some(t => t.toLowerCase() === "flexi");
  }, [availableTabs]);

  const hasFixedSchemes = useMemo(() => {
    return availableTabs.some(t => t.toLowerCase() !== "flexi");
  }, [availableTabs]);

  useEffect(() => {
    const tabs = getAvailableTabTypes(allSchemes);
    setAvailableTabs(tabs);
    logger.log("Tab selection effect:", {
      tabs,
      schemeType,
      activeTab,
      allSchemesLength: allSchemes.length,
    });

    if (tabs.length > 0) {
      let planType = schemePlanType;
      const isFlexiParam = schemeType?.toLowerCase().includes("flexi");
      
      const containsFlexi = tabs.some(t => t.toLowerCase() === "flexi");
      const containsFixed = tabs.some(t => t.toLowerCase() !== "flexi");

      if (isFlexiParam && containsFlexi) {
        planType = "flexi";
      } else if (containsFixed) {
        planType = "fixed";
      } else if (containsFlexi) {
        planType = "flexi";
      }
      setSchemePlanType(planType);

      let targetTab = tabs[0];
      if (planType === "flexi") {
        targetTab = tabs.find(t => t.toLowerCase() === "flexi") || "Flexi";
      } else {
        const firstFixed = tabs.find(t => t.toLowerCase() !== "flexi");
        if (schemeType && schemeType.toLowerCase() !== "flexi" && tabs.includes(schemeType) && !userSelectedTab) {
          targetTab = schemeType;
        } else if (activeTab && activeTab.toLowerCase() !== "flexi" && tabs.includes(activeTab)) {
          targetTab = activeTab;
        } else if (firstFixed) {
          targetTab = firstFixed;
        }
      }

      if (targetTab !== activeTab && !userSelectedTab) {
        logger.log("Setting active tab to:", targetTab);
        setActiveTab(targetTab);
      }
    } else if (tabs.length === 0) {
      setActiveTab("");
    }
  }, [allSchemes, getAvailableTabTypes, schemeType, userSelectedTab, schemePlanType]);`;

if (code.includes(tabEffectSearch)) {
  code = code.replace(tabEffectSearch, tabEffectReplace);
  console.log('✔ Updated tab selection effect');
} else {
  console.error('❌ Could not find tab selection effect signature');
  process.exit(1);
}

// 5. Update filteredSchemes useMemo to also filter based on selectedMetal
const filterSearch = `      // Filter by selected metal category (gold, silver, diamond, platinum, all)
      if (selectedMetal !== "all") {
        const schemeNameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
        const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
        const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();
        const savingTypeLower = (scheme.savingType || "").toLowerCase();
        const descLower = (getTranslatedText(scheme.DESCRIPTION as any, "en") || "").toLowerCase();
        const combined = \`\${schemeNameLower} \${schemeTypeLower} \${insTypeLower} \${savingTypeLower} \${descLower}\`;

        if (selectedMetal === "silver" && !(combined.includes("silver") || combined.includes("வெள்ளி"))) {
          return;
        }
        if (selectedMetal === "diamond" && !(combined.includes("diamond") || combined.includes("வைரம்"))) {
          return;
        }
        if (selectedMetal === "platinum" && !(combined.includes("platinum") || combined.includes("பிளாட்டினம்"))) {
          return;
        }
        if (selectedMetal === "gold") {
          const isOtherMetal = combined.includes("silver") || combined.includes("diamond") || combined.includes("platinum") || combined.includes("வெள்ளி") || combined.includes("வைரம்") || combined.includes("பிளாட்டினம்");
          if (isOtherMetal && !combined.includes("gold") && !combined.includes("தங்கம்")) {
            return;
          }
        }
      }`;

if (!code.includes(filterSearch)) {
  const targetForEach = `    allSchemes.forEach((scheme: Scheme) => {
      if (scheme.ACTIVE !== "Y") return;`;
      
  const replaceForEach = `    allSchemes.forEach((scheme: Scheme) => {
      if (scheme.ACTIVE !== "Y") return;
      // Filter by selected metal category (gold, silver, diamond, platinum, all)
      if (selectedMetal !== "all") {
        const schemeNameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
        const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
        const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();
        const savingTypeLower = (scheme.savingType || "").toLowerCase();
        const descLower = (getTranslatedText(scheme.DESCRIPTION as any, "en") || "").toLowerCase();
        const combined = \`\${schemeNameLower} \${schemeTypeLower} \${insTypeLower} \${savingTypeLower} \${descLower}\`;

        if (selectedMetal === "silver" && !(combined.includes("silver") || combined.includes("வெள்ளி"))) {
          return;
        }
        if (selectedMetal === "diamond" && !(combined.includes("diamond") || combined.includes("வைரம்"))) {
          return;
        }
        if (selectedMetal === "platinum" && !(combined.includes("platinum") || combined.includes("பிளாட்டினம்"))) {
          return;
        }
        if (selectedMetal === "gold") {
          const isOtherMetal = combined.includes("silver") || combined.includes("diamond") || combined.includes("platinum") || combined.includes("வெள்ளி") || combined.includes("வைரம்") || combined.includes("பிளாட்டினம்");
          if (isOtherMetal && !combined.includes("gold") && !combined.includes("தங்கம்")) {
            return;
          }
        }
      }`;
      
  if (code.includes(targetForEach)) {
    code = code.replace(targetForEach, replaceForEach);
    console.log('✔ Added metal category filter inside filteredSchemes');
  } else {
    console.error('❌ Could not find filteredSchemes loop target');
    process.exit(1);
  }
} else {
  console.log('✔ Metal filter already present');
}

// 6. Update JSX to render Metal Category Filter Bar, Plan Type selector, and non-flexi sub-tabs
const subTabsSearch = `      <View style={[
        styles.tabsWrapper,
        styles.iosTabsWrapper
      ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsScrollContainer,
            styles.iosTabsScrollContainer
          ]}
        >
          {availableTabs.map((tab) => renderTab(tab))}
        </ScrollView>
      </View>`;

const subTabsReplace = `      {/* Metal Category Filter Bar */}
      <View style={styles.metalTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metalTabsScroll}>
          {isVisible("showGoldScheme") && availableMetals.gold && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("gold")}
              style={[styles.metalTabPill, selectedMetal === "gold" && styles.metalTabPillGoldActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={14} color={selectedMetal === "gold" ? "#7A4D00" : "#B8860B"} />
              <Text style={[styles.metalTabText, selectedMetal === "gold" && styles.metalTabTextActive]}>
                {t("goldSchemes") || "Gold Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          {isVisible("showSilverScheme") && availableMetals.silver && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("silver")}
              style={[styles.metalTabPill, selectedMetal === "silver" && styles.metalTabPillSilverActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={14} color={selectedMetal === "silver" ? "#333333" : "#666666"} />
              <Text style={[styles.metalTabText, selectedMetal === "silver" && styles.metalTabTextActive]}>
                {t("silverSchemes") || "Silver Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          {isVisible("showDiamondScheme") && availableMetals.diamond && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("diamond")}
              style={[styles.metalTabPill, selectedMetal === "diamond" && styles.metalTabPillDiamondActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="diamond-outline" size={14} color={selectedMetal === "diamond" ? "#0F4C81" : "#1D70B8"} />
              <Text style={[styles.metalTabText, selectedMetal === "diamond" && styles.metalTabTextActive]}>
                {t("diamondSchemes") || "Diamond Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          {isVisible("showPlatinumScheme") && availableMetals.platinum && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("platinum")}
              style={[styles.metalTabPill, selectedMetal === "platinum" && styles.metalTabPillPlatinumActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="ribbon-outline" size={14} color={selectedMetal === "platinum" ? "#1E293B" : "#475569"} />
              <Text style={[styles.metalTabText, selectedMetal === "platinum" && styles.metalTabTextActive]}>
                {t("platinumSchemes") || "Platinum Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setSelectedMetal("all")}
            style={[styles.metalTabPill, selectedMetal === "all" && styles.metalTabPillAllActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={14} color={selectedMetal === "all" ? "#FFF" : "#666"} />
            <Text style={[styles.metalTabText, selectedMetal === "all" && { color: "#FFF" }]}>
              {t("all") || "All Schemes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Plan Type Selector (Fixed vs Flexi) - Only shown if both are available */}
      {hasFlexiSchemes && hasFixedSchemes && (
        <View style={styles.planTypeWrapper}>
          <TouchableOpacity
            onPress={() => {
              setSchemePlanType("fixed");
              setUserSelectedTab(true);
              const firstFixed = availableTabs.find(t => t.toLowerCase() !== "flexi");
              if (firstFixed) {
                setActiveTab(firstFixed);
              }
            }}
            style={[styles.planTypeButton, schemePlanType === "fixed" && styles.planTypeButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={15} color={schemePlanType === "fixed" ? "#FFF" : "#4A0007"} />
            <Text style={[styles.planTypeText, schemePlanType === "fixed" && styles.planTypeTextActive]}>
              {t("Fixed") || "Fixed Scheme"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSchemePlanType("flexi");
              setUserSelectedTab(true);
              setActiveTab("Flexi");
            }}
            style={[styles.planTypeButton, schemePlanType === "flexi" && styles.planTypeButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="infinite-outline" size={15} color={schemePlanType === "flexi" ? "#FFF" : "#4A0007"} />
            <Text style={[styles.planTypeText, schemePlanType === "flexi" && styles.planTypeTextActive]}>
              {t("Flexi") || "Flexi Scheme"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sub-tabs for Fixed Schemes - Only shown if Fixed is selected */}
      {schemePlanType === "fixed" && (
        <View style={[
          styles.tabsWrapper,
          styles.iosTabsWrapper
        ]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.tabsScrollContainer,
              styles.iosTabsScrollContainer
            ]}
          >
            {availableTabs.filter((tab) => tab.toLowerCase() !== "flexi").map((tab) => renderTab(tab))}
          </ScrollView>
        </View>
      )}`;

if (code.includes(subTabsSearch)) {
  code = code.replace(subTabsSearch, subTabsReplace);
  console.log('✔ Updated JSX tabs and filter layouts');
} else {
  console.error('❌ Could not find sub-tabs ScrollView signature');
  process.exit(1);
}

// 7. Append new premium styles to getStyles stylesheet builder
const stylesSearch = `function getStyles(theme: any) { return StyleSheet.create({`;
const stylesReplace = `function getStyles(theme: any) { return StyleSheet.create({
  planTypeWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    gap: 4,
  },
  planTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: 'transparent',
    gap: 4,
  },
  planTypeButtonActive: {
    backgroundColor: '#850111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  planTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  planTypeTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  metalTabsWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metalTabsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  metalTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 6,
    gap: 6,
  },
  metalTabPillGoldActive: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFD700',
  },
  metalTabPillSilverActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },
  metalTabPillDiamondActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  metalTabPillPlatinumActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  metalTabPillAllActive: {
    backgroundColor: '#850111',
    borderColor: '#850111',
  },
  metalTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  metalTabTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  stickyModalFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  stickyTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },`;

if (code.includes(stylesSearch)) {
  code = code.replace(stylesSearch, stylesReplace);
  console.log('✔ Added planType and metal filter stylesheet properties');
} else {
  console.error('❌ Could not find function getStyles signature');
  process.exit(1);
}

// Convert line endings back to original format (CRLF) if it was CRLF
const finalCode = code.replace(/\n/g, '\r\n');

// Validate file syntax before writing it back
try {
  babel.parse(finalCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  fs.writeFileSync(filePath, finalCode, 'utf8');
  console.log('🎉 SUCCESS! Programmatically updated schemes.tsx with 100% valid JSX!');
} catch (err) {
  console.error('❌ JSX Validation Error after edits:', err.message);
  process.exit(1);
}
