import Group1Table from "../components/Group1Table";
import Group2Table from "../components/Group2Table";
import TeamInfoForm from "../components/TeamInfoForm";
import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export default function Home() {
  const [group, setGroup] = useState(1);
  const setGroup1 = (event) => {
    event.preventDefault();
    setGroup(1);
  };
  const setGroup2 = (event) => {
    event.preventDefault();
    setGroup(2);
  };
  return (
    <div>
      <br />
      <h1>Welcome to Govtech Annual Football Championship</h1>
      <div
        style={{
          width: "95vw",
          position: "centre",
          "text-align": "justify",
          "text-justify": "inter-word",
          padding: "2rem",
        }}
      >
        <br />
        <p>
          It’s the time of the year again when Govtech holds its annual football
          championship where 12 teams will compete for the grand prize of honour
          and glory. The teams will be split into 2 groups of 6 where each team
          will play a match against every other team within the same group. The
          top 4 teams of each group will then qualify for the next round. The
          ranking of the teams for each group will be evaluated using these
          metrics in the following order:
        </p>
        <ol>
          <li>
            Highest total match points. A win is worth 3 points, a draw is worth
            1 point, and a loss is worth 0 points.
          </li>
          <li>If teams are tied, highest total goals scored.</li>
          <li>
            If teams are still tied, highest alternate total match points. A win
            is worth 5 points, a draw is worth 3 points, and a loss is worth 1
            point.
          </li>
          <li>If teams are still tied, earliest registration date.</li>
        </ol>
      </div>
      <ButtonGroup aria-label="Basic example" className="mt-3 mb-3">
        <Button variant="secondary" onClick={setGroup1}>
          Group 1
        </Button>
        <Button variant="secondary" onClick={setGroup2}>
          Group 2
        </Button>
      </ButtonGroup>
      <div style={{ height: "425px" }}>
        {group === 1 ? <Group1Table /> : <Group2Table />}
      </div>
    </div>
  );
}
