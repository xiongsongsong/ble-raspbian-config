/**
 * 提供低功耗蓝牙数据接收和广播
 */

const bleno = require('bleno')
const name = 'name';


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
            onReadRequest(offset, callback) {
                console.log('read')
                callback(bleno.Characteristic.RESULT_SUCCESS ,Buffer.from('xxxxx;xxxxxx111'))
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
