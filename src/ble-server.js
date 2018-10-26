/**
 * 提供低功耗蓝牙数据接收和广播
 */

const bleno = require('bleno')
const name = 'name';
const ip = require('ip')
const request = require('request')
var BLE_BUFFER = Buffer.from('')
const { Subject } = require('rxjs')
const subject = new Subject()
const {debounce} = require('lodash')

const EOF_BUF = new ArrayBuffer(20)
const EOF_BUF_VIEW = new Uint16Array(EOF_BUF)
EOF_BUF_VIEW.fill(0xff)
EOF_BUF_VIEW[6] = 0x45 // E
EOF_BUF_VIEW[7] = 0x4f // O
EOF_BUF_VIEW[8] = 0x46 // F
EOF_BUF_VIEW[9] = 0x21 //!
const EOF = Buffer.from(EOF_BUF)

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
    if(this.pending === true) {
      return Buffer.from(`internet=${this.prevStatus}`)
    }
    this.pending = true
    return new Promise((resolve) => {
      request('https://hospital.ruoshui.ai/account/ns/login', {
        timeout: 1000
      }, (err, res) => {
        this.pending = false
        if (err) {
          this.prevStatus = false
        } else {
          this.prevStatus = res.statusCode === 200
        }
        resolve(Buffer.from(`internet=${this.prevStatus}`))
      })
    })
  },
  // 调试用，观察通信是否正常
  ts() {
    return Buffer.from(`ts=${Date.now().toString()}`)
  }
}

// 服务列表
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

var prevNow = Date.now()
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
            onWriteRequest(data, offset, withoutResponse, callback) {
              BLE_BUFFER = Buffer.concat([BLE_BUFFER, data])
              //console.log(Date.now()-prevNow)
              //prevNow = Date.now()
              check()
              callback(bleno.Characteristic.RESULT_SUCCESS)
            }
          })
        ]
      })
    ])
  }
})

function check(){
  // 判断 BLE_BUFFER 末尾的数据，是否和 EOF_BUF 相等
  // 如果相等，则说明数据传输完毕
  let CACHE = BLE_BUFFER.slice(BLE_BUFFER.length - 20)
  if(CACHE.equals(EOF)){
    console.log(BLE_BUFFER.slice(0, -20).toString('utf16le'))
    BLE_BUFFER = Buffer.from('')
  }
}