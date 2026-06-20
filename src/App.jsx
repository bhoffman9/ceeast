import { useState } from "react";
import { CSS } from "./styles";
import PasswordGate from "./PasswordGate";
import OwnerPayback from "./views/OwnerPayback";
import Reserves from "./views/Reserves";

const TABS = [
  { id: "owner", label: "Income", el: OwnerPayback },
  { id: "reserves", label: "Reserves", el: Reserves },
];

export default function App() {
  const [tab, setTab] = useState("owner");
  const Active = TABS.find((t) => t.id === tab).el;

  return (
    <PasswordGate>
      <div className="app">
        <style>{CSS}</style>
        <div className="hdr">
          <div className="logo">CE<b>EAST</b></div>
          <div className="hsub">Capacity Express East LLC</div>
          <div className="hbdg">
            <div className="bdg bdg-o">Owner Dashboard</div>
            <div className="bdg bdg-g">Live</div>
          </div>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <div key={t.id} className={"tab" + (t.id === tab ? " active" : "")} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
        </div>
        <div className="main">
          <Active />
        </div>
      </div>
    </PasswordGate>
  );
}
