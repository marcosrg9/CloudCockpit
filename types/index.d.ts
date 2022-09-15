import { MemoryStore, Session, SessionData } from 'express-session';
import { ObjectID } from 'typeorm';
import { user } from '../src/database/user.db';

declare module 'express-session' {

	export interface SessionData {

		auth: user;

	}
}

declare module 'socket.io/dist/socket' {
    export interface Handshake {
        session: SessionData & Partial<Session>;
		sessionID: string;
    }
}