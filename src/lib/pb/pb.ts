import PocketBase from 'pocketbase';
export const pb = new PocketBase('https://api.donejar.app');
pb.autoCancellation(false);
