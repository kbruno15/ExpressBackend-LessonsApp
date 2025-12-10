# ExpressBackend-LessonsApp

Backend (Node.js + Express + MongoDB) for the **After School Lessons** coursework app for CST3144.

This API provides lesson data, search functionality, order creation and lesson updates for the Vue.js front-end.

---

## Live deployment

- **API base URL (Render):**  
  https://lessons-backend-46m7.onrender.com

- **Front-end (GitHub Pages):**  
  https://kbruno15.github.io/VueFrontEnd-LessonsApp

The front-end calls this API using `fetch` with JSON.

---

## Technology stack

- Node.js + Express
- MongoDB Atlas (cloud database)
- Native MongoDB driver (`mongodb` package)
- Deployed on **Render** as a web service
- Environment variables managed with **dotenv**

---

## Environment variables

The server reads configuration from `.env`:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
DB_NAME=after_school_app
PORT=3000
.env is listed in .gitignore so credentials are not committed to GitHub.

Locally, the server will use PORT=3000 by default if no PORT is set.

Running the backend locally

Clone the repository:

git clone https://github.com/kbruno15/ExpressBackend-LessonsApp.git
cd ExpressBackend-LessonsApp


Install dependencies:

npm install


Create a .env file in the root of the project (same folder as server.js) and copy:

MONGODB_URI=your_mongodb_atlas_connection_string
DB_NAME=after_school_app
PORT=3000


Start the server:

node server.js


Test in the browser or with a tool like Postman:

http://localhost:3000/ → health check ({ status: "ok" })

http://localhost:3000/lessons → list of lessons (JSON)

http://localhost:3000/images/math.png → sample image (if file exists)

Collections and data model

Database: after_school_app

Collections:

lessons

orders

Lesson document example
{
  "_id": ObjectId("..."),
  "topic": "Math",
  "location": "London",
  "price": 100,
  "space": 5,
  "image": "math.png"
}


image is the filename of a PNG in the local images/ folder on the server.

The Express route /images/:filename serves these files.

Order document example
{
  "_id": ObjectId("..."),
  "name": " Bruno Kwizera",
  "phone": "0712345678",
  "items": [
    {
      "lessonId": ObjectId("..."),
      "quantity": 2
    }
  ],
  "createdAt": ISODate("2025-12-10T10:00:00Z")
}

API endpoints
GET /

Health check.

Response:

{
  "status": "ok",
  "message": "Lessons API running"
}

GET /lessons

Returns all lessons as JSON.

GET /search?q=...

Searches lessons by:

topic (subject)

location

numeric fields (price or space) when the query can be converted to a number

The server builds a MongoDB filter with a case-insensitive regex for strings and exact
match for numbers.

POST /orders

Creates a new order.

Request body:

{
  "name": "Student or parent",
  "phone": "0712345678",
  "items": [
    {
      "lessonId": "69369555ae07d8ded4b5084c",
      "quantity": 1
    }
  ]
}


Validation:

name and phone must be present.

items must be a non-empty array.

The server converts lessonId strings to ObjectId before inserting the order.
PUT /lessons/:id

Updates fields of a lesson (normally the space value after an order is placed).

:id is the string representation of the MongoDB _id.

Only the fields passed in the JSON body are updated.

price and space are converted to numbers before saving.

Example:

PUT /lessons/6639555ae07d8ded4b5084c
Content-Type: application/json

{
  "space": 3
}
GET /images/:filename

Serves lesson icon images stored on the server in the images/ folder.

Example:

Request: GET /images/math.png

Physical path: ./images/math.png

If the file does not exist, the API returns:

{ "error": "Image not found" }

Logging and error handling

Each request is logged with method, URL and body (if present).

Database operations are wrapped in .catch() blocks and return HTTP 500 with a
JSON error message when something goes wrong.
Coursework notes

Backend satisfies requirements for:

Use of MongoDB for data storage.

Use of Express to provide REST endpoints.

Separation of front-end and back-end.

Deployment to a real hosting provider (Render).

Securing credentials using environment variables instead of hard-coding
connection strings in the code.