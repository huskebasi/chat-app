const path = require('path')
const http = require('http')
const express = require('express') // express 
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users') 
// define app as express()
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// fetch the port value from heroku |OR| set 3000 if it fails (e.g. locally)
const port = process.env.PORT || 3000

// setup root server directory
const publicDirectory = path.join(__dirname, '../public')
app.use(express.static(publicDirectory))

// io listen to event (socket is an object that contains information about the connection)
io.on('connection', (socket) => {
    console.log('New websocket connection')


    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser( {id: socket.id, username, room} )

        if (error) {
            return callback(error)
        }

        // join a given chatroom
        socket.join(user.room)

        // socket.emit emit to a user, io.emit emit to all users, socket.broadcast.emit emit to all except me
        // io.to.emit emit to anybody in a room, socket.broadcast.to.emit emit to anybody in a room except me

        socket.emit('message', generateMessage('Welcome!')) // when socket connects!
        // .broadcast emits to every socket EXCEPT the one calling it
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined ${user.room}!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    
    })

    socket.on('sendMessage', (message, acknowledgement) => {
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return acknowledgement('Profanity is not allowed!')
        }
        
        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(message))
        acknowledgement('Delivered')
    })

    // send an event from the server to a particular connection ('name of the event', a return value)
    // socket.send('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated', count)
    //     io.emit('countUpdated', count) // send event to EVERY SINGLE connection
    // })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',  generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })


    // this socket disconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})


server.listen(port, () => {
    console.log('server is up on port ' + port)
})