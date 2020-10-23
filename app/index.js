const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql");
const { throws, match } = require("assert");
const DBConf = require("./config/DB.js");
const genFunc = require("./functions/GeneralFunctions.js");
const SqlGenerator = require('./functions/SqlGenerator.js');
const { response } = require("express");

app.use(bodyParser.json());

const conn = mysql.createConnection({
	host: DBConf.HOST,
	user: DBConf.USER,
	port: DBConf.PORT,
	password: DBConf.PASSWORD,
	database: DBConf.DATABASE,
	multipleStatements: true,
});

conn.connect((error) => {
	if (error) throw error;
	console.log("mysql connected");
});

var mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const sqlGenerator = new SqlGenerator();

app.get("/",()=>{
    res.send('Hello, there');
});

//register students to a teacher
app.post("/api/register", (req, res) => {
	let httpStatus = 204;

	let { teacher, students } = req.body;

	if (teacher == undefined || students == undefined) {
		res
			.status(400)
			.json(
				genFunc.errorRespFormatter(true, "Must have teacher and student(s)")
			);
		return;
	}

	if (Array.isArray(teacher)) {
		res
			.status(400)
			.json(
				genFunc.errorRespFormatter(true, "More than 1 teacher is not supported")
			);
		return;
	}

	let emailCheckResp = genFunc.isEmailValid([teacher, ...students]);
	if (!emailCheckResp.valid) {
		res
			.status(400)
			.json(genFunc.errorRespFormatter(true, emailCheckResp.errorMsg));
		return;
	}

	let arrArg = [];

	let sql = sqlGenerator.generateSql('register',{numOfRep:students.length});

	for (const student of students) {
		arrArg = arrArg.concat(teacher, student, teacher, student);
	}

	let query = conn.query(sql, arrArg, (error, results) =>responseHandler(error, results, "register", res));
});

app.get("/api/commonstudents", (req, res) => {
	let params = req.query;
	let { teacher } = params;

	if (!teacher) {
		res.status(400).send({
			error: true,
			errorMsg: "teacher query cannot be empty",
		});
		return;
	}

    //check if teacher is an array
    let isMoreThanOne = Array.isArray(teacher);
	let emailCheckResp = genFunc.isEmailValid(
		isMoreThanOne ? teacher : [teacher]
	);
	if (!emailCheckResp.valid) {
		res.status(400).send({
			error: true,
			errorMsg: emailCheckResp.errorMsg,
		});
		return;
	}

	let sql = sqlGenerator.generateSql("commonstudents",{isMoreThanOne:isMoreThanOne,arrLength:isMoreThanOne ? teacher.length : 1});

	let query = conn.query(sql, [teacher], (error, results) =>responseHandler(error, results, "commonstudents", res));
});

//suspend student
app.post("/api/suspend", (req, res) => {
	let { student } = req.body;
	let hasError = false;
	let errorMsg = "";

	if (student == undefined || student === "") {
		res
			.status(400)
			.json(genFunc.errorRespFormatter(true, "Student cannot be empty"));
	}

	let emailCheckResp = genFunc.isEmailValid([student]);
	if (!emailCheckResp.valid) {
		hasError = true;
		(errorMsg = emailCheckResp.errorMsg), (httpStatus = 400);
	}

	if (hasError) {
		res.status(httpStatus).json(genFunc.errorRespFormatter(hasError, errorMsg));
		return;
	}

	let sql = sqlGenerator.generateSql('suspend');

	let query = conn.query(sql, [student, student], (err, results) =>responseHandler(err, results, "suspend", res));
});

app.post("/api/retrievefornotifications", (req, res) => {

	let { notification, teacher } = req.body;

	if (notification == undefined || teacher == undefined) {
		res
			.status(400)
			.json(
				genFunc.errorRespFormatter(true, "Must have teacher & notification")
			);
		return;
	}

	if (Array.isArray(teacher)) {
		res
			.status(400)
			.json(
				genFunc.errorRespFormatter(true, "Multiple teachers not supported")
			);
		return;
	}

    //check if any tag in the notication string
	let matches = notification.match(mentionRegex);

    let hasMatches = false;
	if (matches && matches.length > 0) {
        hasMatches = true;
		matches = matches.map((emailWithTag) => {
			return emailWithTag.substring(1);
		});
	} else {
		matches = [];
	}

	let emailCheckResp = genFunc.isEmailValid(
		hasMatches ? [teacher, ...matches] : [teacher]
	);
	if (!emailCheckResp.valid) {
		res
			.status(400)
			.json(genFunc.errorRespFormatter(true, emailCheckResp.errorMsg));
		return;
	}

	let sql = sqlGenerator.generateSql("retrievefornotifications",{hasTags:matches.length>0});

	let arrQueryOption =
		hasMatches ? [teacher, matches, teacher] : [teacher, teacher];

	let query = conn.query(sql, arrQueryOption, (err, results) =>responseHandler(err, results, "retrievefornotifications", res));
});

const responseHandler = (error, results, api, res) => {
	if (error) {
		res.sendStatus(500);
		return;
	}

	let httpStatus = 200;
	let errorMsg = "";
	let hasError = false;

	if (api === "register") {
		if (results) {
			res.sendStatus(204);
		}
	} else if (api === "commonstudents") {
		if (results.length === 0) {
			httpStatus = 404;
			errorMsg = "No match found";
			hasError = true;
		} else {
			results = results.map((obj) => {
				return obj.student_email;
			});
		}

		if (hasError) {
			res
				.status(httpStatus)
				.json(genFunc.errorRespFormatter(httpStatus, errorMsg));
		} else {
			res.status(200).json({ students: results });
		}

		return;
	} else if (api === "suspend") {
		if (results) {
			res.sendStatus(204);
		}
	} else if (api === "retrievefornotifications") {
		if (results.length === 0) {
			res.status(404).json(genFunc.errorRespFormatter(false, "No match found"));
			return;
		} else {
			results = results.map((obj) => {
				return obj.student_email;
			});
		}

		res.status(httpStatus).json({ students: results });
	}
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
