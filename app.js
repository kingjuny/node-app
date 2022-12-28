//모듈 가져오기
const express = require('express');
const mysql = require("mysql");
const path = require("path");
const static = require("serve-static");
const dbconfig = require("./config/dbconfig.json");
//데이터베이스 커넥션 풀
const pool = mysql.createPool({
    connectionLimit: 10,
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
    debug:false
});
const app = express();
const port = 3000;
//뷰 설정
app.set("views","./views");

app.set("view engine","ejs");
//라우팅
app.post("/process/adduser",(req,res) => {
    console.log("/process/adduser호출됨"+req)
});
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

//서버3000포트 리슨중
app.listen(port, () =>{
    console.log(`서버 실행 ${port}port`)
});