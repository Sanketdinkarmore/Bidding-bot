// Temporary in-memory storage for registered users
// In a real application, this would be replaced with a database
export const registeredUsers: { phoneNumber: string; password: string; name: string }[] = []; 