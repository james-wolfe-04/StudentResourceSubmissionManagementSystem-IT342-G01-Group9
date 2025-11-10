import React from "react"
import ReactDOM from "react-dom/client"
import "./styles/variables.css"
import "./styles/index.css"
import "./styles/App.css"
import "./styles/auth.css"
import "./styles/dashboard.css"
import App from "./App"


const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
