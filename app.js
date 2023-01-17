//모듈 가져오기
const express = require('express');
const mysql = require("mysql");
const path = require("path");
const static = require("serve-static");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const session = require("express-session");
const mySQLstore = require("express-mysql-session")(session);
const dbconfig = require("./config/dbconfig.json");
const { Cookie } = require('express-session');

/*
var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');*/

const app = express();
const port = 3000;
const router = express.Router();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// DB 커넥션 생성
const connection = mysql.createConnection({
    connectionLimit: 10,
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
    debug:false
});
// DB 접속
connection.connect();

app.use(session({
    secret : '!@#$%^&*',
    store : new mySQLstore(dbconfig),
    resave : false,
    saveUninitialized : false,
    
}));



//뷰 설정
app.set("views","./views");

app.set("view engine","ejs");




//라우팅
app.get("/",(req,res) => {
    if(req.session.user===undefined)
        res.redirect("/login");
    else{
        console.log(req.session.id)
        console.log(req.session.user)
        res.render('pages/project_introduction');
    }
});

app.get("/board",(req,res) => {
    if(req.session.user===undefined)
        res.redirect("/login");
    else{
        console.log(req.session.id)
        console.log(req.session.user)
        res.render('pages/home');
    }
});

app.get("/board/write",(req,res) => {
    if(req.session.user===undefined)
        res.redirect("/login");
    else{
        console.log(req.session.id)
        console.log(req.session.user)
        res.render('pages/writeboard');
    }
});

app.get("/login",(req,res) => {
    if(req.session.user!==undefined)
        res.redirect("/");
    else{
        res.render('pages/login');
    }
});

app.get("/signup",(req,res) => {
    if(req.session.user!==undefined)
        res.redirect("/");
    else{
        res.render('pages/signup');
    }
});

app.get("/project_introduction",(req,res) => {
    if(req.session.user===undefined)
        res.redirect("/login");
    else{
        res.render('pages/project_introduction');
    }
    
});

app.get("/about_me",(req,res) => {
    if(req.session.user===undefined)
        res.redirect("/login");
    else{
        res.render('pages/about_me');
    }
    
});

app.get("/logout",(req,res)=>{
    req.session.destroy(function(err){
        res.redirect('/login')
    })
})
//로그인 요청
app.post("/login",bodyParser.json(),(req,res)=>{
    const loginid =req.body.loginEmail;
    const loginpassword =req.body.loginPassword;
    const sql = 'SELECT * FROM users WHERE id=? ;';
    const aa =[loginid,loginpassword];
    console.log(aa);
    connection.query(sql,[loginid],(err,results)=>{
        if(err) 
            console.log(err);

        if(!results[0]){
            console.log("아이디틀림");
            res.redirect("/login")
            res.write("<script>alert('아이디를 확인하세요')</script>");     
        }
        const user = results[0];
        crypto.pbkdf2(loginpassword,user.salt, 1, 32, 'sha512',(err,derivedkey)=>{
            if(err) console.log(err);

            if(derivedkey.toString('base64')===user.password){
                console.log("성공");
                req.session.user = loginid;
                res.redirect('/',{
                    user : req.session.user 
                });
            }
            else{
                console.log("pw틀림");
                res.redirect("/login")
  
                //res.write("<script>alert('비밀번호를 확인하세요')</script>");
            }
        });  
    });
});

app.post("/signup",(req,res)=>{
    const email = req.body.email
    const name = req.body.name
    const age = req.body.age
    const password = req.body.password
    const salt = crypto.randomBytes(32).toString('base64')// 솔트 생성
    const hashedPw = crypto.pbkdf2Sync(req.body.password, salt, 1, 32, 'sha512').toString('base64')
    const param = [req.body.email,req.body.name,req.body.age,hashedPw,salt]
    console.log(`salt : ${salt} , hashedPW1: ${hashedPw}`)
    
    if(!email||!name||!age||!password)
        console.log(email)
        //return res.write("<script>alert('공백란을 채워주세요')</script>");//************* 나중에 처리해야함
    else{
        connection.query('INSERT INTO `nodeapp`.`users` (`id`, `name`, `age`, `password`, `salt`) VALUES (?,?,?,?,?)',param,(err,row) =>{
            if(err) 
                console.log(err);
            console.log(`${name} 회원가입 성공`)
        });
        res.redirect('/login');
    };
});



//서버3000포트 리슨중
app.listen(port, () =>{
    console.log(`서버 실행 ${port}port`)
});
