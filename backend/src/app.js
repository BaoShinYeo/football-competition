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

const getTeamByName = async (name) => {
  var output = [];
  const params = {
    TableName: "footballCompetition",
    Key: { teamName: name },
  };
  await dynamoDB
    .get(params)
    .promise()
    .then((data) => {
      if (data.Item) {
        output.push(data.Item);
      }
    });
  return output;
};

// ADD NEW TEAM
// --------------------------------------------
app.post("/team", async (req, res) => {
  // format text input
  input = req.body.text.split(`\n`);
  var output = [];
  var remainingItems = input.length;
  var formatted_input = [];
  for (const entry of input) {
    fields = entry.split(` `);
    formatted_input.push({
      teamName: fields[0],
      registrationDate: fields[1],
      groupNumber: fields[2],
    });
  }
  var params = {
    RequestItems: {
      footballCompetition: [],
    },
  };

  // check for previously created teams
  const currentTeams = new Set();
  await dynamoDB
    .scan({
      TableName: tableName,
    })
    .promise()
    .then((data) => {
      for (item of data.Items) {
        currentTeams.add(item.teamName);
      }
    });

  // batch write
  for (const entry of formatted_input) {
    if (!currentTeams.has(entry.teamName)) {
      currentTeams.add(entry.teamName); // check for duplicate team names submitted
      params.RequestItems.footballCompetition.push({
        PutRequest: {
          Item: {
            teamName: entry.teamName,
            registrationDate: entry.registrationDate,
            groupNumber: entry.groupNumber,
            points: 0,
            goalsScored: 0,
            matchHistory: [],
            qualify: false,
          },
        },
      });
    }
    remainingItems -= 1;
    if (
      (params.RequestItems.footballCompetition.length === 25 ||
        remainingItems < 1) &
      (params.RequestItems.footballCompetition.length >= 1)
    ) {
      await dynamoDB
        .batchWrite(params)
        .promise()
        .catch((err) => {
          res.status(400).send({ err });
        });
      output.push(params.RequestItems.footballCompetition);
      params.RequestItems.footballCompetition = [];
    }
  }
  if (!res.headersSent) {
    res.status(201).send(output);
  }
});

// GET TEAM DETAILS
// --------------------------------------------
app.post("/getTeamDetails", async (req, res) => {
  data = await getTeamByName(req.body.teamName);
  if (data.length === 0) {
    res.status(404).send({ message: "Team Not Found!" });
  } else {
    res.status(200).send({ data });
  }
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
  var items = [];
  var group = [];
  var data = await dynamoDB
    .scan(params, function (err, data) {
      if (err) {
        res.status(400).send({ err });
      }
    })
    .promise();
  console.log(data);
  items = [...items, ...data.Items];
  var remainingItems = items.length;
  for (const i of data.Items) {
    const deleteReq = { DeleteRequest: { Key: {} } };
    deleteReq.DeleteRequest.Key["teamName"] = i.teamName;
    group.push(deleteReq);
    remainingItems -= 1;
    console.log(group);
    if ((group.length === 25 || remainingItems < 1) & (group.length > 0)) {
      params = {
        RequestItems: {
          [tableName]: group,
        },
      };
      await dynamoDB
        .batchWrite(params)
        .promise()
        .catch((err) => {
          res.status(400).send({ err });
        });
      group = [];
    }
  }
  if (!res.headersSent) {
    res.status(204).send({ message: "All teams deleted" });
  }
  // params = {
  //   RequestItems: {
  //     [tableName]: group,
  //   },
  // };
  // dynamoDB.batchWrite(params, function (err, data) {
  //   if (err) {
  //     res.status(400).send({ err });
  //   } else {
  //     res.sendStatus(204);
  //   }
  // });
});

// UPDATE MATCH
// --------------------------------------------
app.post("/updateMatch", async (req, res) => {
  // format text input
  input = req.body.text.split(`\n`);
  // var output = [];
  // var remainingItems = input.length;
  var formatted_input = [];
  for (const entry of input) {
    fields = entry.split(` `);
    formatted_input.push({
      team1: fields[0],
      team2: fields[1],
      team1Goals: fields[2],
      team2Goals: fields[3],
    });
  }

  // check for previously created teams
  const currentTeams = new Set();
  await dynamoDB
    .scan({
      TableName: tableName,
    })
    .promise()
    .then((data) => {
      for (item of data.Items) {
        currentTeams.add(item.teamName);
      }
    });
  for (const entry of formatted_input) {
    if (!currentTeams.has(entry.team1) || !currentTeams.has(entry.team2)) {
      continue;
    }
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
    if (entry.team1Goals === entry.team2Goals) {
      draw = true;
      params.Key.teamName = entry.team1;
      updateObj.Key.teamName = entry.team1;
      await dynamoDB
        .get(params)
        .promise()
        .then((data) => {
          console.log(`team 1 data ${JSON.stringify(data)}`);
          console.log(`team 1 pre updateObj ${JSON.stringify(updateObj)}`);
          updateObj["UpdateExpression"] = "set points = :point, ";
          updateObj["ExpressionAttributeValues"] = {
            ":point": data.Item.points + 1,
          };
          updateObj["UpdateExpression"] += "goalsScored = :goals, ";
          updateObj["ExpressionAttributeValues"][":goals"] =
            data.Item.goalsScored + entry.team1Goals;
          updateObj["UpdateExpression"] +=
            "matchHistory = list_append(matchHistory, :matchResults)";
          updateObj["ExpressionAttributeValues"][":matchResults"] = ["draw"];
          console.log(`team 1 post updateObj ${JSON.stringify(updateObj)}`);
        })
        .catch((err) => {
          res.status(400).send({ err });
        });
      await dynamoDB
        .update(updateObj)
        .promise()
        .catch((err) => {
          res.status(400).send({ err });
        });
      params.Key.teamName = entry.team2;
      updateObj.Key.teamName = entry.team2;
      await dynamoDB
        .get(params)
        .promise()
        .then((data) => {
          console.log(`team 2 data ${JSON.stringify(data)}`);
          console.log(`team 2 pre updateObj ${JSON.stringify(updateObj)}`);
          updateObj["UpdateExpression"] = "set points = :point, ";
          updateObj["ExpressionAttributeValues"] = {
            ":point": data.Item.points + 1,
          };
          updateObj["UpdateExpression"] += "goalsScored = :goals, ";
          updateObj["ExpressionAttributeValues"][":goals"] =
            data.Item.goalsScored + entry.team2Goals;
          updateObj["UpdateExpression"] +=
            "matchHistory = list_append(matchHistory, :matchResults)";
          updateObj["ExpressionAttributeValues"][":matchResults"] = ["draw"];
          console.log(`team 2 post updateObj ${JSON.stringify(updateObj)}`);
        })
        .catch((err) => {
          res.status(400).send({ err });
        });
      await dynamoDB
        .update(updateObj)
        .promise()
        .catch((err) => {
          res.status(400).send({ err });
        });
    } else if (entry.team1Goals > entry.team2Goals) {
      winner = { teamName: entry.team1, goalsScored: entry.team1Goals };
      loser = { teamName: entry.team2, goalsScored: entry.team2Goals };
    } else {
      winner = { teamName: entry.team2, goalsScored: entry.team2Goals };
      loser = { teamName: entry.team1, goalsScored: entry.team1Goals };
    }
    if (!draw) {
      console.log(draw);
      console.log("Not Draw");
      params.Key.teamName = winner.teamName;
      updateObj.Key.teamName = winner.teamName;
      await dynamoDB
        .get(params)
        .promise()
        .then((data) => {
          console.log(`winner data ${JSON.stringify(data)}`);
          console.log(`winner pre updateObj ${JSON.stringify(updateObj)}`);
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
          console.log(`winner post updateObj ${JSON.stringify(updateObj)}`);
        })
        .catch((err) => {
          res.status(400).send({ err });
        });
      await dynamoDB
        .update(updateObj)
        .promise()
        .catch((err) => {
          res.status(400).send({ err });
        });
      params.Key.teamName = loser.teamName;
      updateObj.Key.teamName = loser.teamName;
      await dynamoDB
        .get(params)
        .promise()
        .then((data) => {
          console.log(`loser data ${JSON.stringify(data)}`);
          console.log(`loser pre updateObj ${JSON.stringify(updateObj)}`);
          updateObj["UpdateExpression"] = "set points = :point, ";
          updateObj["ExpressionAttributeValues"] = {
            ":point": data.Item.points,
          };
          updateObj["UpdateExpression"] += "goalsScored = :goals, ";
          updateObj["ExpressionAttributeValues"][":goals"] =
            data.Item.goalsScored + loser.goalsScored;
          updateObj["UpdateExpression"] +=
            "matchHistory = list_append(matchHistory, :matchResults)";
          updateObj["ExpressionAttributeValues"][":matchResults"] = ["loss"];
          console.log(`loser post updateObj ${JSON.stringify(updateObj)}`);
        })
        .catch((err) => {
          res.status(400).send({ err });
        });
      await dynamoDB
        .update(updateObj)
        .promise()
        .catch((err) => {
          res.status(400).send({ err });
        });
    }
  }
  if (!res.headersSent) {
    res.status(201).send({ message: "Matches Updated" });
  }
});

if (process.env.NODE_ENV) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
