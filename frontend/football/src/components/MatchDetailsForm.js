import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import axios from "axios";
import { Link } from "react-router-dom";
import React, { useState } from "react";

function MatchDetailsForm() {
  const [matchInfo, setMatchInfo] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        // "http://localhost:4000/team",
        "https://mfgc5kw6dd.execute-api.ap-southeast-1.amazonaws.com/dev/updateMatch",
        {
          text: matchInfo,
        }
      );
      console.log(response?.data);
      console.log(JSON.stringify(response));
      setSuccess(true);
    } catch (err) {
      console.log("API Call Failure");
      console.log(err);
    }
  };

  const submitMoreMatches = (event) => {
    event.preventDefault();
    setSuccess(false);
  };

  return (
    <div>
      {success ? (
        <section>
          <h1>Success!</h1>
          <Link to={""}>
            <Button onClick={submitMoreMatches}>Submit More Matches</Button>
          </Link>
        </section>
      ) : (
        <div>
          <br />
          <h1>Update Match Details via this form</h1>
          <Form>
            <Form.Group
              className="mb-3"
              controlId="exampleForm.ControlTextarea1"
            >
              <Form.Label className="text-muted">Match Information</Form.Label>
              <Form.Control
                as="textarea"
                rows={12}
                cols={100}
                placeholder={`<Team1Name> <Team2Name> <Team1GoalsScored> <Team2GoalsScored>\ne.g. FriendlyOtter DashingMerlion 1 1\nFriendlyOtter DashingMerlion 2 2`}
                onChange={(event) => setMatchInfo(event.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              Submit
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
}

export default MatchDetailsForm;
