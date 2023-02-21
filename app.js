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
const { writer } = require('repl');

/*
var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');*/

const app = express();
const port = 3000;
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        res.render('pages/project_introduction',{logined : req.session.user});
    }  
});

app.get('/board', (req, res) => {
  if (req.session.user === undefined) {
    res.redirect('/login'); 
  } else {
    connection.query('SELECT * FROM board', function(error, results, fields) {
      if (error) throw error;
      
      res.render('pages/home', {logined: req.session.user, results: results});
    });
  }
});


app.get("/board/write",(req,res) => {
    if(req.session.user===undefined) 
        res.redirect("/login");
    else{
        console.log(req.session.id)
        console.log(req.session.user)
        res.render('pages/writeboard',{logined : req.session.user});
    }
});
//게시판 글작성
app.post('/board/write', express.json(), (req, res) => {
    const sql = 'INSERT INTO board (title, writer, content) VALUES (?, ?, ?);';
    const title = req.body.title;
    const writer = req.session.user;
    const content = req.body.content;
    const params = [title, writer, content];
    if(!title||!content){
        res.send("<script>alert('공란을 채워주세요.'); window.location.replace('/board/write');</script>");
    }else{
        connection.query(sql, params, (err, rows, fileds) => {
        if (err) throw err;
        console.log(rows.insertId);
        res.redirect(`/board/read/${rows.insertId}`)
        })
    }
}) 

//글 번호로 GET요청을 받았을 때 해당 번호에 맞는 글의 정보만을 보내는 코드
app.get('/board/read/:id', (req, res, next) => {
    if(req.session.user===undefined)
        res.redirect("/login"); 
    else{
        console.log(req.session.id)
        console.log(req.session.user)
        connection.query('SELECT * from board', (err, rows) => {
            if (err) throw err;
            const article = rows.find(art => art.idx === parseInt(req.params.id));
            if(!article) {
            return res.status(404).send('ID was not found.');
            }    
            // 조회수 증가
            connection.query('UPDATE board SET view_cnt = view_cnt + 1 WHERE idx = ?', [article.idx], (err, result) => {
                if (err) throw err;
                console.log('views updated for article with id: ', article.idx);
            });
             
            res.render('pages/readBoard',{ 
                logined : req.session.user,
                article : article
            });
        })
    }
})
//글 수정 화면
app.get('/board/update/:id', (req, res, next) => {
    if(req.session.user===undefined)
        res.redirect("/login"); 
    else{
        console.log(req.session.id)
        console.log(req.session.user)
        connection.query('SELECT * from board', (err, rows) => {
            if (err) throw err;
            const article = rows.find(art => art.idx === parseInt(req.params.id));
            if(!article) {
            return res.status(404).send('ID was not found.');
            } 
            else if(req.session.user!=article.writer){
                res.redirect("/board"); 
            }else{
                res.render('pages/updateBoard',{ 
                    logined : req.session.user,
                    article : article
                });
            }
        })
    }  
})
 

app.post('/board/update/:id', express.json(), (req, res, next) => {
    connection.query('SELECT * from board', (err, rows, fildes) => { 
      if (err) throw err;
      const article = rows.find(art => art.idx === parseInt(req.params.id));
      if(!article) {
        return res.status(404).send('ID was not found.');
      } 
      console.log(req.body)
      const sql = 'UPDATE board SET title = ?, writer = ?, content = ? WHERE idx = ?';
      const title = req.body.title;    
      const writer = req.session.user;
      const content = req.body.content;
      const params = [title, writer, content, req.params.id];
      console.log(params)
      connection.query(sql, params, (err, rows, fileds) => {
        if (err) throw err;
        console.log(rows);
      })
      // 데이터를 URL 쿼리 문자열로 전달
      res.redirect(`/board/read/${req.params.id}`) 
    })
})
  
//게시판 글삭제
app.post('/board/delete/:id', (req, res, next) => {
    connection.query('DELETE FROM board WHERE idx = ?', [req.params.id], (err, rows, fileds) => {
      if (err) throw err;
      res.send('게시글이 삭제되었습니다.');
    });
});


app.get("/login",(req,res) => {
    if(req.session.user!==undefined)
        res.redirect("/");
    else{
        res.render('pages/login',{logined : req.session.user}); 
    }
});

app.get("/signup",(req,res) => {
    if(req.session.user!==undefined)
        res.redirect("/");
    else{
        res.render('pages/signup',{logined : req.session.user});
    }
});

app.get("/project_introduction",(req,res) => {
    if(req.session.user===undefined)
        res.redirect("/login");
    else{
        res.render('pages/project_introduction',{logined : req.session.user});
    }
    
});

app.get("/mypage",(req,res) => {
    const writer = req.session.user
    if(req.session.user===undefined){
        res.send("<script>window.location.replace('/login');</script>");    
    }
    else{
        connection.query('SELECT * FROM board WHERE writer = ?;',[writer], function(error, results, fields) {
            if (error) throw error;
            
            res.render('pages/mypage',{logined : req.session.user, results: results});
        });
    }
});


//로그인 요청
app.post("/login",bodyParser.json(),(req,res)=>{
    const loginid =req.body.loginEmail;
    const loginpassword =req.body.loginPassword;
    const sql = 'SELECT * FROM users WHERE id=? ;';
    const aa =[loginid,loginpassword];
    console.log(aa);
    
    if(loginid===""||loginpassword==="")
        res.send("<script>alert('공란 확인하세요.'); window.location.replace('/login');</script>");
    else{
        connection.query(sql,[loginid],(err,results)=>{
            if(err) 
                console.log(err);

            if(!results[0]){
                console.log("아이디틀림");
                res.send("<script>alert('아이디를 확인하세요.'); window.location.replace('/login');</script>");     
            }
            const user = results[0];
            crypto.pbkdf2(loginpassword,user.salt, 1, 32, 'sha512',(err,derivedkey)=>{
                if(err) console.log(err);

                if(derivedkey.toString('base64')===user.password){
                    console.log("성공");
                    req.session.user = loginid;
                    res.redirect('/'
                        
                    );
                }
                else{
                    console.log("pw틀림");
                    res.send("<script>alert('비밀번호가 틀렸습니다.'); window.location.replace('/login');</script>");
                }
            });  
        });
    }
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
    
    if(!email||!name||!age||!password){
        console.log(email)
        res.send("<script>alert('공란을 입력해 주세요.'); window.location.replace('/signup');</script>")
    }
    else{
        connection.query('INSERT INTO `nodeapp`.`users` (`id`, `name`, `age`, `password`, `salt`) VALUES (?,?,?,?,?)',param,(err,row) =>{
            if(err) 
                console.log(err);
            console.log(`${name} 회원가입 성공`)
            res.send("<script>alert(`회원가입을 축하합니다.`);  window.location.replace('/login')</script>")
        });
        
    };
});
app.get("/logout",(req,res)=>{
    req.session.destroy(function(err){
        res.redirect('/login')
    })
})



//서버3000포트 리슨중
app.listen(port, () =>{
    console.log(`서버 실행 ${port}port`)
});
