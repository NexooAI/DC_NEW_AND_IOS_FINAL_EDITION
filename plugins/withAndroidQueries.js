const { withAndroidManifest } = require('expo/config-plugins');

const withAndroidQueries = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        if (!androidManifest.manifest.queries) {
            androidManifest.manifest.queries = [];
        }

        const queries = androidManifest.manifest.queries;

        // Define the schemes we want to allow querying
        const schemes = ['upi', 'tez', 'phonepe', 'paytm', 'gpay'];

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

        return config;
    });
};

module.exports = withAndroidQueries;
