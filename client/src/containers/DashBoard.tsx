import React from "react";
import EventMap from './adminDashboard/EventMap'
import SessionPerDay from './adminDashboard/SessionPerDay'
import { Interpreter } from "xstate";
import { AuthMachineContext, AuthMachineEvents } from "../machines/authMachine";
import styled from 'styled-components'

export interface Props {
  authService: Interpreter<AuthMachineContext, any, AuthMachineEvents, any>;
}

const MainDiv = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const DashBoard: React.FC = () => {
  return (
    <MainDiv>
      <EventMap/>
      <SessionPerDay/>
    </MainDiv>
  );
};

export default DashBoard;
