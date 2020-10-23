const chai = require("chai");
var expect = chai.expect;
var chaiHttp = require('chai-http');
var request = require('request');

chai.use(chaiHttp);

describe('api/commonstudents',()=>{

    it('Find common student for one teacher (ben@mail.com)',(done)=>{

        chai
        .request("http://localhost:3000/")
        .get("api/commonstudents?teacher=ben%40mail.com")
        .end((err,res)=>{
            expect(res.status).to.be.equal(200);
            // expect(res.body.students).to.contains('dex@mail.com','ken@mail.com','mary@mail.com','sam@mail.com','tim@mail.com');
            // expect(res.body.students).to.be.lengthOf(5);
            done();
        });
    });

    it("Find common students for 2 teachers (ben@mail.com & sally@mail.com), should return 2 records", (done) => {
      chai
        .request("http://localhost:3000/")
        .get("api/commonstudents?teacher=sally%40mail.com&teacher=ben%40mail.com")
        .end((err,res)=>{
            expect(res.status).to.be.equal(200);
            expect(res.body.students).to.be.lengthOf(2);
            done();
        });
    });

    it("No teacher email provided, should return 400(Bad Request) with error msg", (done) => {
      chai
        .request("http://localhost:3000/")
        .get("api/commonstudents")
        .end((err, res) => {
          expect(res.status).to.be.equal(400);
          expect(res.body).to.have.keys("error", "errorMsg");
          done();
        });
    });

    it("Find common students with an invalid email (benmail.com & sally@mail.com), should return 400(Bad Request) with error msg", (done) => {
      chai
        .request("http://localhost:3000/")
        .get("api/commonstudents?teacher=sally%40mail.com&teacher=benmail.com")
        .end((err,res)=>{
            expect(res.status).to.be.equal(400);
            expect(res.body).to.have.keys('error','errorMsg')
            done();
        });
    });

});

describe('api/register',()=>{

    it('Register a student to a teacher',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/register")
          .send({
            teacher: "ben@mail.com",
            students: ["queen@mail.com", "tim@mail.com"],
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(204);
            expect(res.body).to.be.empty;
            done();
          });
    });

    it('Register one existing student to a teacher',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/register")
          .send({
            teacher: "ben@mail.com",
            students: ["queen@mail.com"],
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(204);
            expect(res.body).to.be.empty;
            done();
          });
    });

    it('Register with one invalid email format, should fail with 400 with errorMsg',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/register")
          .send({
            teacher: "benmail.com",
            students: ["queen@mail.com"],
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(400);
            expect(res.body).to.have.keys('error','errorMsg');
            done();
          });
    });

    it('Register with array of teachers, should fail with 400 with errorMsg',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/register")
          .send({
            teacher: ["benmail.com","terry@mail.com"],
            students: ["queen@mail.com"],
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(400);
            expect(res.body).to.have.keys('error','errorMsg');
            done();
          });
    });

});



describe("api/suspend",()=>{
    it('Suspend a student',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/suspend")
          .send({
            student: "mary@mail.com",
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(204);
            expect(res.body).to.be.empty;
            done();
          });
    });

    it("Do not provide student field, should return 400 with errorMsg", (done) => {
      chai
        .request("http://localhost:3000/")
        .post("api/suspend")
        .send({})
        .end((err, res) => {
          expect(res.status).to.be.equal(400);
          expect(res.body).to.have.keys("error", "errorMsg");
          done();
        });
    });
});

describe("api/retrievefornotifications",()=>{

    it('Send notification with valid email & without tag',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/retrievefornotifications")
          .send({
            teacher: "ben@mail.com",
            notification: "Hello guys",
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            // expect(res.body.students).to.be.lengthOf(5);
            done();
          });
    });

    it('Send notification with valid email & with tag',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/retrievefornotifications")
          .send({
            teacher: "ben@mail.com",
            notification: "Hello guys @queen@mail.com",
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            // expect(res.body.students).to.be.lengthOf(6);
            done();
          });
    });

    it('Send notification with invalid teacher email & with tag',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/retrievefornotifications")
          .send({
            teacher: "benmail.com",
            notification: "Hello guys @queen@mail.com",
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(404);
            expect(res.body).to.have.keys('error','errorMsg');
            done();
          });
    });

    it('Send notification with invalid teacher & with tag',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/retrievefornotifications")
          .send({
            teacher: "oprah@mail.com",
            notification: "Hello guys @queen@mail.com",
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(404);
            expect(res.body).to.have.keys('error','errorMsg');
            done();
          });
    });

    it('Send notification with array of teacher & with tag',(done)=>{
        chai
          .request("http://localhost:3000/")
          .post("api/retrievefornotifications")
          .send({
            teacher: ["oprah@mail.com","ben@mail.com"],
            notification: "Hello guys @queen@mail.com",
          })
          .end((err, res) => {
            expect(res.status).to.be.equal(400);
            expect(res.body).to.have.keys('error','errorMsg');
            done();
          });
    });

});

