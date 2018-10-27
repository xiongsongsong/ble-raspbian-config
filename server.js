require('./src/ble-server')
const { on }  = require('./src/rx$.js')

on('restartBrowser').subscribe(data => {
  console.log(data)
})

on('upgradeSystem').subscribe(data => {
  console.log(data)
})
