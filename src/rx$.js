const {Subject } = require('rxjs')
const { share,filter } = require('rxjs/operators')

const subject = new Subject()

exports.subject = subject

exports.on = function (type) {
  return subject.pipe(share(),filter((str)=>{
    try{
      let json = JSON.parse(str)
      if(json.type===type){
        return json
      }
    } catch(e) {

    }
  }))
}
