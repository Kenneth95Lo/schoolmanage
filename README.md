# schoolmanage

## API SETUP

LOCAL ENV:
http://localhost:3000/

ONLINE ENV:
HOST:
https://school-managee.herokuapp.com/

## APIs
The 4 APIs are for
* Register Student(s) To A Teacher
* Find Common Students Among Teacher(s)
* Suspend A Student
* Retrieve Notificaitons

### 1. REGISTER STUDENT(S) TO A TEACHER

Notes: When teacher & student exist in the DB, the registration will occur. Else nothing happens.

API Endpoint:
`api/register`

Method:
POST

Accepted Request Body:
```
{
    "teacher":"jim@mail.com",
    "students":[
        "kol@mail.com",
        "tim@mail.com"
    ]
}
```

Response (Success):
HTTP Status: 204


Unacceptable Request Body

More than one teacher is not supported

```
{
    "teacher":["jim@mail.com","ben@mail.com"],
    "students":[
        "kol@mail.com",
        "tim@mail.com"
    ]
}
```

Response (Fail)

HTTP Status: 400

```
{
    "error": true,
    "errorMsg": "More than 1 teacher is not supported"
}
```


### 2. FIND COMMON STUDENTS AMONG TEACHER(S)

Notes: When student is not suspended, it will occur in the results.

API Endpoint:
`api/commonstudents?teacher=[teacher_email_1]&teacher=[teacher_email_2]`

Method:
GET

Response (Success):
HTTP Status: 200

```
{
    "students": [
        "tim@mail.com"
    ]
}
```

### 3. SUSPEND A STUDENT

Notes: When student is exist, it will the update will occur. Else, nothing happens.

API Endpoint:
`api/suspend`

Method:
POST

Accepted Request Body:
```
{
    "student":"kol@mail.com"
}
```

Response (Success):
HTTP Status: 204


### 4.RETRIEVE NOTIFICATIONS

Notes:
When student (even being @mentioned) is not suspended, it will show in the results.
Will capture email only when mentioned with '@'


API Endpoint:
`api/retrievefornotifications`

Method:
POST

Accepted Request Body:
```
{
    "teacher":"terry@mail.com",
    "notification":"Hello guys @dex@mail.com @kol@mail.com"
}
```

Response (Success):
HTTP Status: 200

```
{
    "students": [
        "tim@mail.com",
        "dex@mail.com"
    ]
}
```


### INVALID EMAIL FORMAT IN API

For all the APIs, if there's an invalid email format in the request body/ query. It will return `400 (Bad Request)` with `errormsg` specifying which email input caused the issue.

```
{
    "teacher":"jimmail.com",
    "students":[
        "kol@mail.com",
        "tim@mail.com"
    ]
}
```

Responses
HTTP Status: 400
```
{
    "error": true,
    "errorMsg": "Invalid email format for: [jimmail.com]"
}
```

### NON-EXISTING EMAIL IN REQUEST BODY/ QUERY

When non existing email is in the request body/ query, it will returns 400 with "student/teacher does not exist" error.
```
{
    "error": true,
    "errorMsg": "Student does not exist"
}
```

## Tests
Testing is done with Mocha Chai, the test cases can be found under test/ folder

## Postman Collection
https://www.getpostman.com/collections/6607828f591030c3d5f5