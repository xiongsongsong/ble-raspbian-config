const {Subject } = require('rxjs')
const { bufferWhen, interval } = require('rxjs/operators')

const subject = new Subject()

const buffered = subject.pipe(bufferWhen(data=>{
  return new Promise((r)=>{
    r(data)=
  })
}));

setInterval(()=>{
  subject.next(Date.now())
},1000)

buffered.subscribe(x => console.log('ok',x));
