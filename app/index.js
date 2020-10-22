const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const { throws, match } = require('assert');
const DBConf = require('./config/DB.js');

app.use(bodyParser.json());

const conn = mysql.createConnection({
    host:DBConf.HOST,
    user:DBConf.USER,
    port:DBConf.PORT,
    password:DBConf.PASSWORD,
    database:DBConf.DATABASE,
    multipleStatements:true
});

conn.connect((error)=>{
    if(error) throw error;
    console.log("mysql connected");
});

var emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
var mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

function isEmailValid (inputEmails){

    let valid = true;
    let errorMsg = '';

    for (const email of inputEmails) {
        
        let tmpValid = emailRegex.test(email);
        if(!tmpValid){
            errorMsg = "Invalid email format for: ["+ email +"]";
            valid = false;
            break;
        }
        valid &= tmpValid;
    }

    return {
        valid:valid,
        errorMsg:errorMsg
    };

}

function respFormatter (hasError,errorMsg,resultObj={}) {
    return {
        error:hasError,
        errorMsg:errorMsg,
        ...resultObj
    }
}

//register students to a teacher
app.post('/api/register',(req,res)=>{

    if(!req.body){
        res.status(400).json(respFormatter(true,'Body cannot be empty'));
        return;
    }

    let httpStatus = 204;

    let {teacher,students} = req.body;

    if(teacher==undefined || students==undefined){
        res.status(400).json(respFormatter(true,'Must have teacher and student(s)'));
        return;
    }

    if(Array.isArray(teacher)){
        res.status(400).json(respFormatter(true,'More than 1 teacher is not supported'));
        return;
    }

    let emailCheckResp = isEmailValid([teacher, ...students]);
    if (!emailCheckResp.valid) {
      res.status(400).json(respFormatter(true, emailCheckResp.errorMsg));
      return;
    }

    let teacherEmail = teacher;
    let studentsArr = students;
    let arrArg = [];

    let sql = "";

    for (const student of studentsArr) {
      sql += "INSERT INTO teacher_student (teacher_id,student_id) SELECT * FROM (SELECT (SELECT teacher_id FROM teacher WHERE teacher_email LIKE ?),(SELECT student_id FROM student WHERE student_email LIKE ?)) AS tmp WHERE NOT EXISTS (SELECT teacher_id FROM teacher_student WHERE teacher_id=(SELECT teacher_id FROM teacher WHERE teacher_email LIKE ?) AND student_id=(SELECT student_id FROM student WHERE student_email LIKE ?)) LIMIT 1;";
      arrArg = arrArg.concat(teacherEmail, student, teacherEmail, student);
    }

    let query = conn.query(sql,arrArg,(error, results) => {
        if (error) throw error;
        res.status(httpStatus).send();
      }
    );

});


app.get("/api/commonstudents", (req, res) => {

    let params = req.query;
    let {teacher} = params;
    
    if(!teacher){
        res.status(400).send({
            error:true,
            errorMsg:"teacher query cannot be empty"
        })
        return;
    }
    

    let emailCheckResp = isEmailValid(Array.isArray(teacher) ? teacher : [teacher]);
    if(!emailCheckResp.valid){
        res.status(400).send({
          error: true,
          errorMsg: emailCheckResp.errorMsg,
        });
        return;
    }

    let sql =
      "SELECT DISTINCT s.student_email FROM teacher_student ts JOIN teacher t ON t.teacher_id=ts.teacher_id JOIN student s ON s.student_id=ts.student_id WHERE ts.status=1 AND t.teacher_email IN (?)";
    
    if(Array.isArray(teacher)){
        sql += "GROUP BY ts.student_id HAVING (count(ts.student_id)="+teacher.length.toString()+");";
    }

    // res.json({
    //     sql:sql,
    //     teacherArr:teacher
    // });
    // return;

    let query = conn.query(sql,[teacher],(error, results) => {
        if (error) throw error;

        let httpStatus = 200;
        let errorMsg = '';
        if(results.length===0){
            httpStatus=404;
            errorMsg = "No match found";
        }else{
            results = results.map(obj=>{
                return obj.student_email;
            });
        }

        if(httpStatus===404){
            res.status(httpStatus).json(respFormatter(httpStatus===404,errorMsg,{students:results}));
        }else{
            res.status(200).json({students:results});
        }
        
    });
});

//suspend student
app.post('/api/suspend',(req,res)=>{

    let {student} = req.body;
    let hasError = false;
    let errorMsg = '';
    let httpStatus = 204;

    if(student==undefined || student===''){
        res.status(400).json(respFormatter(true,'Student cannot be empty'));
    }
    
    let emailCheckResp = isEmailValid([student]);
    if(!emailCheckResp.valid){
        hasError = true;
        errorMsg = emailCheckResp.errorMsg,
        httpStatus = 400;
    }

    if(hasError){
        res.status(httpStatus).send({
            error:hasError,
            errorMsg:errorMsg
        });
        return;
    }

    let sql =
      "UPDATE student SET suspended=1 WHERE student_email LIKE ? ; UPDATE teacher_student SET status=0 WHERE student_id=(SELECT student_id FROM student WHERE student_email LIKE ?)";

    let query = conn.query(sql,[student,student],(err,results)=>{
        if (err) throw err;
        if(results){
            res.status(204).send();
            // res.json(results);
        }
    });

});

app.post("/api/retrievefornotifications",(req,res)=>{


    let {notification,teacher} = req.body;

    //check for null here
    if(notification==undefined || teacher==undefined){
        res.status(400).json(respFormatter(true,'Must have teacher & notification'));
        return;
    }

    if(Array.isArray(teacher)){
        res.status(400).json(respFormatter(true,'Multiple teachers not supported'));
        return;
    }

    let matches = notification.match(mentionRegex);
    
    if(matches && matches.length>0){
        matches = matches.map((emailWithTag) => {
          return emailWithTag.substring(1);
        });
    }else{
        matches = [];
    }

    let emailCheckResp = isEmailValid(matches.length>0 ? [teacher,...matches] : [teacher]);
    if (!emailCheckResp.valid) {
        res.status(400).json(respFormatter(true,emailCheckResp.errorMsg));
        return;
    }
    
    // res.json({
    //     matches:matches
    // });
    // return;

    let sql = "SELECT * FROM (SELECT DISTINCT s.student_email FROM teacher_student ts JOIN teacher t ON t.teacher_id=ts.teacher_id JOIN student s ON s.student_id=ts.student_id WHERE ts.status=1 AND t.teacher_email LIKE ?";

    if (matches && matches.length>0) {
        sql += " UNION SELECT DISTINCT student_email FROM student WHERE suspended=0 AND student_email IN (?))";
    }else{
        sql += ")";
    }

    sql += " AS temp WHERE (SELECT COUNT(*) FROM teacher WHERE teacher_email LIKE ?)>0";
    
    let arrQueryOption = matches.length>0 ? [teacher, matches,teacher] : [teacher,teacher];

    let query = conn.query(sql,arrQueryOption,(err,results)=>{
        if (err) throw err;

        let httpStatus = 200;
        let errorMsg = "";
        let hasError = false;
        
        if (results.length === 0) {
            res.status(404).json(respFormatter(false,"No match found"));
            return;
        } else {
            results = results.map((obj) => {
                return obj.student_email;
            });
        }

        res.status(httpStatus).json({
            students: results,
        });
    });


});

app.listen(3000,()=>{
    console.log('Server started on port 3000');
});