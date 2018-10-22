/**
 * 提供低功耗蓝牙数据接收和广播
 */

const bleno = require('bleno')
const name = 'name';
const ip = require('ip')
const request = require('request')

// ArrayBuffer 转为字符串，参数为 ArrayBuffer 对象
function ab2str(buf) {
  // 注意，如果是大型二进制数组，为了避免溢出，
  // 必须一个一个字符地转
  if (buf && buf.byteLength < 1024) {
    return String.fromCharCode.apply(null, new Uint16Array(buf))
  }

  const bufView = new Uint16Array(buf)
  const len = bufView.length
  const bstr = new Array(len)
  for (let i = 0; i < len; i++) {
    bstr[i] = String.fromCharCode.call(null, bufView[i])
  }
  return bstr.join('')
}

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
              console.log(data.toString('hex') ,data.length)
              callback(bleno.Characteristic.RESULT_SUCCESS)
            }
          })
        ]
      })
    ])
  }
})

