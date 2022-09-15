import { MemoryStore } from 'express-session';

/**
 * Almacén de sesiones en memoria.
 * Usar exclusivamente en el middleware de sesiones.
 */
export const memoryStore = new MemoryStore();