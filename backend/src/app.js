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
    goalsScored: 0,
    matchHistory: [],
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
app.post("/getTeamDetails", async (req, res) => {
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
app.post("/updateMatch", async (req, res) => {
  var params = {
    TableName: tableName,
    Key: { teamName: "" },
  };
  var updateObj = {
    TableName: tableName,
    Key: {
      teamName: "",
    },
  };
  var draw = false;
  var winner = {};
  var loser = {};
  if (req.body.team1Goals === req.body.team2Goals) {
    draw = true;
    params.Key.teamName = req.body.team1;
    // updateObj.Key.teamName = req.body.team1;
    console.log("Check 1");
    await dynamoDB
      .get(params, function (err, data) {
        if (err) {
          res.status(400).send({ err });
        } else {
          // params.Key.teamName = req.body.team1;
          updateObj.Key.teamName = req.body.team1;
          console.log(`team 1 data ${JSON.stringify(data)}`);
          console.log(`team 1 pre updateObj ${JSON.stringify(updateObj)}`);
          updateObj["UpdateExpression"] = "set points = :point, ";
          updateObj["ExpressionAttributeValues"] = {
            ":point": data.Item.points + 1,
          };
          updateObj["UpdateExpression"] += "goalsScored = :goals, ";
          updateObj["ExpressionAttributeValues"][":goals"] =
            data.Item.goalsScored + req.body.team1Goals;
          updateObj["UpdateExpression"] +=
            "matchHistory = list_append(matchHistory, :matchResults)";
          updateObj["ExpressionAttributeValues"][":matchResults"] = ["draw"];
          console.log(`team 1 post updateObj ${JSON.stringify(updateObj)}`);
          // await dynamoDB
          //   .update(updateObj, function (err, data) {
          //     if (err) {
          //       res.status(400).send({ err });
          //     }
          //   })
          //   .promise();
        }
      })
      .promise();
    dynamoDB.update(updateObj, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      }
    });
    params.Key.teamName = req.body.team2;
    // updateObj.Key.teamName = req.body.team2;
    dynamoDB.get(params, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      } else {
        // params.Key.teamName = req.body.team2;
        updateObj.Key.teamName = req.body.team2;
        console.log(`team 2 data ${JSON.stringify(data)}`);
        console.log(`team 2 pre updateObj ${JSON.stringify(updateObj)}`);
        updateObj["UpdateExpression"] = "set points = :point, ";
        updateObj["ExpressionAttributeValues"] = {
          ":point": data.Item.points + 1,
        };
        updateObj["UpdateExpression"] += "goalsScored = :goals, ";
        updateObj["ExpressionAttributeValues"][":goals"] =
          data.Item.goalsScored + req.body.team2Goals;
        updateObj["UpdateExpression"] +=
          "matchHistory = list_append(matchHistory, :matchResults)";
        updateObj["ExpressionAttributeValues"][":matchResults"] = ["draw"];
        console.log(`team 2 post updateObj ${JSON.stringify(updateObj)}`);
        // await dynamoDB
        //   .update(updateObj, function (err, data) {
        //     if (err) {
        //       res.status(400).send({ err });
        //     } else {
        //       res
        //         .status(200)
        //         .send({ message: "Draw Updated!", body: req.body });
        //     }
        //   })
        //   .promise();
      }
    });
    dynamoDB.update(updateObj, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      } else {
        res.status(200).send({ message: "Draw Updated!", body: req.body });
      }
    });
  } else if (req.body.team1Goals > req.body.team2Goals) {
    winner = { teamName: req.body.team1, goalsScored: req.body.team1Goals };
    loser = { teamName: req.body.team2, goalsScored: req.body.team2Goals };
  } else {
    winner = { teamName: req.body.team2, goalsScored: req.body.team2Goals };
    loser = { teamName: req.body.team1, goalsScored: req.body.team1Goals };
    // params.Key.teamName = req.body.team2;
    // updateObj.Key.teamName = req.body.team2;
  }
  if (!draw) {
    console.log(draw);
    console.log("Not Draw");
    params.Key.teamName = winner.teamName;
    updateObj.Key.teamName = winner.goalsScored;
    dynamoDB.get(params, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      } else {
        updateObj["UpdateExpression"] = "set points = :point, ";
        updateObj["ExpressionAttributeValues"] = {
          ":point": data.Item.points + 3,
        };
        updateObj["UpdateExpression"] += "goalsScored = :goals, ";
        updateObj["ExpressionAttributeValues"][":goals"] =
          data.Item.goalsScored + winner.goalsScored;
        updateObj["UpdateExpression"] +=
          "matchHistory = list_append(matchHistory, :matchResults)";
        updateObj["ExpressionAttributeValues"][":matchResults"] = ["win"];
        dynamoDB.update(updateObj, function (err, data) {
          if (err) {
            res.status(400).send({ err });
          }
        });
      }
    });
    params.Key.teamName = loser.teamName;
    updateObj.Key.teamName = loser.goalsScored;
    dynamoDB.get(params, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      } else {
        updateObj["UpdateExpression"] = "set goalsScored = :goals, ";
        updateObj["ExpressionAttributeValues"][":goals"] =
          data.Item.goalsScored + loser.goalsScored;
        updateObj["UpdateExpression"] +=
          "matchHistory = list_append(matchHistory, :matchResults)";
        updateObj["ExpressionAttributeValues"][":matchResults"] = ["loss"];
        dynamoDB.update(updateObj, function (err, data) {
          if (err) {
            res.status(400).send({ err });
          } else {
            res
              .status(200)
              .send({ message: "Scores Updated!", body: req.body });
          }
        });
      }
    });
  }
});

if (process.env.NODE_ENV) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
