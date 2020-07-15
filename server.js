const express = require('express')
const http = require('http')
const path = require('path')
const socket_IO = require('socket.io')

const random_number = require('./utils/random_number')

const app = express()
const server = http.Server(app)
const io = socket_IO(server)

app.use('/static', express.static(__dirname + '/static'))

app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'))
})

server.listen(process.env.PORT || 5000, function () {
    console.log('Starting server on port 5000')
})

const players = {}
const bullets = {}

let number_of_players

io.on('connection', (socket) => {
    socket.on('new_player', () => {
        if (number_of_players < 5) {

            players[socket.id] = {
                player_id: socket.id,
                x: random_number(750),
                y: random_number(550),
                width: 30,
                height: 30,
                score: 0,
                dead: false
            }

            io.emit('update_score', players)

            number_of_players = Object.keys(players).length
        }
    })

    socket.on('shoot_left', () => {
        const player = players[socket.id] || {}
        if (player.dead === false) {
            add_bullet(player.x, player.y, player.player_id, 'left')
        }
    })

    socket.on('shoot_right', () => {
        const player = players[socket.id] || {}
        if (player.dead === false) {
            add_bullet(player.x, player.y, player.player_id, 'right')
        }
    })

    socket.on('shoot_up', () => {
        const player = players[socket.id] || {}
        if (player.dead === false) {
            add_bullet(player.x, player.y, player.player_id, 'up')
        }
    })

    socket.on('shoot_down', () => {
        const player = players[socket.id] || {}
        if (player.dead === false) {
            add_bullet(player.x, player.y, player.player_id, 'down')
        }
    })

    socket.on('movement', (event) => {
        const player = players[socket.id] || {}
        if (number_of_players > 1) {
            if (event.left && player.x > 0 && player.dead === false) {
                player.x -= 5
            }
            if (event.up && player.y > 0 && player.dead === false) {
                player.y -= 5
            }
            if (event.right && player.x < 770 && player.dead === false) {
                player.x += 5
            }
            if (event.down && player.y < 570 && player.dead === false) {
                player.y += 5
            }
        }
    })

    socket.on('disconnect', () => {
        delete players[socket.id]
        number_of_players = Object.keys(players).length
    })

})

function remove_bullet(bullet_id) {
    delete bullets[bullet_id]
}

function remove_player(player_id) {
    io.to(player_id).emit('player_lose')
    delete players[player_id]
    number_of_players -= 1
}

function add_bullet(current_player_x, current_player_y, current_player_id, bullet_go) {
    const bullet_random_id = random_number(10000000)

    bullets[bullet_random_id] = {
        x: current_player_x + 10,
        y: current_player_y + 10,
        width: 10,
        height: 10,
        player_id: current_player_id,
        vectorBullet: bullet_go
    }

    return {
        bullet_id: bullet_random_id,
        x: current_player_x + 10,
        y: current_player_y + 10,
        width: 10,
        height: 10,
        player_id: current_player_id,
        vectorBullet: bullet_go
    }
}

function check_collisions() {

    for (bullet_id in bullets) {
        const bullet = bullets[bullet_id]

        for (player_id in players) {
            const player = players[player_id]

            if (player.x < bullet.x + bullet.width &&
                player.x + player.width > bullet.x &&
                player.y < bullet.y + bullet.height &&
                player.y + player.height > bullet.y && bullet.player_id != player.player_id) {
                remove_bullet(bullet_id)
                remove_player(player.player_id)
                const playerShoot = players[bullet.player_id]
                playerShoot.score += 10
                io.emit('update_score', players)
            }
        }
    }
}

setInterval(() => {
    io.emit('state', players, bullets)

    check_collisions()

    for (bullet_id in bullets) {
        const bullet = bullets[bullet_id]
        if (bullet.y < 0) {
            remove_bullet(bullet_id)
        } else if (bullet.y > 600) {
            remove_bullet(bullet_id)
        } else if (bullet.x < 0) {
            remove_bullet(bullet_id)
        }
        else if (bullet.x > 800) {
            remove_bullet(bullet_id)
        }
    }

    for (bullet_id in bullets) {
        const bullet = bullets[bullet_id]

        if (bullet.vectorBullet === 'left') {
            bullet.x += 10
        }

        if (bullet.vectorBullet === 'right') {
            bullet.x -= 10
        }

        if (bullet.vectorBullet === 'up') {
            bullet.y -= 10
        }

        if (bullet.vectorBullet === 'down') {
            bullet.y += 10
        }

    }

}, 1000 / 60)