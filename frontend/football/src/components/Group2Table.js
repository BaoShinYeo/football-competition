import Table from "react-bootstrap/Table";
import axios from "axios";
import React, { useState, useEffect } from "react";

export default function Group2Table() {
  const [post, setPost] = useState(null);

  useEffect(() => {
    axios
      .post(
        "https://mfgc5kw6dd.execute-api.ap-southeast-1.amazonaws.com/dev/getTeams"
      )
      .then((response) => {
        setPost(response.data);
        console.log(response.data);
      });
  }, []);

  if (!post) return null;

  return (
    <Table striped bordered hover variant="dark">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team Name</th>
          <th>Points</th>
          <th>Goals Scored</th>
          <th>Qualified</th>
          <th>Registration Date</th>
        </tr>
      </thead>
      <tbody>
        {post.group2.map((team, i) => (
          <tr key={team.teamName}>
            <td>{i + 1}</td>
            <td>{team.teamName}</td>
            <td>{team.points}</td>
            <td>{team.goalsScored}</td>
            <td>{team.qualify ? "Yes" : "No"}</td>
            <td>{team.registrationDate}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
