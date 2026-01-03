
import type { User } from '../types';
import { dbService } from './db';
import { Role } from '../types';

const API_URL = 'http://localhost:3000/api/auth';
const USER_API_URL = 'http://localhost:3000/api/users';
const SESSION_KEY = 'auth_session_token';

export type RegisterCredentials = {
    username: string;
    email: string;
    password: string;
    inviteCode: string;
};

export type LoginCredentials = {
    identifier: string; // username or email
    password: string;
};

export const authService = {
    
    register: async (credentials: RegisterCredentials): Promise<User> => {
        const res = await fetch(`${API_URL}/register`, {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify(credentials)
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        
        return data;
    },

    login: async (credentials: LoginCredentials, stayLoggedIn: boolean): Promise<User> => {
        const res = await fetch(`${API_URL}/login`, {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify(credentials)
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Invalid credentials');
        
        const user = data.user;
        
        // Store session (In a real app, store the JWT token)
        const storage = stayLoggedIn ? localStorage : sessionStorage;
        storage.setItem(SESSION_KEY, JSON.stringify({ uid: user.uid, token: data.token }));

        // Log IP (Async)
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                dbService.logUserIp(user.uid, ipData.ip);
            }
        } catch (e) { console.warn("IP fetch failed"); }

        return user;
    },

    logout: (): void => {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser: (): User | null => {
        const sessionStr = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;
        
        try {
            // Note: This is a synchronous check of local storage.
            // Ideally, we should validate the token with an API call on app load.
            // For now, we return null to force a fresh login if we wanted strict security, 
            // but for UX we just parse the stored ID.
            // To get full user data, AuthContext usually calls an API if this returns partial data.
            // However, since we can't make this function async easily without refactoring the whole Context:
            // We rely on the initial login storing the needed data, or AuthContext using `getUserByUid` immediately after.
            const { uid } = JSON.parse(sessionStr);
            // We cannot fetch synchronously here. The AuthContext handles the fetching.
            // We return a skeleton user or null, but the proper way is AuthContext using `getUserByUid`.
            return null; 
        } catch(e) {
            return null;
        }
    },

    // --- Read Methods ---

    getUserByUid: async (uid: number): Promise<User | null> => {
        try {
            const res = await fetch(`${USER_API_URL}/${uid}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) { return null; }
    },
    
    getUserByUsernameAndUid: async (username: string, uid: number): Promise<User | null> => {
        // The API finds by ID, then we check username
        const user = await authService.getUserByUid(uid);
        if (user && user.username.toLowerCase() === username.toLowerCase()) {
            return user;
        }
        return null;
    },

    getStaffUsers: async (): Promise<User[]> => {
        try {
            const res = await fetch(`http://localhost:3000/api/users`);
            if (!res.ok) return [];
            const users: User[] = await res.json();
            return users.filter(u => u.role === Role.ADMIN || u.role === Role.MODERATOR);
        } catch (e) { return []; }
    },

    // --- Update Methods ---

    updateAvatar: async (uid: number, avatarUrl: string): Promise<void> => {
        await fetch(`${USER_API_URL}/${uid}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ avatarUrl })
        });
    },

    updateAvatarColor: async (uid: number, color: string): Promise<void> => {
        await fetch(`${USER_API_URL}/${uid}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ avatarColor: color })
        });
    },

    updateUserProfile: async (uid: number, data: Partial<User>): Promise<User> => {
        const res = await fetch(`${USER_API_URL}/${uid}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error("Update failed");
        
        // Return updated user object (fetching fresh)
        const updated = await authService.getUserByUid(uid);
        if (!updated) throw new Error("Could not fetch updated user");
        return updated;
    },

    changePassword: async (uid: number, oldPw: string, newPw: string): Promise<void> => {
        const res = await fetch(`${USER_API_URL}/${uid}/password`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to change password');
        }
    }
};
