import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import readlineSync from 'readline-sync';

// --- CONSTANTS ---
const BASE_API_URL = 'https://langappxyz.com';
const DESTINATION_FOLDER = 'C:\\Users\\ayala\\Documents\\Dev\\Ayalas Language\\Exports\\Darija';

// --- INTERFACES ---
export interface LoginRequest {
    userName: string;
    password: string;
}

export interface LoginResponse {
    expires: string;
    user: any;
    requires2FA: boolean;
    token: string;
}

export interface Verify2FARequest {
    verify2FAToken: string;
    code: string;
}

export interface Verify2FAResponse {
    expires: string;
    user: any;
    token: string; // Added based on logic provided in the snippet
}

export const AUTHOR_ACCESS = 
{
    LEARNER: 1,
    CAN_EDIT: 2
} as const;

export type AuthorAccess = typeof AUTHOR_ACCESS[keyof typeof AUTHOR_ACCESS];

export interface ILearningPath {
    learningPathId: number;
    name?: string;
    access: AuthorAccess;
}

async function main() {
    // 1. Ensure destination folder exists
    if (!fs.existsSync(DESTINATION_FOLDER)) {
        fs.mkdirSync(DESTINATION_FOLDER, { recursive: true });
        console.log(`Created folder: ${DESTINATION_FOLDER}`);
    }

    try {
        // 2. Authentication
        const token = await authenticate();
        console.log('Authentication successful!\n');

        // Create axios instance with the Bearer token
        const api: AxiosInstance = axios.create({
            baseURL: BASE_API_URL,
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Get all learning paths
        console.log('Fetching learning paths...');
        const pathsResponse = await api.get<ILearningPath[]>('/api/learning/path');
        const paths = pathsResponse.data;
        console.log(`Found ${paths.length} lessons to download.\n`);

        // 4. Download each lesson
        for (const pathItem of paths) {
            const { learningPathId, name } = pathItem;
            const lessonResponse = await api.get<ILearningPath>(`/api/learning/path/${learningPathId}`);
            const lesson = lessonResponse.data;
            if (lesson.access !== AUTHOR_ACCESS.CAN_EDIT) {
                console.warn(`Skipping lesson ${learningPathId} (${name || 'unnamed'}) due to insufficient access rights.`);
                continue;
            }
            
            const sanitizedName = (name || 'unnamed').replace(/[/\\?%*:|"<>]/g, '-');
            const fileName = `${sanitizedName}-exercises-${learningPathId}.json`;
            const filePath = path.join(DESTINATION_FOLDER, fileName);

            console.log(`Downloading: ${fileName}...`);

            try {
                // 1. Set responseType to 'json' (which is the default, so we can just remove the config)
                const response = await api.get(`/api/learning/path/${learningPathId}/exercises`);

                // 2. Format the JSON
                // JSON.stringify(value, replacer, space)
                // The '2' tells Node to use 2 spaces for indentation. Use '\t' for actual tabs.
                const formattedJson = JSON.stringify(response.data, null, 2);

                // 3. Write the formatted string to the file
                fs.writeFileSync(filePath, formattedJson, 'utf8');
            } catch (err: any) {
                console.error(`Failed to download lesson ${learningPathId}: ${err.message}`);
            }
        }

        console.log('\nBackup completed successfully!');

    } catch (error: any) {
        console.error('\nCritical Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function authenticate(): Promise<string> {
    const userName = readlineSync.question('Username/Email: ');
    const password = readlineSync.question('Password: ', { hideEchoBack: true });

    const loginResponse = await axios.post<LoginResponse>(`${BASE_API_URL}/api/auth/login`, {
        userName,
        password
    });

    const data = loginResponse.data;

    if (data.requires2FA) {
        const verify2FAToken = data.token;
        const code = readlineSync.question('2FA code? ');

        const verifyResponse = await axios.post<Verify2FAResponse>(`${BASE_API_URL}/api/auth/verify2fa`, {
            verify2FAToken,
            code
        });
        
        return verifyResponse.data.token;
    }

    return data.token;
}

main();