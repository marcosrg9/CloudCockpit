import { config } from 'dotenv'
config()

import { Server } from './database/entity/Server'


import { AppDataSource } from "./database/data-source"

/* 
AppDataSource.initialize().then(async () => {

    console.log("Inserting a new user into the database...")
    const user = new User()

    user.password = '123'
    user.lastName = "Saw"
    user.age = 25

    await AppDataSource.manager.save(user)
    console.log("Saved a new user with id: " + user.id)

    console.log("Loading users from the database...")
    const users = await AppDataSource.manager.find(User)
    
    console.log("Loaded users: ", users)

    console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))
 */

AppDataSource.initialize().then(async () => {

    const server = new Server()

    server.name = 'Tesla'
    server.host = '185.27.136.147'
    server.port = 22
    
    await AppDataSource.manager.save(server)
    console.log("Saved a new user with id: " + server._id)

    const servers = await AppDataSource.manager.find(Server)
    
    console.log(servers);    

}).catch(error => console.log(error))
