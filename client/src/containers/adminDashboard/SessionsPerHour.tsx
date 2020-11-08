import React, { useEffect, useState } from "react";
import { Interpreter } from "xstate";
import { AuthMachineContext, AuthMachineEvents } from "../../machines/authMachine";
import styled from "styled-components";
import { Event, Location } from "../../models/event";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";

export interface Props {
  authService: Interpreter<AuthMachineContext, any, AuthMachineEvents, any>;
}

const SessionsPerHour: React.FC = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);
  async function fetchEvents() {
    const response = await fetch("http://localhost:3001/events/by-hours/6");
    const data = await response.json();
    setEvents(data);
    console.log(data);
  }

  return (
    <LineChart
      width={730}
      height={250}
      data={events}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke="#82ca9d" />
    </LineChart>
  );
};

export default SessionsPerHour;
