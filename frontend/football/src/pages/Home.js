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
      <ButtonGroup aria-label="Basic example" className="mt-3 mb-3">
        <Button variant="secondary" onClick={setGroup1}>
          Group 1
        </Button>
        <Button variant="secondary" onClick={setGroup2}>
          Group 2
        </Button>
      </ButtonGroup>
      {group === 1 ? <Group1Table /> : <Group2Table />}
    </div>
  );
}
