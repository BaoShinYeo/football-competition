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
      res.status(201).send(team);
    }
  });
});

// GET TEAM DETAILS
// --------------------------------------------
app.post("/getTeamDetails", (req, res) => {
  const params = {
    TableName: tableName,
    Key: { teamName: req.body.teamName },
  };
  dynamoDB.get(params, function (err, data) {
    if (err) {
      res.status(400).send({ err });
    } else {
      res.status(200).send(data.Item);
    }
  });
});

// LIST DETAILS OF ALL TEAMS
// --------------------------------------------
app.post("/getTeams", (req, res) => {
  const params = {
    TableName: tableName,
  };
  dynamoDB.scan(params, function (err, data) {
    if (err) {
      res.status(400).send({ err });
    } else {
      res.status(200).send(data.Items);
    }
  });
});

// REMOVE TEAM
// --------------------------------------------
app.post("/removeTeam", (req, res) => {
  const params = {
    TableName: tableName,
    Key: { teamName: req.body.teamName },
  };
  dynamoDB.delete(params, function (err, data) {
    if (err) {
      res.status(400).send({ err });
    } else {
      res.sendStatus(204);
    }
  });
});

// REMOVE ALL TEAMs
// --------------------------------------------
app.post("/removeTeams", async (req, res) => {
  var params = {
    TableName: tableName,
  };
  let items = [];
  let group = [];
  let data = await dynamoDB
    .scan(params, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      } else {
        console.log(data);
      }
    })
    .promise();
  items = [...items, ...data.Items];
  for (const i of data.Items) {
    const deleteReq = { DeleteRequest: { Key: {} } };
    deleteReq.DeleteRequest.Key["teamName"] = i.teamName;
    group.push(deleteReq);
  }
  params = {
    RequestItems: {
      [tableName]: group,
    },
  };
  dynamoDB.batchWrite(params, function (err, data) {
    if (err) {
      res.status(400).send({ err });
    } else {
      res.sendStatus(204);
    }
  });
});

// UPDATE MATCH
// --------------------------------------------
app.post("/updateMatch", (req, res) => {
  var params = {
    TableName: tableName,
    Key: { teamName: req.body.teamName },
  };
  var updateObj = {
    TableName: tableName,
    Key: {
      teamName: "",
    },
  };
  if (req.body.team1Goals === req.body.team2Goals) {
    updateObj.TableName = req.body.team1;
    dynamoDB.update(params, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      }
    });
  }
  dynamoDB.delete(params, function (err, data) {
    if (err) {
      res.status(400).send({ err });
    } else {
      res.sendStatus(204);
    }
  });
});

if (process.env.NODE_ENV) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
