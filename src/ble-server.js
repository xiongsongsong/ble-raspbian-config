/**
 * 提供低功耗蓝牙数据接收和广播
 */

const bleno = require('bleno')
const name = 'name';
const ip = require('ip')
const request = require('request')

/**
 * 服务
 * 
 */
const services = {
  getIp () {
    return Buffer.from(`ip=${ip.address()}`)
  },
  // 检查网络是否已经接通
  async network() {
    return new Promise((resolve)=>{
      request('https://hospital.ruoshui.ai/account/ns/login', {
        timeout: 1000
      }, (err, res) => {
          if(err) {
            resolve(Buffer.from(`internet=0`))
            return
          }
          resolve(Buffer.from(`internet=${(res.statusCode === 200)}`))
      })
    })
  },
  // 调试用，观察通信是否正常
  ts() {
    return Buffer.from(`ts=${Date.now().toString()}`)
  }
}

// 有多少个服务
const servicesMap = Object.keys(services)


bleno.on('stateChange',(state) => {
  console.log('on -> stateChange: ' + state)
  if(state === 'poweredOn') {
    console.log('开始')
    bleno.startAdvertising('rstv', ['ebea'])
  } else {
    bleno.stopAdvertising()
  }
})

bleno.on('advertisingStart', (error) => {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'))
  if(!error) { 
    bleno.setServices([
      new bleno.PrimaryService({
        uuid: 'FFF0',
        characteristics: [
          new bleno.Characteristic({
            uuid:'ebcc',
            properties:['read', 'write', 'notify'],
            value: null,
            // 随机读取一个服务的数据，这样避免了建立多个Characteristic
            async onReadRequest(offset, callback) {
              let randIndex = parseInt(servicesMap.length * Math.random(), 10)
              callback(bleno.Characteristic.RESULT_SUCCESS ,await services[servicesMap[randIndex]]())
            },
            onWriteRequest(){
              console.log('write')
            }
          })
        ]
      })
    ])
  }
})
