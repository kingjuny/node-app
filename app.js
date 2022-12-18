const express = require('express');
const app = express();
const port = 3000;

app.set("views","./views");

app.set("view engine","ejs");

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

app.listen(port, () =>{
    console.log(`서버 실행 ${port}port`)
});