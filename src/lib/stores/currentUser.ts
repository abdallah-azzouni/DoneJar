// import { writable } from 'svelte/store';
// import { pb } from '$lib/pb/pb';
// import { browser } from '$app/environment';
// // import { sync } from '$lib/sync/sync';

// export const currentUser = writable(pb.authStore.record);

// if (browser) {
// 	// Keep the store synchronized if the authStore changes locally
// 	pb.authStore.onChange((token, record) => {
// 		currentUser.set(record);

// 		if (!record) {
// 			pb.collection('users').unsubscribe(currentId);
// 		}
// 	});

// 	// Only subscribe to the user collection if a user is actually logged in
// 	const currentId = pb.authStore.record?.id;

// 	if (currentId) {
// 		pb.collection('users').subscribe(currentId, async (e) => {
// 			currentUser.set(e.record);
// 			//await sync(); // Trigger a sync when the user record changes, to ensure we have the latest serverVersion
// 		});
// 	}
// }
