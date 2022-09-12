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
  console.log(formatted_input);

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
  // console.log(JSON.stringify(params));

  // const team = {
  //   teamName: req.body.teamName,
  //   registrationDate: req.body.registrationDate,
  //   groupNumber: req.body.groupNumber,
  //   points: 0,
  //   goalsScored: 0,
  //   matchHistory: [],
  //   qualify: false,
  // };
  // const obj = {
  //   TableName: tableName,
  //   Item: team,
  // };
  // await dynamoDB
  //   .put(obj)
  //   .promise()
  //   .then(() => {
  //     res.status(201).send(team);
  //   })
  //   .catch((err) => {
  //     res.status(400).send({ err });
  //   });

  // await dynamoDB
  //   .batchWrite(params)
  //   .promise()
  //   .then(() => {
  //     res.status(201).send(params);
  //   })
  //   .catch((err) => {
  //     res.status(400).send({ err });
  //   });
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
  team1 = await getTeamByName(req.body.team1);
  team2 = await getTeamByName(req.body.team2);
  if (team1.length === 0 || team2.length === 0) {
    res.status(404).send({ message: "Team Not Found!" });
    return;
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
  if (req.body.team1Goals === req.body.team2Goals) {
    draw = true;
    params.Key.teamName = req.body.team1;
    updateObj.Key.teamName = req.body.team1;
    console.log("Check 1");
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
          data.Item.goalsScored + req.body.team1Goals;
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
    params.Key.teamName = req.body.team2;
    updateObj.Key.teamName = req.body.team2;
    console.log("Check 1.2");
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
          data.Item.goalsScored + req.body.team2Goals;
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
      .then((data) => {
        res.status(200).send({ message: "Draw Updated!", body: req.body });
      })
      .catch((err) => {
        res.status(400).send({ err });
      });
  } else if (req.body.team1Goals > req.body.team2Goals) {
    winner = { teamName: req.body.team1, goalsScored: req.body.team1Goals };
    loser = { teamName: req.body.team2, goalsScored: req.body.team2Goals };
  } else {
    winner = { teamName: req.body.team2, goalsScored: req.body.team2Goals };
    loser = { teamName: req.body.team1, goalsScored: req.body.team1Goals };
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
      .then((data) => {
        res.status(200).send({ message: "Match Updated!", body: req.body });
      })
      .catch((err) => {
        res.status(400).send({ err });
      });
  }
});

if (process.env.NODE_ENV) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
