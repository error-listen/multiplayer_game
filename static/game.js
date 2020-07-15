const socket = io()

const table = document.getElementsByTagName('table')[0]
const spand_dead_message = document.getElementsByTagName('span')[0]

const movement = {
  up: false,
  down: false,
  left: false,
  right: false,
}

const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')

let cool_down = 0

canvas.width = 800
canvas.height = 600

spand_dead_message.style.display = 'none'

document.addEventListener('keydown', function (e) {
  switch (e.keyCode) {
    case 68:
      if (cool_down >= 30) {
        socket.emit('shoot_left')
        cool_down = 0
      }
      break
    case 87:
      if (cool_down >= 30) {
        socket.emit('shoot_up')
        cool_down = 0
      }
      break
    case 65:
      if (cool_down >= 30) {
        socket.emit('shoot_right')
        cool_down = 0
      }
      break
    case 83:
      if (cool_down >= 30) {
        socket.emit('shoot_down')
        cool_down = 0
      }
      break
  }
})

document.addEventListener('keydown', function (e) {
  switch (e.keyCode) {
    case 37:
      movement.left = true
      break
    case 38:
      movement.up = true
      break
    case 39:
      movement.right = true
      break
    case 40:
      movement.down = true
      break
  }
})

document.addEventListener('keyup', function (e) {
  switch (e.keyCode) {
    case 37:
      movement.left = false
      break
    case 38:
      movement.up = false
      break
    case 39:
      movement.right = false
      break
    case 40:
      movement.down = false
      break
  }
})

socket.emit('new_player')

setInterval(function () {
  socket.emit('movement', movement)
}, 1000 / 60)

socket.on('update_score', players => {

  const score_array = []

  let scoreboard = `<tr class='header'>
    <td>Players</td>
    <td>Score</td>
  </tr>`

  for (const player_id in players) {
    const player = players[player_id]
    score_array.push({
      score: player.score,
      player_id: player.player_id
    })
  }
  const score_arraySorted = score_array.sort((first, second) => {
    if (first.score < second.score) {
      return 1
    }

    if (first.score > second.score) {
      return -1
    }

    return 0
  })

  const current_player = players[socket.id]

  score_arraySorted.forEach((score) => {

    scoreboard += ` <tr class='${score.player_id === current_player.player_id ? 'current_player' : ''}'><td> ${score.player_id} </td>
    <td class='score'>${score.score}</td></tr>`
  })

  table.innerHTML = scoreboard
})

socket.on('player_lose', () => {
  spand_dead_message.style.display = 'block'
})

socket.on('state', function (players, bullets) {

  context.fillStyle = '#FFF'
  context.fillRect(0, 0, canvas.width, canvas.height)

  cool_down += 1

  for (const player_id in players) {
    const player = players[player_id]
    if (player.dead === false) {
      context.beginPath()
      context.fillStyle = '#FF0000'
      context.fillRect(player.x, player.y, player.width, player.height)
      context.stroke()
    } else {
      context.beginPath()
      context.fillStyle = '#FF0000'
      context.fillRect(player.x, player.y, 0, 0)
      context.stroke()
    }
  }

  const current_player = players[socket.id]
  if (current_player) {
    if (current_player.dead === false) {
      context.beginPath()
      context.fillStyle = '#4169E1'
      context.fillRect(current_player.x, current_player.y, current_player.width, current_player.height)
      context.stroke()
    } else {
      context.beginPath()
      context.rect(current_player.x, current_player.y, 0, 0)
      context.stroke()
    }

    for (const bullet_id in bullets) {
      const bullet = bullets[bullet_id]
      context.beginPath()
      if (bullet.player_id === current_player.player_id) {
        context.fillStyle = '#4169E1'
      } else {
        context.fillStyle = '#FF0000'
      }
      context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
      context.stroke()
    }

  }

})