//모듈 가져오기
const express = require('express');
const mysql = require("mysql");
const path = require("path");
const static = require("serve-static");
const bodyParser = require("body-parser")
const dbconfig = require("./config/dbconfig.json");

/*
var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');*/

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

const app = express();
const port = 3000;
const router = express.Router();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());




//뷰 설정
app.set("views","./views");

app.set("view engine","ejs");




//라우팅
app.get("/",(req,res) => {
    res.render('pages/home');
});

app.get("/login",(req,res) => {
    res.render('pages/login');
});

app.get("/signup",(req,res) => {
    res.render('pages/signup');
});

app.get("/project_introduction",(req,res) => {
    res.render('pages/project_introduction');
});

app.get("/about_me",(req,res) => {
    res.render('pages/about_me');
});
app.post("/process/adduser",(req,res)=>{
    const param = [req.body.email,req.body.name,req.body.age,req.body.password]
    connection.query('INSERT INTO `nodeapp`.`users` (`id`, `name`, `age`, `password`) VALUES (?,?,?,?);',param,(err,row) =>{
        if(err) console.log(err);
    })
        
});


//서버3000포트 리슨중
app.listen(port, () =>{
    console.log(`서버 실행 ${port}port`)
});