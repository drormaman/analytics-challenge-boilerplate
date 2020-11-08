import React, { useEffect, useState } from "react";
import { Interpreter } from "xstate";
import { AuthMachineContext, AuthMachineEvents } from "../../machines/authMachine";
import styled from "styled-components";
import { Event, weeklyRetentionObject } from "../../models/event";

export interface Props {
  authService: Interpreter<AuthMachineContext, any, AuthMachineEvents, any>;
}

const RetentionChart: React.FC = () => {
  const [retentionData, setRetentionData] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);
  async function fetchEvents() {
    const response = await fetch("http://localhost:3001/events/retention?dayZero=1601531430419");
    const data = await response.json();
    setRetentionData(data);
    console.log(data);
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Week Dates</th>
          {retentionData.map((weekRetention: weeklyRetentionObject, i: number) => (
            <th>{`week ${i}`}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {retentionData.map((weekRetention: weeklyRetentionObject, i: number) => {
          return (
            <tr key={weekRetention.start}>
              <td>{weekRetention.start + " - " + weekRetention.end}</td>
              {weekRetention.weeklyRetention.map((retention: number) => (
                <td>{`${retention}%`}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default RetentionChart;
