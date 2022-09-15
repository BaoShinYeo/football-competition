import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import axios from "axios";
import { Link } from "react-router-dom";
import React, { useState } from "react";

function TeamInfoForm() {
  const [teamInfo, setTeamInfo] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        // "http://localhost:4000/team",
        "https://mfgc5kw6dd.execute-api.ap-southeast-1.amazonaws.com/dev/team",
        {
          text: teamInfo,
        }
      );
      console.log(response?.data);
      console.log(JSON.stringify(response));
      setError(false);
      setSuccess(true);
    } catch (err) {
      setError(true);
      console.log(err);
      console.log(err.response.data.error);
      setErrorMessage(err.response.data.error);
      console.log("API Call Failure");
      console.log(err);
    }
  };

  const deleteAllTeams = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        // "http://localhost:4000/removeTeams"
        "https://mfgc5kw6dd.execute-api.ap-southeast-1.amazonaws.com/dev/removeTeams"
      );
      console.log(response?.data);
      console.log(JSON.stringify(response));
      setSuccess(true);
    } catch (err) {
      console.log("API Call Failure");
      console.log(err);
    }
  };

  const submitMoreTeams = (event) => {
    event.preventDefault();
    setSuccess(false);
  };

  return (
    <div>
      {success ? (
        <section>
          <h1>Success!</h1>
          <Link to={""}>
            <Button onClick={submitMoreTeams}>
              Go Back to Add/Delete Team
            </Button>
          </Link>
        </section>
      ) : (
        <div>
          <br />
          <h1>Add Teams via this form</h1>
          <Form>
            <Form.Group
              className="mb-3"
              controlId="exampleForm.ControlTextarea1"
            >
              <Form.Label className="text-muted">Team Information</Form.Label>
              <Form.Control
                as="textarea"
                rows={12}
                cols={100}
                placeholder={`<TeamName> <RegistrationDate> <GroupNumber>\ne.g. \nFriendlyOtter 14/09 1\nDashingMerlion 13/09 1`}
                onChange={(event) => setTeamInfo(event.target.value)}
              />
              {error ? <p style={{ color: "red" }}>{errorMessage}</p> : <br />}
            </Form.Group>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              Submit
            </Button>
          </Form>
          <br />
          <h1>Delete All Teams</h1>
          <p>
            Be careful before proceeding, clicking on this button will remove
            all teams in the current server.
          </p>
          <Button
            variant="danger"
            type="submit"
            onClick={deleteAllTeams}
            className="mb-3"
          >
            Remove All Teams
          </Button>
          <br />
          <br />
          <br />
        </div>
      )}
    </div>
  );
}

export default TeamInfoForm;
