const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Ensure manifest.queries is an array
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }

    const queries = androidManifest.manifest.queries;

    // Define the schemes we want to query (UPI apps)
    const schemes = ['upi', 'tez', 'phonepe', 'paytm', 'gpay'];

    schemes.forEach((scheme) => {
      // Check if this scheme is already queried in AndroidManifest
      const exists = queries.some((q) => {
        return (
          q.intent &&
          q.intent.some((intent) => {
            return (
              intent.data &&
              intent.data.some((data) => data.$ && data.$['android:scheme'] === scheme)
            );
          })
        );
      });

      if (!exists) {
        queries.push({
          intent: [
            {
              action: [
                {
                  $: {
                    'android:name': 'android.intent.action.VIEW',
                  },
                },
              ],
              data: [
                {
                  $: {
                    'android:scheme': scheme,
                  },
                },
              ],
            },
          ],
        });
      }
    });

    return config;
  });
};
