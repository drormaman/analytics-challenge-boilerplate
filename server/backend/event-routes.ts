///<reference path="types.ts" />

import express from "express";
import { Request, Response } from "express";

// some useful database functions in here:
import {} from "./database";
import { Event, weeklyRetentionObject } from "../../client/src/models/event";
import { ensureAuthenticated, validateMiddleware } from "./helpers";

import {
  shortIdValidation,
  searchValidation,
  userFieldsValidator,
  isUserValidator,
} from "./validators";
const router = express.Router();

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data/database.json");
const db = low(adapter);

function formatDate(date: number) {}

// Routes

interface Filter {
  sorting: string;
  type: string;
  browser: string;
  search: string;
  offset: number;
}

router.get("/all", (req: Request, res: Response): void => {
  const allEvents: Event[] = db.get("events").value();
  res.json(allEvents);
});

router.get("/all-filtered", (req: Request, res: Response) => {
  const params: Filter = {
    sorting: req.query.sorting || "+date",
    type: req.query.type,
    browser: req.query.browser,
    search: req.query.search,
    offset: req.query.offset,
  };
  console.log(params);
  const filteredEvents: Event[] = db
    .get("events")
    .orderBy("date", params.sorting[0] === "+" ? "desc" : "asc")
    .filter(params.type && { name: params.type })
    .filter(params.browser && { browser: params.browser })
    .slice(0, params.offset)
    .value();
  res.json({ events: filteredEvents, more: params.offset ? true : false });
});

router.get("/by-days/:offset", (req: Request, res: Response) => {
  const offset: number = Number(req.params.offset);
  const now: Date = new Date();
  console.log(now);
  const latestDay: Date = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
  console.log(latestDay);
  const weekBefore: Date = new Date(latestDay.getTime() - 6 * 24 * 60 * 60 * 1000);
  console.log(weekBefore);

  interface sessionCountPerDay {
    date: string;
    count: number;
  }
  const countByDays: Array<sessionCountPerDay> = db
    .get("events")
    .uniqBy("session_id")
    .filter((event: Event): boolean => {
      const eventDate: Date = new Date(event.date);
      return eventDate >= weekBefore && eventDate <= latestDay;
    })
    .orderBy("date")
    .map(
      (event: Event): Event => {
        const dateArray: string[] = new Date(event.date).toLocaleDateString().split("/");
        const formattedDate: string = `${dateArray[1]}/${dateArray[0]}/${dateArray[2]}`;
        return { ...event, date: formattedDate };
      }
    )
    .groupBy("date")
    .map((events: Event[], date: string) => ({ date, count: events.length }))
    .value();
  // const allEvents: Event[] = db.get("events").value();

  res.send(countByDays);
});

router.get("/by-hours/:offset", (req: Request, res: Response) => {
  const offset: number = Number(req.params.offset);
  const today: Date = new Date(new Date().toLocaleDateString());
  const choosenDay: Date = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000);
  const endOfDay: Date = new Date(choosenDay.getTime() + 24 * 60 * 60 * 1000);

  interface sessionCountPerhour {
    hour: string;
    count: number;
  }
  const countByHours: Array<sessionCountPerhour> = db
    .get("events")
    .uniqBy("session_id")
    .filter((event: Event): boolean => {
      const eventDate: Date = new Date(event.date);
      return eventDate >= choosenDay && eventDate < endOfDay;
    })
    .orderBy("date")
    .map((event: Event): Event => ({ ...event, date: `${new Date(event.date).getHours()}:00` }))
    .groupBy("date")
    .map((events: Event[], date: string) => ({ date, count: events.length }))
    .value();
  // const allEvents: Event[] = db.get("events").value();

  res.send(countByHours);
});

router.get("/today", (req: Request, res: Response) => {
  res.send("/today");
});

router.get("/week", (req: Request, res: Response) => {
  res.send("/week");
});

/*







*/

router.get("/retention", (req: Request, res: Response) => {
  const dayZero: number = new Date(
    new Date(Number(req.query.dayZero)).toLocaleDateString()
  ).getTime();
  console.log("dayZero", dayZero);
  const weekInMilisec: number = 604800000; // 7*24*60*60*1000
  const today: number = new Date(new Date().toLocaleDateString()).getTime();
  console.log("today", today);

  const signUpEvents: Event[] = db
    .get("events")
    .filter((event: Event) => event.name === "signup" && event.date >= dayZero)
    .orderBy("date")
    .value();
  // console.log("signUpEvents", signUpEvents);
  const loginEvents: Event[] = db
    .get("events")
    .filter((event: Event) => event.name === "login" && event.date >= dayZero)
    .orderBy("date")
    .value();
  // console.log("loginEvents", loginEvents);

  const weekStarts: number[] = [];
  for (let i: number = dayZero; i <= today; i += weekInMilisec) {
    if (i > 1603314000000 && i <= 1603918800000) i += 60 * 60 * 1000;
    weekStarts.push(i);
  }

  const registeredIdsEachWeek: Array<string[]> = []; // array of strings arrays representing each week new usersId
  const loginsEachWeek: Array<string[]> = []; // array of strings arrays representing each week login users id

  for (let i = 0; i < weekStarts.length - 1; i++) {
    const weeklyRegisteredId: string[] = signUpEvents
      .filter((event: Event) => event.date >= weekStarts[i] && event.date < weekStarts[i + 1])
      .map((event: Event) => event.distinct_user_id);
    registeredIdsEachWeek.push(weeklyRegisteredId);

    if (i >= 1) {
      const weeklyLoginEventsIds: string[] = loginEvents
        .filter((event: Event) => event.date >= weekStarts[i] && event.date < weekStarts[i + 1])
        .map((event: Event) => event.distinct_user_id)
        .filter((id: string, i: number, arr: string[]) => arr.indexOf(id) === i);
      loginsEachWeek.push(weeklyLoginEventsIds);
    }
  }
  console.log("registeredIdsEachWeek", registeredIdsEachWeek);
  console.log("loginsEachWeek", loginsEachWeek);
  console.log("registered each week");
  registeredIdsEachWeek.forEach((item, i) => console.log(item.length, i));
  console.log("loginsEachWeek");
  loginsEachWeek.forEach((item, i) => console.log(item.length, i));

  const retentionArrays: Array<number[]> = registeredIdsEachWeek.map(
    (registeredIds: string[], i: number) => {
      console.log("i", i, "registered users", registeredIds.length);
      const weeklyRetentionArray: number[] = [100];
      for (let j = i; j < loginsEachWeek.length; j++) {
        const numOfLogins: number = loginsEachWeek[j].filter((id: string) => {
          return registeredIds.includes(id);
        }).length;
        console.log("j", j, "num of logins", numOfLogins);
        weeklyRetentionArray.push((numOfLogins / registeredIds.length) * 100);
      }
      return weeklyRetentionArray;
    }
  );
  console.log(retentionArrays);
  const retentionInfoArray: weeklyRetentionObject[] = [];
  for (let i = 0; i < weekStarts.length - 1; i++) {
    const weekObj: weeklyRetentionObject = {
      registrationWeek: i + 1,
      newUsers: registeredIdsEachWeek[i].length,
      start: new Date(weekStarts[i]).toLocaleDateString(),
      end: new Date(weekStarts[i + 1] - 1000).toLocaleDateString(),
      weeklyRetention: retentionArrays[i],
    };
    retentionInfoArray.push(weekObj);
  }

  res.send(retentionInfoArray);
});
/*







*/

router.get("/:eventId", (req: Request, res: Response) => {
  const events: Event[] = db.get("events").value();
  const event: Event = events.find((event: Event) => event._id === req.params.eventId)!;

  res.send(event);
});

router.post("/", (req: Request, res: Response) => {
  const newEvent: Event = req.body;
  db.get("events").push(newEvent).write();
  res.send("Added event");
});

router.get("/chart/os/:time", (req: Request, res: Response) => {
  res.send("/chart/os/:time");
});

router.get("/chart/pageview/:time", (req: Request, res: Response) => {
  res.send("/chart/pageview/:time");
});

router.get("/chart/timeonurl/:time", (req: Request, res: Response) => {
  res.send("/chart/timeonurl/:time");
});

router.get("/chart/geolocation/:time", (req: Request, res: Response) => {
  res.send("/chart/geolocation/:time");
});

export default router;
