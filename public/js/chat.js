const socket = io() // socket contains the return value of the connection (what the server emits)

// socket.on('countUpdated', (count) =>{
//     console.log('The count has been updated to ', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('click')
//     socket.emit('increment')
// })


// Elements frome the DOM
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})


const autoscroll = () => {
    // get last message element
    const $newMessage = $messages.lastElementChild

    // Height of the last element
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    // if I'm at top of the last message
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }



}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(messageTemplate, {
        url: message.url,
        createdAt: moment(message.createdAt).format('HH:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('roomData', ( {room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() // avoid full page refresh
    
    // disable form after submitting message
    // $messageFormButton.setAttribute('disabled','disabled')

    // e.target is our form, e.target.elements.message contains its 'message' element and 'value' its value, our message
    const message = e.target.elements.message.value
    // event name, argument[0], ... , argument[-1], acknowledgement function
    socket.emit('sendMessage', message, (error) => {

        // re enable the form
        $messageFormButton.removeAttribute('disabled')

        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error){
            return console.log(error)
        }

        console.log('The message was delivered!')
    })
})

$sendLocationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    // disable send-location button
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition( (position) => {
        console.log(position)

        const myPosition = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude    
                        }

        socket.emit('sendLocation', myPosition)
    }, () => {
        $sendLocationButton.removeAttribute('disabled')
        console.log('Location shared!')
    })
})
                                        // acknowledgement
socket.emit('join', {username, room}, (error) => {
    if (error){
        alert(error)
        location.href = '/'
    }
})