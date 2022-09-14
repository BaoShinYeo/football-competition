import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navigationbar from "./components/Navigationbar";
import Home from "./pages/Home";
import AdjustTeam from "./pages/AdjustTeam";
import UpdateMatch from "./pages/UpdateMatch";

function App() {
  return (
    <Router>
      <div className="App">
        <Navigationbar />
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/adjust" element={<AdjustTeam />} />
            <Route path="/match" element={<UpdateMatch />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
