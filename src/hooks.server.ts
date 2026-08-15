import { sentryHandle, initCloudflareSentryHandle } from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';

export const handle = sequence(
	initCloudflareSentryHandle({
		dsn: 'https://e1e80f52ebe2ffb1457c11cdd4e089aa@o4511916518801408.ingest.de.sentry.io/4511916525879376',
		tracesSampleRate: 1.0,
		enableLogs: true
	}),
	sentryHandle()
);

const myErrorHandler = ({ error, event }) => {
	console.error('An error occurred on the server side:', error, event);
};
export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
