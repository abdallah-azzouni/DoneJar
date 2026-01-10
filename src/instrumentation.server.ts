import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://c1fb8fc6c227fc8c6926b95b19c47edf@o4510679423516672.ingest.de.sentry.io/4510679428956240',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
