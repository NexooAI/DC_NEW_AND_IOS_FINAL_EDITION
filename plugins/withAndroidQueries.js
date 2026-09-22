const { withAndroidManifest } = require('expo/config-plugins');

const withAndroidQueries = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        if (!androidManifest.manifest.queries) {
            androidManifest.manifest.queries = [];
        }

        const queries = androidManifest.manifest.queries;

        // Define the schemes we want to allow querying
        const schemes = ['upi', 'tez', 'phonepe', 'paytm', 'gpay', 'geo', 'google.navigation'];

        schemes.forEach((scheme) => {
            // Check if schema already exists to avoid duplicates
            const exists = queries.some((q) =>
                q.intent && q.intent.some(i => i.data && i.data.some(d => d['$']['android:scheme'] === scheme))
            );

            if (!exists) {
                queries.push({
                    intent: [
                        {
                            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
                            data: [{ $: { 'android:scheme': scheme } }],
                        },
                    ],
                });
            }
        });

        // Add Google Maps package query for Android 11+
        const hasMapsPackage = queries.some(q => q.package && q.package.some(p => p['$']['android:name'] === 'com.google.android.apps.maps'));
        if (!hasMapsPackage) {
            queries.push({
                package: [{ $: { 'android:name': 'com.google.android.apps.maps' } }]
            });
        }

        return config;
    });
};

module.exports = withAndroidQueries;
