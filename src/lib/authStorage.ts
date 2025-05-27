// Temporary in-memory storage for registered users
// In a real application, this would be replaced with a database
export let registeredUsers: { phoneNumber: string; password: string; name: string }[] = []; 