import Group1Table from "../components/Group1Table";
import Group2Table from "../components/Group2Table";
import TeamInfoForm from "../components/TeamInfoForm";
import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export default function AdjustTeam() {
  return (
    <div>
      <header className="App-header">
        <TeamInfoForm />
      </header>
    </div>
  );
}
