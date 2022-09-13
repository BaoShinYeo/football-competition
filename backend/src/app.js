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
            altPoints: 0,
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
app.post("/getTeams", async (req, res) => {
  // const params = {
  //   TableName: tableName,
  // };
  // dynamoDB.scan(params, function (err, data) {
  //   if (err) {
  //     res.status(400).send({ err });
  //   } else {
  //     res.status(200).send(data.Items);
  //   }
  // });
  const params = {
    TableName: tableName,
  };
  // var output = {};
  var data = await dynamoDB
    .scan(params)
    .promise()
    .then((data) => {
      res.status(200).send(data.Items);
      return data;
      // var groups = {};
      // for (const team in data.Items) {
      //   if (data.Items[team].groupNumber in groups) {
      //     groups[data.Items[team].groupNumber][data.Items[team].teamName] = {
      //       teamName: data.Items[team].teamName,
      //       registrationDate: data.Items[team].registrationDate,
      //       points: data.Items[team].points,
      //       altPoints: data.Items[team].altPoints,
      //       goalsScored: data.Items[team].goalsScored,
      //       matchHistory: data.Items[team].matchHistory,
      //     };
      //   } else {
      //     groups[data.Items[team].groupNumber] = {};
      //     groups[data.Items[team].groupNumber][data.Items[team].teamName] = {
      //       teamName: data.Items[team].teamName,
      //       registrationDate: data.Items[team].registrationDate,
      //       points: data.Items[team].points,
      //       altPoints: data.Items[team].altPoints,
      //       goalsScored: data.Items[team].goalsScored,
      //       matchHistory: data.Items[team].matchHistory,
      //     };
      //   }
      //   output = data.Items;
      // }
      // if (!res.headersSent) {
      //   res.status(200).send(output);
      // }
      // console.log(JSON.stringify(groups));
    });
  console.log(data);
  console.log(data.Items);
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
    .scan(params)
    .promise()
    .catch((err) => {
      res.status(400).send({ err });
    });
  console.log(`${JSON.stringify(data)}`);
  items = [...items, ...data.Items];
  var remainingItems = items.length;
  for (const i of data.Items) {
    const deleteReq = { DeleteRequest: { Key: {} } };
    deleteReq.DeleteRequest.Key["teamName"] = i.teamName;
    group.push(deleteReq);
    remainingItems -= 1;
    console.log(JSON.stringify(group));
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
      team1Goals: Number(fields[2]),
      team2Goals: Number(fields[3]),
    });
  }

  // check for previously created teams
  const currentTeams = new Set();
  const currentTeamInfo = [];
  await dynamoDB
    .scan({
      TableName: tableName,
    })
    .promise()
    .then((data) => {
      for (item of data.Items) {
        currentTeams.add(item.teamName);
        currentTeamInfo.push(item);
      }
    });
  // var updateTeamInfo = {};
  const updateTeam = (name, goals, result) => {
    var addPoints = 3;
    var addAltPoints = 5;
    if (result === "draw") {
      addPoints = 1;
      addAltPoints = 3;
    } else if (result === "loss") {
      addPoints = 0;
      addAltPoints = 1;
    }
    currentTeamInfo.find((team, index) => {
      if (team.teamName === name) {
        currentTeamInfo[index].points += addPoints;
        currentTeamInfo[index].altPoints += addAltPoints;
        currentTeamInfo[index].goalsScored += goals;
        currentTeamInfo[index].matchHistory.push(result);
        return true; // stop searching
      }
    });
  };

  //   if (name in updateTeamInfo) {
  //     console.log(`pre ${JSON.stringify(updateTeamInfo[name])}`);
  //     updateTeamInfo[name].newPoints += points;
  //     updateTeamInfo[name].newAltPoints += altPoints;
  //     updateTeamInfo[name].goals += goals;
  //     updateTeamInfo[name].matchHistory.push(result);
  //     console.log(`post ${JSON.stringify(updateTeamInfo[name])}`);
  //   } else {
  //     updateTeamInfo[name] = {};
  //     console.log(`pre ${JSON.stringify(updateTeamInfo[name])}`);
  //     updateTeamInfo[name]["teamName"] = name;
  //     updateTeamInfo[name]["newPoints"] = points;
  //     updateTeamInfo[name]["newAltPoints"] = altPoints;
  //     updateTeamInfo[name]["goals"] = goals;
  //     updateTeamInfo[name]["matchHistory"] = [result];
  //     console.log(`post ${JSON.stringify(updateTeamInfo[name])}`);
  //   }
  // };
  for (const entry of formatted_input) {
    if (!currentTeams.has(entry.team1) || !currentTeams.has(entry.team2)) {
      continue;
    }
    if (entry.team1Goals === entry.team2Goals) {
      updateTeam(entry.team1, entry.team1Goals, "draw");
      updateTeam(entry.team2, entry.team2Goals, "draw");
    } else if (entry.team1Goals > entry.team2Goals) {
      updateTeam(entry.team1, entry.team1Goals, "win");
      updateTeam(entry.team2, entry.team2Goals, "loss");
    } else {
      updateTeam(entry.team1, entry.team1Goals, "win");
      updateTeam(entry.team2, entry.team2Goals, "loss");
    }
  }

  currentTeamInfo.sort((team1, team2) => {
    team1RegDate = new Date(
      2022,
      Number(team1.registrationDate.split("/")[1]),
      Number(team1.registrationDate.split("/")[0])
    );
    team2RegDate = new Date(
      2022,
      Number(team2.registrationDate.split("/")[1]),
      Number(team2.registrationDate.split("/")[0])
    );
    if (team1.points > team2.points) {
      return -1;
    } else if (team1.points < team2.points) {
      return 1;
    } else if (team1.goalsScored > team2.goalsScored) {
      return -1;
    } else if (team1.goalsScored < team2.goalsScored) {
      return 1;
    } else if (team1.altPoints > team2.altPoints) {
      return -1;
    } else if (team1.altPoints < team2.altPoints) {
      return 1;
    } else if (team1RegDate < team2RegDate) {
      return -1;
    } else if (team1RegDate > team2RegDate) {
      return 1;
    } else {
      return -1;
    }
  });
  var group1qualified = 0;
  var group2qualified = 0;
  for (var team of currentTeamInfo) {
    if ((team.groupNumber === "1") & (group1qualified < 4)) {
      team.qualify = true;
      group1qualified += 1;
    } else if ((team.groupNumber === "2") & (group2qualified < 4)) {
      team.qualify = true;
      group2qualified += 1;
    }
  }
  // console.log(JSON.stringify(updateTeamInfo));
  console.log(JSON.stringify(currentTeamInfo));

  // batch write
  var group = [];
  var remainingItems = currentTeamInfo.length;

  for (team of currentTeamInfo) {
    console.log(team);
    var putRequest = {
      PutRequest: {
        Item: {
          teamName: team.teamName,
          registrationDate: team.registrationDate,
          groupNumber: team.groupNumber,
          points: team.points,
          altPoints: team.altPoints,
          goalsScored: team.goalsScored,
          matchHistory: team.matchHistory,
          qualify: team.qualify,
        },
      },
    };
    group.push(putRequest);
    remainingItems--;
    if (group.length === 25 || remainingItems < 1) {
      var params = {
        RequestItems: {
          footballCompetition: group,
        },
      };
      await dynamoDB.batchWrite(params).promise();

      if (remainingItems > 0) {
        group = [];
      }
    }
  }

  // for (var team in updateTeamInfo) {
  //   console.log(JSON.stringify(team));
  //   team = updateTeamInfo[team];
  //   console.log(JSON.stringify(team));
  //   var params = {
  //     TableName: tableName,
  //     Key: { teamName: team.teamName },
  //   };
  //   var updateObj = {
  //     TableName: tableName,
  //     Key: {
  //       teamName: team.teamName,
  //     },
  //   };
  //   console.log(JSON.stringify(params));
  //   console.log(JSON.stringify(updateObj));

  // await dynamoDB
  //   .get(params)
  //   .promise()
  //   .then((data) => {
  //     console.log(`team data ${JSON.stringify(data)}`);
  //     console.log(`team pre updateObj ${JSON.stringify(updateObj)}`);
  //     updateObj["UpdateExpression"] = "set points = :point, ";
  //     updateObj["ExpressionAttributeValues"] = {
  //       ":point": data.Item.points + team.newPoints,
  //     };
  //     updateObj["UpdateExpression"] += "altPoints = :altPoint, ";
  //     updateObj["ExpressionAttributeValues"][":altPoint"] =
  //       data.Item.altPoints + team.newAltPoints;
  //     updateObj["UpdateExpression"] += "goalsScored = :goals, ";
  //     updateObj["ExpressionAttributeValues"][":goals"] =
  //       data.Item.goalsScored + team.goals;
  //     updateObj["UpdateExpression"] +=
  //       "matchHistory = list_append(matchHistory, :matchResults)";
  //     updateObj["ExpressionAttributeValues"][":matchResults"] =
  //       team.matchHistory;
  //     console.log(`team post updateObj ${JSON.stringify(updateObj)}`);
  //   })
  //   .catch((err) => {
  //     res.status(400).send({ err });
  //   });
  // await dynamoDB
  //   .update(updateObj)
  //   .promise()
  //   .catch((err) => {
  //     res.status(400).send({ err });
  //   });
  // }
  if (!res.headersSent) {
    res.status(201).send({ message: "Matches Updated", update: group });
  }
});

if (process.env.NODE_ENV) {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports.handler = serverless(app);
