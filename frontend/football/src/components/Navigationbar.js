import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Link } from "react-router-dom";
import { football } from "../images/imgindex";

export default function Navigationbar() {
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top">
      <Container>
        <Navbar.Brand href="/">
          <img
            alt=""
            src={football}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{" "}
          <Link to="/" style={{ textDecoration: "none", color: "white" }}>
            Govtech Football Championship
          </Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            {/* <Nav.Link href="/table">Group Table</Nav.Link> */}
            {/* <Nav.Link href="/team">Team Management</Nav.Link> */}
            <NavDropdown title="Team Management" id="collasible-nav-dropdown">
              <NavDropdown.Item>
                <Link
                  to="adjust"
                  style={{ textDecoration: "none", color: "black" }}
                >
                  <div>
                    <p>Add/Remove Teams</p>
                  </div>
                </Link>
              </NavDropdown.Item>
              <NavDropdown.Item>
                <Link
                  to="match"
                  style={{ textDecoration: "none", color: "black" }}
                >
                  <div>
                    <p>Update Matches</p>
                  </div>
                </Link>
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
