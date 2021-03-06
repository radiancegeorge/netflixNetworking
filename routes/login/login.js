const express = require('express');
const login = express.Router()
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const db = require('../db');
const uuid = require('uuid').v1;
const user_dashboard = require('../dashboard_users/user_dashboard')

// login.use(session)
const sessionStore = new MysqlStore({
    clearExpired: true,
    checkExpirationInterval: 60000,
    createDatabaseTable: true,
    schema:{
        tableName: 'sessions'
    }
}, db)
login.use(session({
    secret: 'networkingNetflix',
    resave: false,
    saveUninitialized: true,
    genid:()=>{
        return uuid();
    },
    cookie: {
        // secure: true,
        maxAge: 86400000,
        
    }
}))


login.use((req, res, next)=>{
    setTimeout(() => {
        req.session.msg = null;

    }, 10000);
    next();
})

login.get('/login', (req, res)=>{
    if(req.session.username){
        res.redirect('/user/dashboard')
    }else{
        res.render('login', {msg: ''});
    }

})
login.post('/login', (req, res)=>{
    

    const data = req.body;
    const values = [data.username, data.username];
    
    const sql = `select * from registered_users where username = ? or email = ?`;
    db.query(sql, values, (err, result)=>{
        if(err)throw err;
        if(result.length === 1){
            req.session.username = data.username
            result = result[0]
            bcrypt.compare(data.password, result.password).then( password =>{
                if(password){
                    console.log('welcome');
                    console.log(result)
                    req.session.email = result.email;
                    req.session.everyDetail = result;
                    const sql = `select * from registered_users where username = ? or email = ? `;
                    db.query(sql, values, (err, result) => {
                        if(err)throw err;
                        const bnk = result[0].bank_name;
                        if(bnk === null){
                            //add email to locals;
                            req.session.email = result[0].email;
                            req.session.msg = 'Please put in your account details'
                            console.log('no bank detail');
                            res.redirect('/bank');
                        }else{
                            res.redirect('/user/dashboard')
                        };
                    });

                }else{
                    console.log('wrong password')
                    res.render('login', {msg: 'Wrong password'})
                    //re render page with wrong password message
                };
            });
        }else{
            console.log('invalid username')
            res.render('login', {msg: 'Invalid Username'})
            // invalid username... re render the page with an error message
        }
    })
})

login.get('/logout', (req, res)=>{
    req.session.username = false;
    req.session.email = false;
    req.session.regEmail = false;
    req.session.username = null;
    // req.session.username.destroy();
    req.session.msg = null;
    req.session.message = null;
    res.redirect('/login')
});
login.use('/user', user_dashboard)
module.exports = login