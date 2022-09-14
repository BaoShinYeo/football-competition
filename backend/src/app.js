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

const sortTeam = (team1, team2) => {
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
};

// ADD NEW TEAMS
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
    res.status(201).send({ teams: output });
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
  const params = {
    TableName: tableName,
  };
  await dynamoDB
    .scan(params)
    .promise()
    .then((data) => {
      group1 = [];
      group2 = [];
      console.log(JSON.stringify(data.Items));
      for (team of data.Items) {
        if (team.groupNumber === "1") {
          group1.push(team);
        } else if (team.groupNumber === "2") {
          group2.push(team);
        }
      }
      group1.sort(sortTeam);
      group2.sort(sortTeam);
      res.status(200).send({ group1: group1, group2: group2 });
      return data;
    })
    .catch((err) => {
      res.status(404).send({ message: "Not Found!" });
    });
});

// REMOVE SINGLE TEAM
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

    // write batch if group size is 25 (batch write limit) or if there are no other items
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
      group = []; // reset group for the next batch
    }
  }
  if (!res.headersSent) {
    res.status(204).send({ message: "All teams deleted" });
  }
});

// UPDATE MATCH
// --------------------------------------------
app.post("/updateMatch", async (req, res) => {
  // format text input
  input = req.body.text.split(`\n`);
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

  // function to update team information
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

  for (const entry of formatted_input) {
    if (!currentTeams.has(entry.team1) || !currentTeams.has(entry.team2)) {
      continue;
    }

    // update points, goals and match history
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

  // tabulate qualified teams
  currentTeamInfo.sort(sortTeam);
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

    // write batch if group size is 25 (batch write limit) or if there are no other items
    if ((group.length === 25 || remainingItems < 1) & (group.length > 0)) {
      var params = {
        RequestItems: {
          footballCompetition: group,
        },
      };
      await dynamoDB.batchWrite(params).promise();

      if (remainingItems > 0) {
        group = []; // reset group if there are other items
      }
    }
  }
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
