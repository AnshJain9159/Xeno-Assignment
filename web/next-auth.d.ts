import 'next-auth/jwt'
import { DefaultSession, User as DefaultNextAuthUser } from 'next-auth'

declare module 'next-auth' {
    /**
     * Represents the user object profile obtained from providers
     * or the object returned by the `authorize` callback.
     * In your `auth.ts`, `authorize` returns `{ id: string, name: string, email: string }`.
     */
    interface User extends DefaultNextAuthUser {
        id: string;    // Ensure id is always a string
        name: string;  // Ensure name is always a string
        email: string; // Ensure email is always a string
    }

    /**
     * The shape of the session object returned by `useSession`, `getSession`, `auth`.
     */
    interface Session {
        user: {
            /** The user's unique identifier. */
            id: string;
            /** The user's name. */
            name: string;
            /** The user's email address. */
            email: string;
        } & DefaultSession['user'] // Extends DefaultSessionUser (which has name?, email?, image?)
                                  // Our more specific types for id, name, email will take precedence.
    }
}

declare module 'next-auth/jwt' {
    /**
     * The shape of the JWT payload. Returned by the `jwt` callback and `getToken`.
     */
    interface JWT {
        /** The user's unique identifier. */
        id: string;
        /** The user's name. */
        name: string;
        /** The user's email address. */
        email: string;
    }
} 