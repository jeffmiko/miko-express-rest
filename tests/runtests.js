const axios = require('axios')

axios.defaults.baseURL = `http://localhost:${process.env.HTTP_PORT || 3000}/api`
axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.headers.put['Content-Type'] = 'application/json'
axios.defaults.headers.patch['Content-Type'] = 'application/json'
axios.defaults.headers.delete['Content-Type'] = 'application/json'
axios.defaults.headers.get['Content-Type'] = 'application/json'
axios.defaults.timeout = 15000;  // 5 seconds

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
 }
 return result;
}


async function testadd() {
  const givenname = makeid(12)
  const familyname = makeid(12)
  const newuser = {
    givenname,
    familyname,
    email: `${givenname}.${familyname}@yandex.com`
  }
  return axios.post("users/add",newuser).then(res => {
    if (res && res.status < 400 ) {
      if (res.data && res.data.insertId) {
        console.log("testadd - SUCCESS")
        return res.data.insertId
      }
    }
    console.log("testadd - FAILED")
    return null
  }).catch((err) => {
    if (err.code)
      console.log("testadd - FAILED", err.code, err.message)
    else
      console.error("testadd - FAILED", err.message)
    return null
  })
}

async function testget(userpk) {
  return axios.post("users/get",{userpk}).then(res => {
    if (res && res.status < 400 ) {
      if (res.data && res.data.length) {
        console.log("testget - SUCCESS")
        return res.data[0]
      }
    }
    console.log("testget - FAILED")
    return null
  }).catch((err) => {
    if (err.code)
      console.log("testget - FAILED", code, err.message)
    else
      console.error("testget - FAILED", err.message)
    return null
  })
}

async function testsave(user) {
  return axios.post("users/save",user).then(res => {
    if (res && res.status < 400 ) {
      if (res.data && res.data.affectedRows) {
        console.log("testsave - SUCCESS")
        return user
      }
    }
    console.log("testsave - FAILED")
    return null
  }).catch((err) => {
    if (err.code)
      console.log("testsave - FAILED", code, err.message)
    else
      console.error("testsave - FAILED", err.message)
    return null
  })
}

async function testremove(userpk) {
  return axios.post("users/remove",{userpk}).then(res => {
    if (res && res.status < 400 ) {
      if (res.data && res.data.affectedRows) {
        console.log("testremove - SUCCESS")
        return true
      }
    }
    console.log("testremove - FAILED")
    return null
  }).catch((err) => {
    if (err.code)
      console.log("testremove - FAILED", code, err.message)
    else
      console.error("testremove - FAILED", err.message)
    return null
  })
}

async function runall( ) {

  let userpk = await testadd()
  if (userpk) {
    let newuser = await testget(userpk)
    if (newuser) {
      newuser.givenname = "Jeff"
      newuser.updated = new Date()
      let saved = await testsave(newuser)
      if (saved) {
        let removed = await testremove(newuser.userpk)

      }
    }

  }

}

module.exports = runall