var mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

module.exports = class SqlGenerator{

    constructor(){

    }

    generateSql(api,params=null){

        let sql = "";

        if(api==='retrievefornotifications'){

            let { hasTags } = params;

            sql = "SELECT * FROM (SELECT DISTINCT s.student_email FROM teacher_student ts JOIN teacher t ON t.teacher_id=ts.teacher_id JOIN student s ON s.student_id=ts.student_id WHERE ts.status=1 AND t.teacher_email LIKE ?";

            if (hasTags) {
                sql +=
                    " UNION SELECT DISTINCT student_email FROM student WHERE suspended=0 AND student_email IN (?))";
            } else {
                sql += ")";
            }

            sql += " AS temp WHERE (SELECT COUNT(*) FROM teacher WHERE teacher_email LIKE ?)>0";

        }else if(api==='register'){

            let { numOfRep } = params;

            for(var i=0; i<numOfRep; i++){
                sql +="INSERT INTO teacher_student (teacher_id,student_id) SELECT * FROM (SELECT (SELECT teacher_id FROM teacher WHERE teacher_email LIKE ?),(SELECT student_id FROM student WHERE student_email LIKE ?)) AS tmp WHERE NOT EXISTS (SELECT teacher_id FROM teacher_student WHERE teacher_id=(SELECT teacher_id FROM teacher WHERE teacher_email LIKE ?) AND student_id=(SELECT student_id FROM student WHERE student_email LIKE ?)) LIMIT 1;";
            }

        }else if(api==='commonstudents'){

            let {isMoreThanOne,arrLength} = params;

            sql = "SELECT DISTINCT s.student_email FROM teacher_student ts JOIN teacher t ON t.teacher_id=ts.teacher_id JOIN student s ON s.student_id=ts.student_id WHERE ts.status=1 AND t.teacher_email IN (?)";

            if(isMoreThanOne){
                sql +="GROUP BY ts.student_id HAVING (count(ts.student_id)=" +arrLength.toString() +");";
            }

        }else if(api==='suspend'){

            sql = "UPDATE student SET suspended=1 WHERE student_email LIKE ? ; UPDATE teacher_student SET status=0 WHERE student_id=(SELECT student_id FROM student WHERE student_email LIKE ?)";

        }else if(api==='checkexist'){

            let {tablename,columnname} = params;

            sql = "SELECT COUNT(*) AS headCount FROM (SELECT * FROM "+tablename+" WHERE "+columnname+" IN (?)) AS tmp";

        }else if(api==='checkexistunion'){

            let { hasTags } = params;

            sql = "SELECT COUNT(*) AS headCount FROM (SELECT teacher_id AS id FROM teacher WHERE teacher_email IN (?) UNION SELECT student_id AS id FROM student WHERE student_email IN (?)) AS tmp";

        }

        return sql;

    }

}