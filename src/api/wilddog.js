//src/api/wilddog.js
//@flow
import maker from './maker'
import wilddog from 'wilddog'

class WilddogAPI {
  api:any
  timestamp:boolean
  debug:boolean
  constructor() {
    process.env.NODE_ENV
    
    this.debug = process.env.NODE_ENV !== 'production'
    this.timestamp = !this.debug
    this.api = maker( process.env.NODE_ENV === 'production')
  }

  login(phone:string, password:string):Function {
    return wilddog.auth().signInWithPhoneAndPassword(phone, password)
  }
  loginByEmail(email:string, password:string): Function{
    return wilddog.auth().signInWithEmailAndPassword(email, password)
  }

  curUser():Object {
    return wilddog.auth().currentUser
  }
  logout(): Function{
    return wilddog.auth().signOut()
  }
  async  createUser(phone:string, password:string): Promise<User> {
    await wilddog.auth().createUserWithPhoneAndPassword(phone, password)
    let user = wilddog.auth().currentUser
    let uid = `${user.uid}`
    await this.api.child(`user/${uid}`).set({ phone: phone ,uid})
    console.log('createUser:', phone)
    return user
  }



  async  updateEmail(email:string) :Promise<User>{
    let user = wilddog.auth().currentUser
    await user.updateEmail(email)
    let uid = `${user.uid}`
    await this.api.child(`user/${uid}`).update({ email: email })
    return user
  }
  /*
   async  updatePhone(phone){ 
    let user =  wilddog.auth().currentUser
    await user.updatePhone(phone)
    let uid = `${user.uid}`
    await this.api.child(`user/${uid}`).update({phone:phone})
    return user
  }*/
  async   updateProfile(displayName:string, photoUrl:string) :Promise<User>{
    let profile = {
      'displayName': displayName,
      'photoURL': photoUrl
    }
    let user = wilddog.auth().currentUser
    let uid = `${user.uid}`
    await this.api.child(`user/${uid}`).update(profile)
    await user.updateProfile(profile)

    return user
  }
  async transaction(key: string,delta:number) : Promise<any>{
    let result = await this.api.child(key).transaction(currentValue => {
     
      return (currentValue || 0) + delta
    })
   if (result.committed) {
       // console.log('transaction commit success!')
        let currentValue =Number(result.snapshot.val())
       // console.log("New ID: ", id)
       await this.api.child(key).set(currentValue)  
       return currentValue
   }else{
     console.log('transaction failed! ',key)
     return null
   }
   
  }
  push(key: string, data: any):Promise<any> {
    return this.api.child(key).push(data)
  }
  save(key: string, data: any):Promise<any> {
    return this.api.child(key).set(data)
  }
  update(key: string, data: Object):Promise<any> {
    return this.api.child(key).update(data)
  }

  async fetch(key: string):Promise<any> {
    const snapshot = await this.api.child(key).once('value')
    const val = snapshot.val()
    // mark the timestamp when this item is cached
    if (val) {
      if (this.timestamp&& (val instanceof Object))
          val.__lastUpdated = Date.now()
      if(this.debug) 
        console.log('load ' + key + ' from remote')
    }
    return val
  }
}

export default WilddogAPI
