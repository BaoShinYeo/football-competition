const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
const port = 4000;
const AWS = require("aws-sdk");

// parse application/json
app.use(bodyParser.json());

// enable cors
app.use(cors());

let awsConfig = {
  region: "ap-southeast-1",
  endpoint: "http://dynamodb.ap-southeast-1.amazonaws.com",
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
};
AWS.config.update(awsConfig);

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = "footballCompetition";
const headers = {
  "content-type": "application/json",
};

// ADD NEW TEAM
// --------------------------------------------
app.post("/team", (req, res) => {
  const team = {
    teamName: req.body.teamName,
    registrationDate: req.body.registrationDate,
    groupNumber: req.body.groupNumber,
    points: 0,
    qualify: false,
  };
  const obj = {
    TableName: "footballCompetition",
    Item: team,
  };
  dynamoDB.put(obj, function (err, data) {
    if (err) {
      res.status(400).send({ err });
    } else {
      res.status(201).send({
        body: team,
      });
    }
  });
});

if (process.env.NODE_ENV) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
