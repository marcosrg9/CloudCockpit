import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Platform } from './entity/Platform';
import { User } from './entity/User';
import { Server } from './entity/Server';
import { Auth } from './entity/Auth';

export const AppDataSource = new DataSource({
    type:        'mongodb',
    synchronize: true,
    logging:     true,
    authSource:  process.env.DB_AUTH,
    username:    process.env.DB_USER,
    password:    process.env.DB_PASS,
    host:        process.env.DB_HOST,
    database:    process.env.DB_NAME,
    port:        parseInt(process.env.DB_PORT) || 27017,
    entities:    [Platform, User, Server, Auth],
    migrations:  [],
    subscribers: [],
    // MONGODB Driver Error fix for CSDM (Current Server Discovery and Monitoring engine)
    useUnifiedTopology: true
});