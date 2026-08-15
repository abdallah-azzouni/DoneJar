import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://e1e80f52ebe2ffb1457c11cdd4e089aa@o4511916518801408.ingest.de.sentry.io/4511916525879376',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
